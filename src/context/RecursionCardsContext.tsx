

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useFirestore } from '@/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    writeBatch,
    getDocs,
    where,
    deleteField,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RecursionBoard, RecursionCard, RecursionConnection } from '@/lib/types';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, Connection, addEdge as addReactFlowEdge, OnEdgesDelete, MarkerType } from 'reactflow';

// ReactFlow specific types
export type RecursionNode = Node<RecursionCard>;
export type RecursionEdge = Edge;

interface RecursionCardsContextType {
    boards: RecursionBoard[];
    boardsLoading: boolean;
    activeBoard: RecursionBoard | null;
    setActiveBoardId: (id: string | null) => void;
    addBoard: (name: string) => Promise<string | undefined>;
    deleteBoard: (boardId: string) => Promise<void>;
    updateBoard: (boardId: string, name: string) => Promise<void>;
    
    nodes: RecursionNode[];
    edges: RecursionEdge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    onEdgesDelete: OnEdgesDelete;
    
    addCard: (cardData: Partial<RecursionCard>) => Promise<void>;
    updateCard: (cardId: string, data: Partial<RecursionCard>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;

    selectedCardId: string | null;
    setSelectedCardId: (id: string | null) => void;
}

const RecursionCardsContext = createContext<RecursionCardsContextType | undefined>(undefined);

export function RecursionCardsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [boards, setBoards] = useState<RecursionBoard[]>([]);
    const [boardsLoading, setBoardsLoading] = useState(true);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

    const [nodes, setNodes] = useState<RecursionNode[]>([]);
    const [edges, setEdges] = useState<RecursionEdge[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Memoize Firestore references
    const boardsRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'recursionBoards') : null, [user, firestore]);
    
    const cardsRef = useMemo(() => 
        user && activeBoardId ? collection(firestore, 'users', user.uid, 'recursionBoards', activeBoardId, 'cards') : null
    , [user, firestore, activeBoardId]);
    
    const connectionsRef = useMemo(() => 
        user && activeBoardId ? collection(firestore, 'users', user.uid, 'recursionBoards', activeBoardId, 'connections') : null
    , [user, firestore, activeBoardId]);

    // Listener for Boards
    useEffect(() => {
        if (!boardsRef) {
            setBoards([]);
            setBoardsLoading(false);
            return;
        }
        setBoardsLoading(true);
        const q = query(boardsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecursionBoard));
            setBoards(fetchedBoards);
            if (!activeBoardId && fetchedBoards.length > 0) {
                setActiveBoardId(fetchedBoards[0].id);
            }
            setBoardsLoading(false);
        }, (error) => {
            console.error("Error fetching recursion boards: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch boards.' });
            setBoardsLoading(false);
        });
        return () => unsubscribe();
    }, [boardsRef]);

    // Listener for Cards (Nodes)
    useEffect(() => {
        if (!cardsRef) {
            setNodes([]);
            return;
        }
        const unsubscribe = onSnapshot(cardsRef, (snapshot) => {
            const newNodes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: 'recursionCard',
                    position: { x: data.x, y: data.y },
                    data: { ...data, id: doc.id },
                } as RecursionNode;
            });
            
            // This is the fix for the "jumping card" bug.
            // It merges new data with existing node data, preserving the client-side position during updates.
            setNodes(currentNodes => {
                return newNodes.map(newNode => {
                    const existingNode = currentNodes.find(n => n.id === newNode.id);
                    if (existingNode) {
                        return { ...newNode, position: existingNode.position };
                    }
                    return newNode;
                });
            });

        }, (error) => {
            console.error("Error fetching cards: ", error);
        });
        return () => unsubscribe();
    }, [cardsRef]);
    
    // Listener for Connections (Edges)
    useEffect(() => {
        if (!connectionsRef) {
            setEdges([]);
            return;
        }
        const unsubscribe = onSnapshot(connectionsRef, (snapshot) => {
            const fetchedEdges = snapshot.docs.map(doc => {
                const data = doc.data() as RecursionConnection;
                return {
                    id: doc.id,
                    source: data.fromCardId,
                    target: data.toCardId,
                    label: data.label,
                    markerEnd: { type: MarkerType.ArrowClosed },
                } as RecursionEdge;
            });
            setEdges(fetchedEdges);
        }, (error) => {
            console.error("Error fetching connections: ", error);
        });
        return () => unsubscribe();
    }, [connectionsRef]);

    const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || null, [boards, activeBoardId]);

    const addBoard = async (name: string) => {
        if (!boardsRef || !user) return;
        try {
            const docRef = await addDoc(boardsRef, {
                name,
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setActiveBoardId(docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error adding board: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create board.' });
        }
    };
    
    const deleteBoard = async (boardId: string) => {
        if (!user) return;
        // Complex delete: requires deleting subcollections. For now, simple doc delete.
        const boardDocRef = doc(firestore, 'users', user.uid, 'recursionBoards', boardId);
        try {
            await deleteDoc(boardDocRef);
            toast({ title: 'Board Deleted' });
            if(activeBoardId === boardId) {
                setActiveBoardId(boards.length > 1 ? boards.filter(b => b.id !== boardId)[0].id : null);
            }
        } catch (error) {
            console.error("Error deleting board: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete board.' });
        }
    };

    const updateBoard = async (boardId: string, name: string) => {
         if (!user) return;
        const boardDocRef = doc(firestore, 'users', user.uid, 'recursionBoards', boardId);
        try {
            await updateDoc(boardDocRef, { name, updatedAt: serverTimestamp() });
        } catch (error) {
            console.error("Error updating board: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update board name.' });
        }
    };

    // --- ReactFlow Handlers ---

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            setNodes((nds) => applyNodeChanges(changes, nds));
            // Persist position changes to Firestore
            for (const change of changes) {
                if (change.type === 'position' && change.position) {
                    if(!cardsRef) continue;
                    const nodeRef = doc(cardsRef, change.id);
                    updateDoc(nodeRef, { x: change.position.x, y: change.position.y });
                }
            }
        },
        [cardsRef]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onEdgesDelete: OnEdgesDelete = useCallback((edgesToDelete) => {
        if (!connectionsRef) return;
        const batch = writeBatch(firestore);
        edgesToDelete.forEach(edge => {
            const edgeRef = doc(connectionsRef, edge.id);
            batch.delete(edgeRef);
        });
        batch.commit().catch(err => {
             console.error("Failed to delete edges", err);
            toast({ variant: "destructive", title: "Error", description: "Could not delete connections."});
        });
    }, [connectionsRef, firestore, toast]);

    const onConnect = useCallback((connection: Connection) => {
        if (!connectionsRef || !activeBoardId) return;
        
        // Optimistically update the UI
        setEdges((eds) => addReactFlowEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));

        // Persist to Firestore
        const newConnection = {
            boardId: activeBoardId,
            fromCardId: connection.source,
            toCardId: connection.target,
            // You can add logic for labels here if needed
            // fromHandle: connection.sourceHandle,
            // toHandle: connection.targetHandle,
        };
        addDoc(connectionsRef, newConnection).catch(err => {
            console.error("Failed to create connection", err);
            toast({ variant: "destructive", title: "Error", description: "Could not save connection."});
            // Revert optimistic update on failure
            setEdges((eds) => eds.filter(e => !(e.source === connection.source && e.target === connection.target)));
        });
    }, [connectionsRef, activeBoardId, toast]);


    // --- Card and Connection CRUD ---

    const addCard = async (cardData: Partial<RecursionCard>) => {
        if (!cardsRef || !activeBoardId) return;
        const newCard = {
            boardId: activeBoardId,
            title: cardData.title || 'New Card',
            type: cardData.type || 'recursive',
            x: cardData.x ?? 100,
            y: cardData.y ?? 100,
            notes: cardData.notes || '',
            subtitle: cardData.subtitle || '',
        };
        try {
            await addDoc(cardsRef, newCard);
        } catch (error) {
            console.error("Error adding card: ", error);
        }
    };
    
    const updateCard = async (cardId: string, data: Partial<RecursionCard>) => {
        if(!cardsRef) return;
        const cardRef = doc(cardsRef, cardId);
        try {
            // Ensure x and y are not set to undefined
            const updateData = { ...data };
            if (updateData.x === undefined) delete updateData.x;
            if (updateData.y === undefined) delete updateData.y;

            await updateDoc(cardRef, updateData);
        } catch (error) {
             console.error("Error updating card: ", error);
        }
    };

    const deleteCard = async (cardId: string) => {
        if(!cardsRef || !connectionsRef) return;
        
        const batch = writeBatch(firestore);
        
        // Delete the card itself
        const cardRef = doc(cardsRef, cardId);
        batch.delete(cardRef);
        
        // Find and delete connections from this card
        const fromConnectionsQuery = query(connectionsRef, where('fromCardId', '==', cardId));
        // Find and delete connections to this card
        const toConnectionsQuery = query(connectionsRef, where('toCardId', '==', cardId));

        try {
            const [fromSnapshot, toSnapshot] = await Promise.all([
                getDocs(fromConnectionsQuery),
                getDocs(toConnectionsQuery)
            ]);

            fromSnapshot.forEach(doc => batch.delete(doc.ref));
            toSnapshot.forEach(doc => batch.delete(doc.ref));
            
            await batch.commit();

            if (selectedCardId === cardId) {
                setSelectedCardId(null);
            }

        } catch (error) {
             console.error("Error deleting card and its connections: ", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the card.' });
        }
    };


    const value: RecursionCardsContextType = {
        boards,
        boardsLoading,
        activeBoard,
        setActiveBoardId,
        addBoard,
        deleteBoard,
        updateBoard,
        
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgesDelete,

        addCard,
        updateCard,
        deleteCard,
        
        selectedCardId,
        setSelectedCardId,
    };

    return <RecursionCardsContext.Provider value={value}>{children}</RecursionCardsContext.Provider>;
}

export function useRecursionCards() {
    const context = useContext(RecursionCardsContext);
    if (!context) {
        throw new Error('useRecursionCards must be used within a RecursionCardsProvider');
    }
    return context;
}

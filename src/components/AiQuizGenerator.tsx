'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { generateAiQuiz } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, FileUp, X, ArrowRight, Clock, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import type { GenerateQuizOutput } from '@/ai/flows/quiz-generator-flow';

type QuizState = 'config' | 'generating' | 'taking' | 'results';
type QuizQuestion = GenerateQuizOutput['questions'][0];

const QuizConfigView = ({ onStartQuiz }: { onStartQuiz: (topic: string, numQuestions: number, timeLimit: number, file?: File) => void }) => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz(topic, numQuestions, timeLimit, file || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input id="topic" placeholder="e.g., Core Java, React Hooks" value={topic} onChange={(e) => setTopic(e.target.value)} required />
        <p className="text-sm text-muted-foreground">Or upload a PDF below to use as context.</p>
      </div>

      <div className="space-y-3">
        <Label>Number of Questions: {numQuestions}</Label>
        <Slider defaultValue={[5]} min={1} max={20} step={1} onValueChange={(value) => setNumQuestions(value[0])} />
      </div>

      <div className="space-y-3">
        <Label>Time Limit (minutes): {timeLimit}</Label>
        <Slider defaultValue={[10]} min={1} max={60} step={1} onValueChange={(value) => setTimeLimit(value[0])} />
      </div>

      <div className="space-y-2">
        <Label>Context Document (Optional PDF)</Label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-2" /> {file ? 'Change File' : 'Upload PDF'}
          </Button>
          <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" accept="application/pdf" />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 w-full">
              <span className="truncate flex-1">{file.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={!topic && !file}>
        <Sparkles className="h-4 w-4 mr-2" /> Generate Quiz
      </Button>
    </form>
  );
};

const GeneratingView = () => (
  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <h2 className="text-xl font-semibold">Generating Your Quiz...</h2>
    <p className="text-muted-foreground">The AI is warming up. This may take a moment.</p>
  </div>
);

const QuizTakingView = ({ quiz, timeLimit, onSubmit }: { quiz: GenerateQuizOutput, timeLimit: number, onSubmit: (answers: string[]) => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(quiz.questions.length).fill(''));
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                onSubmit(answers); 
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSubmit, answers]);
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold truncate" title={quiz.title}>{quiz.title}</h2>
        <div className="flex items-center gap-2 font-mono text-lg font-semibold text-primary">
            <Clock className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
        </div>
      </div>
       <div className="w-full mb-6">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground mt-1 text-center">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
      </div>

      <div className="flex-grow">
        <p className="font-semibold text-lg mb-4">{currentQuestion.question}</p>
        <RadioGroup value={answers[currentQuestionIndex]} onValueChange={handleAnswerChange}>
            {currentQuestion.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-accent has-[:checked]:border-primary">
                    <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${i}`} />
                    <Label htmlFor={`q${currentQuestionIndex}-o${i}`} className="flex-grow cursor-pointer">{option}</Label>
                </div>
            ))}
        </RadioGroup>
      </div>

      <div className="mt-6 flex justify-end">
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(answers)}>
            Finish Quiz
          </Button>
        )}
      </div>
    </div>
  );
};


const QuizResultsView = ({ quiz, userAnswers, onRestart }: { quiz: GenerateQuizOutput, userAnswers: string[], onRestart: () => void }) => {
    let score = 0;
    quiz.questions.forEach((q, i) => {
        if (q.answer === userAnswers[i]) {
            score++;
        }
    });
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
        <ScrollArea className="h-full">
            <div className="p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Quiz Results</h2>
                    <p className="text-6xl font-bold text-primary my-2">{percentage}%</p>
                    <p className="text-muted-foreground">You answered {score} out of {quiz.questions.length} questions correctly.</p>
                </div>
                
                <div className="space-y-4">
                    {quiz.questions.map((q, i) => {
                        const isCorrect = q.answer === userAnswers[i];
                        const userAnswer = userAnswers[i];
                        return (
                             <div key={i} className={cn("p-4 border rounded-lg", isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10')}>
                                <p className="font-semibold">{i + 1}. {q.question}</p>
                                <div className="mt-2 text-sm space-y-1">
                                    {q.options.map((opt, j) => {
                                        const isUserChoice = userAnswer === opt;
                                        const isCorrectAnswer = q.answer === opt;

                                        return (
                                            <p key={j} className={cn(
                                                "flex items-center",
                                                isCorrectAnswer && "text-green-700 dark:text-green-300 font-semibold",
                                                isUserChoice && !isCorrectAnswer && "text-red-700 dark:text-red-300 line-through"
                                            )}>
                                                {isCorrectAnswer && <Check className="h-4 w-4 mr-2 text-green-600" />}
                                                {isUserChoice && !isCorrectAnswer && <X className="h-4 w-4 mr-2 text-red-600" />}
                                                {!isUserChoice && !isCorrectAnswer && <span className="w-6 mr-2"></span>}
                                                {opt}
                                            </p>
                                        )
                                    })}
                                    {!userAnswer && <p className="text-orange-600 font-semibold">Not answered</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="mt-8 flex justify-center">
                    <Button onClick={onRestart}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Take Another Quiz
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
};


export function AiQuizGenerator() {
  const [quizState, setQuizState] = useState<QuizState>('config');
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [timeLimit, setTimeLimit] = useState(10);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const { toast } = useToast();

  const handleStartQuiz = async (topic: string, numQuestions: number, time: number, file?: File) => {
    setQuizState('generating');
    setTimeLimit(time);

    let fileDataUri: string | undefined = undefined;
    if (file) {
      fileDataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    const response = await generateAiQuiz(topic, numQuestions, fileDataUri);
    if (response.success && response.quiz) {
      setQuizData(response.quiz);
      setQuizState('taking');
    } else {
      toast({
        variant: 'destructive',
        title: 'Quiz Generation Failed',
        description: response.error,
      });
      setQuizState('config');
    }
  };

  const handleSubmitQuiz = (finalAnswers: string[]) => {
    setUserAnswers(finalAnswers);
    setQuizState('results');
  };

  const handleRestart = () => {
    setQuizData(null);
    setUserAnswers([]);
    setQuizState('config');
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-background">
      <div className="flex-grow min-h-0">
        {quizState === 'config' && <QuizConfigView onStartQuiz={handleStartQuiz} />}
        {quizState === 'generating' && <GeneratingView />}
        {quizState === 'taking' && quizData && <QuizTakingView quiz={quizData} timeLimit={timeLimit} onSubmit={handleSubmitQuiz} />}
        {quizState === 'results' && quizData && <QuizResultsView quiz={quizData} userAnswers={userAnswers} onRestart={handleRestart} />}
      </div>
    </div>
  );
}

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Note } from './types';
import { format } from 'date-fns';

interface NoteForPdf extends Note {
  topicName: string;
}

// Function to add a header to each page
const addHeader = (doc: jsPDF, topicName: string) => {
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Topic: ${topicName}`, 15, 10);
};

// Function to add a footer with page number
const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Page ${pageNum} of ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
};

const createStyledContainer = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Apply styles to make it render off-screen but with a defined size for html2canvas
    Object.assign(container.style, {
        position: 'absolute',
        left: '-9999px',
        top: '0px',
        width: '800px', // A reasonable width for rendering content
        padding: '20px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Helvetica, Arial, sans-serif',
    });
    return container;
}


const renderNoteContent = (note: NoteForPdf): string => {
    const createdAt = note.createdAt?.toDate ? format(note.createdAt.toDate(), 'PPP') : 'N/A';
    const updatedAt = note.updatedAt?.toDate ? format(note.updatedAt.toDate(), 'PPP') : 'N/A';

    let contentHtml = note.highlightedContent || note.content;

    // For code notes, wrap in a div that controls code block styling
    if (note.type === 'code') {
        contentHtml = `<div class="code-content">${contentHtml}</div>`;
    }

    return `
        <div class="pdf-note-container">
            <h1>${note.title}</h1>
            <div class="metadata">
                <span>Created: ${createdAt}</span> | <span>Last Updated: ${updatedAt}</span>
            </div>
            <hr />
            <div class="content-body">${contentHtml}</div>
        </div>
    `;
};


export const generatePdf = async (notes: NoteForPdf[]) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'px',
    format: 'a4',
  });

  const container = createStyledContainer();
  
  // Add global styles for the PDF content
  const style = document.createElement('style');
  style.innerHTML = `
    .pdf-note-container { page-break-inside: avoid; }
    .pdf-note-container h1 { font-size: 24px; margin-bottom: 10px; font-weight: bold; }
    .pdf-note-container .metadata { font-size: 10px; color: #555; margin-bottom: 10px; }
    .pdf-note-container hr { border-top: 1px solid #ccc; margin: 10px 0; }
    .pdf-note-container .content-body { font-size: 12px; line-height: 1.6; }
    .pdf-note-container .content-body pre { background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 10px; white-space: pre-wrap; word-wrap: break-word; font-family: "Courier New", Courier, monospace; font-size: 11px; }
    .pdf-note-container .content-body code { font-family: "Courier New", Courier, monospace; }
    .pdf-note-container .content-body ul, .pdf-note-container .content-body ol { padding-left: 20px; }
    .pdf-note-container .content-body blockquote { border-left: 2px solid #ccc; padding-left: 10px; margin-left: 0; font-style: italic; }
  `;
  container.appendChild(style);

  let firstPage = true;

  for (const note of notes) {
    if (!firstPage) {
        doc.addPage();
    }
    
    container.innerHTML = style.outerHTML + renderNoteContent(note);

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 40; // with margin
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 20; // top margin

    addHeader(doc, note.topicName);
    doc.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 40);

    let pageCount = 1;
    while (heightLeft > 0) {
      pageCount++;
      doc.addPage();
      position = (-pdfHeight + 40) * (pageCount - 1) + 20;
      addHeader(doc, note.topicName);
      doc.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 40);
    }
    firstPage = false;
  }
  
  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  document.body.removeChild(container);
  
  const safeFilename = notes.length === 1 ? notes[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'codenote-export';
  doc.save(`${safeFilename}.pdf`);
};

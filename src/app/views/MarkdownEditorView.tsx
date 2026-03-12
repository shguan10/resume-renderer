import React, { useState, useRef, useCallback } from 'react';
import { MarkdownEditorLayout } from '@/app/components/layouts/MarkdownEditorLayout';
import { marked } from 'marked';

export function MarkdownEditorView() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart typing your markdown here...');
  const [renderedHtml, setRenderedHtml] = useState('');
  const paperRef = useRef<HTMLDivElement>(null);

  const handleRender = useCallback(() => {
    const html = marked.parse(markdown);
    if (typeof html === 'string') {
      setRenderedHtml(html);
    }
  }, [markdown]);

  const handlePrint = useCallback(() => {
    if (!paperRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print</title>
        <style>
          /* 1. Define the physical page size */
          @page { 
            size: 8.5in 11in; 
            margin: 1in; /* Standard margins */
          }

          body { 
            margin: 0; 
            padding: 0; 
            background: white;
          }

          /* 2. The container should not have a fixed height */
          .content-wrapper {
            width: 100%;
            font-family: 'Georgia', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #1a1a1a;
          }

          /* 3. Prevent elements from splitting awkwardly across pages */
          h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
          img, pre, blockquote, tr { 
            page-break-inside: avoid; 
            break-inside: avoid; 
          }

          /* General Markdown Styling */
          h1 { font-size: 24pt; }
          pre { background: #f0f0f0; padding: 12pt; white-space: pre-wrap; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6pt; }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          ${paperRef.current.innerHTML}
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  return (
    <MarkdownEditorLayout
      markdown={markdown}
      renderedHtml={renderedHtml}
      paperRef={paperRef}
      onMarkdownChange={setMarkdown}
      onRender={handleRender}
      onPrint={handlePrint}
    />
  );
}

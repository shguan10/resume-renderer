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
            @page { size: 8.5in 11in; margin: 0; }
            body { margin: 0; padding: 0; }
            .page {
              width: 8.5in;
              min-height: 11in;
              padding: 1in;
              box-sizing: border-box;
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #1a1a1a;
            }
            .page h1 { font-size: 24pt; margin: 0 0 12pt; }
            .page h2 { font-size: 18pt; margin: 16pt 0 8pt; }
            .page h3 { font-size: 14pt; margin: 12pt 0 6pt; }
            .page p { margin: 0 0 8pt; }
            .page ul, .page ol { margin: 0 0 8pt; padding-left: 24pt; }
            .page code { background: #f0f0f0; padding: 2pt 4pt; border-radius: 3px; font-size: 11pt; }
            .page pre { background: #f0f0f0; padding: 12pt; border-radius: 4px; overflow-x: auto; }
            .page pre code { background: none; padding: 0; }
            .page blockquote { border-left: 3px solid #ccc; margin: 0 0 8pt; padding-left: 12pt; color: #555; }
            .page table { border-collapse: collapse; width: 100%; margin: 0 0 8pt; }
            .page th, .page td { border: 1px solid #ccc; padding: 6pt 8pt; text-align: left; }
            .page th { background: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="page">${paperRef.current.innerHTML}</div>
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

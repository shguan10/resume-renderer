import React from 'react';
import { Printer } from 'lucide-react';

interface MarkdownEditorLayoutProps {
  markdown: string;
  renderedHtml: string;
  paperRef: React.RefObject<HTMLDivElement | null>;
  onMarkdownChange: (value: string) => void;
  onRender: () => void;
  onPrint: () => void;
}

export function MarkdownEditorLayout({
  markdown,
  renderedHtml,
  paperRef,
  onMarkdownChange,
  onRender,
  onPrint,
}: MarkdownEditorLayoutProps) {
  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden font-sans">
      {/* Toolbar */}
      <header className="md-editor-toolbar">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">Markdown → Paper</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRender} className="md-editor-render-btn">
            Render
          </button>
          <button
            onClick={onPrint}
            className="md-editor-print-btn"
            disabled={!renderedHtml}
            aria-label="Print"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </header>

      {/* Split panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 flex flex-col border-r border-border">
          <div className="md-editor-pane-label">Input</div>
          <textarea
            className="md-editor-textarea"
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder="Type your markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="md-editor-pane-label">Preview (8.5″ × 11″)</div>
          <div className="flex-1 overflow-auto bg-muted p-6">
            <div
              ref={paperRef}
              className="md-editor-paper"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
            {!renderedHtml && (
              <div className="md-editor-paper flex items-center justify-center">
                <p className="text-muted-foreground text-sm italic">
                  Click "Render" to preview your markdown
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ResumeFont, PageLayout } from '@/app/views/MarkdownEditorView';

interface MarkdownEditorLayoutProps {
  markdown: string;
  font: ResumeFont;
  pageLayout: PageLayout;
  paperRef: React.RefObject<HTMLDivElement | null>;
  onMarkdownChange: (value: string) => void;
  onFontChange: (font: ResumeFont) => void;
  onPageLayoutChange: (layout: PageLayout) => void;
  onPrint: () => void;
}

const PAGE_BREAK_MARKER = '---page-break---';

function splitByPageBreaks(markdown: string): string[] {
  return markdown.split(PAGE_BREAK_MARKER).map((s) => s.trim());
}

const FONT_OPTIONS: { value: ResumeFont; label: string }[] = [
  { value: 'Geist', label: 'Geist (Modern)' },
  { value: 'Inter', label: 'Inter (Clean)' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville (Classic)' },
];

export function MarkdownEditorLayout({
  markdown,
  font,
  pageLayout,
  paperRef,
  onMarkdownChange,
  onFontChange,
  onPageLayoutChange,
  onPrint,
}: MarkdownEditorLayoutProps) {
  const pages = splitByPageBreaks(markdown);
  const displayPages = pageLayout === '1' ? [pages.join('\n\n')] : pages;

  return (
    <>
      {/* Screen UI */}
      <div className="h-screen w-full bg-background flex flex-col overflow-hidden font-sans print:hidden">
        {/* Toolbar */}
        <header className="md-editor-toolbar">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">Resume Builder</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Font selector */}
            <select
              value={font}
              onChange={(e) => onFontChange(e.target.value as ResumeFont)}
              className="md-editor-select"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Page layout toggle */}
            <select
              value={pageLayout}
              onChange={(e) => onPageLayoutChange(e.target.value as PageLayout)}
              className="md-editor-select"
            >
              <option value="1">1 Page</option>
              <option value="2">2 Pages</option>
            </select>

            <button onClick={onPrint} className="md-editor-render-btn">
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </header>

        {/* Split panes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Editor */}
          <div className="w-1/2 flex flex-col border-r border-border">
            <div className="md-editor-pane-label">Markdown Input</div>
            <textarea
              className="md-editor-textarea"
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              placeholder="Type your resume markdown here..."
              spellCheck={false}
            />
          </div>

          {/* Right: Live Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="md-editor-pane-label">Live Preview (8.5″ × 11″)</div>
            <div className="flex-1 overflow-auto bg-muted p-6">
              <div ref={paperRef}>
                {displayPages.map((pageContent, index) => (
                  <div
                    key={index}
                    className="resume-page"
                    style={{ fontFamily: `'${font}', sans-serif` }}
                  >
                    <div className="resume-prose prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {pageContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block" id="print-resume">
        {displayPages.map((pageContent, index) => (
          <div
            key={index}
            className="resume-print-page"
            style={{ fontFamily: `'${font}', sans-serif` }}
          >
            <div className="resume-prose prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {pageContent}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

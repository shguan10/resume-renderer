import React from 'react';
import { Download, Play, Loader2 } from 'lucide-react';
import type { ResumeFont, PageLayout } from '@/app/views/MarkdownEditorView';
import type { FitVariables } from '@/app/utils/fittingAlgorithm';

interface RenderedPage {
  html: string;
  fitVars: FitVariables;
}

interface MarkdownEditorLayoutProps {
  markdown: string;
  font: ResumeFont;
  pageLayout: PageLayout;
  renderedPages: RenderedPage[] | null;
  isRendering: boolean;
  renderContainerRef: React.RefObject<HTMLDivElement | null>;
  onMarkdownChange: (value: string) => void;
  onFontChange: (font: ResumeFont) => void;
  onPageLayoutChange: (layout: PageLayout) => void;
  onRender: () => void;
  onDownloadPdf: () => void;
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
  renderedPages,
  isRendering,
  renderContainerRef,
  onMarkdownChange,
  onFontChange,
  onPageLayoutChange,
  onRender,
  onDownloadPdf,
}: MarkdownEditorLayoutProps) {
  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden font-sans">
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

          <button
            onClick={onRender}
            disabled={isRendering}
            className="md-editor-render-btn"
          >
            {isRendering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Render
          </button>

          {renderedPages && (
            <button onClick={onDownloadPdf} className="md-editor-download-btn">
              <Download size={16} />
              Download PDF
            </button>
          )}
        </div>
      </header>

      {/* Split panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor (full width if no render, half if rendered) */}
        <div className={`flex flex-col border-r border-border ${renderedPages ? 'w-1/2' : 'w-full'}`}>
          <div className="md-editor-pane-label">
            Markdown Input
            <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
              (Ctrl+Enter to render)
            </span>
          </div>
          <textarea
            className="md-editor-textarea"
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder="Type your resume markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Right: Rendered Output (only after render) */}
        {renderedPages && (
          <div className="w-1/2 flex flex-col">
            <div className="md-editor-pane-label">Rendered Output (8.5″ × 11″)</div>
            <div className="flex-1 overflow-auto bg-muted p-6">
              <div ref={renderContainerRef}>
                {renderedPages.map((page, index) => (
                  <div
                    key={index}
                    className="resume-page resume-fitted"
                    style={{
                      fontFamily: `'${font}', sans-serif`,
                      ['--fit-h2-margin-top' as string]: `${page.fitVars.h2MarginTop}pt`,
                      ['--fit-p-margin-bottom' as string]: `${page.fitVars.pMarginBottom}pt`,
                      ['--fit-li-margin-bottom' as string]: `${page.fitVars.liMarginBottom}pt`,
                      ['--fit-base-font-size' as string]: `${page.fitVars.baseFontSize}pt`,
                    }}
                  >
                    <div
                      className="resume-prose prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: page.html }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

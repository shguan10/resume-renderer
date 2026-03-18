import React, { useMemo, useLayoutEffect, useCallback } from 'react';
import { Download, Play, Loader2, FileCode, Eye, EyeOff, Wand2 } from 'lucide-react';
import type {
  ResumeFont,
  PageLayout,
  InputMode,
  ResumeTemplate,
  RenderedPage,
} from '@/app/views/MarkdownEditorView';
import type { StyleValues } from '@/app/utils/fittingAlgorithm';
import { ResizableDivider } from '@/app/components/ResizableDivider';

const FONT_OPTIONS: { value: ResumeFont; label: string }[] = [
  { value: 'Geist', label: 'Geist (Modern)' },
  { value: 'Inter', label: 'Inter (Clean)' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville (Classic)' },
];

interface MarkdownEditorLayoutProps {
  inputMode: InputMode;
  template: ResumeTemplate;
  onInputModeChange: (mode: InputMode) => void;
  onTemplateChange: (template: ResumeTemplate) => void;
  inputContent: string;
  onInputContentChange: (value: string) => void;
  font: ResumeFont;
  pageLayout: PageLayout;
  renderedPages: RenderedPage[] | null;
  isFitting: boolean;
  renderContainerRef: React.RefObject<HTMLDivElement | null>;
  onFontChange: (font: ResumeFont) => void;
  onPageLayoutChange: (layout: PageLayout) => void;
  onRender: () => void;
  onAutoFit: () => void;
  onDownloadPdf: () => void;
  onExportDiagnostic: () => void;
  showFitVariables: boolean;
  onToggleFitVariables: () => void;
  styleValues: StyleValues;
  fitVarKeys: string[];
  fitVarLabels: Record<string, string>;
  onStyleValueChange: (styleKey: string, value: number) => void;
  onResetFitVariables: () => void;
  pageCssVars: Record<string, string>;
  dividerFraction: number;
  onDividerFractionChange: (f: number) => void;
  setPageRef: (index: number, el: HTMLDivElement | null) => void;
  onRenderReady?: () => void;
}

export function MarkdownEditorLayout({
  inputMode,
  template,
  onInputModeChange,
  onTemplateChange,
  inputContent,
  onInputContentChange,
  font,
  pageLayout,
  renderedPages,
  isFitting,
  renderContainerRef,
  onFontChange,
  onPageLayoutChange,
  onRender,
  onAutoFit,
  onDownloadPdf,
  onExportDiagnostic,
  showFitVariables,
  onToggleFitVariables,
  styleValues,
  fitVarKeys,
  fitVarLabels,
  onStyleValueChange,
  onResetFitVariables,
  pageCssVars,
  dividerFraction,
  onDividerFractionChange,
  setPageRef,
  onRenderReady,
}: MarkdownEditorLayoutProps) {
  useLayoutEffect(() => {
    onRenderReady?.();
  }, [pageCssVars, renderedPages, font, pageLayout, onRenderReady]);

  const leftPct = `${dividerFraction * 100}%`;
  const rightPct = `${(1 - dividerFraction) * 100}%`;

  const pageStyle = useMemo<React.CSSProperties>(
    () => ({
      ...(pageCssVars as React.CSSProperties),
      fontFamily: `'${font}', sans-serif`,
    }),
    [pageCssVars, font],
  );

  const handleFitVarInput = useCallback(
    (key: string, raw: string) => {
      const num = parseFloat(raw);
      if (!Number.isNaN(num)) onStyleValueChange(key, num);
    },
    [onStyleValueChange],
  );

  /** Determine step size for a given fit variable key */
  const stepForKey = (key: string): number => {
    if (key === 'line-height' || key === 'lineHeight') return 0.05;
    if (key.includes('letter') || key.includes('word')) return 0.02;
    return 0.5;
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden font-sans">
      {/* Toolbar */}
      <header className="md-editor-toolbar">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground">Resume Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Input mode selector */}
          <select
            value={inputMode}
            onChange={(e) => onInputModeChange(e.target.value as InputMode)}
            className="md-editor-select"
          >
            <option value="markdown">Markdown</option>
            <option value="xml">XML</option>
          </select>

          {/* Template selector (XML mode only) */}
          {inputMode === 'xml' && (
            <select
              value={template}
              onChange={(e) => onTemplateChange(e.target.value as ResumeTemplate)}
              className="md-editor-select"
            >
              <option value="default">Default Template</option>
            </select>
          )}

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

          <select
            value={pageLayout}
            onChange={(e) => onPageLayoutChange(e.target.value as PageLayout)}
            className="md-editor-select"
          >
            <option value="1">1 Page</option>
            <option value="2">2 Pages</option>
          </select>

          <button onClick={onRender} disabled={isFitting} className="md-editor-render-btn">
            <Play size={16} />
            Render
          </button>

          <button
            onClick={onAutoFit}
            disabled={isFitting || !renderedPages}
            className="md-editor-autofit-btn"
          >
            {isFitting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Auto-Fit
          </button>

          <button
            onClick={onToggleFitVariables}
            className="md-editor-fit-btn"
            aria-pressed={showFitVariables}
            type="button"
          >
            {showFitVariables ? <EyeOff size={16} /> : <Eye size={16} />}
            {showFitVariables ? 'Hide Fit Vars' : 'Show Fit Vars'}
          </button>

          {renderedPages && (
            <>
              <button onClick={onDownloadPdf} className="md-editor-download-btn" disabled={isFitting}>
                <Download size={16} />
                PDF
              </button>
              <button
                onClick={onExportDiagnostic}
                className="md-editor-diagnostic-btn"
                disabled={isFitting}
              >
                <FileCode size={16} />
                HTML/CSS
              </button>
            </>
          )}
        </div>
      </header>

      {/* Split panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor or Fit Variables overlay */}
        <div className="flex flex-col relative" style={{ width: leftPct }}>
          <div className="md-editor-pane-label">
            {showFitVariables
              ? 'Fit Variables'
              : inputMode === 'xml'
                ? 'XML Input'
                : 'Markdown Input'}
            {!showFitVariables && (
              <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                (Ctrl+Enter to render)
              </span>
            )}
          </div>

          {showFitVariables ? (
            <div className="md-editor-fitvars-overlay">
              <div className="md-editor-fitvars-toolbar">
                <button
                  type="button"
                  onClick={onResetFitVariables}
                  disabled={isFitting}
                  className="md-editor-fitvars-reset-btn"
                >
                  Reset to default
                </button>
              </div>
              <div className="md-editor-fitvars-grid">
                {fitVarKeys.map((key) => (
                  <div key={key} className="md-editor-fitvars-item">
                    <label className="md-editor-fitvars-label">{fitVarLabels[key] ?? key}</label>
                    <input
                      type="number"
                      step={stepForKey(key)}
                      value={Number((styleValues[key] ?? 0).toFixed(3))}
                      onChange={(e) => handleFitVarInput(key, e.target.value)}
                      className="md-editor-fitvars-input"
                      disabled={isFitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <textarea
              className="md-editor-textarea"
              value={inputContent}
              onChange={(e) => onInputContentChange(e.target.value)}
              placeholder={
                inputMode === 'xml'
                  ? 'Paste your resume XML here...'
                  : 'Type your resume markdown here...'
              }
              spellCheck={false}
            />
          )}
        </div>

        {/* Draggable divider */}
        <ResizableDivider fraction={dividerFraction} onFractionChange={onDividerFractionChange} />

        {/* Right: Preview (always visible) */}
        <div className="flex flex-col" style={{ width: rightPct }}>
          <div className="md-editor-pane-label">
            Rendered Output (8.5″ × 11″)
            {isFitting && (
              <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
                Fitting…
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-muted p-6">
            {renderedPages ? (
              <div ref={renderContainerRef}>
                {renderedPages.map((page, index) => {
                  const pageClassName =
                    page.mode === 'xml'
                      ? 'resume-page resume-xml'
                      : 'resume-page resume-multiscale';
                  return (
                    <div
                      key={index}
                      ref={(el) => setPageRef(index, el)}
                      className={pageClassName}
                      style={pageStyle}
                    >
                      {page.mode === 'xml' ? (
                        <div className="rv-xml-inner">{page.content}</div>
                      ) : (
                        <div
                          className="resume-prose prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: page.html }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="md-editor-preview-placeholder">
                <p className="text-muted-foreground text-sm">
                  Click <strong>Render</strong> or press <strong>Ctrl+Enter</strong> to preview your
                  resume.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

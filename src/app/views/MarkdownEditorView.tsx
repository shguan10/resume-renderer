import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import { MarkdownEditorLayout } from '@/app/components/layouts/MarkdownEditorLayout';
import {
  fitContentToPage,
  buildStyleSnapshotFromValues,
  cascadeDown,
  cascadeUp,
  buildResizeableStyles,
  type StyleValues,
} from '@/app/utils/fittingAlgorithm';
import { buildXmlStyleDefinitions } from '@/app/utils/xmlFitStyles';
import { buildHtmlStyleDefinitions, buildHtmlCssVars } from '@/app/utils/htmlFitStyles';
import { parseResumeXml } from '@/app/utils/xmlResumeParser';
import { parseHtmlToResumeNode } from '@/app/utils/htmlResumeParser';
import { parseMarkdownToResumeNode } from '@/app/utils/mdResumeParser';
import { renderXmlResume, buildXmlCssVars } from '@/app/utils/xmlResumeRenderer';
import { exportToPdf } from '@/app/utils/pdfExport';
import { exportDiagnosticHtml } from '@/app/utils/diagnosticExport';
import { toast } from 'sonner';

// Load default content from data files (source of truth)
import resumeMdDefault from '@/app/data/resume-master.md?raw';
import resumeHtmlDefault from '@/app/data/resume-master.html?raw';
import resumeXmlDefault from '@/app/data/resume-master.xml?raw';

// ── Types ────────────────────────────────────────────────────────────────

export type ResumeFont = 'Geist' | 'Inter' | 'Libre Baskerville';
export type PageLayout = '1' | '2';
export type InputMode = 'markdown' | 'html' | 'xml';
export type ResumeTemplate = 'default';

export interface RenderedPage {
  content: ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────

export function MarkdownEditorView() {
  const [inputMode, setInputMode] = useState<InputMode>('xml');
  const [template, setTemplate] = useState<ResumeTemplate>('default');
  const [markdown, setMarkdown] = useState(resumeMdDefault);
  const [htmlContent, setHtmlContent] = useState(resumeHtmlDefault);
  const [xmlContent, setXmlContent] = useState(resumeXmlDefault);
  const [font, setFont] = useState<ResumeFont>('Geist');
  const [pageLayout, setPageLayout] = useState<PageLayout>('2');
  const [renderedPages, setRenderedPages] = useState<RenderedPage[] | null>(null);
  const [isFitting, setIsFitting] = useState(false);
  const [showFitVariables, setShowFitVariables] = useState(false);
  const [dividerFraction, setDividerFraction] = useState(0.5);

  const xmlStyleDefinitions = useMemo(() => buildXmlStyleDefinitions(), []);
  const htmlStyleDefinitions = useMemo(() => buildHtmlStyleDefinitions(), []);
  const useXmlStyles = inputMode === 'xml';
  const styleDefinitions = useMemo(
    () => (useXmlStyles ? xmlStyleDefinitions : htmlStyleDefinitions),
    [useXmlStyles, xmlStyleDefinitions, htmlStyleDefinitions],
  );

  const defaultStyleValues = useMemo(
    () =>
      styleDefinitions.reduce<StyleValues>((acc, def) => {
        acc[def.key] = def.defaultValue;
        return acc;
      }, {}),
    [styleDefinitions],
  );

  const [styleValues, setStyleValues] = useState<StyleValues>(() => defaultStyleValues);

  const workingValues = { ...styleValues }; // local copy
  const fittingStyles = buildResizeableStyles(styleDefinitions, workingValues, (key, newValue) => {
    workingValues[key] = newValue;
    setStyleValues({ ...workingValues });
  });

  // Reset style values when input mode changes
  useEffect(() => {
    setStyleValues(defaultStyleValues);
    setRenderedPages(null);
  }, [inputMode, defaultStyleValues]);

  // Fit var keys & labels derived from definitions
  const fitVarKeys = useMemo(() => styleDefinitions.map((d) => d.key), [styleDefinitions]);
  const fitVarLabels = useMemo(
    () =>
      styleDefinitions.reduce<Record<string, string>>(
        (acc, d) => ({ ...acc, [d.key]: d.description }),
        {},
      ),
    [styleDefinitions],
  );

  // Compute CSS vars for pages (mode-specific pipeline)
  const pageCssVars = useMemo<Record<string, string>>(
    () => (useXmlStyles ? buildXmlCssVars(styleValues) : buildHtmlCssVars(styleValues)),
    [styleValues, useXmlStyles],
  );

  const resetStyleValues = useCallback(() => {
    setStyleValues(defaultStyleValues);
  }, [defaultStyleValues]);

  // Render-ready signalling for the fitting algorithm
  const renderReadyResolver = useRef<(() => void) | null>(null);
  const renderReadyPending = useRef(false);
  const waitForRenderReady = useCallback(() => {
    console.log("waitForRenderReady\n");
    if (renderReadyPending.current) {
      console.log("waitForRenderReady -- immediately resolved\n");
      renderReadyPending.current = false;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      renderReadyResolver.current = () => {
        renderReadyResolver.current = null;
        console.log("waitForRenderReady -- resolved\n");
        resolve();
      };
    });
  }, []);
  const signalRenderReady = useCallback(() => {
    console.log("signalRenderReady\n");
    if (renderReadyResolver.current) {
      renderReadyResolver.current();
    } else {
      renderReadyPending.current = true;
    }
  }, []);

  const renderContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const setPageRef = useCallback((index: number, el: HTMLDivElement | null) => {
    pageRefs.current[index] = el;
  }, []);

  // ── Render (unified pipeline: all modes → ResumeNode → XML renderer) ─
  const handleRender = useCallback(() => {
    try {
      let root;
      if (inputMode === 'xml') {
        root = parseResumeXml(xmlContent);
      } else if (inputMode === 'html') {
        root = parseHtmlToResumeNode(htmlContent);
      } else {
        root = parseMarkdownToResumeNode(markdown);
      }
      const pages = renderXmlResume(root, pageLayout);
      setRenderedPages(pages.map((page) => ({ content: page.content })));
    } catch (err) {
      toast.error('Parse error: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [inputMode, xmlContent, htmlContent, markdown, pageLayout]);

  // ── Auto-Fit ───────────────────────────────────────────────────────────
  const handleAutoFit = useCallback(() => {
    handleRender();
    setIsFitting(true);
  }, [handleRender]);

  useLayoutEffect(() => {
    if (!isFitting) return;
    const pageElements = pageRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (pageElements.length === 0) {
      setIsFitting(false);
      toast.error('Could not find page elements for fitting.');
      return;
    }
    const runFitting = async () => {
      try {
        const fitResult = await fitContentToPage(
          pageElements,
          fittingStyles,
          waitForRenderReady,
        );
        toast.info('Fitting Report', { description: fitResult.report, duration: 5000 });
      } catch (err) {
        toast.error('Fitting failed. Check console for details.');
        console.error(err);
      } finally {
        setIsFitting(false);
      }
    };
    runFitting();
  }, [isFitting, styleDefinitions, styleValues, setStyleValues, waitForRenderReady]);

  const handleDownloadPdf = useCallback(async () => {
    if (!renderContainerRef.current) return;
    toast.info('Generating PDF…');
    try {
      await exportToPdf(renderContainerRef.current);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('PDF export failed. Check console for details.');
      console.error(err);
    }
  }, []);

  const handleExportDiagnostic = useCallback(() => {
    if (!renderContainerRef.current || !renderedPages) return;
    requestAnimationFrame(() => {
      if (!renderContainerRef.current) {
        toast.error('Preview disappeared before export could start.');
        return;
      }
      exportDiagnosticHtml(renderContainerRef.current);
      toast.success('Diagnostic HTML exported!');
    });
  }, [renderedPages]);

  const toggleFitVariables = useCallback(() => {
    setShowFitVariables((prev) => !prev);
  }, []);

  // Hierarchy-respecting style value change
  const handleStyleValueChange = useCallback(
    (styleKey: string, value: number) => {
      const style = fittingStyles.find((s) => s.key === styleKey);
      if(!style) return;

      const oldValue = style.getCurrentValue();
      if (value < oldValue) {
        cascadeDown(style, value);
      } else if (value > oldValue) {
        cascadeUp(style, value);
      } else {
        style.setCurrentValue(value);
      }
    },
    [styleDefinitions],
  );

  // Active input content based on mode
  const inputContent =
    inputMode === 'xml' ? xmlContent : inputMode === 'html' ? htmlContent : markdown;

  const handleInputContentChange = useCallback(
    (value: string) => {
      if (inputMode === 'xml') setXmlContent(value);
      else if (inputMode === 'html') setHtmlContent(value);
      else setMarkdown(value);
    },
    [inputMode],
  );

  // Ctrl+Enter to render
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRender();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRender]);

  return (
    <MarkdownEditorLayout
      inputMode={inputMode}
      template={template}
      onInputModeChange={setInputMode}
      onTemplateChange={setTemplate}
      inputContent={inputContent}
      onInputContentChange={handleInputContentChange}
      font={font}
      pageLayout={pageLayout}
      renderedPages={renderedPages}
      isFitting={isFitting}
      renderContainerRef={renderContainerRef}
      onFontChange={setFont}
      onPageLayoutChange={setPageLayout}
      onRender={handleRender}
      onAutoFit={handleAutoFit}
      onDownloadPdf={handleDownloadPdf}
      onExportDiagnostic={handleExportDiagnostic}
      showFitVariables={showFitVariables}
      onToggleFitVariables={toggleFitVariables}
      styleValues={styleValues}
      fitVarKeys={fitVarKeys}
      fitVarLabels={fitVarLabels}
      onStyleValueChange={handleStyleValueChange}
      onResetFitVariables={resetStyleValues}
      pageCssVars={pageCssVars}
      dividerFraction={dividerFraction}
      onDividerFractionChange={setDividerFraction}
      setPageRef={setPageRef}
      onRenderReady={signalRenderReady}
    />
  );
}

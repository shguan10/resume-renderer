import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownEditorLayout } from '@/app/components/layouts/MarkdownEditorLayout';
import {
  fitContentToPage,
  buildDefaultStyleDefinitions,
  buildStyleSnapshotFromValues,
  buildVarsFromStyles,
  buildMarkdownCssVars,
  type StyleValues,
} from '@/app/utils/fittingAlgorithm';
import { buildXmlStyleDefinitions } from '@/app/utils/xmlFitStyles';
import { parseResumeXml } from '@/app/utils/xmlResumeParser';
import { renderXmlResume, buildXmlCssVars } from '@/app/utils/xmlResumeRenderer';
import { exportToPdf } from '@/app/utils/pdfExport';
import { exportDiagnosticHtml } from '@/app/utils/diagnosticExport';
import { toast } from 'sonner';
import { renderToStaticMarkup } from 'react-dom/server';
import resumeXmlDefault from '@/app/data/resume-master.xml?raw';

// ── Constants & Types ────────────────────────────────────────────────────

const DEFAULT_MARKDOWN = `# Shane Guan
309-868-8331 | shguan10@gmail.com | https://shguan10.github.io

### SUMMARY
*   **Data Scientist & ML Engineer** with a B.S. in Computer Science (University Honors) and Minor in Machine Learning from Carnegie Mellon University.
*   **4 years of professional experience** (Microsoft) specializing in ML model kernel optimization, connectivity protocols, and IoT telemetry.
*   **Direct Caterpillar Experience:** Former Machine Perception Co-op and Software Intern with a focus on machine health, payload telemetry, and computer vision.

### TECHNICAL SKILLS
*   **ML/AI:** PyTorch, TensorFlow, Keras, DirectML, Generative AI (Gemini, LLM Agents), Computer Vision, NLP.
*   **Languages:** Python (Advanced), C/C++, CUDA, SQL (Postgres, Kusto, SQLite), HLSL.
*   **Tools/Platforms:** Azure DevOps, Windbg, PIX, Raspberry Pi.

### EDUCATION
**Carnegie Mellon University (CMU)** | Pittsburgh, PA | Dec 2020
*   B.S. in Computer Science (University Honors), Minor in Machine Learning, **GPA** 3.68
*   **Relevant Coursework:** TA for 10-617 Intermediate Deep Learning

### WORK EXPERIENCE
**Microsoft, Inc. | Software Engineer (DirectML Team)** | Aug 2023 – Jan 2025
*   Optimized ML workloads from ONNX/TensorFlow into high-performance pipelines for GPUs/NPUs, which is directly applicable to **edge computing and on-board machine analytics.**
*   Implemented metacommands to enhance hardware acceleration, improving model inference efficiency for real-time applications.
*   Utilized **analytical thinking** to debug complex library code and shaders using Windbg and PIX.

**Microsoft, Inc. | Software Engineer (Connectivity Platform Team)** | Feb 2021 – Aug 2023
*   Engineered secure, short-range communication protocols for **embedded IoT devices** following IEEE specifications.
*   Managed data conversion logic for public WinRT APIs, ensuring high **accuracy and attention to detail** in mission-critical connectivity systems.
*   Established fuzz testing frameworks to ensure long-term system stability and connectivity.

**Microsoft, Inc. | Explore Intern (PM + SWE)** | May 2019 – Aug 2019
*   **Big Data Querying:** Developed a prototype backend for Microsoft Defender using **Cosmos and Kusto (KQL)**, Microsoft's internal big data solutions.
*   **Data Extraction:** Authored complex queries to search, extract, and format large-scale security datasets for feature analysis and requirement gathering.

**Caterpillar, Inc. | Machine Perception Engineer Co-op** | Aug 2018 – May 2019
*   **Anomaly Detection:** Developed PyTorch-based techniques to identify flaws in training datasets, improving inference performance for machine perception.
*   **Computer Vision:** Enhanced state-of-the-art ENet algorithms for image segmentation in autonomous heavy machinery.
---page-break---
**Caterpillar, Inc. | Software Engineer Intern** | May 2018 – Aug 2018
*   **Telematics:** Developed a C++ application to detect machine state and measure **payload via telemetry data.**
*   **Predictive Modeling:** Built a Python-based debug tool to simulate Electronic Control Modules (ECMs), accelerating test cycles for equipment risk models.

### PUBLICATIONS
*   X. Guan, J. Lee, P. Wu, Y. Wu. *Machine Learning for Exam Triage.* Proceedings of the 2018 HackAuton hosted by the AutonLab, Pittsburgh, Pennsylvania, 2018.
*   S.Kazadi, G. Jeno, X. Guan, N. Nusgart, A. Sheptunov. *Decision making swarms.* Proceedings of the 28th Modern Artificial Intelligence and Cognitive Science Conference, Fort Wayne, Indiana, 2017. 

### RESEARCH & THESIS
**Senior Thesis: Exploiting Extra Inputs During Training Time** | Jan 2020 – Dec 2020
*   Investigated theoretical basis for **multimodal ML tasks**, specifically focusing on data imputation.
*   **Statistical Analysis:** Proved through linear distribution analysis that empirical averaging outperforms predictive imputation during test time for missing modalities.

**Autoencoder-Based Attacks on Deep Learning Models** | Jan 2019 – May 2019
*   Developed a technique for identifying flaws in training datasets using PyTorch.
*   Identified model sensitivity to environmental lighting (darker shades), a critical factor in **outdoor heavy equipment operation.**

### NOTABLE PROJECTS
**PerceptionTrainer (Generative AI & Database Management)** | Jan 2026 – March 2026
*   **Full-Stack Data Architecture:** Architected a scalable backend using **PostgreSQL and Supabase** to support user test results and a friendship table.
*   **Query Optimization:** Implemented efficient data access patterns and relational schemas to support real-time performance.
*   **GenAI Integration:** Leveraged Gemini and AI agents to accelerate the SDLC, including rapid prototyping, validation, and migration of database schemas.

**Chest Disease Identification (Dense CNN)** | April 2018
*   Achieved better AUROC scores than state-of-the-art CheXNet by incorporating skip connections and additional features.
*   **Award:** Won "Best in Show" at Hack Auton hackathon for **predictive risk modeling.**

**Snowflake: IoT Fridge Management** | March 2018
*   Built an automated inventory system using **Computer Vision (TensorFlow)** and Raspberry Pi to track expiration and reduce waste.

**Sight2Sound: Aid for the Blind** | Jan 2018
*   Mapped video pixels to audio frequencies using Hilbert curves to enable perception of movement via sound.

### TEACHING EXPERIENCE
**Teaching Assistant: Intermediate Deep Learning (CMU)** | Aug 2019 – May 2020
*   Led recitations on **Vector Differentiation** and advanced statistical concepts for 30+ students.
*   Developed auto-graded unit tests and templates for Backpropagation programming assignments.
`;

export type ResumeFont = 'Geist' | 'Inter' | 'Libre Baskerville';
export type PageLayout = '1' | '2';
export type InputMode = 'markdown' | 'xml';
export type ResumeTemplate = 'default';

const PAGE_BREAK_MARKER = '---page-break---';

export type RenderedPage =
  | { mode: 'markdown'; html: string }
  | { mode: 'xml'; content: ReactNode };

function markdownToHtml(md: string): string {
  const element = React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, md);
  return renderToStaticMarkup(element);
}

// ── Component ────────────────────────────────────────────────────────────

export function MarkdownEditorView() {
  const [inputMode, setInputMode] = useState<InputMode>('markdown');
  const [template, setTemplate] = useState<ResumeTemplate>('default');
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [xmlContent, setXmlContent] = useState(resumeXmlDefault);
  const [font, setFont] = useState<ResumeFont>('Geist');
  const [pageLayout, setPageLayout] = useState<PageLayout>('2');
  const [renderedPages, setRenderedPages] = useState<RenderedPage[] | null>(null);
  const [isFitting, setIsFitting] = useState(false);
  const [showFitVariables, setShowFitVariables] = useState(false);
  const [dividerFraction, setDividerFraction] = useState(0.5);

  // Style definitions change based on input mode
  const styleDefinitions = useMemo(
    () => (inputMode === 'xml' ? buildXmlStyleDefinitions() : buildDefaultStyleDefinitions()),
    [inputMode],
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

  // Compute CSS vars for pages
  const pageCssVars = useMemo<Record<string, string>>(() => {
    if (inputMode === 'xml') {
      return buildXmlCssVars(styleValues);
    }
    const snapshot = buildStyleSnapshotFromValues(styleDefinitions, styleValues);
    const fitVars = buildVarsFromStyles(snapshot);
    return buildMarkdownCssVars(fitVars);
  }, [inputMode, styleDefinitions, styleValues]);

  const resetStyleValues = useCallback(() => {
    setStyleValues(defaultStyleValues);
  }, [defaultStyleValues]);

  // Render-ready signalling for the fitting algorithm
  const renderReadyResolver = useRef<(() => void) | null>(null);
  const renderReadyPending = useRef(false);
  const waitForRenderReady = useCallback(() => {
    if (renderReadyPending.current) {
      renderReadyPending.current = false;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      renderReadyResolver.current = () => {
        renderReadyResolver.current = null;
        resolve();
      };
    });
  }, []);
  const signalRenderReady = useCallback(() => {
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

  // ── Render (just display with current style values) ────────────────
  const handleRender = useCallback(() => {
    if (inputMode === 'xml') {
      try {
        const root = parseResumeXml(xmlContent);
        const pages = renderXmlResume(root, pageLayout);
        setRenderedPages(pages.map((page) => ({ mode: 'xml', content: page.content })));
      } catch (err) {
        toast.error('XML parse error: ' + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      const rawPages = markdown.split(PAGE_BREAK_MARKER).map((s) => s.trim());
      const pages = pageLayout === '1' ? [rawPages.join('\n\n')] : rawPages;
      setRenderedPages(
        pages.map((pageMd) => ({ mode: 'markdown', html: markdownToHtml(pageMd) })),
      );
    }
  }, [inputMode, xmlContent, markdown, pageLayout]);

  // ── Auto-Fit (render then run fitting algorithm) ────────────────────
  const handleAutoFit = useCallback(() => {
    handleRender();
    setIsFitting(true);
  }, [handleRender]);

  // Kick off fitting when isFitting becomes true
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
          styleDefinitions,
          styleValues,
          setStyleValues,
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

  const handleStyleValueChange = useCallback((styleKey: string, value: number) => {
    setStyleValues((prev) => ({ ...prev, [styleKey]: value }));
  }, []);

  // Active input content based on mode
  const inputContent = inputMode === 'xml' ? xmlContent : markdown;
  const handleInputContentChange = useCallback(
    (value: string) => {
      if (inputMode === 'xml') setXmlContent(value);
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

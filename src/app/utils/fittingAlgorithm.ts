/**
 * Recursive Fitting Algorithm
 *
 * Iteratively decreases CSS spacing variables and font size
 * until content fits within a single 8.5×11" page (1056px at 96dpi).
 */

const PAGE_HEIGHT_PX = 1056; // 11in × 96dpi
const PAGE_WIDTH_PX = 816;   // 8.5in × 96dpi
const PAGE_PADDING_PX = 96;  // 0.5in × 2 sides × 96dpi

const MIN_FONT_SIZE_PT = 9;
const MARGIN_STEP_PX = 2;
const FONT_STEP_PT = 0.1;

export interface FitVariables {
  h2MarginTop: number;    // pt
  pMarginBottom: number;  // pt
  liMarginBottom: number; // pt
  baseFontSize: number;   // pt
}

export interface FitResult {
  variables: FitVariables;
  didAdjust: boolean;
  report: string;
}

const DEFAULT_VARS: FitVariables = {
  h2MarginTop: 10,
  pMarginBottom: 4,
  liMarginBottom: 1,
  baseFontSize: 10,
};

function applyVarsToElement(el: HTMLElement, vars: FitVariables): void {
  el.style.setProperty('--fit-h2-margin-top', `${vars.h2MarginTop}pt`);
  el.style.setProperty('--fit-p-margin-bottom', `${vars.pMarginBottom}pt`);
  el.style.setProperty('--fit-li-margin-bottom', `${vars.liMarginBottom}pt`);
  el.style.setProperty('--fit-base-font-size', `${vars.baseFontSize}pt`);
}

/**
 * Measures content in a hidden sandbox and iteratively reduces
 * spacing/font until it fits within the page height.
 */
export function fitContentToPage(contentHtml: string, font: string): FitResult {
  const vars: FitVariables = { ...DEFAULT_VARS };
  const usableHeight = PAGE_HEIGHT_PX - PAGE_PADDING_PX;

  // Create hidden measurement div
  const sandbox = document.createElement('div');
  sandbox.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${PAGE_WIDTH_PX - PAGE_PADDING_PX}px;
    visibility: hidden;
    font-family: '${font}', sans-serif;
  `;
  sandbox.className = 'resume-prose prose prose-sm max-w-none resume-fitted';
  sandbox.innerHTML = contentHtml;
  document.body.appendChild(sandbox);

  applyVarsToElement(sandbox, vars);

  let iterations = 0;
  const maxIterations = 200;
  let didAdjust = false;

  while (sandbox.scrollHeight > usableHeight && iterations < maxIterations) {
    didAdjust = true;

    // Phase 1: Reduce margins first
    if (vars.h2MarginTop > 2) {
      vars.h2MarginTop = Math.max(2, vars.h2MarginTop - MARGIN_STEP_PX);
    } else if (vars.pMarginBottom > 1) {
      vars.pMarginBottom = Math.max(1, vars.pMarginBottom - MARGIN_STEP_PX);
    } else if (vars.liMarginBottom > 0) {
      vars.liMarginBottom = Math.max(0, vars.liMarginBottom - MARGIN_STEP_PX);
    }
    // Phase 2: Reduce font size
    else if (vars.baseFontSize > MIN_FONT_SIZE_PT) {
      vars.baseFontSize = Math.max(MIN_FONT_SIZE_PT, vars.baseFontSize - FONT_STEP_PT);
    } else {
      break; // Hit minimum safety floor
    }

    applyVarsToElement(sandbox, vars);
    iterations++;
  }

  document.body.removeChild(sandbox);

  const overflows = sandbox.scrollHeight > usableHeight;
  let report: string;
  if (!didAdjust) {
    report = 'Content fits perfectly — no adjustments needed.';
  } else if (overflows) {
    report = `⚠️ Content still overflows at minimum ${MIN_FONT_SIZE_PT}pt. Consider removing content.`;
  } else {
    const parts: string[] = [];
    if (vars.baseFontSize < DEFAULT_VARS.baseFontSize) {
      parts.push(`font: ${vars.baseFontSize.toFixed(1)}pt`);
    }
    if (vars.h2MarginTop < DEFAULT_VARS.h2MarginTop) {
      parts.push(`H2 margin: ${vars.h2MarginTop}pt`);
    }
    if (vars.pMarginBottom < DEFAULT_VARS.pMarginBottom) {
      parts.push(`¶ margin: ${vars.pMarginBottom}pt`);
    }
    report = `Fitted by reducing ${parts.join(', ')} (${iterations} iterations).`;
  }

  return { variables: vars, didAdjust, report };
}

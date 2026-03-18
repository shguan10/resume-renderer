import type { Dispatch, SetStateAction } from 'react';

/**
 * Configurable Multi-Variable Fitting Algorithm
 *
 * Uses ResizeableStyle interface to define independent, ordered "knobs"
 * that the algorithm iterates through to fit content to 1056px (11in).
 *
 * Works directly on rendered page DOM elements — no sandbox needed.
 */

const PAGE_HEIGHT_PX = 1056; // 11in × 96dpi

export type StyleValues = Record<string, number>;
export type StyleValuesSetter = Dispatch<SetStateAction<StyleValues>>;

// ── Types ────────────────────────────────────────────────────────────────

/** A stateful function that yields successive values to try */
export type NextValueGetter = IterableIterator<number>;

export interface ResizeableStyleDefinition {
  key: string;
  defaultValue: number;
  /** Given current value + ref to all styles, return whether there's still room to adjust. */
  hasRoomToChange: (currentValue: number, allStyles: ResizeableStyle[]) => boolean;
  /** Return a NextValueGetter producing values to try, or undefined if no room. */
  getStageValues: (currentValue: number, allStyles: ResizeableStyle[]) => NextValueGetter | undefined;
  /** Human-readable description */
  description: string;
}

export interface ResizeableStyle extends ResizeableStyleDefinition {
  getCurrentValue: () => number;
  setCurrentValue: (value: number) => void;
}

export interface FitVariables {
  h1FontPt: number;
  h2FontPt: number;
  h3FontPt: number;
  paragraphFontPt: number;
  listFontPt: number;
  sectionGapPt: number;
  entryGapPt: number;
  listGapPt: number;
  pageMarginPx: number;
  paragraphGapPt: number;
  listPaddingPt: number;
  hrGapPt: number;
  h1BottomPt: number;
  h2BottomPt: number;
  lineHeightRel: number;
  letterSpacingPt: number;
  wordSpacingPt: number;
  h3TopPt: number;
  entryHeaderGapPt: number;
  listIndentPt: number;
}

export interface FitResult {
  variables?: FitVariables;
  didAdjust: boolean;
  report: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function findStyle(styles: ResizeableStyle[], key: string): ResizeableStyle | undefined {
  return styles.find((s) => s.key === key);
}

function getVal(styles: ResizeableStyle[], key: string): number {
  return findStyle(styles, key)?.getCurrentValue() ?? 0;
}

/** Build FitVariables from the current ResizeableStyle values + derived header fonts. */
export function buildVarsFromStyles(styles: ResizeableStyle[]): FitVariables {
  const paragraph = getVal(styles, 'paragraphFont');
  return {
    h1FontPt: getVal(styles, 'h1Font'),
    h2FontPt: getVal(styles, 'h2Font'),
    h3FontPt: getVal(styles, 'h3Font'),
    paragraphFontPt: paragraph,
    listFontPt: getVal(styles, 'listFont'),
    sectionGapPt: getVal(styles, 'sectionGap'),
    entryGapPt: getVal(styles, 'entryGap'),
    listGapPt: getVal(styles, 'listGap'),
    pageMarginPx: getVal(styles, 'pageMargin'),
    paragraphGapPt: getVal(styles, 'paragraphGap'),
    listPaddingPt: getVal(styles, 'listPadding'),
    hrGapPt: getVal(styles, 'hrGap'),
    h1BottomPt: getVal(styles, 'h1Bottom'),
    h2BottomPt: getVal(styles, 'h2Bottom'),
    lineHeightRel: getVal(styles, 'lineHeight'),
    letterSpacingPt: getVal(styles, 'letterSpacing'),
    wordSpacingPt: getVal(styles, 'wordSpacing'),
    h3TopPt: getVal(styles, 'h3Top'),
    entryHeaderGapPt: getVal(styles, 'entryHeaderGap'),
    listIndentPt: getVal(styles, 'listIndent'),
  };
}

/** Convert FitVariables to CSS custom properties (including padding). */
export function buildMarkdownCssVars(vars: FitVariables): Record<string, string> {
  return {
    '--rv-h1-font': `${vars.h1FontPt}pt`,
    '--rv-h2-font': `${vars.h2FontPt}pt`,
    '--rv-h3-font': `${vars.h3FontPt}pt`,
    '--rv-paragraph-font': `${vars.paragraphFontPt}pt`,
    '--rv-list-font': `${vars.listFontPt}pt`,
    '--rv-section-gap': `${vars.sectionGapPt}pt`,
    '--rv-entry-gap': `${vars.entryGapPt}pt`,
    '--rv-list-gap': `${vars.listGapPt}pt`,
    '--rv-paragraph-gap': `${vars.paragraphGapPt}pt`,
    '--rv-list-padding': `${vars.listPaddingPt}pt`,
    '--rv-list-indent': `${vars.listIndentPt}pt`,
    '--rv-hr-gap': `${vars.hrGapPt}pt`,
    '--rv-h1-bottom': `${vars.h1BottomPt}pt`,
    '--rv-h2-bottom': `${vars.h2BottomPt}pt`,
    '--rv-line-height': `${vars.lineHeightRel}`,
    '--rv-letter-spacing': `${vars.letterSpacingPt}pt`,
    '--rv-word-spacing': `${vars.wordSpacingPt}pt`,
    '--rv-h3-top': `${vars.h3TopPt}pt`,
    '--rv-entry-header-gap': `${vars.entryHeaderGapPt}pt`,
    padding: `${vars.pageMarginPx}px`,
  };
}

// This function is merely a helper for memoizing fitVars
export function buildStyleSnapshotFromValues(
  defs: ResizeableStyleDefinition[],
  values: StyleValues,
): ResizeableStyle[] {
  return defs.map((def) => ({
    ...def,
    getCurrentValue: ()=> (values[def.key] ?? def.defaultValue),
    setCurrentValue: () => {
      /* snapshot helper; no-op */
    },
  }));
}

/** Force layout reflow and return scrollHeight for an element. */
function measureHeight(el: HTMLElement): number {
  void el.offsetHeight;
  return el.scrollHeight;
}

/** Check that ALL page elements fit within PAGE_HEIGHT_PX. */
function allPagesFit(pageElements: HTMLElement[]): number {
  return pageElements.reduce((maxHeight, el) => {
    return Math.max(maxHeight, measureHeight(el));
  }, 0);
}

const MIN_GAP_PT = 2 * (72 / 96); // ~1.5pt

export function makeGapReducer(
  key: string,
  description: string,
  defaultVal: number,
  minVal: number = MIN_GAP_PT,
  step: number = 0.95, // multiplicative factor
  stageLimit: number = 2,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    description,
    hasRoomToChange: (cur) => cur > minVal,
    getStageValues: (cur) => {
      if (cur <= minVal) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > minVal && stageNumber-- > 0) {
          value = Math.max(value * step, minVal);
          yield value;
        }
      }
      return stageValues();
    },
  };
}

export function makeLinearReducer(
  key: string,
  description: string,
  defaultVal: number,
  minVal: number,
  step: number,
  stageLimit: number = 2,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    description,
    hasRoomToChange: (cur) => cur > minVal,
    getStageValues: (cur) => {
      if (cur <= minVal) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > minVal && stageNumber-- > 0) {
          value = Math.max(value - step, minVal);
          yield value;
        }
      }
      return stageValues();
    },
  };
}

/** Font reducer that respects hierarchy: listFont <= paragraphFont <= h3Font, etc. */
export function makeFontReducer(
  key: string,
  description: string,
  defaultVal: number,
  minVal: number,
  step: number,
  lowerBoundKeys: string[],
  stageLimit: number = 5,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    description,
    hasRoomToChange: (cur) => cur > minVal,
    getStageValues: (cur, allStyles) => {
      if (cur <= minVal) return undefined;
      const biggestChild = lowerBoundKeys.reduce((acc, k) => {
        const s = findStyle(allStyles, k);
        return s ? Math.max(acc, s.getCurrentValue()) : acc;
      }, minVal);

      const effectiveMin = Math.max(biggestChild, 0);
      if (cur <= effectiveMin) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > effectiveMin && stageNumber-- > 0) {
          value = Math.max(value - step, effectiveMin);
          yield value;
        }
      }
      return stageValues();
    },
  };
}

/** Build the default ordered list of ResizeableStyleDefinitions. Order determines priority. */
export function buildDefaultStyleDefinitions(): ResizeableStyleDefinition[] {
  return [
    // Phase 1: Spacing compression (highest priority — try first)
    makeGapReducer('sectionGap', 'Section gap (margin above H2)', 10, MIN_GAP_PT),
    makeGapReducer('entryGap', 'Entry gap (margin between jobs)', 6, MIN_GAP_PT),
    makeGapReducer('entryHeaderGap', 'Entry header gap (H2→H3)', 6, MIN_GAP_PT),
    makeGapReducer('h3Top', 'H3 top margin', 6, MIN_GAP_PT),
    makeGapReducer('paragraphGap', 'Paragraph gap', 6, MIN_GAP_PT),
    makeGapReducer('listGap', 'List item gap', 1, 0),
    makeGapReducer('hrGap', 'Horizontal rule gap', 8, MIN_GAP_PT),
    makeGapReducer('h1Bottom', 'H1 bottom margin', 4, MIN_GAP_PT),
    makeGapReducer('h2Bottom', 'H2 bottom margin', 4, MIN_GAP_PT),
    makeGapReducer('listPadding', 'List padding', 16, 8),
    makeGapReducer('listIndent', 'UL indent', 16, 8),
    makeLinearReducer('lineHeight', 'Line height ratio', 1.4, 1.0, 0.05),
    makeLinearReducer('letterSpacing', 'Letter spacing (pt)', 0, -0.2, 0.02),
    makeLinearReducer('wordSpacing', 'Word spacing (pt)', 0, -0.4, 0.1),

    // Phase 2: Font compression
    makeFontReducer('listFont', 'List item font (pt)', 12, 4, 0.1, []),
    makeFontReducer('paragraphFont', 'Paragraph font (pt)', 16, 4, 0.1, ['listFont']),
    makeFontReducer('h3Font', 'H3 font (pt)', 18, 4, 0.1, ['paragraphFont']),
    makeFontReducer('h2Font', 'H2 font (pt)', 20, 4, 0.1, ['h3Font']),
    makeFontReducer('h1Font', 'H1 font (pt)', 24, 4, 0.1, ['h2Font']),

    // Phase 3: Margin squeeze (last resort)
    makeLinearReducer('pageMargin', 'Page margin (px)', 48, 28.5, 2),
  ];
}

// ── Core fitting loop ────────────────────────────────────────────────────

/**
 * Fit content to page by adjusting styles on the actual rendered page elements.
 * Both pages share the same FitVariables.
 *
 * @param pageElements - References to the rendered page divs (1 or 2 elements)
 * @param styleDefinitions - Ordered definitions describing adjustable knobs.
 * @param styleValues - Current values from React state (copied before fitting).
 * @param setStyleValues - Setter for updating the UI state after each adjustment.
 * @param waitForRenderReady - Promise that resolves once the layout has rendered the latest vars.
 */
export async function fitContentToPage(
  pageElements: HTMLElement[],
  styleDefinitions: ResizeableStyleDefinition[],
  styleValues: StyleValues,
  setStyleValues: StyleValuesSetter,
  waitForRenderReady: () => Promise<void>,
): Promise<FitResult> {
  if (pageElements.length === 0) {
    return {
      didAdjust: false,
      report: 'No page elements provided.',
    };
  }

  console.log(`starting fitting\n`);

  const workingValues: StyleValues = { ...styleValues };

  const styles: ResizeableStyle[] =
    styleDefinitions.map((def) => ({
      ...def,
      getCurrentValue: () => (workingValues[def.key] ?? def.defaultValue),
      setCurrentValue: (value: number) => {
        workingValues[def.key] = value; // updates the local copy
        setStyleValues({ ...workingValues }); // notify the UI
      },
    }));
  
  const phaseLog: string[] = [];
  let totalTrials = 0;
  const MAX_TOTAL_TRIALS = 500;

  async function applyAndCheckFit(): Promise<number> {
    await waitForRenderReady();
    return allPagesFit(pageElements);
  }

  const initialHeight = await applyAndCheckFit();
  console.log(`initial height ${initialHeight}, target height ${PAGE_HEIGHT_PX}\n`);
  if (initialHeight <= PAGE_HEIGHT_PX) {
    return {
      variables: buildVarsFromStyles(styles),
      didAdjust: false,
      report: 'Content fits perfectly — no adjustments needed.',
    };
  }

  outerLoop:
  while (totalTrials < MAX_TOTAL_TRIALS) {
    const styleCanChange = styles.map((style) => 
      style.hasRoomToChange(style.getCurrentValue(), styles)
    );
    const anyCanChange = styleCanChange.some(Boolean);
    if (!anyCanChange) {
      phaseLog.push('⚠️ All styles exhausted — content still overflows.');
      break;
    }

    for (const style of styles) {
      // we explicitly check again since the lower bounds might have changed
      if (!style.hasRoomToChange(style.getCurrentValue(), styles)) continue;
      const valueGenerator = style.getStageValues(style.getCurrentValue(), styles);

      if (valueGenerator === undefined) {
        continue;
      }

      for (const valueToTry of valueGenerator) {
        totalTrials++;
        console.log(`starting trial ${totalTrials}\n`);

        if (totalTrials > MAX_TOTAL_TRIALS) {
          phaseLog.push(`Reached max trial count (${MAX_TOTAL_TRIALS}).`);
          break outerLoop;
        }
        console.log(`Trying ${style.description} at ${valueToTry}`);
        style.setCurrentValue(valueToTry);
        const trialHeight = await applyAndCheckFit();
        console.log(`trial ${totalTrials} height ${trialHeight}, target height ${PAGE_HEIGHT_PX}\n`);
        if (trialHeight <= PAGE_HEIGHT_PX) {
          phaseLog.push(
            `Fit achieved after ${totalTrials} trials. Last adjusted: ${style.description} → ${valueToTry.toFixed(2)}`
          );
          return {
            variables: buildVarsFromStyles(styles),
            didAdjust: true,
            report: phaseLog.join(' '),
          };
        }
      }
    }
  }

  console.log("finished.\n");
  const finalVars = buildVarsFromStyles(styles);
  if (!phaseLog.some((l) => l.includes('⚠️'))) {
    phaseLog.push('⚠️ Content still overflows after all adjustments. Consider removing content.');
  }

  return {
    variables: finalVars,
    didAdjust: true,
    report: phaseLog.join(' '),
  };
}

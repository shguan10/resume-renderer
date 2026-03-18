/**
 * Configurable Multi-Variable Fitting Algorithm
 *
 * Uses ResizeableStyle interface to define independent, ordered "knobs"
 * that the algorithm iterates through to fit content to 1056px (11in).
 *
 * Works directly on rendered page DOM elements — no sandbox needed.
 */

const PAGE_HEIGHT_PX = 1056; // 11in × 96dpi
const PAGE_WIDTH_PX = 816;

export type StyleValues = Record<string, number>;

// ── Types ────────────────────────────────────────────────────────────────

/** A stateful function that yields successive values to try */
export type NextValueGetter = IterableIterator<number>;

export interface ResizeableStyleDefinition {
  key: string;
  defaultValue: number;
  minValue: number;
  parentKey: string | null;
  childKeys: string[];
  description: string;
  /** Given current value + resolved children, return whether there's still room to adjust. */
  hasRoomToChange: (currentValue: number, children: ResizeableStyle[]) => boolean;
  /** Return a NextValueGetter producing values to try, or undefined if no room. */
  getStageValues: (currentValue: number, children: ResizeableStyle[]) => NextValueGetter | undefined;
}

export interface ResizeableStyle extends ResizeableStyleDefinition {
  getCurrentValue: () => number;
  setCurrentValue: (value: number) => void;
  parent?: ResizeableStyle | null; // the resolved parent
  children?: ResizeableStyle[]; // the resolved children
}

export interface FitResult {
  didAdjust: boolean;
  report: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function mapByKey<T extends { key: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.key, item]));
}

/**
 * Resolves and injects parent/child object references into an array of styles.
 *
 * This function performs an in-place mutation of the `styles` objects,
 * transforming string-based keys (`parentKey`, `childKeys`) into direct
 * cached references (`parent`, `children`).
 */
function attachStyleHierarchy(styles: ResizeableStyle[]): void {
  const styleMap = mapByKey(styles);
  for (const style of styles) {
    const children = style.childKeys
      .map((childKey) => styleMap.get(childKey))
      .filter((s): s is ResizeableStyle => s !== undefined);
    style.children = children;
    style.parent = style.parentKey ? styleMap.get(style.parentKey) ?? null : null;
  }
}

/**
 * Constructs an array of ResizeableStyle objects by mapping definitions to 
 * their current state and update logic.
 * 
 * @param defs - Metadata definitions for each ResizeableStyle.
 * @param values - A mutable working copy of the current style values.
 * @param onSet - Optional callback to sync changes back to external state (e.g., React).
 * @returns An array of `ResizeableStyle` objects with hierarchical relationships attached.
 */
export function buildResizeableStyles(
  defs: ResizeableStyleDefinition[],
  values: StyleValues,
  onSet: (key: string, value: number) => void = () => {},
): ResizeableStyle[] {
  const styles: ResizeableStyle[] = defs.map((def) => ({
    ...def,
    getCurrentValue: () => values[def.key] ?? def.defaultValue,
    setCurrentValue: (value: number) => {
      values[def.key] = value;
      onSet(def.key, value);
    },
  }));
  attachStyleHierarchy(styles);
  return styles;
}

/** Build a read-only snapshot of ResizeableStyle objects for CSS var computation. */
export function buildStyleSnapshotFromValues(
  defs: ResizeableStyleDefinition[],
  values: StyleValues,
): ResizeableStyle[] {
  return defs.map((def) => ({
    ...def,
    getCurrentValue: () => values[def.key] ?? def.defaultValue,
    setCurrentValue: () => { /* snapshot helper; no-op */ },
  }));
}

/** Force layout reflow and return scrollHeight for an element. */
function measureHeight(el: HTMLElement): number {
  void el.offsetHeight;
  return el.scrollHeight;
}

/** Check that ALL page elements fit within PAGE_HEIGHT_PX. Returns max height. */
function allPagesFit(pageElements: HTMLElement[]): number {
  return pageElements.reduce((maxHeight, el) => Math.max(maxHeight, measureHeight(el)), 0);
}

// ── Reducer factories ────────────────────────────────────────────────────

export function makeGapReducer(
  key: string,
  description: string,
  defaultVal: number,
  minVal: number,
  step: number,
  stageLimit: number,
  childKeys: string[] = [],
  parentKey: string | null = null,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    minValue: minVal,
    parentKey,
    childKeys,
    description,
    hasRoomToChange: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      return cur > floor;
    },
    getStageValues: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      if (cur <= floor) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > floor && stageNumber-- > 0) {
          value = Math.max(value * step, floor);
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
  stageLimit: number,
  childKeys: string[] = [],
  parentKey: string | null = null,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    minValue: minVal,
    parentKey,
    childKeys,
    description,
    hasRoomToChange: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      return cur > floor;
    },
    getStageValues: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      if (cur <= floor) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > floor && stageNumber-- > 0) {
          value = Math.max(value - step, floor);
          yield value;
        }
      }
      return stageValues();
    },
  };
}

/** Font reducer that respects hierarchy via children. */
export function makeFontReducer(
  key: string,
  description: string,
  defaultVal: number,
  minVal: number,
  step: number,
  childKeys: string[],
  stageLimit: number = 5,
  parentKey: string | null = null,
): ResizeableStyleDefinition {
  return {
    key,
    defaultValue: defaultVal,
    minValue: minVal,
    parentKey,
    childKeys,
    description,
    hasRoomToChange: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      return cur > floor;
    },
    getStageValues: (cur, children) => {
      const floor = children.reduce((acc, c) => Math.max(acc, c.getCurrentValue()), minVal);
      if (cur <= floor) return undefined;
      let stageNumber = stageLimit;
      function* stageValues() {
        let value = cur;
        while (value > floor && stageNumber-- > 0) {
          value = Math.max(value - step, floor);
          yield value;
        }
      }
      return stageValues();
    },
  };
}

// ── Recursive shrink for width fitting ───────────────────────────────────

/**
 * Try to shrink a style by one step. If it's at its children's lower bound,
 * recursively try shrinking the biggest child first.
 */
function tryShrinkRecursive(style: ResizeableStyle, depth = 0): boolean {
  if (depth > 50) return false;
  if (style.getCurrentValue() <= style.minValue) return false;

  const children = style.children ?? [];

  // Try direct shrink
  if (style.hasRoomToChange(style.getCurrentValue(), children)) {
    const gen = style.getStageValues(style.getCurrentValue(), children);
    if (gen) {
      const next = gen.next();
      if (!next.done) {
        style.setCurrentValue(next.value);
        return true;
      }
    }
  }

  // At children's lower bound — try shrinking biggest child first
  const sortedChildren = [...children].sort((a, b) => b.getCurrentValue() - a.getCurrentValue());
  for (const child of sortedChildren) {
    if (tryShrinkRecursive(child, depth + 1)) {
      // Child was shrunk, retry self
      return tryShrinkRecursive(style, depth + 1);
    }
  }

  return false;
}

/** Determine which font knob controls a given DOM element. */
function getFontKeyForElement(el: HTMLElement): string | null {
  if (el.closest('.rv-entry-header')) return 'entry-header-font';
  if (el.closest('.rv-skill')) return 'skill-font';
  if (el.closest('.rv-name-details')) return 'name-details-font';
  if (el.closest('.rv-name')) return 'name-font';
  return null;
}

// ── Hierarchy-respecting UI controls ─────────────────────────────────────

/** When shrinking a node, cascade down to children if they exceed the new value. */
export function cascadeDown(style: ResizeableStyle, newValue: number): void {
  style.setCurrentValue(newValue);
  for (const child of style.children ?? []) {
    if (child.getCurrentValue() > newValue) {
      cascadeDown(child, newValue);
    }
  }
}

/** When growing a node, cascade up to parent if parent is smaller. */
export function cascadeUp(style: ResizeableStyle, newValue: number): void {
  style.setCurrentValue(newValue);
  const parent = style.parent;
  if (!parent) return;
  if (newValue > parent.getCurrentValue()) {
    cascadeUp(parent, newValue);
  }
}

// ── Core fitting loop ────────────────────────────────────────────────────

/**
 * Fit content to page by adjusting styles on the actual rendered page elements.
 * Both pages share the same FitVariables.
 *
 * @param pageElements - References to the rendered page divs (1 or 2 elements)
 * @param styles - Prebuilt ResizeableStyle instances that mutate the provided values.
 * @param waitForRenderReady - Promise that resolves once the layout has rendered the latest vars.
 */
export async function fitContentToPage(
  pageElements: HTMLElement[],
  styles: ResizeableStyle[],
  waitForRenderReady: () => Promise<void>,
): Promise<FitResult> {
  if (pageElements.length === 0) {
    return { didAdjust: false, report: 'No page elements provided.' };
  }

  console.log('starting fitting\n');
  attachStyleHierarchy(styles);
  const styleMap = mapByKey(styles);

  const phaseLog: string[] = [];
  let totalTrials = 0;
  const MAX_TOTAL_TRIALS = 500;

  async function applyAndCheckFit(skipWait = false): Promise<number> {
    if (!skipWait) {
      await waitForRenderReady();
    }
    return allPagesFit(pageElements);
  }

  // ── Phase 1: Height fitting ──────────────────────────────────────────
  const initialHeight = await applyAndCheckFit();
  console.log(`initial height ${initialHeight}, target height ${PAGE_HEIGHT_PX}\n`);

  if (initialHeight > PAGE_HEIGHT_PX) {
    outerLoop:
    while (totalTrials < MAX_TOTAL_TRIALS) {
      const anyCanChange = styles.some((style) => {
        const children = style.children ?? [];
        return style.hasRoomToChange(style.getCurrentValue(), children);
      });
      if (!anyCanChange) {
        phaseLog.push('⚠️ All styles exhausted — content still overflows.');
        break;
      }

      for (const style of styles) {
        const children = style.children ?? [];
        if (!style.hasRoomToChange(style.getCurrentValue(), children)) continue;
        const valueGenerator = style.getStageValues(style.getCurrentValue(), children);
        if (valueGenerator === undefined) continue;

        for (const valueToTry of valueGenerator) {
          totalTrials++;
          if (totalTrials > MAX_TOTAL_TRIALS) {
            phaseLog.push(`Reached max trial count (${MAX_TOTAL_TRIALS}).`);
            break outerLoop;
          }
          console.log(`Trying ${style.description} at ${valueToTry}`);
          style.setCurrentValue(valueToTry);
          console.log(`awaiting height check, trial: ${totalTrials}`);
          const trialHeight = await applyAndCheckFit();
          if (trialHeight <= PAGE_HEIGHT_PX) {
            phaseLog.push(
              `Height fit after ${totalTrials} trials. Last: ${style.description} → ${valueToTry.toFixed(2)}`
            );
            break outerLoop; // will fall through to width fitting
          }
        }
      }
    }
  }

  // ── Phase 2: Width fitting for FormatOneLine ─────────────────────────
  let widthTrials = 0;
  const MAX_WIDTH_TRIALS = 200;

  while (widthTrials < MAX_WIDTH_TRIALS) {
    if (widthTrials > 0) {
      console.log(`awaiting width trial ${widthTrials}`);
      await waitForRenderReady();
    }
    const overflowing = pageElements.flatMap(page =>
      Array.from(page.querySelectorAll<HTMLElement>('.rv-one-line'))
        .filter(el => el.scrollWidth > PAGE_WIDTH_PX)
    );
    if (overflowing.length === 0) break;

    const el = overflowing[0];
    if (!el) break;
    const fontKey = getFontKeyForElement(el);
    if (!fontKey) {
      phaseLog.push('⚠️ Cannot determine font knob for overflowing one-line element.');
      break;
    }

    const startStyle = styleMap.get(fontKey);
    if (!startStyle) {
      phaseLog.push(`⚠️ Cannot find style for font key ${fontKey}.`);
      break;
    }
    const shrunk = tryShrinkRecursive(startStyle);
    if (!shrunk) {
      phaseLog.push(`⚠️ Cannot shrink ${fontKey} further for one-line overflow.`);
      break;
    }
    widthTrials++;
    totalTrials++;
  }

  if (widthTrials > 0) {
    phaseLog.push(`Width fit: ${widthTrials} adjustments for one-line overflow.`);
  }

  // Check final height after width adjustments
  console.log("awaiting final height check\n");
  const finalHeight = await applyAndCheckFit(true);
  const didAdjust = totalTrials > 0;

  if (!didAdjust && initialHeight <= PAGE_HEIGHT_PX) {
    return { didAdjust: false, report: 'Content fits perfectly — no adjustments needed.' };
  }

  if (finalHeight > PAGE_HEIGHT_PX && !phaseLog.some(l => l.includes('⚠️'))) {
    phaseLog.push('⚠️ Content still overflows after all adjustments. Consider removing content.');
  }

  console.log('finished.\n');
  return { didAdjust, report: phaseLog.join(' ') };
}

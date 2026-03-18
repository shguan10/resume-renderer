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
}

export interface FitResult {
  didAdjust: boolean;
  report: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function resolveChildren(style: ResizeableStyleDefinition, allStyles: ResizeableStyle[]): ResizeableStyle[] {
  return style.childKeys
    .map(k => allStyles.find(s => s.key === k))
    .filter((s): s is ResizeableStyle => s !== undefined);
}

function findStyle(styles: ResizeableStyle[], key: string): ResizeableStyle | undefined {
  return styles.find(s => s.key === key);
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
function tryShrinkRecursive(key: string, allStyles: ResizeableStyle[], depth = 0): boolean {
  if (depth > 50) return false;
  const style = findStyle(allStyles, key);
  if (!style) return false;
  if (style.getCurrentValue() <= style.minValue) return false;

  const children = resolveChildren(style, allStyles);

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
    if (tryShrinkRecursive(child.key, allStyles, depth + 1)) {
      // Child was shrunk, retry self
      return tryShrinkRecursive(key, allStyles, depth + 1);
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
export function cascadeDown(
  key: string,
  newValue: number,
  values: StyleValues,
  defs: ResizeableStyleDefinition[],
): void {
  values[key] = newValue;
  const def = defs.find(d => d.key === key);
  if (!def) return;
  for (const childKey of def.childKeys) {
    const childDef = defs.find(d => d.key === childKey);
    if (!childDef) continue;
    const childValue = values[childKey] ?? childDef.defaultValue;
    if (childValue > newValue) {
      cascadeDown(childKey, newValue, values, defs);
    }
  }
}

/** When growing a node, cascade up to parent if parent is smaller. */
export function cascadeUp(
  key: string,
  newValue: number,
  values: StyleValues,
  defs: ResizeableStyleDefinition[],
): void {
  values[key] = newValue;
  const def = defs.find(d => d.key === key);
  if (!def || !def.parentKey) return;
  const parentDef = defs.find(d => d.key === def.parentKey);
  if (!parentDef) return;
  const parentValue = values[parentDef.key] ?? parentDef.defaultValue;
  if (newValue > parentValue) {
    cascadeUp(parentDef.key, newValue, values, defs);
  }
}

// ── Core fitting loop ────────────────────────────────────────────────────

export async function fitContentToPage(
  pageElements: HTMLElement[],
  styleDefinitions: ResizeableStyleDefinition[],
  styleValues: StyleValues,
  setStyleValues: StyleValuesSetter,
  waitForRenderReady: () => Promise<void>,
): Promise<FitResult> {
  if (pageElements.length === 0) {
    return { didAdjust: false, report: 'No page elements provided.' };
  }

  console.log('starting fitting\n');

  const workingValues: StyleValues = { ...styleValues };

  const styles: ResizeableStyle[] = styleDefinitions.map((def) => ({
    ...def,
    getCurrentValue: () => workingValues[def.key] ?? def.defaultValue,
    setCurrentValue: (value: number) => {
      workingValues[def.key] = value;
      setStyleValues({ ...workingValues });
    },
  }));

  const phaseLog: string[] = [];
  let totalTrials = 0;
  const MAX_TOTAL_TRIALS = 500;

  async function applyAndCheckFit(): Promise<number> {
    await waitForRenderReady();
    return allPagesFit(pageElements);
  }

  // ── Phase 1: Height fitting ──────────────────────────────────────────
  const initialHeight = await applyAndCheckFit();
  console.log(`initial height ${initialHeight}, target height ${PAGE_HEIGHT_PX}\n`);

  if (initialHeight > PAGE_HEIGHT_PX) {
    outerLoop:
    while (totalTrials < MAX_TOTAL_TRIALS) {
      const anyCanChange = styles.some((style) => {
        const children = resolveChildren(style, styles);
        return style.hasRoomToChange(style.getCurrentValue(), children);
      });
      if (!anyCanChange) {
        phaseLog.push('⚠️ All styles exhausted — content still overflows.');
        break;
      }

      for (const style of styles) {
        const children = resolveChildren(style, styles);
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
    await waitForRenderReady();
    const overflowing = pageElements.flatMap(page =>
      Array.from(page.querySelectorAll<HTMLElement>('.rv-one-line'))
        .filter(el => el.scrollWidth > el.clientWidth)
    );
    if (overflowing.length === 0) break;

    const el = overflowing[0];
    if (!el) break;
    const fontKey = getFontKeyForElement(el);
    if (!fontKey) {
      phaseLog.push('⚠️ Cannot determine font knob for overflowing one-line element.');
      break;
    }

    const shrunk = tryShrinkRecursive(fontKey, styles);
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
  const finalHeight = await applyAndCheckFit();
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

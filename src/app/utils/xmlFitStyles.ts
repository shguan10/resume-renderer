/**
 * XML-specific ResizeableStyleDefinitions.
 *
 * Each structure tag gets a font-size and upper-margin knob.
 * Hierarchy derived from XML tag nesting:
 *   NameSection > Name, Details
 *   ResumeSection > ExperienceItem/ProjectItem > Bullet
 *   ResumeSection > Skill
 *
 * Parent font/margin >= direct children's font/margin.
 * stageLimit = 2 for every knob.
 */

import {
  makeGapReducer,
  makeFontReducer,
  makeLinearReducer,
  type ResizeableStyleDefinition,
} from '@/app/utils/fittingAlgorithm';

export function buildXmlStyleDefinitions(): ResizeableStyleDefinition[] {
  const STAGE = 2;

  return [
    // ── Margins (compress first) ──────────────────────────────────────
    // section-title-margin >= entry-header-margin >= bullet-margin, skill-margin
    makeGapReducer('section-title-margin', 'Section title top margin (pt)', 10, 1, 0.8, STAGE,
      ['entry-header-margin', 'section-hr-margin'], null),
    makeGapReducer('entry-header-margin', 'Entry header top margin (pt)', 6, 0.5, 0.8, STAGE,
      ['bullet-margin', 'skill-margin'], 'section-title-margin'),
    makeGapReducer('section-hr-margin', 'Section HR top margin (pt)', 2, 0, 0.7, STAGE,
      [], 'section-title-margin'),
    makeGapReducer('bullet-margin', 'Bullet top margin (pt)', 1, 0, 0.7, STAGE,
      [], 'entry-header-margin'),
    makeGapReducer('skill-margin', 'Skill top margin (pt)', 1, 0, 0.7, STAGE,
      [], 'entry-header-margin'),
    makeGapReducer('name-details-margin', 'Name details top margin (pt)', 2, 0, 0.7, STAGE),
    makeGapReducer('name-margin', 'Name top margin (pt)', 0, 0, 0.7, STAGE),

    // ── Line height ───────────────────────────────────────────────────
    makeLinearReducer('line-height', 'Line height (ratio)', 1.3, 1.0, 0.05, STAGE),

    // ── Font sizes ────────────────────────────────────────────────────
    // section-title-font >= entry-header-font >= bullet-font
    // section-title-font >= skill-font
    // name-font >= name-details-font
    makeFontReducer('bullet-font', 'Bullet font (pt)', 10, 6, 0.5, [], STAGE,
      'entry-header-font'),
    makeFontReducer('skill-font', 'Skill font (pt)', 10, 6, 0.5, [], STAGE,
      'section-title-font'),
    makeFontReducer(
      'entry-header-font', 'Entry header font (pt)', 10, 6, 0.5,
      ['bullet-font'], STAGE, 'section-title-font',
    ),
    makeFontReducer(
      'section-title-font', 'Section title font (pt)', 11, 6, 0.5,
      ['entry-header-font', 'skill-font'], STAGE, null,
    ),
    makeFontReducer('name-details-font', 'Name details font (pt)', 10, 6, 0.5, [], STAGE,
      'name-font'),
    makeFontReducer(
      'name-font', 'Name font (pt)', 18, 8, 0.5,
      ['name-details-font'], STAGE, null,
    ),
    makeFontReducer('footer-font', 'Footer font (pt)', 8, 6, 0.5, [], STAGE),

    // ── Page margin (last resort) ─────────────────────────────────────
    makeLinearReducer('page-margin', 'Page margin (px)', 48, 28.5, 2, STAGE),
  ];
}

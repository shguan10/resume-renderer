/**
 * HTML Resume Parser
 *
 * Converts HTML (from resume-master.html or markdown-generated HTML)
 * into the same ResumeNode tree that the XML parser produces,
 * so the XML renderer can handle all formats uniformly.
 *
 * Supported HTML tags: h1, h2, h3, p, ul, li, strong, em, a, hr,
 * and the custom FormatPageBreak tag.
 */

import type { ResumeNode } from '@/app/utils/xmlResumeParser';

const PAGE_BREAK_PLACEHOLDER = '<!--RESUME_PAGE_BREAK-->';

/** Pre-process HTML to handle custom tags that aren't valid HTML. */
function preProcess(html: string): string {
  // Replace <FormatPageBreak /> or <formatpagebreak> variants
  return html
    .replace(/<FormatPageBreak\s*\/?>/gi, PAGE_BREAK_PLACEHOLDER)
    .replace(/<formatpagebreak\s*\/?>\s*<\/formatpagebreak>/gi, PAGE_BREAK_PLACEHOLDER);
}

/** Parse an HTML string into a ResumeNode tree. */
export function parseHtmlToResumeNode(html: string): ResumeNode {
  const processed = preProcess(html);

  // Split on page break placeholders and rejoin with a sentinel <hr>
  const parts = processed.split(PAGE_BREAK_PLACEHOLDER);
  const joined = parts.join('<hr data-page-break="true" />');

  const parser = new DOMParser();
  const doc = parser.parseFromString(joined, 'text/html');
  return convertBodyToResume(doc.body);
}

function convertBodyToResume(body: HTMLElement): ResumeNode {
  const resume: ResumeNode = { tag: 'Resume', attributes: {}, children: [] };

  let nameSection: ResumeNode | null = null;
  let currentSection: ResumeNode | null = null;
  let currentEntry: ResumeNode | null = null;
  let seenH1 = false;
  let contactParsed = false;
  let companyInfo: { name: string; location: string } | null = null;

  for (const child of Array.from(body.children)) {
    const tag = child.tagName.toLowerCase();
    const text = child.textContent?.trim() ?? '';

    // ── Page break ───────────────────────────────────────────────
    if (tag === 'hr' && child.getAttribute('data-page-break') === 'true') {
      resume.children.push({ tag: 'FormatPageBreak', attributes: {}, children: [] });
      currentSection = null;
      currentEntry = null;
      companyInfo = null;
      continue;
    }

    // ── H1 = Name ────────────────────────────────────────────────
    if (tag === 'h1') {
      seenH1 = true;
      nameSection = {
        tag: 'NameSection',
        attributes: {},
        children: [{ tag: 'Name', attributes: {}, children: [text] }],
      };
      resume.children.push(nameSection);
      continue;
    }

    // ── First P after H1 = contact info ──────────────────────────
    if (tag === 'p' && seenH1 && !contactParsed && nameSection && !currentSection) {
      contactParsed = true;
      parseContactInfo(child, nameSection);
      continue;
    }

    // ── H2 / H3 — section title or company grouping ─────────────
    if (tag === 'h2' || tag === 'h3') {
      if (isSectionTitle(text)) {
        currentSection = {
          tag: 'ResumeSection',
          attributes: { title: stripBold(text) },
          children: [],
        };
        currentEntry = null;
        companyInfo = null;
        resume.children.push(currentSection);
      } else if (currentSection) {
        // Company grouping header (from markdown ### **Company** | Location)
        const parts = text.split('|').map(s => s.trim());
        companyInfo = {
          name: stripBold(parts[0] ?? ''),
          location: parts[1] ?? '',
        };
        currentEntry = null;
      }
      continue;
    }

    // ── P inside a section = entry header ────────────────────────
    if (tag === 'p' && currentSection) {
      const hasStrong = child.querySelector('strong, b') !== null;
      if (hasStrong) {
        currentEntry = createEntryFromP(child, currentSection, companyInfo);
      }
      continue;
    }

    // ── UL = bullets ─────────────────────────────────────────────
    if (tag === 'ul') {
      const target = currentEntry ?? currentSection;
      if (target) {
        for (const li of Array.from(child.children)) {
          if (li.tagName.toLowerCase() === 'li') {
            target.children.push({
              tag: 'Bullet',
              attributes: {},
              children: convertInlineChildren(li),
            });
          }
        }
      }
      continue;
    }

    // ── HR (non-page-break) — ignore ─────────────────────────────
    if (tag === 'hr') continue;
  }

  return resume;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

function isSectionTitle(text: string): boolean {
  const cleaned = stripBold(text);
  const hasDate = /\d{4}/.test(cleaned);
  const hasPipe = cleaned.includes('|');
  const letters = cleaned.replace(/[^a-zA-Z]/g, '');
  const isUpperCase = letters.length > 0 && letters === letters.toUpperCase();
  return isUpperCase && !hasDate && !hasPipe && cleaned.length < 60;
}

function parseContactInfo(pEl: Element, nameSection: ResumeNode): void {
  const text = pEl.textContent?.trim() ?? '';
  const parts = text.split('|').map(s => s.trim());
  for (const part of parts) {
    if (part.includes('@')) {
      nameSection.children.push({ tag: 'Email', attributes: {}, children: [part] });
    } else if (part.match(/\.\w/) && !part.match(/^\d/)) {
      nameSection.children.push({ tag: 'Website', attributes: {}, children: [part] });
    } else {
      nameSection.children.push({ tag: 'Location', attributes: {}, children: [part] });
    }
  }
}

function createEntryFromP(
  pEl: Element,
  section: ResumeNode,
  companyInfo: { name: string; location: string } | null,
): ResumeNode {
  const sectionTitle = section.attributes.title?.toUpperCase() ?? '';
  const isExperience = sectionTitle.includes('EXPERIENCE') || sectionTitle.includes('TEACHING');
  const isEducation = sectionTitle.includes('EDUCATION');

  const header: ResumeNode = { tag: 'Header', attributes: {}, children: [] };

  // Extract bold text
  const strongEl = pEl.querySelector('strong, b');
  const boldText = strongEl?.textContent?.trim() ?? '';

  // Extract date from <em> or text with year pattern
  const emEl = pEl.querySelector('em');
  let dateText = '';
  if (emEl) {
    dateText = emEl.textContent?.trim() ?? '';
  } else {
    const fullText = pEl.textContent?.trim() ?? '';
    const boldEnd = fullText.indexOf(boldText) + boldText.length;
    const afterBold = fullText.substring(boldEnd);
    const parts = afterBold.split('|').map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/\d{4}/.test(parts[i])) {
        dateText = parts[i];
        break;
      }
    }
  }

  if (dateText) {
    header.children.push({ tag: 'Date', attributes: {}, children: [dateText] });
  }

  if (companyInfo) {
    // Company info from preceding <h3>
    header.children.push({ tag: 'CompanyName', attributes: {}, children: [companyInfo.name] });
    if (companyInfo.location) {
      header.children.push({ tag: 'CompanyLocation', attributes: {}, children: [companyInfo.location] });
    }
    // Bold text = position
    if (boldText) {
      header.children.push({ tag: 'Position', attributes: {}, children: [boldText] });
    }
    // Check for additional non-date parts (location override)
    const fullText = pEl.textContent?.trim() ?? '';
    const boldEnd = fullText.indexOf(boldText) + boldText.length;
    const afterBold = fullText.substring(boldEnd);
    const remaining = afterBold.split('|').map(s => s.trim()).filter(s => s && s !== dateText && !/\d{4}/.test(s));
    if (remaining.length > 0) {
      // Override location from the position line if present (e.g., "Pittsburgh, PA")
      header.children.push({ tag: 'CompanyLocation', attributes: {}, children: [remaining[0]] });
    }
  } else if (isExperience) {
    // Parse "Company | Position (Team)" from bold text
    const boldParts = boldText.split('|').map(s => s.trim());
    if (boldParts[0]) {
      header.children.push({ tag: 'CompanyName', attributes: {}, children: [boldParts[0]] });
    }
    if (boldParts[1]) {
      const posMatch = boldParts[1].match(/^(.+?)\s*\((.+?)\)\s*$/);
      if (posMatch) {
        header.children.push({ tag: 'Position', attributes: {}, children: [posMatch[1].trim()] });
        header.children.push({ tag: 'Team', attributes: {}, children: [posMatch[2].trim()] });
      } else {
        header.children.push({ tag: 'Position', attributes: {}, children: [boldParts[1]] });
      }
    }
  } else if (isEducation) {
    header.children.push({ tag: 'SchoolName', attributes: {}, children: [boldText] });
    const fullText = pEl.textContent?.trim() ?? '';
    const boldEnd = fullText.indexOf(boldText) + boldText.length;
    const afterBold = fullText.substring(boldEnd);
    const remaining = afterBold.split('|').map(s => s.trim()).filter(s => s && s !== dateText && !/\d{4}/.test(s));
    if (remaining.length > 0) {
      header.children.push({ tag: 'SchoolLocation', attributes: {}, children: [remaining[0]] });
    }
  } else {
    // Project
    header.children.push({ tag: 'ProjectName', attributes: {}, children: [boldText] });
  }

  const entryTag = isEducation ? 'ExperienceItem' : (isExperience ? 'ExperienceItem' : 'ProjectItem');
  const entry: ResumeNode = { tag: entryTag, attributes: {}, children: [header] };
  section.children.push(entry);
  return entry;
}

/** Convert inline HTML children to ResumeNode inline children. */
function convertInlineChildren(el: Element): (ResumeNode | string)[] {
  const result: (ResumeNode | string)[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text.trim()) result.push(text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const elem = child as Element;
      const tag = elem.tagName.toLowerCase();
      if (tag === 'strong' || tag === 'b') {
        result.push({
          tag: 'FormatBold',
          attributes: {},
          children: convertInlineChildren(elem),
        });
      } else if (tag === 'em' || tag === 'i') {
        result.push({
          tag: 'FormatItalics',
          attributes: {},
          children: convertInlineChildren(elem),
        });
      } else if (tag === 'a') {
        const text = elem.textContent?.trim() ?? '';
        if (text) result.push(text);
      } else {
        result.push(...convertInlineChildren(elem));
      }
    }
  }
  return result;
}

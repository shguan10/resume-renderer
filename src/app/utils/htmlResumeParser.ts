import type { ResumeNode } from '@/app/utils/xmlResumeParser';

const PAGE_BREAK_PLACEHOLDER = '<!--RESUME_PAGE_BREAK-->';

/** Normalize HTML input so the DOM parser can produce consistent nodes. */
function preProcess(html: string): string {
  return html
    .replace(/<FormatPageBreak\s*\/?>/gi, PAGE_BREAK_PLACEHOLDER)
    .replace(/<formatpagebreak\s*\/?>\s*<\/formatpagebreak>/gi, PAGE_BREAK_PLACEHOLDER);
}

/** Parse an HTML string into a ResumeNode tree that mirrors the HTML structure. */
export function parseHtmlToResumeNode(html: string): ResumeNode {
  const processed = preProcess(html);
  const parts = processed.split(PAGE_BREAK_PLACEHOLDER);
  const joined = parts.join('<hr data-page-break="true" />');

  const parser = new DOMParser();
  const doc = parser.parseFromString(joined, 'text/html');
  return convertBodyToResume(doc.body);
}

function convertBodyToResume(body: HTMLElement): ResumeNode {
  const resume: ResumeNode = { tag: 'Resume', attributes: {}, children: [] };
  for (const child of Array.from(body.childNodes)) {
    const node = convertNode(child);
    if (node !== null) resume.children.push(node);
  }
  return resume;
}

function convertNode(node: ChildNode): ResumeNode | string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeText(node.textContent ?? '');
    return text ? text : null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (isPageBreakElement(el)) {
    return { tag: 'FormatPageBreak', attributes: {}, children: [] };
  }

  const resumeNode: ResumeNode = { tag, attributes: {}, children: [] };
  for (const attr of Array.from(el.attributes)) {
    resumeNode.attributes[attr.name.toLowerCase()] = attr.value;
  }

  for (const child of Array.from(el.childNodes)) {
    const childNode = convertNode(child);
    if (childNode !== null) resumeNode.children.push(childNode);
  }

  return resumeNode;
}

function isPageBreakElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'formatpagebreak') return true;
  if (tag === 'hr' && el.getAttribute('data-page-break') === 'true') {
    return true;
  }
  return false;
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

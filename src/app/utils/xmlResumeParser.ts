/**
 * XML Resume Parser
 *
 * Parses resume XML (see resume-master.xml) into a typed tree of ResumeNode objects.
 * Distinguishes between structure tags and format tags.
 */

export interface ResumeNode {
  tag: string;
  attributes: Record<string, string>;
  children: (ResumeNode | string)[];
}

/** Format tags always take precedence over template styling. */
export const FORMAT_TAGS = new Set([
  'FormatPageBreak',
  'FormatBold',
  'FormatItalics',
  'FormatOneLine',
  'FormatAlignLeft',
  'FormatAlignRight',
  'FormatAlignCenter',
]);

export function isFormatTag(tag: string): boolean {
  return FORMAT_TAGS.has(tag);
}

/** Parse an XML string into a ResumeNode tree. */
export function parseResumeXml(xml: string): ResumeNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('XML parse error: ' + (errorNode.textContent ?? 'Unknown error'));
  }
  return elementToNode(doc.documentElement);
}

function elementToNode(el: Element): ResumeNode {
  const node: ResumeNode = {
    tag: el.tagName,
    attributes: {},
    children: [],
  };
  for (const attr of Array.from(el.attributes)) {
    node.attributes[attr.name] = attr.value;
  }
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      node.children.push(elementToNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const trimmed = (child.textContent ?? '').trim();
      if (trimmed) node.children.push(trimmed);
    }
  }
  return node;
}

/** Find the first direct child node with a given tag. */
export function findChild(node: ResumeNode, tag: string): ResumeNode | undefined {
  for (const child of node.children) {
    if (typeof child !== 'string' && child.tag === tag) return child;
  }
  return undefined;
}

/** Find all direct child nodes with a given tag. */
export function findChildren(node: ResumeNode, tag: string): ResumeNode[] {
  return node.children.filter(
    (child): child is ResumeNode => typeof child !== 'string' && child.tag === tag,
  );
}

/** Recursively extract text content from a node. */
export function getTextContent(node: ResumeNode | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(getTextContent).join(' ');
}

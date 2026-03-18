/**
 * Markdown Resume Parser
 *
 * Converts markdown to HTML (via react-markdown + renderToStaticMarkup),
 * handles the ---page-break--- syntax, then delegates to htmlResumeParser
 * to produce a ResumeNode tree for the XML renderer.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHtmlToResumeNode } from '@/app/utils/htmlResumeParser';
import type { ResumeNode } from '@/app/utils/xmlResumeParser';

const PAGE_BREAK_MARKER = '---page-break---';

function markdownToHtml(md: string): string {
  const parts = md.split(PAGE_BREAK_MARKER);
  const htmlParts = parts.map((part) => {
    const element = React.createElement(
      ReactMarkdown,
      { remarkPlugins: [remarkGfm] },
      part.trim(),
    );
    return renderToStaticMarkup(element);
  });
  return htmlParts.join('<FormatPageBreak />');
}

/** Parse markdown into a ResumeNode tree via the HTML intermediate. */
export function parseMarkdownToResumeNode(md: string): ResumeNode {
  const html = markdownToHtml(md);
  return parseHtmlToResumeNode(html);
}

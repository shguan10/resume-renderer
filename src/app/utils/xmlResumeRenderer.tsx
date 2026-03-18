import { Fragment, type ReactNode } from 'react';
import type { ResumeNode } from '@/app/utils/xmlResumeParser';
import {
  findChild,
  findChildren,
  getTextContent,
  isFormatTag,
} from '@/app/utils/xmlResumeParser';
import type { StyleValues } from '@/app/utils/fittingAlgorithm';

export interface XmlRenderedPage {
  content: ReactNode;
}

interface NameInfo {
  name: string;
  location: string;
  email: string;
  website: string;
}

type InlineChild = ResumeNode | string;

function renderInlineChildren(children: InlineChild[]): ReactNode {
  if (children.length === 0) return null;
  const nodes: ReactNode[] = [];
  children.forEach((child, index) => {
    nodes.push(
      <Fragment key={`inline-child-${index}`}>
        {renderInline(child)}
      </Fragment>,
    );
    if (index < children.length - 1) {
      nodes.push(
        <Fragment key={`inline-space-${index}`}>{' '}</Fragment>,
      );
    }
  });
  return <>{nodes}</>;
}

function renderInline(node: InlineChild): ReactNode {
  if (typeof node === 'string') return node;

  const children = renderInlineChildren(node.children);

  if (isFormatTag(node.tag)) {
    switch (node.tag) {
      case 'FormatBold':
        return <strong>{children}</strong>;
      case 'FormatItalics':
        return <em>{children}</em>;
      case 'FormatOneLine':
        return <span className="rv-one-line">{children}</span>;
      case 'FormatAlignLeft':
        return <span className="rv-align-left">{children}</span>;
      case 'FormatAlignRight':
        return <span className="rv-align-right">{children}</span>;
      case 'FormatAlignCenter':
        return <span className="rv-align-center">{children}</span>;
      default:
        return children;
    }
  }

  return children;
}

function extractNameInfo(root: ResumeNode): NameInfo {
  const ns = findChild(root, 'NameSection');
  if (!ns) return { name: '', location: '', email: '', website: '' };
  return {
    name: getTextContent(findChild(ns, 'Name') ?? ''),
    location: getTextContent(findChild(ns, 'Location') ?? ''),
    email: getTextContent(findChild(ns, 'Email') ?? ''),
    website: getTextContent(findChild(ns, 'Website') ?? ''),
  };
}

function renderNameSection(ns: ResumeNode): ReactNode {
  const name = getTextContent(findChild(ns, 'Name') ?? '');
  const parts: string[] = [];
  const loc = findChild(ns, 'Location');
  if (loc) parts.push(getTextContent(loc));
  const email = findChild(ns, 'Email');
  if (email) parts.push(getTextContent(email));
  const website = findChild(ns, 'Website');
  if (website) parts.push(getTextContent(website));

  return (
    <div className="rv-name-section">
      <div className="rv-name">{name}</div>
      <div className="rv-name-details">{parts.join(' | ')}</div>
    </div>
  );
}

function renderHeader(header: ResumeNode, type: 'experience' | 'project' | 'education'): ReactNode {
  const leftParts: ReactNode[] = [];
  const date = getTextContent(findChild(header, 'Date') ?? '');

  const pushField = (tag: string, bold = false) => {
    const node = findChild(header, tag);
    if (!node) return;
    const rendered = renderInline(node);
    leftParts.push(bold ? <strong>{rendered}</strong> : rendered);
  };

  if (type === 'experience') {
    for (const [tag, bold] of [
      ['CompanyName', true],
      ['Position', false],
      ['Team', false],
      ['CompanyLocation', false],
    ] as const) {
      pushField(tag, bold);
    }
  } else if (type === 'project') {
    pushField('ProjectName', true);
  } else {
    for (const tag of ['SchoolName', 'SchoolLocation', 'SchoolGpa']) {
      pushField(tag);
    }
  }

  return (
    <div className="rv-entry-header rv-one-line">
      <span className="rv-entry-header-left">
        {leftParts.map((part, idx) => (
          <Fragment key={`header-left-${idx}`}>
            {idx > 0 && ' | '}
            {part}
          </Fragment>
        ))}
      </span>
      <span className="rv-entry-header-right">{date}</span>
    </div>
  );
}

function renderBullets(bullets: ResumeNode[]): ReactNode {
  if (bullets.length === 0) return null;
  return (
    <ul className="rv-bullet-list">
      {bullets.map((bullet, index) => (
        <li key={`bullet-${index}`} className="rv-bullet">
          {renderInlineChildren(bullet.children)}
        </li>
      ))}
    </ul>
  );
}

function renderSkill(skill: ResumeNode): ReactNode {
  return <div className="rv-skill">{renderInlineChildren(skill.children)}</div>;
}

function renderEntry(item: ResumeNode, headerType: 'experience' | 'project'): ReactNode {
  const header = findChild(item, 'Header');
  const bullets = findChildren(item, 'Bullet');
  return (
    <div className="rv-entry">
      {header ? renderHeader(header, headerType) : null}
      {renderBullets(bullets)}
    </div>
  );
}

function renderSection(section: ResumeNode): ReactNode {
  const title = section.attributes.title ?? '';
  const parts: ReactNode[] = [];
  let bulletBuf: ResumeNode[] = [];

  const flushBullets = () => {
    if (bulletBuf.length > 0) {
      const rendered = renderBullets(bulletBuf);
      if (rendered) parts.push(rendered);
      bulletBuf = [];
    }
  };

  for (const child of section.children) {
    if (typeof child === 'string') continue;
    if (child.tag === 'Bullet') {
      bulletBuf.push(child);
      continue;
    }
    flushBullets();
    switch (child.tag) {
      case 'ExperienceItem':
        parts.push(renderEntry(child, 'experience'));
        break;
      case 'ProjectItem':
        parts.push(renderEntry(child, 'project'));
        break;
      case 'Skill':
        parts.push(renderSkill(child));
        break;
      case 'Header':
        parts.push(renderHeader(child, 'education'));
        break;
      default:
        if (isFormatTag(child.tag)) {
          parts.push(renderInline(child));
        }
        break;
    }
  }
  flushBullets();

  return (
    <div className="rv-section">
      <div className="rv-section-title">{title}</div>
      <hr className="rv-section-hr" />
      {parts.map((part, index) => (
        <Fragment key={`section-child-${index}`}>{part}</Fragment>
      ))}
    </div>
  );
}

function wrapPage(
  content: ReactNode,
  nameInfo: NameInfo,
  pageNum: number,
  totalPages: number,
): ReactNode {
  return (
    <>
      <div className="rv-page-content">{content}</div>
      <div className="rv-page-footer">
        <span>{nameInfo.name}</span>
        <span>{nameInfo.email}</span>
        <span>
          Page {pageNum} of {totalPages}
        </span>
      </div>
    </>
  );
}

export function renderXmlResume(root: ResumeNode, pageLayout: '1' | '2'): XmlRenderedPage[] {
  const nameInfo = extractNameInfo(root);
  const pageContents: ReactNode[][] = [[]];

  for (const child of root.children) {
    if (typeof child === 'string') continue;
    if (child.tag === 'FormatPageBreak') {
      if (pageLayout !== '1') {
        pageContents.push([]);
      }
      continue;
    }
    const currentPage = pageContents[pageContents.length - 1]!;
    if (child.tag === 'NameSection') {
      currentPage.push(renderNameSection(child));
    } else if (child.tag === 'ResumeSection') {
      currentPage.push(renderSection(child));
    }
  }

  return pageContents.map((content, index) => {
    const pageBody = (
      <>
        {content.map((part, partIndex) => (
          <Fragment key={`page-${index}-child-${partIndex}`}>{part}</Fragment>
        ))}
      </>
    );
    return {
      content: wrapPage(pageBody, nameInfo, index + 1, pageContents.length),
    };
  });
}

export function buildXmlCssVars(values: StyleValues): Record<string, string> {
  const v = (key: string, fallback: number) => values[key] ?? fallback;
  return {
    '--rv-name-font': `${v('name-font', 18)}pt`,
    '--rv-name-margin': `${v('name-margin', 0)}pt`,
    '--rv-name-details-font': `${v('name-details-font', 10)}pt`,
    '--rv-name-details-margin': `${v('name-details-margin', 2)}pt`,
    '--rv-section-title-font': `${v('section-title-font', 11)}pt`,
    '--rv-section-title-margin': `${v('section-title-margin', 10)}pt`,
    '--rv-section-hr-margin': `${v('section-hr-margin', 2)}pt`,
    '--rv-entry-header-font': `${v('entry-header-font', 10)}pt`,
    '--rv-entry-header-margin': `${v('entry-header-margin', 6)}pt`,
    '--rv-bullet-font': `${v('bullet-font', 10)}pt`,
    '--rv-bullet-margin': `${v('bullet-margin', 1)}pt`,
    '--rv-skill-font': `${v('skill-font', 10)}pt`,
    '--rv-skill-margin': `${v('skill-margin', 1)}pt`,
    '--rv-footer-font': `${v('footer-font', 8)}pt`,
    '--rv-line-height': `${v('line-height', 1.3)}`,
    padding: `${v('page-margin', 48)}px`,
  };
}

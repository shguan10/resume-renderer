const LETTER_W_PX = 816;
const LETTER_H_PX = 1056;

/**
 * Opens the browser's native Print dialog via a hidden iframe,
 * producing a vector-text PDF that is fully ATS-compatible.
 */
export async function exportToPdf(containerEl: HTMLElement): Promise<void> {
  const pages = containerEl.querySelectorAll<HTMLElement>('.resume-page');
  if (pages.length === 0) return;

  // Collect all stylesheets
  let cssText = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        cssText += rule.cssText + '\n';
      }
    } catch {
      if (sheet.href) {
        cssText += `@import url("${sheet.href}");\n`;
      }
    }
  }

  // Clone page HTML
  const pagesHtml = Array.from(pages)
    .map((p) => p.outerHTML)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
${cssText}

@media print {
  /* Force all text to be selectable */
  * {
    -webkit-user-select: text !important;
    user-select: text !important;
  }
  
  /* Ensure no elements are 'clipped' in a way that hides text layers */
  .resume-page {
    overflow: visible !important;
  }
}

@page {
  size: letter portrait;
  margin: 0;
}

*, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

html, body {
  margin: 0;
  padding: 0;
  background: white;
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.resume-page {
  width: ${LETTER_W_PX}px;
  height: ${LETTER_H_PX}px;
  min-height: ${LETTER_H_PX}px;
  max-height: ${LETTER_H_PX}px;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  box-shadow: none !important;
  margin: 0 !important;
}

.resume-page:last-child {
  page-break-after: auto;
  break-after: auto;
}
</style>
</head>
<body>${pagesHtml}</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = `${LETTER_W_PX}px`;
  iframe.style.height = `${LETTER_H_PX}px`;
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts & layout to settle
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    // Fallback in case onload already fired
    setTimeout(resolve, 500);
  });

  iframe.contentWindow?.print();

  // Clean up after a delay so the print dialog can use the iframe
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}

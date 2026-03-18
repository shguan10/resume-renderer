/**
 * Exports a standalone HTML file containing the rendered resume DOM
 * and all computed CSS, for offline box-model inspection.
 */
export function exportDiagnosticHtml(containerEl: HTMLElement): void {
  const pages = containerEl.querySelectorAll<HTMLElement>('.resume-page');
  if (pages.length === 0) return;

  // Collect all stylesheets
  const styleSheets = Array.from(document.styleSheets);
  let cssText = '';

  for (const sheet of styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules);
      for (const rule of rules) {
        cssText += rule.cssText + '\n';
      }
    } catch {
      // Cross-origin stylesheet, skip
      if (sheet.href) {
        cssText += `/* Could not read cross-origin sheet: ${sheet.href} */\n`;
      }
    }
  }

  // Also capture computed CSS variables from each page
  let computedVarsBlock = '';
  pages.forEach((page, i) => {
    const computed = getComputedStyle(page);
    const scale = computed.getPropertyValue('--resume-scale').trim();
    computedVarsBlock += `/* Page ${i + 1}: --resume-scale = ${scale || 'not set'}, scrollHeight = ${page.scrollHeight}px, offsetHeight = ${page.offsetHeight}px */\n`;
  });

  // Build HTML clone
  const pagesHtml = Array.from(pages)
    .map((page) => page.outerHTML)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Diagnostic Export</title>
  <style>
    /* === Computed Variable Report === */
    ${computedVarsBlock}

    /* === Application Stylesheets === */
    ${cssText}

    /* === Diagnostic Overrides === */
    body {
      margin: 0;
      padding: 24px;
      background: #e5e5e5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    .resume-page {
      outline: 2px dashed red;
      outline-offset: -1px;
    }
  </style>
</head>
<body>
  <p style="font-family: monospace; color: #666; font-size: 12px;">
    Diagnostic export — red dashed outline marks the 816×1056px page boundary.
    Inspect elements to verify box model.
  </p>
  ${pagesHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume-diagnostic.html';
  a.click();
  URL.revokeObjectURL(url);
}

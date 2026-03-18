import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const LETTER_W_IN = 8.5;
const LETTER_H_IN = 11;
const DPI = 96;
const PX_W = LETTER_W_IN * DPI;
const PX_H = LETTER_H_IN * DPI;

/**
 * Captures rendered resume pages from the DOM and generates
 * a clean PDF. Enforces 1056px height + overflow:hidden during capture.
 */
export async function exportToPdf(containerEl: HTMLElement): Promise<void> {
  const pages = containerEl.querySelectorAll<HTMLElement>('.resume-page');
  if (pages.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  // Store original styles to restore after capture
  const originals: { height: string; overflow: string; minHeight: string }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page) continue;

    // Lock dimensions and clip overflow during capture
    originals[i] = {
      height: page.style.height,
      overflow: page.style.overflow,
      minHeight: page.style.minHeight,
    };
    page.style.height = `${PX_H}px`;
    page.style.minHeight = `${PX_H}px`;
    page.style.overflow = 'hidden';

    const canvas = await html2canvas(page, {
      scale: 3, // high-res without changing layout
      width: PX_W,
      height: PX_H,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // Restore original styles
    const orig = originals[i];
    if (orig) {
      page.style.height = orig.height;
      page.style.minHeight = orig.minHeight;
      page.style.overflow = orig.overflow;
    }

    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('letter', 'portrait');
    }

    pdf.addImage(imgData, 'PNG', 0, 0, LETTER_W_IN, LETTER_H_IN);
  }

  pdf.save('resume.pdf');
}

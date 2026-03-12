import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const LETTER_W_IN = 8.5;
const LETTER_H_IN = 11;
const DPI = 96;
const PX_W = LETTER_W_IN * DPI;
const PX_H = LETTER_H_IN * DPI;

/**
 * Captures rendered resume pages from the DOM and generates
 * a clean PDF with no browser chrome.
 */
export async function exportToPdf(containerEl: HTMLElement): Promise<void> {
  const pages = containerEl.querySelectorAll<HTMLElement>('.resume-page');
  if (pages.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 2, // 2× for crisp output
      width: PX_W,
      height: PX_H,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('letter', 'portrait');
    }

    pdf.addImage(imgData, 'PNG', 0, 0, LETTER_W_IN, LETTER_H_IN);
  }

  pdf.save('resume.pdf');
}

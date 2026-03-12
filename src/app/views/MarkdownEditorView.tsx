import React, { useState, useRef, useCallback } from 'react';
import { MarkdownEditorLayout } from '@/app/components/layouts/MarkdownEditorLayout';

const DEFAULT_MARKDOWN = `# Shane Guan

shguan10@gmail.com | [shguan10.github.io](http://shguan10.github.io/) | US Citizen

---

## SUMMARY

- Bachelor's Degree in **Computer Science** (University Honors) and Minor in **Machine Learning**
- 3+ years non-internship professional experience using **C, C++, Python** in full software development life cycle with **Agile** methodologies and **Azure DevOps**
- 3+ years non-internship professional experience in reliable and scalable systems design
- Strong background in statistics, **deep learning** (PyTorch, Keras), and **natural language processing**

## TECHNICAL SKILLS

**Languages:** C/C++, Python, CUDA, ONNX, Java, SQLite
**ML Frameworks:** PyTorch, Tensorflow, DirectML
**Graphics:** DirectX, HLSL
**Debugging:** Windbg, Pix

## EDUCATION

**University of Illinois Urbana-Champaign** (UIUC) — Champaign, IL
Master of Computer Science — *May 2025 – Aug 2026 (anticipated)*

**Carnegie Mellon University** (CMU) — Pittsburgh, PA
B.S. in Computer Science *(University Honors)*, Minor in Machine Learning — *Aug 2017 – Dec 2020*

## WORK EXPERIENCE

**Microsoft, Inc.** | Software Engineer — Redmond, WA
*DirectML Team — Aug 2023 – Jan 2025*

- Worked on the Windows DirectML library which turns ML workloads from libraries like **ONNX** and **TensorFlow** into optimized pipelines for accelerators like **GPU** and NPU
- Implemented metacommands that enhance the **GPU** driver support for different vendors
- Set up 10 test machines for in-house testing of the DirectML library across multiple **GPU** vendors
- Maintained the **C++** codebase via regression testing and analyzing the library code using Windbg and the DirectX HLSL shaders using PIX

**Microsoft, Inc.** | Software Engineer — Redmond, WA
*Connectivity Platform Team — Feb 2021 – Aug 2023*

- Implemented **C++** data conversion functions and the logic for the public WinRT API of a secure, short-range object communication protocol for embedded IoT devices following IEEE specifications
- Established the groundwork for fuzz testing of LUI APIs
- Maintained the **C++** codebase via regression testing and analyzing the library code in Windbg

---page-break---

## WORK EXPERIENCE (continued)

**Microsoft, Inc.** | Software Engineer Intern — Redmond, WA
*Connectivity Platform Team — May 2020 – Aug 2020*

- Developed a configurable, extendable, and exhaustive test suite in **Python** for a new smart IoT sensor

**Caterpillar, Inc.** | Machine Perception Engineer Co-op — Pittsburgh, PA
*Aug 2018 – May 2019*

- Worked in image segmentation for use in machine perception, improving upon the state-of-the-art computer vision algorithm ENet
- Developed a technique for finding flaws in **training** datasets that improves **inference performance**, implemented in **PyTorch**

## NOTABLE PROJECTS & RESEARCH

**Senior Thesis: Exploiting Extra Inputs During Training Time** — *Jan 2020 – Dec 2020*
- Investigated the theoretical basis of when to perform imputation for multimodal ML tasks
- Proved that if the data has a linear distribution then taking the empirical average of the missing modality is better than trying to predict the missing modality during test time

**Autoencoder-Based Attacks on Deep Learning Models** — *Jan 2019 – May 2019*
- Developed a technique for identifying flaws in training datasets, implemented in **PyTorch**
- Successfully attacked an ENet **image segmentation** model, resulting in **3x decrease** in IoU score

## PUBLICATIONS

- **X. Guan**, J. Lee, P. Wu, Y. Wu. **Machine Learning for Exam Triage**. Proceedings of the 2018 HackAuton, Pittsburgh, PA, 2018.
- S. Kazadi, G. Jeno, **X. Guan**, N. Nusgart, A. Sheptunov. Decision making swarms. Proceedings of the 28th MAICS Conference, Fort Wayne, IN, 2017.

## HONORS AND AWARDS

- **Best in Show** award at Hack Auton hackathon — *2018*
- **Best Paper Award** at 2017 Modern Artificial Intelligence and Cognitive Science conference — *2017*
`;

export type ResumeFont = 'Geist' | 'Inter' | 'Libre Baskerville';
export type PageLayout = '1' | '2';

export function MarkdownEditorView() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [font, setFont] = useState<ResumeFont>('Geist');
  const [pageLayout, setPageLayout] = useState<PageLayout>('2');
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <MarkdownEditorLayout
      markdown={markdown}
      font={font}
      pageLayout={pageLayout}
      paperRef={paperRef}
      onMarkdownChange={setMarkdown}
      onFontChange={setFont}
      onPageLayoutChange={setPageLayout}
      onPrint={handlePrint}
    />
  );
}

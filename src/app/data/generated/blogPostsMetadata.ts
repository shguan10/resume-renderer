/**
 * This file is generated from scripts/sync-blog-metadata.ts.
 * Run "npm run sync:blog" to refresh.
 */

export interface BlogPostMetadata {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  summary: string;
  date: string;
  tags: string[];
  image?: string;
  icon?: string;
  layout?: string;
}

export const blogPostMetadata: BlogPostMetadata[] = [
  {
    "id": "2026-03-10-new-website",
    "title": "New Website Design",
    "summary": "I finally took the time to update my website! Previously my website was built using Beautiful Jekyll, which in fairness is quite nice, but I was only really usi...",
    "date": "2026-03-10",
    "tags": [
      "software",
      "postmortem"
    ],
    "layout": "post"
  },
  {
    "id": "2026-03-05-reflection",
    "title": "PerceptionTrainer Post Mortem",
    "summary": "Overall Reflection Are AI agents really all they are hyped up to be? Marketed as personal “10x engineers”, they claim to raise productivity by orders of magnitu...",
    "date": "2026-03-05",
    "tags": [
      "software",
      "postmortem"
    ],
    "image": "/img/eye.svg",
    "layout": "post"
  },
  {
    "id": "2026-03-01-perceptiontrainer",
    "title": "PerceptionTrainer",
    "description": "Duolingo, but for art and music skills. 2026.",
    "summary": "Duolingo, but for art and music skills. 2026.",
    "date": "2026-03-01",
    "tags": [
      "software",
      "prototypes",
      "highlighted"
    ],
    "image": "/img/eye.svg",
    "layout": "post"
  },
  {
    "id": "2020-12-15-senior-thesis",
    "title": "GenNet, Theoretical Explanations for Certain Phenomenons in Multimodal Deep Learning",
    "description": "Investigating theoretical explanations for multimodal deep learning effects with Dr. Zico Kolter. 2020.",
    "summary": "Investigating theoretical explanations for multimodal deep learning effects with Dr. Zico Kolter. 2020.",
    "date": "2020-12-15",
    "tags": [
      "software",
      "research",
      "GenNet",
      "highlighted"
    ],
    "image": "/img/senses.png",
    "layout": "post"
  },
  {
    "id": "2020-06-07-hotp",
    "title": "Understanding Higher Order Derivatives of Matrix Functions",
    "description": "A method for understanding higher order derivatives of a matrix function. 2020",
    "summary": "A method for understanding higher order derivatives of a matrix function. 2020",
    "date": "2020-06-07",
    "tags": [
      "math",
      "research",
      "taylor-polynomial",
      "highlighted"
    ],
    "icon": "Sigma",
    "layout": "post"
  },
  {
    "id": "2020-01-23-deep-regression",
    "title": "GenNet, 1/23/2020 Update",
    "summary": "Benefits of Multimodal Training Over winter break I learned that for linear regression there was a benefit to training with multiple modalities even when your t...",
    "date": "2020-01-23",
    "tags": [
      "software",
      "research",
      "GenNet"
    ],
    "image": "/img/senses.png",
    "layout": "post"
  },
  {
    "id": "2020-01-12-winter-research",
    "title": "GenNet, Winter Break Update",
    "summary": "Benefits of Multimodal Training It makes sense that for a multimodal task, a multimodal model is better than a unimodal one. However, would a multimodal model b...",
    "date": "2020-01-12",
    "tags": [
      "software",
      "research",
      "GenNet"
    ],
    "image": "/img/senses.png",
    "layout": "post"
  },
  {
    "id": "2019-10-31-research",
    "title": "Senior Thesis",
    "summary": "Introduction My webpage will also contain the work I'm doing to investigate the generalization ability of neural networks, specifically for the multi-modal case...",
    "date": "2019-10-31",
    "tags": [
      "software",
      "research",
      "GenNet"
    ],
    "layout": "post"
  },
  {
    "id": "2018-04-30-medical-ml",
    "title": "Machine Learning for Exam Triage",
    "description": "Trained a model to identify chest diseases, achieving better AUROC scores than the state of the art. 2018.",
    "summary": "Trained a model to identify chest diseases, achieving better AUROC scores than the state of the art. 2018.",
    "date": "2018-04-30",
    "tags": [
      "software",
      "research",
      "hackathon",
      "highlighted"
    ],
    "icon": "Stethoscope",
    "layout": "post"
  },
  {
    "id": "2018-04-03-snowflake",
    "title": "Snowflake, the Fridge Management System",
    "description": "Automatic fridge inventory management system with recipe recommendations. 2018.",
    "summary": "Automatic fridge inventory management system with recipe recommendations. 2018.",
    "date": "2018-04-03",
    "tags": [
      "software",
      "hackathon",
      "highlighted"
    ],
    "image": "/img/snowflake_logo.png",
    "layout": "post"
  },
  {
    "id": "2018-02-03-sight2sound",
    "title": "Sight2Sound",
    "description": "Transforms image input to soundscapes to help blind people perceive their surroundings. 2018.",
    "summary": "Transforms image input to soundscapes to help blind people perceive their surroundings. 2018.",
    "date": "2018-02-03",
    "tags": [
      "software",
      "hackathon",
      "highlighted"
    ],
    "icon": "Ear",
    "layout": "post"
  },
  {
    "id": "2016-04-15-swarm-robotics",
    "title": "Swarm Robotics",
    "description": "Ant colony simulation using Hamiltonian Method of Swarm Design. 2016.",
    "summary": "Ant colony simulation using Hamiltonian Method of Swarm Design. 2016.",
    "date": "2016-04-15",
    "tags": [
      "software",
      "research",
      "highlighted"
    ],
    "icon": "Robot",
    "layout": "post"
  }
];

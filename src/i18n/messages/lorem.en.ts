import type { loremCs } from "./lorem.cs";

export const loremEn: typeof loremCs = {
  copy: "Copy",
  copied: "Copied ✓",
  regenerate: "↻ New",
  regenerateAria: "Generate new text",
  stats: "{words} words · {chars} characters",
  unitAria: "Unit",
  units: {
    paragraphs: "Paragraphs",
    sentences: "Sentences",
    words: "Words",
  },
  countLabels: {
    paragraphs: "Number of paragraphs",
    sentences: "Number of sentences",
    words: "Number of words",
  },
  stepper: { decrease: "{label} — decrease", increase: "{label} — increase" },
  startWithLorem: "Start with “Lorem ipsum dolor sit amet…”",
  html: "Wrap paragraphs in <p> tags",
};

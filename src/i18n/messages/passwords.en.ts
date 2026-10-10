import type { passwordsCs } from "./passwords.cs";

export const passwordsEn: typeof passwordsCs = {
  noCharset: "Select at least one character set.",
  copy: "Copy",
  copied: "Copied ✓",
  regenerate: "↻ New",
  regenerateAria: "Generate a new one",
  strength: ["Weak", "Fair", "Strong", "Very strong"],
  bits: "≈ {n} bits",
  modeAria: "Mode",
  modeChars: "Characters",
  modeWords: "Words",
  length: "Length",
  stepper: { decrease: "{label} — decrease", increase: "{label} — increase" },
  charsets: "Character sets",
  charsetLabels: {
    lower: "Lowercase letters (a–z)",
    upper: "Uppercase letters (A–Z)",
    digits: "Digits (0–9)",
    symbols: "Symbols (!@#…)",
  },
  excludeAmbiguous: "Exclude similar characters (0 O 1 l I |)",
  wordCount: "Number of words",
  separator: "Separator",
  separatorLabels: {
    "-": "hyphen",
    " ": "space",
    ".": "dot",
    _: "underscore",
  },
  capitalize: "Capitalize words",
  addNumber: "Add a digit",
};

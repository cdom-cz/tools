import type { catalogCs } from "./catalog.cs";

export const catalogEn: typeof catalogCs = {
  timer: {
    name: "Timer",
    description:
      "Interval timer for HIIT and circuit training. Set the exercise, rest and number of rounds, and the timer guides you through colour-coded phases with a sound signal.",
    tags: ["training", "time"],
    intro: "Interval timer for HIIT and circuit training. Settings are saved in this browser.",
  },
  meditation: {
    name: "Meditation",
    description:
      "Meditation timer with blocks. Set the number and length of blocks; a soft gong sounds at the end of each one and three times at the end of the whole session.",
    tags: ["mind", "time"],
    intro: "Set the number and length of blocks; a soft gong sounds at the end of each. Settings are saved in this browser.",
  },
  passwords: {
    name: "Password generator",
    description:
      "Generates strong random passwords or easy-to-remember passphrases. You choose the length and character types; nothing is sent anywhere.",
    tags: ["security", "text"],
    intro: "Passwords are generated right in your browser and never sent anywhere. Settings are saved in this browser.",
  },
  invoice: {
    name: "Invoice generator",
    description:
      "One-off invoice in CZK as a PDF with a QR payment code. For VAT payers and non-payers, with logo and signature; the IBAN is derived from the account number.",
    tags: ["finance", "pdf"],
    intro:
      "The CZK invoice is downloaded as a PDF straight from your browser; nothing is sent anywhere. Your supplier details, logo and signature are remembered only in this browser.",
  },
  compound: {
    name: "Compound interest",
    description:
      "Compound interest calculator with a chart. Initial deposit, regular savings, rate and period; interest is credited monthly or yearly.",
    tags: ["finance", "savings"],
    intro:
      "Calculates how a deposit grows with compound interest. Everything is computed in your browser; settings are saved only here.",
  },
};

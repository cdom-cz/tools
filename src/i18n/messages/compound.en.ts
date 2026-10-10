import type { compoundCs } from "./compound.cs";

export const compoundEn: typeof compoundCs = {
  compoundingAria: "Interest compounding",
  monthly: "Monthly",
  yearly: "Yearly",
  compoundingHint: {
    monthly: "Interest is credited every month and earns interest itself.",
    yearly: "Interest accrues during the year and is credited at its end.",
  },
  principal: "Initial deposit",
  monthlyDeposit: "Monthly deposit",
  rate: "Interest rate p.a.",
  years: "Saving period",
  currency: "CZK",
  yearsUnit: { one: "{n} year", few: "{n} years", many: "{n} years", other: "{n} years" },
  stepper: { decrease: "{label} — decrease", increase: "{label} — increase" },
  finalValue: "Final value",
  contributed: "Total deposited",
  interest: "Total interest",
  effectiveRate: "Effective annual rate: {n} %",
  chartTitle: "Growth over time",
  chartAria: "Chart: deposits and interest by year",
  year: "Year",
  balance: "Value",
  table: "Year-by-year table",
};

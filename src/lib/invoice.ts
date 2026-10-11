/**
 * Invoice generator domain: pure functions with no React or DOM.
 * Amounts are computed in cents (integers) to avoid floating-point errors.
 */

import type { Locale } from "@/i18n/config";

export const VAT_RATES = [0, 12, 21] as const;
export type VatRate = (typeof VAT_RATES)[number];

export type Party = {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  ico: string;
  dic: string;
  /** Free text below the address (e.g. trade register entry). */
  note: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  /** Price per unit in CZK (excl. VAT for VAT payers, otherwise final). */
  unitPrice: number;
  vatRate: VatRate;
};

export type Supplier = {
  party: Party;
  vatPayer: boolean;
  /** Account number as `[prefix-]number/bank code`. */
  account: string;
  iban: string;
  bic: string;
  paymentMethod: string;
  footer: string;
};

export type Invoice = {
  number: string;
  variableSymbol: string;
  issueDate: string;
  dueDate: string;
  /** Taxable supply date (VAT payers only). */
  taxDate: string;
  customer: Party;
  items: InvoiceItem[];
  supplier: Supplier;
};

/** Language-dependent defaults (texts come from the dictionary). */
export type InvoiceDefaults = { country: string; paymentMethod: string; footer: string };

export const EMPTY_PARTY: Party = {
  name: "",
  street: "",
  city: "",
  zip: "",
  country: "",
  ico: "",
  dic: "",
  note: "",
};

export function emptyParty(defaults: Pick<InvoiceDefaults, "country">): Party {
  return { ...EMPTY_PARTY, country: defaults.country };
}

export function defaultSupplier(defaults: InvoiceDefaults): Supplier {
  return {
    party: emptyParty(defaults),
    vatPayer: false,
    account: "",
    iban: "",
    bic: "",
    paymentMethod: defaults.paymentMethod,
    footer: defaults.footer,
  };
}

let idCounter = 0;
export function newItemId(): string {
  idCounter += 1;
  return `item-${Date.now().toString(36)}-${idCounter}`;
}

export function emptyItem(): InvoiceItem {
  return { id: newItemId(), description: "", quantity: 1, unit: "", unitPrice: 0, vatRate: 21 };
}

/** ISO date (YYYY-MM-DD) in local time. */
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

export function defaultInvoice(defaults: InvoiceDefaults, supplier: Supplier = defaultSupplier(defaults), today = new Date()): Invoice {
  const issueDate = toIsoDate(today);
  const yy = String(today.getFullYear()).slice(2);
  return {
    number: `${yy}00001`,
    variableSymbol: `${yy}00001`,
    issueDate,
    dueDate: addDays(issueDate, 14),
    taxDate: issueDate,
    customer: emptyParty(defaults),
    items: [emptyItem()],
    supplier,
  };
}

/** `2026-09-10` → cs `10. 09. 2026`, en `10 Sep 2026`. */
export function formatDate(iso: string, locale: Locale = "cs"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  if (locale === "cs") return `${m[3]}. ${m[2]}. ${m[1]}`;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

const NBSP = "\u00a0";

/** Cent count → cs `13 878 Kč`, en `CZK 13,878` (decimals only when non-zero). */
export function formatCzk(cents: number, locale: Locale = "cs"): string {
  const n = formatNumber(cents / 100, locale);
  return locale === "cs" ? `${n}${NBSP}Kč` : `CZK${NBSP}${n}`;
}

export function formatNumber(value: number, locale: Locale = "cs"): string {
  const neg = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const thousands = locale === "cs" ? NBSP : ",";
  const whole = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const frac = cents % 100;
  const out = frac === 0 ? whole : `${whole}${locale === "cs" ? "," : "."}${String(frac).padStart(2, "0")}`;
  return neg ? `-${out}` : out;
}

export function toCents(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

export type ItemTotals = { base: number; vat: number; total: number };

/** Totals of a single item in cents. Non-payer: VAT = 0, total = base. */
export function itemTotals(item: InvoiceItem, vatPayer: boolean): ItemTotals {
  const base = Math.round((Number.isFinite(item.quantity) ? item.quantity : 0) * toCents(item.unitPrice));
  const vat = vatPayer ? Math.round((base * item.vatRate) / 100) : 0;
  return { base, vat, total: base + vat };
}

export type VatSummaryRow = { rate: VatRate; base: number; vat: number; total: number };
export type Totals = {
  base: number;
  vat: number;
  /** Sum before rounding. */
  total: number;
  rounding: number;
  /** Amount due, in whole crowns. */
  payable: number;
  summary: VatSummaryRow[];
};

/** For VAT payers, VAT is computed from the base per rate (summed by rate), not per item. */
export function computeTotals(items: readonly InvoiceItem[], vatPayer: boolean): Totals {
  const byRate = new Map<VatRate, number>();
  for (const it of items) {
    const { base } = itemTotals(it, vatPayer);
    byRate.set(it.vatRate, (byRate.get(it.vatRate) ?? 0) + base);
  }
  const summary: VatSummaryRow[] = [...byRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, base]) => {
      const vat = vatPayer ? Math.round((base * rate) / 100) : 0;
      return { rate, base, vat, total: base + vat };
    });
  const base = summary.reduce((s, r) => s + r.base, 0);
  const vat = summary.reduce((s, r) => s + r.vat, 0);
  const total = base + vat;
  const payable = Math.round(total / 100) * 100;
  return { base, vat, total, rounding: payable - total, payable, summary };
}

/* ---------- Color palette ---------- */

export const DEFAULT_PRIMARY_COLOR = "#f26b1d";

export type InvoicePalette = {
  /** Primary color: stripes, party accent, total bar. */
  accent: string;
  /** Accent usable as text on white (darkened when the primary is too light). */
  accentText: string;
  /** Text on top of the accent background (white or near-black, whichever reads better). */
  onAccent: string;
  ink: string;
  muted: string;
  hairline: string;
  tint: string;
  rowAlt: string;
};

export function normalizeHex(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : DEFAULT_PRIMARY_COLOR;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const sat = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, sat, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Derives the whole invoice color scheme from one primary color (same hue, adjusted saturation/lightness). */
export function invoicePalette(primary: string): InvoicePalette {
  const accent = normalizeHex(primary);
  const [h, s, l] = hexToHsl(accent);
  const ink = hslToHex(h, Math.min(s, 0.2), 0.11);

  let accentText = accent;
  let lightness = l;
  while (contrast(accentText, "#ffffff") < 3.5 && lightness > 0.05) {
    lightness -= 0.02;
    accentText = hslToHex(h, s, lightness);
  }

  return {
    accent,
    accentText,
    onAccent: contrast(accent, "#ffffff") >= contrast(accent, ink) ? "#ffffff" : ink,
    ink,
    muted: hslToHex(h, Math.min(s, 0.08), 0.46),
    hairline: hslToHex(h, Math.min(s, 0.12), 0.89),
    tint: hslToHex(h, Math.min(s, 0.7), 0.95),
    rowAlt: hslToHex(h, Math.min(s, 0.1), 0.965),
  };
}

/* ---------- Bank details ---------- */

const ACCOUNT_RE = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/;

export function parseCzAccount(account: string): { prefix: string; number: string; bank: string } | null {
  const m = ACCOUNT_RE.exec(account.replace(/\s/g, ""));
  return m ? { prefix: m[1] ?? "", number: m[2], bank: m[3] } : null;
}

/** IBAN from a Czech account number; `null` if the format does not match. */
export function czAccountToIban(account: string): string | null {
  const a = parseCzAccount(account);
  if (!a) return null;
  const bban = `${a.bank}${a.prefix.padStart(6, "0")}${a.number.padStart(10, "0")}`;
  // CZ00 → "123500" (C=12, Z=35); check digits = 98 − (BBAN+CZ00 mod 97).
  const mod = Number(BigInt(`${bban}123500`) % 97n);
  return `CZ${String(98 - mod).padStart(2, "0")}${bban}`;
}

export function formatIban(iban: string): string {
  return iban.replace(/\s/g, "");
}

const BIC_BY_BANK: Record<string, string> = {
  "0100": "KOMBCZPP",
  "0300": "CEKOCZPP",
  "0600": "AGBACZPP",
  "0710": "CNBACZPP",
  "0800": "GIBACZPX",
  "2010": "FIOBCZPP",
  "2250": "CTASCZ22",
  "2260": "NROZCZPP",
  "2700": "BACXCZPP",
  "3030": "AIRACZPP",
  "5500": "RZBCCZPP",
  "6210": "BREXCZPP",
  "6800": "VBOECZ2X",
};

export function bicForAccount(account: string): string {
  const a = parseCzAccount(account);
  return (a && BIC_BY_BANK[a.bank]) || "";
}

/* ---------- QR payment (SPAYD) ---------- */

/** Strips diacritics and `*` characters that would break SPAYD; limits the length. */
function spaydText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\*/g, " ")
    .trim()
    .slice(0, max);
}

/** QR payment string in SPAYD 1.0 format. */
export function buildSpayd(opts: {
  iban: string;
  cents: number;
  variableSymbol: string;
  dueDate: string;
  message?: string;
}): string {
  const parts = [
    "SPD",
    "1.0",
    `ACC:${formatIban(opts.iban)}`,
    `AM:${(opts.cents / 100).toFixed(2)}`,
    "CC:CZK",
  ];
  const vs = opts.variableSymbol.replace(/\D/g, "").slice(0, 10);
  if (vs) parts.push(`X-VS:${vs}`);
  const dt = opts.dueDate.replace(/-/g, "");
  if (/^\d{8}$/.test(dt)) parts.push(`DT:${dt}`);
  const msg = spaydText(opts.message ?? "", 60);
  if (msg) parts.push(`MSG:${msg}`);
  return parts.join("*");
}

/* ---------- Validation ---------- */

export type InvoiceErrorCode = "number" | "supplierName" | "customerName" | "items" | "account" | "dueDate";

/** Missing required fields as codes (texts come from the dictionary); empty array = invoice is complete. */
export function validateInvoice(inv: Invoice): InvoiceErrorCode[] {
  const errors: InvoiceErrorCode[] = [];
  if (!inv.number.trim()) errors.push("number");
  if (!inv.supplier.party.name.trim()) errors.push("supplierName");
  if (!inv.customer.name.trim()) errors.push("customerName");
  if (inv.items.every((i) => !i.description.trim())) errors.push("items");
  if (!inv.supplier.iban.trim() && !parseCzAccount(inv.supplier.account)) errors.push("account");
  if (inv.dueDate < inv.issueDate) errors.push("dueDate");
  return errors;
}

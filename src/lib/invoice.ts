/**
 * Doména generátoru faktur — čisté funkce bez Reactu a DOMu.
 * Částky se počítají v haléřích (celá čísla), aby nevznikaly chyby plovoucí čárky.
 */

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
  /** Volný text pod adresou (např. zápis v živnostenském rejstříku). */
  note: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  /** Cena za měrnou jednotku v Kč (bez DPH u plátce, jinak konečná). */
  unitPrice: number;
  vatRate: VatRate;
};

export type Supplier = {
  party: Party;
  vatPayer: boolean;
  /** Číslo účtu ve tvaru `[předčíslí-]číslo/kód banky`. */
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
  /** Datum uskutečnění zdanitelného plnění (jen plátce DPH). */
  taxDate: string;
  customer: Party;
  items: InvoiceItem[];
  supplier: Supplier;
};

export const EMPTY_PARTY: Party = {
  name: "",
  street: "",
  city: "",
  zip: "",
  country: "Česko",
  ico: "",
  dic: "",
  note: "",
};

export const DEFAULT_SUPPLIER: Supplier = {
  party: { ...EMPTY_PARTY },
  vatPayer: false,
  account: "",
  iban: "",
  bic: "",
  paymentMethod: "Převodem",
  footer: "Úrok z prodlení ve výši 0,05 % za den z neuhrazené částky ve smyslu OZ.",
};

let idCounter = 0;
export function newItemId(): string {
  idCounter += 1;
  return `item-${Date.now().toString(36)}-${idCounter}`;
}

export function emptyItem(): InvoiceItem {
  return { id: newItemId(), description: "", quantity: 1, unit: "", unitPrice: 0, vatRate: 21 };
}

/** ISO datum (YYYY-MM-DD) v lokálním čase. */
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

export function defaultInvoice(supplier: Supplier = DEFAULT_SUPPLIER, today = new Date()): Invoice {
  const issueDate = toIsoDate(today);
  const yy = String(today.getFullYear()).slice(2);
  return {
    number: `${yy}00001`,
    variableSymbol: `${yy}00001`,
    issueDate,
    dueDate: addDays(issueDate, 14),
    taxDate: issueDate,
    customer: { ...EMPTY_PARTY },
    items: [emptyItem()],
    supplier,
  };
}

/** `2026-09-10` → `10. 09. 2026`. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}. ${m[2]}. ${m[1]}` : iso;
}

const NBSP = " ";

/** Počet haléřů → `13 878 Kč` (desetinná část jen pokud je nenulová). */
export function formatCzk(halere: number): string {
  return `${formatNumber(halere / 100)}${NBSP}Kč`;
}

export function formatNumber(value: number): string {
  const neg = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const whole = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const frac = cents % 100;
  const out = frac === 0 ? whole : `${whole},${String(frac).padStart(2, "0")}`;
  return neg ? `-${out}` : out;
}

export function toHalere(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

export type ItemTotals = { base: number; vat: number; total: number };

/** Součty jedné položky v haléřích. Neplátce: DPH = 0, celkem = základ. */
export function itemTotals(item: InvoiceItem, vatPayer: boolean): ItemTotals {
  const base = Math.round((Number.isFinite(item.quantity) ? item.quantity : 0) * toHalere(item.unitPrice));
  const vat = vatPayer ? Math.round((base * item.vatRate) / 100) : 0;
  return { base, vat, total: base + vat };
}

export type VatSummaryRow = { rate: VatRate; base: number; vat: number; total: number };
export type Totals = {
  base: number;
  vat: number;
  /** Součet před zaokrouhlením. */
  total: number;
  rounding: number;
  /** K úhradě — celé koruny. */
  payable: number;
  summary: VatSummaryRow[];
};

/** DPH se u plátce počítá ze základu dané sazby (součet po sazbách), ne po položkách. */
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

/* ---------- Bankovní údaje ---------- */

const ACCOUNT_RE = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/;

export function parseCzAccount(account: string): { prefix: string; number: string; bank: string } | null {
  const m = ACCOUNT_RE.exec(account.replace(/\s/g, ""));
  return m ? { prefix: m[1] ?? "", number: m[2], bank: m[3] } : null;
}

/** IBAN z českého čísla účtu; `null`, pokud formát nesedí. */
export function czAccountToIban(account: string): string | null {
  const a = parseCzAccount(account);
  if (!a) return null;
  const bban = `${a.bank}${a.prefix.padStart(6, "0")}${a.number.padStart(10, "0")}`;
  // CZ00 → "123500" (C=12, Z=35); kontrolní číslice = 98 − (BBAN+CZ00 mod 97).
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

/* ---------- QR platba (SPAYD) ---------- */

/** Odstraní diakritiku a znaky `*`, které by rozbily SPAYD; omezí délku. */
function spaydText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\*/g, " ")
    .trim()
    .slice(0, max);
}

/** Řetězec pro QR platbu ve formátu SPAYD 1.0. */
export function buildSpayd(opts: {
  iban: string;
  halere: number;
  variableSymbol: string;
  dueDate: string;
  message?: string;
}): string {
  const parts = [
    "SPD",
    "1.0",
    `ACC:${formatIban(opts.iban)}`,
    `AM:${(opts.halere / 100).toFixed(2)}`,
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

/* ---------- Validace ---------- */

/** Chybějící povinné údaje (česky), prázdné pole = faktura je kompletní. */
export function validateInvoice(inv: Invoice): string[] {
  const errors: string[] = [];
  if (!inv.number.trim()) errors.push("Vyplň číslo faktury.");
  if (!inv.supplier.party.name.trim()) errors.push("Vyplň jméno dodavatele.");
  if (!inv.customer.name.trim()) errors.push("Vyplň jméno odběratele.");
  if (inv.items.every((i) => !i.description.trim())) errors.push("Přidej alespoň jednu položku s popisem.");
  if (!inv.supplier.iban.trim() && !parseCzAccount(inv.supplier.account)) {
    errors.push("Vyplň číslo účtu ve tvaru 123456789/0100 (nebo IBAN).");
  }
  if (inv.dueDate < inv.issueDate) errors.push("Splatnost nesmí být před datem vystavení.");
  return errors;
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fmt } from "@/i18n/format";
import { useLocale, useToolMessages } from "@/i18n/provider";
import {
  bicForAccount,
  buildSpayd,
  computeTotals,
  czAccountToIban,
  defaultInvoice,
  defaultSupplier,
  emptyItem,
  emptyParty,
  formatCzk,
  itemTotals,
  validateInvoice,
  VAT_RATES,
  type Invoice,
  type InvoiceErrorCode,
  type InvoiceItem,
  type Party,
  type Supplier,
  type VatRate,
} from "@/lib/invoice";

const SUPPLIER_KEY = "tools.faktura.supplier.v1";
const LOGO_KEY = "tools.faktura.logo.v1";
const SIGNATURE_KEY = "tools.faktura.signature.v1";
const LAST_NUMBER_KEY = "tools.faktura.lastNumber.v1";

const cardClass = "rounded-2xl border border-border bg-card p-4";
const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const btnClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-all duration-200 touch-manipulation disabled:pointer-events-none disabled:opacity-50";
const smallBtnClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm text-foreground hover:bg-muted touch-manipulation";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private mode — the setting is simply not remembered
  }
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  className,
  type = "text",
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <Field label={label} className={className}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function PartyFields({ party, onChange }: { party: Party; onChange: (p: Party) => void }) {
  const m = useToolMessages("invoice").party;
  const set = (k: keyof Party) => (v: string) => onChange({ ...party, [k]: v });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <TextField label={m.name} value={party.name} onChange={set("name")} className="sm:col-span-6" />
      <TextField label={m.street} value={party.street} onChange={set("street")} className="sm:col-span-6" />
      <TextField label={m.city} value={party.city} onChange={set("city")} className="sm:col-span-3" />
      <TextField label={m.zip} value={party.zip} onChange={set("zip")} className="sm:col-span-1" inputMode="numeric" />
      <TextField label={m.country} value={party.country} onChange={set("country")} className="sm:col-span-2" />
      <TextField label={m.ico} value={party.ico} onChange={set("ico")} className="sm:col-span-3" inputMode="numeric" />
      <TextField label={m.dic} value={party.dic} onChange={set("dic")} className="sm:col-span-3" />
      <Field label={m.note} className="sm:col-span-6">
        <textarea
          value={party.note}
          onChange={(e) => set("note")(e.target.value)}
          rows={2}
          className={cn(inputClass, "h-auto py-2")}
        />
      </Field>
    </div>
  );
}

function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const m = useToolMessages("invoice").image;
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-14 max-w-40 rounded border border-border bg-white object-contain p-1" />
        ) : (
          <span className="text-sm text-muted-foreground">{m.none}</span>
        )}
        <button type="button" className={smallBtnClass} onClick={() => ref.current?.click()}>
          {value ? m.change : m.upload}
        </button>
        {value && (
          <button type="button" className={smallBtnClass} onClick={() => onChange(null)}>
            {m.remove}
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </div>
  );
}

function parseDecimal(raw: string): number {
  const n = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function InvoiceForm() {
  const locale = useLocale();
  const t = useToolMessages("invoice");
  const defaults = t.defaults;
  const [invoice, setInvoice] = useState<Invoice>(() => defaultInvoice(defaults));
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // The supplier is saved only after a user edit, so language-specific defaults do not leak into the other language.
  const [supplierTouched, setSupplierTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load the saved supplier, logo and signature after mount (static prerender).
  useEffect(() => {
    const supplier = read<Supplier>(SUPPLIER_KEY);
    const lastNumber = read<string>(LAST_NUMBER_KEY);
    setInvoice((inv) => {
      const next = { ...inv };
      if (supplier) next.supplier = { ...defaultSupplier(defaults), ...supplier, party: { ...emptyParty(defaults), ...supplier.party } };
      if (lastNumber && /^\d+$/.test(lastNumber)) {
        const n = String(BigInt(lastNumber) + 1n);
        next.number = n;
        next.variableSymbol = n;
      }
      return next;
    });
    setLogo(read<string>(LOGO_KEY));
    setSignature(read<string>(SIGNATURE_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && supplierTouched) write(SUPPLIER_KEY, invoice.supplier);
  }, [hydrated, supplierTouched, invoice.supplier]);

  const totals = useMemo(
    () => computeTotals(invoice.items, invoice.supplier.vatPayer),
    [invoice.items, invoice.supplier.vatPayer],
  );

  const setField = <K extends keyof Invoice>(key: K, value: Invoice[K]) => setInvoice((inv) => ({ ...inv, [key]: value }));
  const setSupplier = (patch: Partial<Supplier>) => {
    setSupplierTouched(true);
    setInvoice((inv) => ({ ...inv, supplier: { ...inv.supplier, ...patch } }));
  };
  const setItem = (id: string, patch: Partial<InvoiceItem>) =>
    setInvoice((inv) => ({ ...inv, items: inv.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));

  const onAccountChange = (account: string) => {
    const iban = czAccountToIban(account);
    setSupplier({ account, ...(iban ? { iban, bic: bicForAccount(account) } : {}) });
  };

  const onNumberChange = (number: string) =>
    setInvoice((inv) => ({
      ...inv,
      number,
      // VS follows the invoice number until the user changes it manually
      variableSymbol: inv.variableSymbol === inv.number ? number.replace(/\D/g, "") : inv.variableSymbol,
    }));

  const download = async () => {
    const problems: InvoiceErrorCode[] = validateInvoice(invoice);
    setErrors(problems.map((code) => t.errors[code]));
    if (problems.length > 0) return;
    setBusy(true);
    try {
      // Heavy libraries load only here to keep the page light.
      const [{ pdf }, { default: QRCode }, { InvoicePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("qrcode"),
        import("./invoice-pdf"),
      ]);
      const iban = invoice.supplier.iban.trim() || czAccountToIban(invoice.supplier.account) || "";
      const qrDataUrl = iban
        ? await QRCode.toDataURL(
            buildSpayd({
              iban,
              cents: totals.payable,
              variableSymbol: invoice.variableSymbol,
              dueDate: invoice.dueDate,
              message: fmt(t.pdf.spaydMessage, { number: invoice.number }),
            }),
            { margin: 0, width: 400, errorCorrectionLevel: "M" },
          )
        : null;
      const blob = await pdf(
        <InvoicePdf locale={locale} messages={t.pdf} invoice={{ ...invoice, supplier: { ...invoice.supplier, iban } }} qrDataUrl={qrDataUrl} logo={logo} signature={signature} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fmt(t.pdf.fileName, { number: invoice.number.replace(/[^\w-]+/g, "_") });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      write(LAST_NUMBER_KEY, invoice.number.replace(/\D/g, "") === invoice.number ? invoice.number : null);
    } catch (err) {
      setErrors([fmt(t.errors.pdfFailed, { message: err instanceof Error ? err.message : String(err) })]);
    } finally {
      setBusy(false);
    }
  };

  const vatPayer = invoice.supplier.vatPayer;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.invoiceSection.title}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <TextField label={t.invoiceSection.number} value={invoice.number} onChange={onNumberChange} />
          <TextField
            label={t.invoiceSection.variableSymbol}
            value={invoice.variableSymbol}
            onChange={(v) => setField("variableSymbol", v.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
          />
          <TextField label={t.invoiceSection.issueDate} type="date" value={invoice.issueDate} onChange={(v) => setField("issueDate", v)} />
          <TextField label={t.invoiceSection.dueDate} type="date" value={invoice.dueDate} onChange={(v) => setField("dueDate", v)} />
          {vatPayer && (
            <TextField
              label={t.invoiceSection.taxDate}
              type="date"
              value={invoice.taxDate}
              onChange={(v) => setField("taxDate", v)}
            />
          )}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.supplier.title}</h2>
        <PartyFields party={invoice.supplier.party} onChange={(party) => setSupplier({ party })} />
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-body">
          <input
            type="checkbox"
            checked={vatPayer}
            onChange={(e) => setSupplier({ vatPayer: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          {t.supplier.vatPayer}
        </label>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.customer.title}</h2>
        <PartyFields party={invoice.customer} onChange={(customer) => setField("customer", customer)} />
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.payment.title}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <TextField
            label={t.payment.account}
            value={invoice.supplier.account}
            onChange={onAccountChange}
            className="sm:col-span-2"
          />
          <TextField label={t.payment.iban} value={invoice.supplier.iban} onChange={(iban) => setSupplier({ iban })} className="sm:col-span-3" />
          <TextField label={t.payment.bic} value={invoice.supplier.bic} onChange={(bic) => setSupplier({ bic })} className="sm:col-span-1" />
          <TextField
            label={t.payment.method}
            value={invoice.supplier.paymentMethod}
            onChange={(paymentMethod) => setSupplier({ paymentMethod })}
            className="sm:col-span-2"
          />
          <TextField
            label={t.payment.footer}
            value={invoice.supplier.footer}
            onChange={(footer) => setSupplier({ footer })}
            className="sm:col-span-4"
          />
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.items.title}</h2>
        <div className="flex flex-col gap-4">
          {invoice.items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-12">
              <TextField
                label={fmt(t.items.description, { n: idx + 1 })}
                value={it.description}
                onChange={(description) => setItem(it.id, { description })}
                className="col-span-2 sm:col-span-12"
              />
              <TextField
                label={t.items.quantity}
                value={String(it.quantity)}
                inputMode="decimal"
                onChange={(v) => setItem(it.id, { quantity: parseDecimal(v) })}
                className="sm:col-span-2"
              />
              <TextField label={t.items.unit} value={it.unit} onChange={(unit) => setItem(it.id, { unit })} className="sm:col-span-2" placeholder={t.items.unitPlaceholder} />
              <TextField
                label={vatPayer ? t.items.unitPriceNet : t.items.unitPrice}
                value={String(it.unitPrice)}
                inputMode="decimal"
                onChange={(v) => setItem(it.id, { unitPrice: parseDecimal(v) })}
                className="col-span-2 sm:col-span-4"
              />
              {vatPayer && (
                <Field label={t.items.vat} className="sm:col-span-2">
                  <select
                    value={it.vatRate}
                    onChange={(e) => setItem(it.id, { vatRate: Number(e.target.value) as VatRate })}
                    className={inputClass}
                  >
                    {VAT_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r} %
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="col-span-2 flex items-end justify-between gap-2 sm:col-span-2">
                <span className="pb-2 text-sm font-semibold">{formatCzk(itemTotals(it, vatPayer).total, locale)}</span>
                {invoice.items.length > 1 && (
                  <button
                    type="button"
                    className={smallBtnClass}
                    onClick={() => setField("items", invoice.items.filter((x) => x.id !== it.id))}
                    aria-label={fmt(t.items.removeAria, { n: idx + 1 })}
                  >
                    {t.items.remove}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={cn(smallBtnClass, "mt-3")} onClick={() => setField("items", [...invoice.items, emptyItem()])}>
          {t.items.add}
        </button>
        <div className="mt-4 flex flex-col items-end gap-1 text-sm">
          {vatPayer && (
            <span className="text-muted-foreground">
              {fmt(t.items.summary, { base: formatCzk(totals.base, locale), vat: formatCzk(totals.vat, locale) })}
            </span>
          )}
          <span className="text-lg font-semibold">{fmt(t.items.payable, { amount: formatCzk(totals.payable, locale) })}</span>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold">{t.appearance.title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImagePicker
            label={t.appearance.logo}
            value={logo}
            onChange={(v) => {
              setLogo(v);
              write(LOGO_KEY, v);
            }}
          />
          <ImagePicker
            label={t.appearance.signature}
            value={signature}
            onChange={(v) => {
              setSignature(v);
              write(SIGNATURE_KEY, v);
            }}
          />
        </div>
      </section>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc rounded-xl border border-destructive/40 bg-destructive/10 p-4 pl-8 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className={cn(btnClass, "bg-primary text-primary-foreground hover:bg-primary-hover")}
        >
          {busy ? t.actions.busy : t.actions.download}
        </button>
        <button
          type="button"
          onClick={() =>
            setInvoice((inv) => ({ ...inv, customer: emptyParty(defaults), items: [emptyItem()] }))
          }
          className={cn(btnClass, "border border-border bg-card text-foreground hover:bg-muted")}
        >
          {t.actions.clear}
        </button>
      </div>
    </div>
  );
}

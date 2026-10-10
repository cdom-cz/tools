"use client";

import { useEffect, useMemo, useState } from "react";
import { NumberStepper } from "@/components/number-stepper";
import { fmt, plural } from "@/i18n/format";
import { useLocale, useToolMessages } from "@/i18n/provider";
import {
  clampConfig,
  COMPOUNDING,
  DEFAULT_CONFIG,
  effectiveRatePct,
  LIMITS,
  parseStoredConfig,
  simulate,
  summary,
  type CompoundConfig,
} from "@/lib/compound-interest";
import { cn } from "@/lib/utils";
import { CompoundChart } from "./compound-chart";

const STORAGE_KEY = "tools.slozene-uroceni.config.v1";

const cardClass = "rounded-2xl border border-border bg-card p-4";

/** Accepts "1 500", "1500,5", "1.500,5"-ish input; returns null if not a number. */
function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[\s ]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function CompoundCalculator() {
  const t = useToolMessages("compound");
  const locale = useLocale();
  const [config, setConfig] = useState<CompoundConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const stored = parseStoredConfig(localStorage.getItem(STORAGE_KEY));
      if (stored) setConfig(stored);
    } catch {}
  }, []);

  function update(patch: Partial<CompoundConfig>) {
    const next = clampConfig({ ...config, ...patch });
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const rows = useMemo(() => simulate(config), [config]);
  const result = summary(rows);
  const money = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const rate = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const formatMoney = (v: number) => money.format(v);
  const stepper = (label: string) => ({
    label,
    decreaseLabel: fmt(t.stepper.decrease, { label }),
    increaseLabel: fmt(t.stepper.increase, { label }),
  });
  const cur = t.currency;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <div role="tablist" aria-label={t.compoundingAria} className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
          {COMPOUNDING.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={config.compounding === mode}
              onClick={() => update({ compounding: mode })}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition touch-manipulation",
                config.compounding === mode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t[mode]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t.compoundingHint[config.compounding]}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberStepper
            {...stepper(`${t.principal} (${cur})`)}
            value={config.principal}
            onChange={(v) => update({ principal: v })}
            min={LIMITS.principal.min}
            max={LIMITS.principal.max}
            step={10_000}
            format={formatMoney}
            parse={parseNumber}
          />
          <NumberStepper
            {...stepper(`${t.monthlyDeposit} (${cur})`)}
            value={config.monthly}
            onChange={(v) => update({ monthly: v })}
            min={LIMITS.monthly.min}
            max={LIMITS.monthly.max}
            step={500}
            format={formatMoney}
            parse={parseNumber}
          />
          <NumberStepper
            {...stepper(`${t.rate} (%)`)}
            value={config.ratePct}
            onChange={(v) => update({ ratePct: v })}
            min={LIMITS.ratePct.min}
            max={LIMITS.ratePct.max}
            step={0.5}
            format={(v) => rate.format(v)}
            parse={parseNumber}
          />
          <NumberStepper
            {...stepper(t.years)}
            value={config.years}
            onChange={(v) => update({ years: v })}
            min={LIMITS.years.min}
            max={LIMITS.years.max}
            step={1}
            format={(v) => fmt(plural(locale, t.yearsUnit, v), { n: v })}
            parse={(raw) => parseNumber(raw.replace(/[^\d.,]/g, ""))}
          />
        </div>
      </section>

      <section className={cardClass}>
        <div className="text-sm text-muted-foreground">{t.finalValue}</div>
        <div className="font-display text-3xl font-semibold tabular-nums text-foreground">
          {money.format(result.balance)} {cur}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t.contributed}</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {money.format(result.contributed)} {cur}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.interest}</dt>
            <dd className="font-semibold tabular-nums text-primary">
              {money.format(result.interest)} {cur}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {fmt(t.effectiveRate, { n: rate.format(effectiveRatePct(config.ratePct, config.compounding)) })}
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold text-foreground">{t.chartTitle}</h2>
        <CompoundChart
          rows={rows}
          locale={locale}
          labels={{
            aria: t.chartAria,
            contributed: t.contributed,
            interest: t.interest,
            year: t.year,
            balance: t.balance,
            currency: cur,
          }}
        />
      </section>

      <details className={cardClass}>
        <summary className="cursor-pointer text-base font-semibold text-foreground">{t.table}</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-right text-sm tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-medium">{t.year}</th>
                <th className="py-1 font-medium">{t.contributed}</th>
                <th className="py-1 font-medium">{t.interest}</th>
                <th className="py-1 font-medium">{t.balance}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r) => (
                <tr key={r.year} className="border-t border-border">
                  <td className="py-1 text-left">{r.year}</td>
                  <td className="py-1">{money.format(r.contributed)}</td>
                  <td className="py-1">{money.format(r.interest)}</td>
                  <td className="py-1 font-semibold text-foreground">{money.format(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

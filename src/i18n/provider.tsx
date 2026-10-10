"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

/** Serializable part of the dictionary that the server passes to client components. */
export type ClientMessages = Pick<Dictionary, "common"> & Partial<Dictionary>;

type Ctx = { locale: Locale; messages: ClientMessages };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: ClientMessages;
  children: React.ReactNode;
}) {
  return <I18nContext value={{ locale, messages }}>{children}</I18nContext>;
}

function useCtx(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider is missing in the parent tree.");
  return ctx;
}

export function useLocale(): Locale {
  return useCtx().locale;
}

/** Texts shared across the site (header, switchers). */
export function useCommon(): Dictionary["common"] {
  return useCtx().messages.common;
}

/** Texts of a specific tool; `<ToolPage>` puts them into the provider. */
export function useToolMessages<K extends "timer" | "meditation" | "passwords" | "invoice">(
  tool: K,
): Dictionary[K] {
  const messages = useCtx().messages[tool];
  if (!messages) throw new Error(`Missing messages for tool "${tool}" in I18nProvider.`);
  return messages as Dictionary[K];
}

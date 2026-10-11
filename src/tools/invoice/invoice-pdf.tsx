import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  computeTotals,
  formatCzk,
  formatDate,
  formatNumber,
  invoicePalette,
  itemTotals,
  type Invoice,
  type InvoicePalette,
  type Party,
} from "@/lib/invoice";

// Fonts load from /public/fonts; Roboto covers Czech diacritics (default Helvetica does not).
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.woff", fontWeight: 400 },
    { src: "/fonts/Roboto-Medium.woff", fontWeight: 500 },
    { src: "/fonts/Roboto-Bold.woff", fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

// Colors are derived from the chosen primary color — the PDF must not depend on the page theme.
const MARGIN = 36;

function createStyles({ accent, accentText, onAccent, ink: INK, muted: MUTED, hairline: HAIRLINE, tint: TINT, rowAlt }: InvoicePalette) {
  const ACCENT = accent;
  return StyleSheet.create({
    page: { fontFamily: "Roboto", fontSize: 9, color: INK, paddingBottom: 56 },
    stripe: { height: 7, backgroundColor: ACCENT },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginHorizontal: MARGIN, marginTop: 28, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: INK },
    logo: { maxHeight: 40, maxWidth: 160, objectFit: "contain" },
    headerRight: { alignItems: "flex-end" },
    heading: { fontSize: 8, fontWeight: 500, color: accentText, letterSpacing: 2.5 },
    number: { fontSize: 22, fontWeight: 700, marginTop: 2 },
    parties: { flexDirection: "row", marginHorizontal: MARGIN, marginTop: 22, gap: 16 },
    party: { flex: 1, borderLeftWidth: 2.5, borderLeftColor: ACCENT, paddingLeft: 12, paddingVertical: 2 },
    partyCustomer: { borderLeftColor: INK },
    label: { fontSize: 7, fontWeight: 500, color: MUTED, letterSpacing: 1.2, marginBottom: 8 },
    partyName: { fontSize: 11.5, fontWeight: 700, marginBottom: 4 },
    line: { fontSize: 9, lineHeight: 1.5 },
    idRow: { flexDirection: "row", marginTop: 2 },
    idKey: { width: 34, color: MUTED },
    note: { marginTop: 10, fontSize: 8, lineHeight: 1.4, color: MUTED },
    vatNote: { marginTop: 10, fontSize: 7, color: MUTED },
    dates: { flexDirection: "row", marginHorizontal: MARGIN, marginTop: 22, borderTopWidth: 0.7, borderBottomWidth: 0.7, borderColor: HAIRLINE },
    dateCell: { flex: 1, paddingVertical: 9, paddingHorizontal: 10, borderRightWidth: 0.7, borderRightColor: HAIRLINE },
    dateCellLast: { borderRightWidth: 0 },
    dateKey: { fontSize: 7, color: MUTED, marginBottom: 3 },
    dateVal: { fontSize: 10, fontWeight: 500 },
    table: { marginTop: 22, marginHorizontal: MARGIN },
    thead: { flexDirection: "row", backgroundColor: INK, color: "#ffffff", fontSize: 8, fontWeight: 500, paddingVertical: 7 },
    trow: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
    trowAlt: { backgroundColor: rowAlt },
    cIdx: { width: 30, textAlign: "center" },
    cDesc: { flex: 1, paddingRight: 8 },
    cQty: { width: 58, textAlign: "right" },
    cPrice: { width: 80, textAlign: "right" },
    cVat: { width: 40, textAlign: "right" },
    cTotal: { width: 84, textAlign: "right", paddingRight: 8 },
    summaryWrap: { marginHorizontal: MARGIN, marginTop: 14, alignItems: "flex-end" },
    summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3, color: MUTED },
    summaryCell: { width: 80, textAlign: "right" },
    totalBar: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: ACCENT, color: onAccent, paddingVertical: 10, paddingHorizontal: 14, minWidth: 220 },
    totalLabel: { fontSize: 8, fontWeight: 500, letterSpacing: 1.2, marginRight: 24 },
    total: { fontSize: 15, fontWeight: 700 },
    roundNote: { color: MUTED, marginTop: 6 },
    pay: { marginHorizontal: MARGIN, marginTop: 26, backgroundColor: TINT, borderTopWidth: 2, borderTopColor: ACCENT, padding: 14, flexDirection: "row", alignItems: "center", gap: 16 },
    qr: { width: 96, height: 96, backgroundColor: "#ffffff", padding: 5 },
    payBody: { flex: 1 },
    payText: { fontSize: 9.5, lineHeight: 1.6, marginBottom: 10 },
    payStrong: { fontWeight: 700 },
    factGrid: { flexDirection: "row", gap: 18 },
    factCol: { flexDirection: "column" },
    factRow: { flexDirection: "row", fontSize: 7.5, marginBottom: 3 },
    factKey: { color: MUTED, width: 62, flexShrink: 0 },
    factVal: { color: INK },
    footer: { marginHorizontal: MARGIN, marginTop: 18, lineHeight: 1.5, fontSize: 8.5, color: MUTED },
    signature: { marginTop: 14, marginRight: 40, alignSelf: "flex-end", height: 80, maxWidth: 200, objectFit: "contain" },
    pageNo: { position: "absolute", bottom: 22, right: MARGIN, fontSize: 8, color: MUTED },
    rule: { position: "absolute", bottom: 44, left: MARGIN, right: MARGIN, borderTopWidth: 0.7, borderTopColor: HAIRLINE },
    bottomStripe: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: ACCENT },
  });
}

type PdfMessages = Dictionary["invoice"]["pdf"];

type Styles = ReturnType<typeof createStyles>;

function PartyBlock({ party, m, s }: { party: Party; m: PdfMessages; s: Styles }) {
  const cityLine = [party.zip && party.city ? `${party.city}, ${party.zip}` : party.city || party.zip]
    .filter(Boolean)
    .join("");
  return (
    <View>
      <Text style={s.partyName}>{party.name}</Text>
      {party.street ? <Text style={s.line}>{party.street}</Text> : null}
      {cityLine ? <Text style={s.line}>{cityLine}</Text> : null}
      {party.country ? <Text style={s.line}>{party.country}</Text> : null}
      {party.ico || party.dic ? <View style={{ marginTop: 10 }} /> : null}
      {party.ico ? (
        <View style={s.idRow}>
          <Text style={s.idKey}>{m.ico}</Text>
          <Text>{party.ico}</Text>
        </View>
      ) : null}
      {party.dic ? (
        <View style={s.idRow}>
          <Text style={s.idKey}>{m.dic}</Text>
          <Text>{party.dic}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Fact({ k, v, s }: { k: string; v: string; s: Styles }) {
  return (
    <View style={s.factRow}>
      <Text style={s.factKey}>{k}</Text>
      <Text style={s.factVal}>{v}</Text>
    </View>
  );
}

function DateCell({ k, v, last, s }: { k: string; v: string; last?: boolean; s: Styles }) {
  return (
    <View style={last ? [s.dateCell, s.dateCellLast] : s.dateCell}>
      <Text style={s.dateKey}>{k}</Text>
      <Text style={s.dateVal}>{v}</Text>
    </View>
  );
}

export function InvoicePdf({
  locale,
  messages: m,
  invoice,
  qrDataUrl,
  logo,
  signature,
  primaryColor,
}: {
  locale: Locale;
  messages: PdfMessages;
  invoice: Invoice;
  qrDataUrl: string | null;
  logo: string | null;
  signature: string | null;
  primaryColor: string;
}) {
  const palette = invoicePalette(primaryColor);
  const s = createStyles(palette);
  const { supplier } = invoice;
  const vatPayer = supplier.vatPayer;
  const totals = computeTotals(invoice.items, vatPayer);
  const items = invoice.items.filter((i) => i.description.trim());
  const money = (cents: number) => formatCzk(cents, locale);
  const date = (iso: string) => formatDate(iso, locale);
  const roundedNote = totals.rounding !== 0;

  return (
    <Document title={fmt(m.documentTitle, { number: invoice.number })} author={supplier.party.name} language={m.language}>
      <Page size="A4" style={s.page}>
        <View style={s.stripe} fixed />
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logo ? <Image src={logo} style={s.logo} /> : <View />}
          <View style={s.headerRight}>
            <Text style={s.heading}>{m.heading}</Text>
            <Text style={s.number}>{invoice.number}</Text>
          </View>
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>{m.supplier.toUpperCase()}</Text>
            <PartyBlock party={supplier.party} m={m} s={s} />
            {supplier.party.note ? <Text style={s.note}>{supplier.party.note}</Text> : null}
            <Text style={s.vatNote}>{vatPayer ? m.vatPayer : m.nonVatPayer}</Text>
          </View>
          <View style={[s.party, s.partyCustomer]}>
            <Text style={s.label}>{m.customer.toUpperCase()}</Text>
            <PartyBlock party={invoice.customer} m={m} s={s} />
            {invoice.customer.note ? <Text style={s.note}>{invoice.customer.note}</Text> : null}
          </View>
        </View>

        <View style={s.dates}>
          <DateCell s={s} k={m.issueDate} v={date(invoice.issueDate)} />
          {vatPayer ? <DateCell s={s} k={m.taxDate} v={date(invoice.taxDate)} /> : null}
          <DateCell s={s} k={m.dueDate} v={date(invoice.dueDate)} last />
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={s.cIdx} />
            <Text style={s.cDesc} />
            <Text style={s.cQty}>{m.colQuantity}</Text>
            <Text style={s.cPrice}>{m.colUnitPrice}</Text>
            {vatPayer ? <Text style={s.cVat}>{m.colVat}</Text> : null}
            <Text style={s.cTotal}>{m.colTotal}</Text>
          </View>
          {items.map((it, idx) => {
            const t = itemTotals(it, vatPayer);
            return (
              <View key={it.id} style={idx % 2 ? [s.trow, s.trowAlt] : s.trow} wrap={false}>
                <Text style={s.cIdx}>{idx + 1}</Text>
                <Text style={s.cDesc}>{it.description}</Text>
                <Text style={s.cQty}>
                  {formatNumber(it.quantity, locale)}
                  {it.unit ? ` ${it.unit}` : ""}
                </Text>
                <Text style={s.cPrice}>{money(Math.round(it.unitPrice * 100))}</Text>
                {vatPayer ? <Text style={s.cVat}>{it.vatRate} %</Text> : null}
                <Text style={s.cTotal}>{money(vatPayer ? t.base : t.total)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.summaryWrap} wrap={false}>
          {vatPayer ? (
            <View>
              <View style={s.summaryRow}>
                <Text style={s.summaryCell}>{m.sumRate}</Text>
                <Text style={s.summaryCell}>{m.sumBase}</Text>
                <Text style={s.summaryCell}>{m.sumVat}</Text>
                <Text style={s.summaryCell}>{m.sumTotal}</Text>
              </View>
              {totals.summary.map((r) => (
                <View key={r.rate} style={[s.summaryRow, { color: palette.ink }]}>
                  <Text style={s.summaryCell}>{r.rate} %</Text>
                  <Text style={s.summaryCell}>{money(r.base)}</Text>
                  <Text style={s.summaryCell}>{money(r.vat)}</Text>
                  <Text style={s.summaryCell}>{money(r.total)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {roundedNote ? <Text style={s.roundNote}>{fmt(m.rounding, { amount: money(totals.rounding) })}</Text> : null}
          <View style={s.totalBar}>
            <Text style={s.totalLabel}>{m.payable.toUpperCase()}</Text>
            <Text style={s.total}>{money(totals.payable)}</Text>
          </View>
        </View>

        <View style={s.pay} wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
          <View style={s.payBody}>
            <Text style={s.payText}>
              {m.payPre} <Text style={s.payStrong}>{money(totals.payable)}</Text> {m.payAccount}{" "}
              <Text style={s.payStrong}>{supplier.account || supplier.iban}</Text> {m.payVs}{" "}
              <Text style={s.payStrong}>{invoice.variableSymbol}</Text> {m.payDue}{" "}
              <Text style={s.payStrong}>{date(invoice.dueDate)}</Text>.
            </Text>
            <View style={s.factGrid}>
              <View style={[s.factCol, { width: 175 }]}>
                {supplier.account ? <Fact s={s} k={m.account} v={supplier.account} /> : null}
                {supplier.iban ? <Fact s={s} k={m.iban} v={supplier.iban} /> : null}
                {supplier.bic ? <Fact s={s} k={m.bic} v={supplier.bic} /> : null}
              </View>
              <View style={s.factCol}>
                <Fact s={s} k={m.variableSymbol} v={invoice.variableSymbol} />
                {supplier.paymentMethod ? <Fact s={s} k={m.paymentMethod} v={supplier.paymentMethod} /> : null}
                <Fact s={s} k={m.payable} v={money(totals.payable)} />
              </View>
            </View>
          </View>
        </View>

        {supplier.footer ? <Text style={s.footer}>{supplier.footer}</Text> : null}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {signature ? <Image src={signature} style={s.signature} /> : null}

        <View style={s.rule} fixed />
        <Text
          style={s.pageNo}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
        />
        <View style={s.bottomStripe} fixed />
      </Page>
    </Document>
  );
}

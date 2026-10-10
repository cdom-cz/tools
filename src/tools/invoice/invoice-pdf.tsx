import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  computeTotals,
  formatCzk,
  formatDate,
  formatNumber,
  itemTotals,
  type Invoice,
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

// Hard-coded colors — the PDF must not depend on the page theme.
const PEACH = "#ffc4ae";
const PEACH_TEXT = "#7a3a1f";
const GRAY_BG = "#efefef";
const MUTED = "#6b6b6b";
const TEXT = "#111111";

const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 9, color: TEXT, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: "24 24 0 24", height: 94 },
  logo: { maxHeight: 40, maxWidth: 160, objectFit: "contain" },
  title: { fontSize: 15, fontWeight: 700, marginTop: 22 },
  titleNo: { color: "#808080" },
  parties: { flexDirection: "row" },
  partyLeft: { width: "50%", padding: "28 24 24 24" },
  partyRight: { width: "50%", padding: "28 24 24 24", backgroundColor: GRAY_BG },
  label: { fontSize: 7, color: MUTED, marginBottom: 10 },
  partyName: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  line: { fontSize: 9, lineHeight: 1.5 },
  idRow: { flexDirection: "row", marginTop: 2 },
  idKey: { width: 44, color: MUTED },
  note: { marginTop: 12, fontSize: 9, lineHeight: 1.3 },
  vatNote: { marginTop: 24, fontSize: 7, color: MUTED },
  payBar: { backgroundColor: PEACH, padding: "22 24", flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 108 },
  payText: { color: PEACH_TEXT, fontSize: 11, lineHeight: 1.6, flex: 1, paddingRight: 130 },
  payStrong: { color: TEXT, fontWeight: 700 },
  qr: { position: "absolute", right: 24, top: -22, width: 112, height: 112, backgroundColor: "#ffffff", padding: 8 },
  facts: { backgroundColor: GRAY_BG, padding: "16 24", flexDirection: "row", gap: 24 },
  factCol: { flexDirection: "column" },
  factRow: { flexDirection: "row", fontSize: 7, marginBottom: 3 },
  factKey: { color: MUTED, width: 64, flexShrink: 0 },
  factVal: { color: TEXT },
  table: { marginTop: 26, marginHorizontal: 24 },
  thead: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: "#bbbbbb", paddingBottom: 6, color: MUTED },
  trow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 0.7, borderBottomColor: "#bbbbbb" },
  cIdx: { width: 36, textAlign: "center" },
  cDesc: { flex: 1 },
  cQty: { width: 54, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cVat: { width: 40, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
  totalWrap: { alignItems: "flex-end", marginTop: 0 },
  totalBox: { borderTopWidth: 1.2, borderTopColor: TEXT, marginTop: -0.7, paddingTop: 6, minWidth: 110, alignItems: "flex-end" },
  total: { fontSize: 14, fontWeight: 700 },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3, color: MUTED },
  summaryCell: { width: 80, textAlign: "right" },
  footer: { marginHorizontal: 24, marginTop: 16, lineHeight: 1.5 },
  signature: { marginTop: 20, marginRight: 40, alignSelf: "flex-end", height: 80, maxWidth: 200, objectFit: "contain" },
  pageNo: { position: "absolute", bottom: 20, right: 24, fontSize: 8, color: MUTED },
  rule: { position: "absolute", bottom: 42, left: 24, right: 24, borderTopWidth: 0.7, borderTopColor: "#cccccc" },
});

type PdfMessages = Dictionary["invoice"]["pdf"];

function PartyBlock({ party, m }: { party: Party; m: PdfMessages }) {
  const cityLine = [party.zip && party.city ? `${party.city}, ${party.zip}` : party.city || party.zip]
    .filter(Boolean)
    .join("");
  return (
    <View>
      <Text style={s.partyName}>{party.name}</Text>
      {party.street ? <Text style={s.line}>{party.street}</Text> : null}
      {cityLine ? <Text style={s.line}>{cityLine}</Text> : null}
      {party.country ? <Text style={s.line}>{party.country}</Text> : null}
      {party.ico || party.dic ? <View style={{ marginTop: 14 }} /> : null}
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

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.factRow}>
      <Text style={s.factKey}>{k}</Text>
      <Text style={s.factVal}>{v}</Text>
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
}: {
  locale: Locale;
  messages: PdfMessages;
  invoice: Invoice;
  qrDataUrl: string | null;
  logo: string | null;
  signature: string | null;
}) {
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
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logo ? <Image src={logo} style={s.logo} /> : <View />}
          <Text style={s.title}>
            {m.heading} <Text style={s.titleNo}>{invoice.number}</Text>
          </Text>
        </View>

        <View style={s.parties}>
          <View style={s.partyLeft}>
            <Text style={s.label}>{m.supplier}</Text>
            <PartyBlock party={supplier.party} m={m} />
            {supplier.party.note ? <Text style={s.note}>{supplier.party.note}</Text> : null}
            <Text style={s.vatNote}>{vatPayer ? m.vatPayer : m.nonVatPayer}</Text>
          </View>
          <View style={s.partyRight}>
            <Text style={s.label}>{m.customer}</Text>
            <PartyBlock party={invoice.customer} m={m} />
            {invoice.customer.note ? <Text style={s.note}>{invoice.customer.note}</Text> : null}
          </View>
        </View>

        <View style={s.payBar}>
          <Text style={s.payText}>
            {m.payPre} <Text style={s.payStrong}>{money(totals.payable)}</Text> {m.payAccount}{" "}
            <Text style={s.payStrong}>{supplier.account || supplier.iban}</Text> {m.payVs}{" "}
            <Text style={s.payStrong}>{invoice.variableSymbol}</Text> {m.payDue}{" "}
            <Text style={s.payStrong}>{date(invoice.dueDate)}</Text>.
          </Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {qrDataUrl ? <Image src={qrDataUrl} style={s.qr} /> : null}
        </View>

        <View style={s.facts}>
          <View style={[s.factCol, { width: 150 }]}>
            <Fact k={m.issueDate} v={date(invoice.issueDate)} />
            {vatPayer ? <Fact k={m.taxDate} v={date(invoice.taxDate)} /> : null}
            <Fact k={m.dueDate} v={date(invoice.dueDate)} />
          </View>
          <View style={[s.factCol, { width: 190 }]}>
            {supplier.account ? <Fact k={m.account} v={supplier.account} /> : null}
            {supplier.iban ? <Fact k={m.iban} v={supplier.iban} /> : null}
            {supplier.bic ? <Fact k={m.bic} v={supplier.bic} /> : null}
          </View>
          <View style={s.factCol}>
            <Fact k={m.variableSymbol} v={invoice.variableSymbol} />
            {supplier.paymentMethod ? <Fact k={m.paymentMethod} v={supplier.paymentMethod} /> : null}
            <Fact k={m.payable} v={money(totals.payable)} />
          </View>
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
              <View key={it.id} style={s.trow} wrap={false}>
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

        {vatPayer ? (
          <View style={[s.table, { marginTop: 10 }]} wrap={false}>
            <View style={[s.summaryRow, { color: MUTED }]}>
              <Text style={s.summaryCell}>{m.sumRate}</Text>
              <Text style={s.summaryCell}>{m.sumBase}</Text>
              <Text style={s.summaryCell}>{m.sumVat}</Text>
              <Text style={s.summaryCell}>{m.sumTotal}</Text>
            </View>
            {totals.summary.map((r) => (
              <View key={r.rate} style={[s.summaryRow, { color: TEXT }]}>
                <Text style={s.summaryCell}>{r.rate} %</Text>
                <Text style={s.summaryCell}>{money(r.base)}</Text>
                <Text style={s.summaryCell}>{money(r.vat)}</Text>
                <Text style={s.summaryCell}>{money(r.total)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[s.totalWrap, { marginHorizontal: 24 }]} wrap={false}>
          {roundedNote ? (
            <Text style={{ color: MUTED, marginTop: 6 }}>
              {fmt(m.rounding, { amount: money(totals.rounding) })}
            </Text>
          ) : null}
          <View style={s.totalBox}>
            <Text style={s.total}>{money(totals.payable)}</Text>
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
      </Page>
    </Document>
  );
}

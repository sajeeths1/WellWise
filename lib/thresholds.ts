export interface Row {
  analyte: string;
  value: string;
  unit: string;
  qualifier: string;
  source: string;
}
const standards: Record<string, [number, string]> = {
  iron: [0.3, "EPA secondary standard"],
  manganese: [0.05, "EPA secondary standard"],
  chloride: [250, "EPA secondary standard"],
  lead: [0.015, "EPA action level"],
  "nitrate as n": [10, "EPA MCL"],
  "nitrate (as no3)": [10, "EPA MCL"],
};
export function compare(row: Row) {
  const key = row.analyte.trim().toLowerCase();
  const standard = standards[key];
  if (!standard)
    return "No matching reference. Confirm the analyte and reporting basis with the lab.";
  const factor = { "mg/l": 1, ppm: 1, "ug/l": 0.001, ppb: 0.001 }[
    row.unit.trim().toLowerCase().replace(/[µμ]/g, "u")
  ];
  if (!factor || !/^\d+(\.\d+)?$/.test(row.value.trim()))
    return "Confirm the numeric value and unit with the lab.";
  const asN = key === "nitrate (as no3)";
  const amount = Number(row.value) * factor * (asN ? 0.2259 : 1);
  const [limit, source] = standard;
  const reference =
    source +
    " · " +
    limit +
    " mg/L" +
    (key.startsWith("nitrate") ? " as N" : "");
  const conversion = asN
    ? " Converted result: " +
      row.qualifier +
      Number(amount.toPrecision(6)) +
      " mg/L as N."
    : "";
  let result = amount > limit ? "Above reference" : "At or below reference";
  if (row.qualifier === "<")
    result =
      amount <= limit
        ? "Below reporting limit"
        : "Reporting limit too high to compare";
  if (row.qualifier === ">")
    result =
      amount >= limit ? "Above reference" : "Lower bound alone is inconclusive";
  if (key === "lead" && row.qualifier !== "<")
    result += ". EPA’s health goal for lead is zero";
  return result + " · " + reference + "." + conversion;
}
export function parseRows(text: string): Row[] {
  return text.split(/\r?\n/).flatMap((source) => {
    const line = source.replace(/^Private well,/i, "").trim();
    const match =
      /^([a-z][a-z ()\d-]*?)(?:\s+|\s*\.{2,}\s*|,)([<>＝=]?)\s*(\d+(?:\.\d+)?)(?:\s+|,)([^\s,]+)$/i.exec(
        line,
      );
    return match
      ? [
          {
            analyte: match[1].trim(),
            qualifier: match[2] || "=",
            value: match[3],
            unit: match[4],
            source,
          },
        ]
      : [];
  });
}

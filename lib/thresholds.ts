export interface Row {
  analyte: string;
  value: string;
  unit: string;
  qualifier: string;
  source: string;
  uncertain?: boolean;
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
  const standard = Object.hasOwn(standards, key) ? standards[key] : undefined;
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
  let explanation = "";
  if (result === "Above reference" && source === "EPA secondary standard")
    explanation =
      " This is above an appearance or taste guideline. " +
      (key === "iron"
        ? "Iron can contribute to orange staining. A measured iron result alone cannot establish the cause of a color change."
        : "Ask your lab whether this finding could explain a change you noticed.");
  else if (result.startsWith("Above reference"))
    explanation =
      " This exceeds the public-water reference. Contact your county health department for advice about using this well water.";
  else if (result === "Below reporting limit")
    explanation =
      " The lab reported less than the printed value. The exact concentration is unknown.";
  else if (result.startsWith("At or below reference"))
    explanation =
      " This measurement falls within the comparison level for this item.";
  else
    explanation =
      " Ask the lab whether a more sensitive measurement is available.";
  return result + " · " + reference + "." + conversion + explanation;
}
export function parseRows(text: string): Row[] {
  return text.split(/\r?\n/).flatMap((source) => {
    const line = source
      .replace(/^Private well,/i, "")
      .replace(/\s*\|\s*/g, " ")
      .trim();
    const match =
      /^([a-z][a-z ()\d-]*?)(?:\s+|\s*\.{2,}\s*|,)([<>=]?)\s*(\d+(?:\.\d+)?)(?:\s+|,)([^\s,]+)$/i.exec(
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

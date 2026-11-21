export interface Row {
  analyte: string;
  value: string;
  unit: string;
  qualifier: string;
  source: string;
  uncertain?: boolean;
  period?: string;
}
const standards: Record<string, [number, string]> = {
  fluoride: [4, "EPA MCL"],
  iron: [0.3, "EPA secondary standard"],
  manganese: [0.05, "EPA secondary standard"],
  chloride: [250, "EPA secondary standard"],
  lead: [0.015, "EPA action level"],
  "nitrate as n": [10, "EPA MCL"],
  "nitrate (as no3)": [10, "EPA MCL"],
};
export function compare(row: Row) {
  let key = row.analyte.trim().toLowerCase();
  let unit = row.unit.trim().toLowerCase().replace(/[µμ]/g, "u");
  if (key === "nitrate" && /^(mg|ug)\/l as n$/.test(unit)) {
    key = "nitrate as n";
    unit = unit.replace(/ as n$/, "");
  }
  if (
    /^(total coliform bacteria|e\.? coli)$/i.test(key) &&
    /^(absent|present)$/i.test(row.value)
  ) {
    return row.value.toLowerCase() === "absent"
      ? "Reported absent in the tested samples. This result describes the sampled water and period only."
      : "Bacteria reported present. Contact the water provider or county health department for instructions.";
  }
  if (
    key === "ph" &&
    ["units", "su", "s.u.", "ph units"].includes(unit) &&
    row.qualifier === "=" &&
    /^\d+(?:\.\d+)?$/.test(row.value)
  ) {
    return (
      (Number(row.value) < 6.5 || Number(row.value) > 8.5
        ? "Outside"
        : "Within") +
      " the EPA secondary pH range of 6.5–8.5. pH describes how acidic or alkaline the water is."
    );
  }
  const descriptions: Record<string, string> = {
    temperature:
      "Temperature records how warm the water was at the sampling point.",
    "total hardness":
      "Hardness describes dissolved minerals and can help explain scale on fixtures.",
    "total alkalinity":
      "Alkalinity describes how well water resists changes in pH.",
    "specific conductivity":
      "Conductivity reflects how readily water carries electrical current and is influenced by dissolved ions.",
    "total trihalomethanes":
      "These are disinfection byproducts. Ask the utility for its location-specific compliance results and monitoring period.",
  };
  if (Object.hasOwn(descriptions, key))
    return (
      descriptions[key] +
      " This tool does not assign a use-safety rating from this measurement."
    );
  const standard = Object.hasOwn(standards, key) ? standards[key] : undefined;
  if (!standard)
    return "No matching reference. Confirm the analyte and reporting basis with the lab.";
  const factor = { "mg/l": 1, ppm: 1, "ug/l": 0.001, ppb: 0.001 }[unit];
  if (!factor || !/^\d+(\.\d+)?$/.test(row.value.trim()))
    return "Confirm the numeric value and unit with the lab.";
  const asN = key === "nitrate (as no3)";
  const amount = Number(row.value) * factor * (asN ? 0.2259 : 1);
  const [limit, source] =
    key === "fluoride" && row.qualifier === "=" && amount > 2 && amount <= 4
      ? ([2, "EPA secondary standard"] as const)
      : standard;
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
  else if (result.startsWith("Above reference") && key.startsWith("nitrate"))
    explanation =
      " If this represents your drinking supply, use water known to be low in nitrate for infants under six months and for their formula. Boiling does not remove nitrate. Contact your utility or county health department for follow-up.";
  else if (result.startsWith("Above reference"))
    explanation =
      " This exceeds the public-water reference. Contact your county health department or water provider for guidance on the reported result.";
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

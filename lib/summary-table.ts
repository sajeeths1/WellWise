import type { Line } from "tesseract.js";
import type { Row } from "./thresholds";

// Read the explicitly headed summary column. Empty months must never shift a result.
export function readAverageColumn(lines: Line[]): Row[] | undefined {
  const headerIndex = lines.findIndex(
    (line) =>
      /\baverage\b/i.test(line.text) &&
      /\bjan\b/i.test(line.text) &&
      /\bfeb\b/i.test(line.text),
  );
  if (headerIndex < 0) return;
  const headers = lines[headerIndex].words;
  const average = headers.find((word) => /^average$/i.test(word.text));
  const jan = headers.find((word) => /^jan$/i.test(word.text));
  const feb = headers.find((word) => /^feb$/i.test(word.text));
  if (!average || !jan || !feb) return [];
  const spacing = feb.bbox.x0 - jan.bbox.x0;
  if (spacing <= 0) return [];
  const rows: Row[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const center = (word: Line["words"][number]) =>
      (word.bbox.x0 + word.bbox.x1) / 2;
    const label = line.words.filter(
      (w) => center(w) < jan.bbox.x0 - spacing * 0.5,
    );
    const cells = line.words.filter(
      (w) =>
        center(w) >= average.bbox.x0 &&
        center(w) <= average.bbox.x1 + spacing * 0.5,
    );
    const measurement = cells
      .map((w) => w.text)
      .join("")
      .match(/^([<>=]?)(\d+(?:\.\d+)?|absent|present)$/i);
    if (!measurement || !label.length) continue;
    const heading = label.map((w) => w.text).join(" ");
    const [analyte, ...units] = heading.split(/,\s*/);
    if (!units.length && !/^(absent|present)$/i.test(measurement[2])) continue;
    rows.push({
      analyte,
      unit: units.join(", ").trim(),
      qualifier: measurement[1] || "=",
      value: measurement[2],
      source: heading + " · Average: " + cells.map((w) => w.text).join(" "),
      period: "Average",
      uncertain: true,
    });
  }
  return rows;
}

"use client";
import Image from "next/image";
import { useState } from "react";
import { useWell } from "../workspace";
import { compare, parseRows, type Row } from "@/lib/thresholds";
const samples = [
  ["metals", "Iron, manganese and lead"],
  ["nitrate-n", "Nitrate as nitrogen"],
  ["nitrate-no3", "Nitrate as NO₃"],
];
export default function Reports() {
  const { lastReport, setLastReport } = useWell();
  const [sample, setSample] = useState("metals");
  const [report, setReport] = useState(lastReport?.text ?? "");
  const [photo, setPhoto] = useState("");
  const [rows, setRows] = useState<Row[]>(lastReport?.rows ?? []);
  const [done, setDone] = useState(Boolean(lastReport));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  function reset(text: string) {
    setReport(text);
    setRows([]);
    setDone(false);
    setError("");
  }
  function read(text: string) {
    const parsed = parseRows(text);
    setRows(parsed);
    setDone(false);
    setError(
      parsed.length
        ? ""
        : "No numeric result lines found. Enter one line per item, such as Iron 0.84 mg/L.",
    );
  }
  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/samples/" + sample + ".txt");
      if (!response.ok) throw new Error();
      const text = await response.text();
      reset(text);
      read(text);
    } catch {
      setError("Couldn’t load the sample. Try again.");
    } finally {
      setLoading(false);
    }
  }
  function edit(index: number, field: keyof Row, value: string) {
    setDone(false);
    setRows(
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }
  return (
    <>
      <div className="heading">
        <h1>Lab reports</h1>
        <p>
          Check the printed evidence, confirm each reading, and compare it with
          a reference.
        </p>
      </div>
      <section id="samples" className="panel form">
        <h2>Review a report</h2>
        <label htmlFor="sample">Synthetic sample report</label>
        <div className="inline">
          <select
            id="sample"
            value={sample}
            disabled={loading}
            onChange={(e) => setSample(e.target.value)}
          >
            {samples.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <button className="button" disabled={loading} onClick={load}>
            {loading ? "Loading…" : "Load sample report"}
          </button>
        </div>
        <details>
          <summary>Use a report photo for manual entry</summary>
          <p>Choose a photo to read alongside your typed results.</p>
          <input
            aria-label="Report photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (photo) URL.revokeObjectURL(photo);
              setPhoto("");
              if (!file) return;
              if (
                !file.size ||
                file.size > 8 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              ) {
                setError("Choose a JPG, PNG or WebP image up to 8 MB.");
                return;
              }
              setError("");
              setPhoto(URL.createObjectURL(file));
            }}
          />
          {photo && (
            <Image
              unoptimized
              width={800}
              height={600}
              className="preview"
              src={photo}
              alt="Lab report for transcription"
            />
          )}
        </details>
        <label htmlFor="report">Report text</label>
        <textarea
          id="report"
          disabled={loading}
          rows={5}
          value={report}
          onChange={(e) => reset(e.target.value)}
          placeholder="Iron 0.84 mg/L"
        />
        <button
          className="secondary"
          disabled={loading || !report.trim()}
          onClick={() => read(report)}
        >
          Read result lines
        </button>
        <p role="status">{error}</p>
      </section>
      {rows.length > 0 && (
        <section className="panel form">
          <h2>Confirm the evidence</h2>
          <p>
            Only recognized numeric lines appear below. Check for missing items
            and compare every field with the original.
          </p>
          {rows.map((row, i) => (
            <div key={i} className="evidence">
              <code>{row.source}</code>
              <div className="fields">
                {(["analyte", "qualifier", "value", "unit"] as const).map(
                  (field) => (
                    <label key={field}>
                      {field}
                      {field === "qualifier" ? (
                        <select
                          value={row[field]}
                          onChange={(e) => edit(i, field, e.target.value)}
                        >
                          {["=", "<", ">"].map((q) => (
                            <option key={q}>{q}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={row[field]}
                          onChange={(e) => edit(i, field, e.target.value)}
                        />
                      )}
                    </label>
                  ),
                )}
              </div>
            </div>
          ))}
          <button
            className="button"
            onClick={() => {
              setDone(true);
              setLastReport({ text: report, rows });
            }}
          >
            Confirm and analyze
          </button>
        </section>
      )}
      {done && (
        <section className="panel form" aria-live="polite">
          <h2>Comparison results</h2>
          {rows.map((row, i) => (
            <div className="finding" key={i}>
              <h3>
                {row.analyte} · {row.qualifier}
                {row.value} {row.unit}
              </h3>
              <p>{compare(row)}</p>
            </div>
          ))}
          <a
            className="text-link"
            href="https://www.epa.gov/sdwa/drinking-water-regulations-and-contaminants"
          >
            EPA reference standards ↗
          </a>
        </section>
      )}
    </>
  );
}

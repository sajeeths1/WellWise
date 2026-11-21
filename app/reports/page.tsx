"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useWell } from "../workspace";
import { compare, parseRows, type Row } from "@/lib/thresholds";
import { readReportPhoto } from "@/lib/read-report-photo";
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
  const [progress, setProgress] = useState("");
  const scan = useRef<AbortController | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => () => scan.current?.abort(), []);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );

  async function scanPhoto(file?: Blob) {
    if (!file) return;
    const controller = new AbortController();
    scan.current?.abort();
    scan.current = controller;
    reset("");
    setPhoto("");
    setLastReport(null);
    if (
      !file.size ||
      file.size > 8 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG or WebP image up to 8 MB.");
      return;
    }
    setPhoto(URL.createObjectURL(file));
    setLoading(true);
    setProgress("Preparing the on-device reader…");
    try {
      const result = await readReportPhoto(
        file,
        setProgress,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setReport(result.text);
      const reportContext =
        /\b(water|well|potable|groundwater|drinking)\b/i.test(result.text);
      if (!reportContext || !result.rows.length) {
        setError(
          reportContext
            ? "No complete numeric result lines were readable. Retake the page straight on, in good light, with the analytes, numbers and units in frame."
            : "Couldn’t identify a water report. Include the water sample heading and the results table in the photo.",
        );
        return;
      }
      setRows(result.rows);
    } catch {
      if (!controller.signal.aborted)
        setError(
          "Couldn’t read that photo. Try a sharper JPG, PNG or WebP with the full results table visible.",
        );
    } finally {
      if (!controller.signal.aborted) {
        setProgress("");
        setLoading(false);
      }
    }
  }
  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void scanPhoto(file);
  }
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
      setPhoto("");
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
          Read a report straight from a picture, then check what each
          measurement means.
        </p>
      </div>
      <section className="panel form">
        <h2>Scan your lab report</h2>
        <p>
          Photograph one printed page with the water sample heading, results,
          and units in view. WellWise reads it on your device.
        </p>
        <div className="inline">
          <button
            className="button"
            disabled={loading}
            onClick={() => camera.current?.click()}
          >
            Take a photo
          </button>
          <button
            className="secondary"
            disabled={loading}
            onClick={() => upload.current?.click()}
          >
            Choose a report image
          </button>
        </div>
        <input
          hidden
          ref={camera}
          aria-label="Take a report photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={pick}
        />
        <input
          hidden
          ref={upload}
          aria-label="Upload report photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pick}
        />
        <small>JPG, PNG or WebP · Up to 8 MB</small>
        <button
          className="text-link sample-photo"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const response = await fetch("/samples/metals-report.png");
              if (!response.ok) throw new Error();
              await scanPhoto(await response.blob());
            } catch {
              setError("Couldn’t open the sample image. Try again.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Try a synthetic report photo →
        </button>
        <p role="status">{progress || error}</p>
        {photo && (
          <details open>
            <summary>Original report photo</summary>
            <a href={photo} target="_blank" rel="noreferrer">
              <Image
                unoptimized
                width={800}
                height={600}
                className="preview"
                src={photo}
                alt="Open the original report photo at full size"
              />
            </a>
          </details>
        )}
      </section>
      {rows.length > 0 && (
        <section className="panel form">
          <h2>Confirm the evidence</h2>
          <p>
            Only recognized numeric lines appear below. Check for missing items
            and compare every field with the original.
          </p>
          {rows.map((row, i) => (
            <div
              key={i}
              className="evidence"
              style={row.uncertain ? { background: "#fff5d9" } : undefined}
            >
              {row.uncertain && (
                <strong>Uncertain reading · please confirm</strong>
              )}
              <code>{row.source}</code>
              <button
                className="text-link"
                onClick={() => {
                  setRows(rows.filter((_, index) => index !== i));
                  setDone(false);
                }}
              >
                Exclude line
              </button>
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
      <section id="samples" className="panel form">
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
          <summary>
            {photo && report
              ? "View recognized text"
              : "Paste report text instead"}
          </summary>
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
        </details>
      </section>
    </>
  );
}

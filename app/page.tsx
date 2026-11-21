"use client";

import { useState } from "react";

const samples = [
  ["nitrate-n", "Nitrate as nitrogen"],
  ["metals", "Iron, manganese and lead"],
  ["nitrate-no3", "Nitrate as NO₃"],
];

export default function Home() {
  const [mode, setMode] = useState<"image" | "text">("image");
  const [report, setReport] = useState("");
  const [sample, setSample] = useState(samples[0][0]);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSample() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/samples/" + sample + ".txt");
      if (!response.ok) throw new Error();
      setReport(await response.text());
      setMode("text");
    } catch {
      setError("Couldn’t load the sample. Try again or paste report text.");
    } finally {
      setLoading(false);
    }
  }

  function selectImage(file?: File) {
    setImage(null);
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
    } else if (!file.size || file.size > 8 * 1024 * 1024) {
      setError("Choose a nonempty image of 8 MB or less.");
    } else {
      setImage(file);
    }
  }

  return (
    <main>
      <header><strong>WellWise</strong><span>North Carolina · Private wells</span></header>
      <h1>Read your well-water report</h1>
      <p className="intro">Start with a clear photo of your lab results, or paste the text from your report.</p>
      <section aria-label="Report intake">
        <div className="modes">{(["image", "text"] as const).map(option =>
          <button key={option} disabled={loading} aria-pressed={mode === option}
            onClick={() => {setMode(option); setError("");}}>
            {option === "image" ? "Report photo" : "Paste report text"}
          </button>
        )}</div>
        {mode === "image" ? <div className="field">
          <label htmlFor="photo">Choose a report photo</label>
          <small>JPG, PNG or WebP · Up to 8 MB</small>
          <input id="photo" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={event => {
              selectImage(event.target.files?.[0]);
              event.target.value = "";
            }}/>
          {image && <p role="status">Selected: {image.name}</p>}
        </div> : <div className="field">
          <label htmlFor="report">Lab report text</label>
          <textarea id="report" disabled={loading} rows={8} value={report}
            placeholder="Paste the analyte names, results and units here."
            onChange={event => setReport(event.target.value)}/>
        </div>}
        <div className="samples">
          <label htmlFor="sample">Try a synthetic report</label>
          <select id="sample" disabled={loading} value={sample} onChange={event => setSample(event.target.value)}>
            {samples.map(([slug, title]) => <option key={slug} value={slug}>{title}</option>)}
          </select>
          <button disabled={loading} onClick={loadSample}>{loading ? "Loading…" : "Load sample report"}</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <small>This preview keeps your input in the browser. Extraction and analysis are pending.</small>
      </section>
      <aside>Private wells are not regulated by EPA. Results are compared to EPA public drinking water standards as a reference. This is informational, not medical advice. Contact your county health department.</aside>
    </main>
  );
}

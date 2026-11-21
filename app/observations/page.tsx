"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";

import { useWell } from "../workspace";

function suggestColor(file: ImageBitmap) {
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "Color could not be sampled.";
  ctx.drawImage(
    file,
    file.width * 0.32,
    file.height * 0.32,
    file.width * 0.36,
    file.height * 0.36,
    0,
    0,
    size,
    size,
  );
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const colors = new Map<string, number>();
  let edges = 0,
    pairs = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = pixels.subarray(i, i + 4);
    if (a < 220) continue;
    let color = "neutral gray or white";
    if (Math.max(r, g, b) < 55) color = "dark";
    else if (r > g * 1.15 && g > b * 1.2) color = "orange or brown";
    else if (r > b * 1.22 && g > b * 1.2 && r >= g) color = "yellow";
    else if (g > r * 1.12 && g > b * 1.1) color = "green";
    else if (b > r * 1.2 && b >= g) color = "blue";
    colors.set(color, (colors.get(color) ?? 0) + 1);
    if ((i / 4) % size && pixels[i - 1] >= 220) {
      pairs++;
      if (
        Math.abs(r - pixels[i - 4]) +
          Math.abs(g - pixels[i - 3]) +
          Math.abs(b - pixels[i - 2]) >
        100
      )
        edges++;
    }
  }
  const dominant = [...colors].sort((a, b) => b[1] - a[1])[0];
  if (!dominant)
    return "The central area has too little visible detail to describe.";
  return (
    "The center of the photo appears " +
    dominant[0] +
    ". " +
    (edges > pairs * 0.1
      ? "It has a patchy pattern of light and dark areas. Reflections, the container or suspended material could produce this pattern."
      : "Color is fairly even across the sampled area. The image cannot resolve fine particles or dissolved substances.")
  );
}
export default function Observations() {
  const { observation, saveObservation } = useWell();
  const [description, setDescription] = useState(
    observation?.description ?? "",
  );
  const [change, setChange] = useState(observation?.change ?? "Unsure");
  const [preview, setPreview] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [visual, setVisual] = useState("");
  const [saved, setSaved] = useState(false);
  const [hazard, setHazard] = useState(false);
  const generation = useRef(0);
  async function select(file?: File) {
    if (!file) return;
    const id = ++generation.current;
    setFeedback("");
    setSaved(false);
    setHazard(false);
    setPreview("");
    setDescription("");
    setBusy(true);
    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !file.size ||
        file.size > 8 * 1024 * 1024
      )
        throw new Error("Choose a JPG, PNG or WebP photo up to 8 MB.");
      const bitmap = await createImageBitmap(file);
      try {
        if (generation.current !== id) return;
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        setPreview(canvas.toDataURL("image/jpeg"));
        const suggestion = suggestColor(bitmap);
        setVisual(suggestion);
        setDescription(suggestion);
        setFeedback(
          suggestion
            ? "Review the suggested color below. Lighting and the background can affect it."
            : "Describe what you see in the water. The photo has no distinct warm tint in the center.",
        );
      } finally {
        bitmap.close();
      }
    } catch (err) {
      if (id === generation.current)
        setFeedback(
          err instanceof Error && err.message.startsWith("Choose")
            ? err.message
            : "Couldn’t read the photo. Try another or describe the water below.",
        );
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <>
      <div className="heading">
        <h1>Water observation</h1>
        <p>
          Photograph the water for a visual description and guidance on everyday
          uses.
        </p>
      </div>
      <form
        className="panel form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim()) return;
          saveObservation({ description: description.trim(), change });
          setSaved(true);
        }}
      >
        <label htmlFor="photo">
          Photo of your water <small>Optional</small>
        </label>
        <p>Center the water in the frame. Photos stay in this tab.</p>
        <input
          type="file"
          id="photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void select(file);
          }}
        />
        {preview && (
          <Image
            unoptimized
            width={800}
            height={600}
            className="preview"
            src={preview}
            alt="Your water observation"
          />
        )}
        <p role="status">{busy ? "Reading photo…" : feedback}</p>
        {preview && (
          <section className="panel form" aria-label="Water photo assessment">
            <h2>Water photo assessment</h2>
            <p>{visual}</p>
            <p>
              Lighting and the container affect the image. A photo cannot
              identify microbes, metals, or chemicals.
            </p>
            <label>
              <input
                type="checkbox"
                checked={hazard}
                onChange={(e) => setHazard(e.target.checked)}
              />{" "}
              I suspect a fuel or chemical spill, or have a do-not-use advisory.
            </label>
            <div className="finding">
              <h3>Drinking and cooking</h3>
              <p>
                {hazard
                  ? "Use commercially bottled water for drinking, making ice, cooking and brushing teeth. Boiling cannot remove fuel or toxic chemicals."
                  : "Safety is undetermined from appearance. If the water has changed unexpectedly or contamination is suspected, use a known safe source for drinking and food preparation while you check with the utility or health department."}
              </p>
            </div>
            <div className="finding">
              <h3>Touching and bathing</h3>
              <p>
                {hazard
                  ? "Avoid contact, including bathing and washing hands in this water. Use an alternative water supply and follow local officials’ instructions."
                  : "Skin-contact safety depends on what is in the water. Check any local advisory for bathing and handwashing instructions. Avoid contact if you suspect a chemical spill."}
              </p>
            </div>
            <div className="finding">
              <h3>Handling the water</h3>
              <p>
                {hazard
                  ? "Keep children and pets away. Contact the utility or health department for instructions before handling or collecting a sample."
                  : "Keep the photo and note when and where you took it. Ask your lab for a collection bottle and instructions before collecting a test sample."}
              </p>
            </div>
            <a
              className="text-link"
              href="https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html"
            >
              CDC water-use guidance ↗
            </a>
          </section>
        )}
        <label htmlFor="description">What can you see?</label>
        <textarea
          id="description"
          required
          maxLength={500}
          value={description}
          placeholder="For example, the water looked orange this morning."
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
        />
        <label htmlFor="change">Is this a change from usual?</label>
        <select
          id="change"
          value={change}
          onChange={(e) => {
            setChange(e.target.value);
            setSaved(false);
          }}
        >
          <option>Unsure</option>
          <option>Yes</option>
          <option>No</option>
        </select>
        <p>
          A photo records appearance. A water test is needed to check for
          contaminants.
        </p>
        <button className="button" disabled={busy || !description.trim()}>
          Save observation
        </button>
        {saved && (
          <p role="status">
            Observation saved for this session.{" "}
            <Link className="text-link" href="/testing">
              Find testing near your well →
            </Link>
          </p>
        )}
      </form>
      <div className="demo">
        <div>
          <h3>Already have a lab report?</h3>
          <p>Photograph the printed page to read your measurements.</p>
        </div>
        <Link className="text-link" href="/reports">
          Scan a report →
        </Link>
      </div>
    </>
  );
}

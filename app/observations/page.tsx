"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";

import { useWell } from "../workspace";

type Point = { x: number; y: number };
const center = { x: 0.5, y: 0.5 };
function suggestColor(file: HTMLCanvasElement, point: Point) {
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "Color could not be sampled.";
  ctx.drawImage(
    file,
    file.width * (point.x - 0.05),
    file.height * (point.y - 0.05),
    file.width * 0.1,
    file.height * 0.1,
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
    "The selected area appears " +
    dominant[0] +
    ". " +
    (edges > pairs * 0.1
      ? "It has a patchy pattern of light and dark areas. Reflections, the container or suspended material could produce this pattern."
      : "The color looks fairly even in this small area.")
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
  const frame = useRef<HTMLCanvasElement | null>(null);
  const [spot, setSpot] = useState<Point>(center);
  const [example, setExample] = useState(false);
  function describe(canvas: HTMLCanvasElement, point: Point) {
    const bounded = {
      x: Math.max(0.05, Math.min(0.95, point.x)),
      y: Math.max(0.05, Math.min(0.95, point.y)),
    };
    setSpot(bounded);
    const text = suggestColor(canvas, bounded);
    setDescription(text);
    setVisual(text);
    setSaved(false);
  }
  async function select(input: File | "example" | undefined) {
    if (!input) return;
    const id = ++generation.current;
    setFeedback("");
    setSaved(false);
    setHazard(false);
    setPreview("");
    setDescription("");
    setBusy(true);
    setExample(false);
    frame.current = null;
    try {
      let file: Blob;
      if (input === "example") {
        const response = await fetch("/samples/brown-tap-water.jpg");
        if (!response.ok) throw new Error("Sample unavailable");
        file = await response.blob();
      } else {
        file = input;
      }
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
        frame.current = canvas;
        setExample(input === "example");
        describe(canvas, input === "example" ? { x: 0.42, y: 0.66 } : center);
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
        <div className="inline">
          <label className="button file-action">
            Take a water photo
            <input
              type="file"
              aria-label="Take a water photo"
              capture="environment"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void select(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label className="secondary file-action">
            Choose an image
            <input
              type="file"
              id="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void select(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => void select("example")}
          >
            Try a brown tap-water photo
          </button>
        </div>
        {preview && (
          <>
            <p>
              Tap the water to inspect its color. Use the arrow keys to move the
              marker.
            </p>
            <button
              type="button"
              className="water-frame"
              aria-label="Select the water area to inspect"
              onKeyDown={(e) => {
                const moves: Record<string, Point> = {
                  ArrowLeft: { x: -0.05, y: 0 },
                  ArrowRight: { x: 0.05, y: 0 },
                  ArrowUp: { x: 0, y: -0.05 },
                  ArrowDown: { x: 0, y: 0.05 },
                };
                const move = moves[e.key];
                if (move && frame.current) {
                  e.preventDefault();
                  describe(frame.current, {
                    x: spot.x + move.x,
                    y: spot.y + move.y,
                  });
                }
              }}
              onClick={(e) => {
                if (!frame.current || e.detail === 0) return;
                const bounds = e.currentTarget.getBoundingClientRect();
                describe(frame.current, {
                  x: (e.clientX - bounds.left) / bounds.width,
                  y: (e.clientY - bounds.top) / bounds.height,
                });
              }}
            >
              <Image
                unoptimized
                width={800}
                height={600}
                src={preview}
                alt={
                  example
                    ? "Brown water flowing from a tap and pooling near the drain."
                    : "Your water observation"
                }
              />
              <span
                aria-hidden="true"
                style={{ left: spot.x * 100 + "%", top: spot.y * 100 + "%" }}
              />
            </button>
            {example && (
              <small>
                Example photo by AVRS, CC0.{" "}
                <a
                  className="text-link"
                  href="https://commons.wikimedia.org/w/index.php?oldid=893362331"
                >
                  Original photograph ↗
                </a>
              </small>
            )}
          </>
        )}
        <p role="status">{busy ? "Reading photo…" : feedback}</p>
        {preview && (
          <section className="panel form" aria-label="Water photo assessment">
            <h2>Water photo assessment</h2>
            <h3>
              {hazard
                ? "Avoid using this water while you get local instructions"
                : "Drinking safety is unknown from this photo"}
            </h3>
            <p>{visual}</p>
            {visual.includes("orange or brown") && (
              <p>
                Rust or stirred-up sediment can give water this color. The
                picture cannot tell which is present. If this color is new, note
                when it started and whether it appears at other taps.
              </p>
            )}
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

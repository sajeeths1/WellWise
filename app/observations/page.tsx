"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWell } from "../workspace";

function suggestColor(file: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(
    file,
    file.width * 0.4,
    file.height * 0.4,
    file.width * 0.2,
    file.height * 0.2,
    0,
    0,
    1,
    1,
  );
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  if (a < 220) return "";
  if (r > g * 1.15 && g > b * 1.2)
    return "The center of the photo appears orange or brown.";
  if (r > b * 1.22 && g > b * 1.2 && r >= g)
    return "The center of the photo has a yellow tint.";
  return "";
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
  const router = useRouter();
  const generation = useRef(0);
  async function select(file?: File) {
    if (!file) return;
    const id = ++generation.current;
    setFeedback("");
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
        <p>Document a visible change before you contact your county.</p>
      </div>
      <form
        className="panel form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim()) return;
          saveObservation({ description: description.trim(), change });
          router.push("/testing");
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
          onChange={(e) => void select(e.target.files?.[0])}
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
        <label htmlFor="description">What can you see?</label>
        <textarea
          id="description"
          required
          maxLength={500}
          value={description}
          placeholder="For example, the water looked orange this morning."
          onChange={(e) => setDescription(e.target.value)}
        />
        <label htmlFor="change">Is this a change from usual?</label>
        <select
          id="change"
          value={change}
          onChange={(e) => setChange(e.target.value)}
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
          Save observation &amp; find testing →
        </button>
      </form>
    </>
  );
}

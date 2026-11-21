import { readAverageColumn } from "./summary-table";
import { parseRows, type Row } from "./thresholds";

export async function readReportPhoto(
  file: Blob,
  progress: (message: string) => void,
  signal: AbortSignal,
) {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  signal.throwIfAborted();
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/tesseract-core-lstm.wasm.js",
    langPath: "/ocr",
    workerBlobURL: false,
    logger: ({ status, progress: percent }) => {
      if (status === "recognizing text" && !signal.aborted)
        progress("Reading printed text · " + Math.round(percent * 100) + "%");
    },
    errorHandler: () => {}, // The rejected recognition promise is handled by the intake screen.
  });
  const stop = () => {
    void worker.terminate();
  };
  try {
    signal.throwIfAborted();
    signal.addEventListener("abort", stop, { once: true });
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(
      file,
      { rotateAuto: true },
      { blocks: true },
    );
    const lines = (data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((p) => p.lines),
    );
    const rows: Row[] =
      readAverageColumn(lines) ??
      lines.flatMap((line) =>
        parseRows(line.text.trim()).map((row) => ({
          ...row,
          uncertain:
            line.confidence < 85 ||
            line.words.some((word) => word.confidence < 80),
        })),
      );
    return { text: data.text, rows };
  } finally {
    signal.removeEventListener("abort", stop);
    if (!signal.aborted) await worker.terminate();
    else stop();
  }
}

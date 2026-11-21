# WellWise

A private well-water report reader for North Carolina homeowners, built for TRIANGULATE. This first checkpoint includes a mobile-friendly intake screen, client-side photo selection, editable pasted text and three synthetic reports. The samples load without an API key. Reports stay in browser memory during this preview.

## Run locally

Use Node.js 22 or 24 and npm.

~~~sh
git clone https://github.com/sajeeths1/Triangulate.git
cd Triangulate
npm ci
npm run dev
~~~

Open http://localhost:3000 and choose **Load sample report**. The sample should appear in the editable text box. Switch to **Report photo** to select a JPG, PNG or WebP up to 8 MB. To update an existing clean clone on main, run `git pull --ff-only`.

Run `npm run lint` and `npm run build` before pushing changes.

## Deployment

In Vercel, choose **Add New → Project**, import **sajeeths1/Triangulate**, select the **Next.js** preset, leave the root directory at the repository root, and deploy. This scaffold runs without credentials.

When the server routes are implemented, copy `.env.example` to `.env.local` for development. In Vercel **Project Settings → Environment Variables**, add `LLM_API_KEY` and `LLM_MODEL` for the desired environments and redeploy. Use a vision-capable model supported by the chosen provider. Keep the key server-side.

## Next implementation checkpoints

- Build a pure threshold engine and tests with an editable standards table. Verify reference limits and bacteria guidance against EPA sources before showing verdicts.
- Add Zod-validated extraction at POST /api/extract. A vision model copies printed values and literal source text. Blurry images, misread digits and incorrect units can change a result. Display evidence beside editable values, highlight uncertain rows and require confirmation before analysis.
- Compute each verdict in code after confirmation. Check units, qualifiers and whether nitrate was measured as nitrogen or as nitrate. Flag ambiguous results for follow-up.
- Add POST /api/explain for plain English and Spanish explanations of flagged items. Centralize model calls in lib/llm.ts. Process images in memory and avoid logging or storing report contents.
- Pilot with a county health department.

Built with Next.js App Router, TypeScript and Tailwind CSS. Only the sample reports are synthetic. This scaffold does not generate extraction results, explanations or water-quality verdicts.

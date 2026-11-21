# WellWise

A private well dashboard for North Carolina homeowners, built for TRIANGULATE. The dashboard connects water observations, local testing requests, and lab report review. Session details stay in browser memory and reset on refresh.

## Run locally

Use Node.js 22 or 24 and npm.

~~~sh
git clone https://github.com/sajeeths1/Triangulate.git
cd Triangulate
npm ci
npm run dev
~~~

Open http://localhost:3000. Record an observation or upload a photo up to 8 MB. A local color sampler checks the center of the image for a warm tint. Lighting, reflections and backgrounds can change the suggestion. Confirm the description before saving. A photo cannot determine whether water is safe to drink.

Choose the well’s county to find a testing contact and copy a request. Wake and Franklin have individual contacts from NC DHHS. Other counties use the state directory. The app does not request GPS.

Open Lab reports and take a photo, choose an image, or try the synthetic report photo. Tesseract reads printed English text in a local browser worker; the photo never leaves the device. The app copies the worker, WebAssembly core and language data from npm packages before dev and build. Compare each parsed line with its printed source, edit fields and click **Confirm and analyze**. Pasted numeric text uses the same parser. Low-confidence OCR lines are highlighted. Retake unclear pages with the report heading and result units visible. The photo reader does best with one analyte, result and unit per line. The prototype supports the analytes in the three sample files. Unrecognized line formats can be omitted, and unsupported units or analytes have no verdict. Comparisons in lib/thresholds.ts use printed qualifiers, unit conversions, nitrate basis and EPA reference values. They do not determine overall potability.

Run `npm run lint` and `npm run build` before pushing changes.

## Deployment

In Vercel, choose **Add New → Project**, import **sajeeths1/Triangulate**, select the **Next.js** preset, leave the root directory at the repository root, and deploy. This scaffold runs without credentials.

When the server routes are implemented, copy `.env.example` to `.env.local` for development. In Vercel **Project Settings → Environment Variables**, add `LLM_API_KEY` and `LLM_MODEL` for the desired environments and redeploy. Use a vision-capable model supported by the chosen provider. Keep the key server-side.

## Next steps

Pilot the handoff with a county health department. Expand the reference table and evaluate OCR on more lab layouts. The current demo requires no AI credentials.

Dashboard landscape photograph from Unsplash (photo-1470770841072-f978cf4d019e). It is illustrative.

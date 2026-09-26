# Getting Started — baby steps

> **Two ways to run — pick one:**
> - **For judging / uploading PDFs (recommended):** `npm run build` then `npm start`
>   and open **http://localhost:8080**. One server serves the page AND the API, so
>   everything works with no extra setup.
> - **For hot-reload UI dev:** `npm run dev` (port 5173). Demo mode works alone; for
>   *live uploads* also run `npm start` in a second terminal (the dev server forwards
>   `/api` to the backend on :8080).

Everything here is Google-only: the app calls **Google Gemini**, the key comes
from **Google AI Studio**, and it deploys to **Google Cloud Run**.

## Step 0 — Install Node.js (one time)
1. Go to https://nodejs.org and install the **LTS** version (20 or newer).
2. Open a terminal and check it worked:
   ```bash
   node -v
   npm -v
   ```
   You should see version numbers. If not, restart the terminal.

## Step 1 — Get the code
1. Unzip `disha.zip`.
2. In the terminal, go into the folder:
   ```bash
   cd disha
   ```

## Step 2 — Install the project (one time)
```bash
npm install
```
Wait for it to finish (about a minute).

## Step 3 — Run it in DEMO mode (no key needed)
```bash
npm run dev
```
Open the URL it prints (usually **http://localhost:5173**). Click a **“Demo:”**
button to see a full analysis. Press `Ctrl + C` in the terminal to stop.

## Step 4 — Run it in LIVE mode (real Gemini)
1. Get a free API key: https://aistudio.google.com/apikey → **Create API key** → copy it.
2. Make your env file:
   - macOS/Linux: `cp .env.example .env`
   - Windows:     `copy .env.example .env`
3. Open `.env` in any text editor and paste your key:
   ```
   GEMINI_API_KEY=paste-your-key-here
   GEMINI_MODEL=gemini-3.8-flash
   PORT=8080
   ```
4. Build and start:
   ```bash
   npm run build
   npm start
   ```
5. A sample PDF is included — on the page, click **“Download a sample Indian
   lease”**, then upload it. Or use your own legal PDF.
6. Open **http://localhost:8080**. Check the health line first:
   **http://localhost:8080/api/health** should show `"genai_configured": true`.
   Then upload a legal PDF and analyze it.

> If you ever get a "model not found" error, open Google AI Studio, see which
> models your key has, and change `GEMINI_MODEL` in `.env` to one of them.

## Step 5 — Verify everything (optional but recommended)
Run these one at a time; each should finish without errors:
```bash
npm run typecheck          # types are correct
npm run lint               # style is clean
npm test                   # 64 tests
npm run build              # production build
npm run evaluate:repository # PASS/FAIL self-audit, BLOCKERS: 0
```
With your key set, you can also prove the real Gemini path works:
```bash
npm run validate:live
```

## Step 6 — Deploy to Google Cloud Run (put it online)
1. Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Sign in and pick your project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Deploy (Mumbai region shown; `--source .` builds the included Dockerfile):
   ```bash
   gcloud run deploy disha \
     --source . \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=YOUR_KEY,GEMINI_MODEL=gemini-3.8-flash
   ```
4. It prints a public URL. Open `THAT_URL/api/health` — it should show
   `"genai_configured": true`. That URL is your submission's live link.

## If something goes wrong
- Delete `node_modules` and run `npm install` again.
- Make sure you are inside the `disha` folder (`cd disha`).
- In live mode, the key must be in `.env` (Step 4) or the health check shows demo.

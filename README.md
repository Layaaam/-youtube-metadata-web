# YouTube Metadata Fetcher

A minimal Next.js app: paste a YouTube URL, hit **Fetch**, and see the
video's title, duration, view count, and upload date — backed by a real
Python microservice running yt-dlp.

## Architecture

```
Browser  →  Next.js (app/page.tsx)
              ↓ POST /api/video-info
         Next.js API route (app/api/video-info/route.ts)
              ↓ POST http://localhost:5001/metadata
         Flask microservice (service/app.py)
              ↓
           yt-dlp  →  YouTube
```

The Python logic runs as its **own small Flask service**, separate from the
Next.js server. The API route just forwards the request over HTTP and relays
the response. This keeps Python/yt-dlp fully decoupled from Node — useful
because platforms like Vercel don't run a Python runtime alongside Node
functions, and it lets the two services scale or deploy independently.

## Running it locally

You need **two terminals** — one for each service.

### Terminal 1 — Python microservice

```bash
cd service
pip install -r requirements.txt
python app.py
```

This starts the Flask service on `http://localhost:5001`. Check it's alive:

```bash
curl http://localhost:5001/health
```

### Terminal 2 — Next.js app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, paste a YouTube URL, and click **Fetch**.

## Configuration

The Next.js route reads the microservice URL from an environment variable:

```
PYTHON_SERVICE_URL=http://localhost:5001
```

Create a `.env.local` file with this line if you want to point it somewhere
other than the default (e.g. a deployed microservice URL in production).
If unset, it defaults to `http://localhost:5001`.

## Project structure

```
youtube-metadata-web/
├── app/
│   ├── api/video-info/route.ts   # Calls the Flask microservice
│   ├── layout.tsx
│   ├── page.tsx                  # Input + Fetch button + results UI
│   └── globals.css
├── service/
│   ├── app.py                    # Flask microservice wrapping yt-dlp
│   └── requirements.txt
├── scripts/
│   └── youtube_metadata.py       # Original standalone CLI script (Part 1)
├── examples/
│   └── ...                       # Sample output from the CLI script — see examples/README.md
├── package.json
├── tailwind.config.ts
└── ...
```

## Deploying (free tier: Vercel + Render)

**Backend — Render (Web Service)**

1. Push this repo to GitHub.
2. On Render: New → Web Service → connect the repo.
3. Root directory: `service`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Deploy, then copy the resulting URL (e.g. `https://your-app.onrender.com`).
   Confirm it's alive: `curl https://your-app.onrender.com/health`

Note: Render's free tier spins the service down after 15 minutes of
inactivity; the next request takes 30–60 seconds to wake it back up.

**Frontend — Vercel**

1. On Vercel: New Project → import the same repo.
2. Root directory: leave as the repo root (where `app/` lives).
3. Add an environment variable: `PYTHON_SERVICE_URL` = your Render URL from
   above (no trailing slash).
4. Deploy.

That's it — the API route already reads `PYTHON_SERVICE_URL` from the
environment, so no code changes are needed between local dev and
production.

Consider putting the microservice behind auth or an allowlist if it's
publicly reachable, since anyone who can hit it can trigger a yt-dlp
fetch through it.

## Tech

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Flask + yt-dlp (Python microservice)

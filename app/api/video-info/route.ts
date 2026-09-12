import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// MICROSERVICE IMPLEMENTATION
// ---------------------------------------------------------------------------
// This route calls a separate Python microservice (see /service/app.py),
// which wraps yt-dlp and exposes it over HTTP. That keeps the Python
// runtime and its dependencies (yt-dlp) fully decoupled from the Next.js
// server — useful for deploying on platforms like Vercel that don't run
// Python alongside Node, and it lets the two services scale independently.
//
// The microservice URL is read from an environment variable so it can point
// to localhost in development and to a deployed service URL in production.
// ---------------------------------------------------------------------------

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:5001";

function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
    url
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = body?.url as string | undefined;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing 'url' in request body." },
      { status: 400 }
    );
  }

  if (!isValidYouTubeUrl(url)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid YouTube URL." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${PYTHON_SERVICE_URL}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      // Avoid Next.js caching a POST that hits a live external service.
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "The metadata service returned an error." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    // Most common cause: the Python microservice isn't running.
    return NextResponse.json(
      {
        error:
          "Could not reach the metadata service. Is it running at " +
          PYTHON_SERVICE_URL +
          "? (see service/app.py)",
      },
      { status: 502 }
    );
  }
}

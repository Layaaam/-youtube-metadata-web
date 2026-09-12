import { NextRequest, NextResponse } from "next/server";

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

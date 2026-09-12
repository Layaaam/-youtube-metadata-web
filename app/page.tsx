"use client";

import { useState } from "react";

type VideoMetadata = {
  title: string;
  duration_seconds: number;
  view_count: number;
  upload_date: string;
  url: string;
  video_id: string;
  channel: string;
  thumbnail?: string;
};

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return new Intl.NumberFormat("en-US").format(views);
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VideoMetadata | null>(null);

  async function handleFetch() {
    if (!url.trim()) {
      setError("Enter a YouTube URL first.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Something went wrong.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleFetch();
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-ink">
          Know the video
          <br />
          before you open it.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Paste a YouTube link and get the essentials from duration, views,
          to upload date, pulled straight from the source.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:rounded-full sm:border sm:border-line sm:bg-panel/60 sm:p-1.5">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-full border border-line bg-white px-5 py-3 text-[15px] text-ink placeholder:text-muted/70 outline-none focus:border-accent sm:border-0 sm:bg-transparent sm:focus:ring-0"
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Fetching…" : "Fetch"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-accent-dark animate-rise-in">
            {error}
          </p>
        )}

        {data && (
          <div className="mt-14 animate-rise-in">
            <div className="flex flex-col sm:flex-row gap-6">
              {data.thumbnail && (
                <div className="w-full sm:w-56 shrink-0 overflow-hidden rounded-2xl bg-panel">
                  <img
                    src={data.thumbnail}
                    alt={data.title}
                    className="h-full w-full object-cover aspect-video"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-2xl leading-snug text-ink">
                  {data.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{data.channel}</p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
              <div>
                <div className="text-2xl font-serif text-ink">
                  {formatDuration(data.duration_seconds)}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                  Duration
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-ink">
                  {formatViews(data.view_count)}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                  Views
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif text-ink">
                  {data.upload_date}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                  Uploaded
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

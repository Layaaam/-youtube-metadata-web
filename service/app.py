"""
service/app.py

A tiny Flask microservice that wraps yt-dlp and exposes it over HTTP.
This is the "real" backend for the Next.js app: the API route at
app/api/video-info/route.ts calls this service instead of shelling out
to a Python subprocess directly.

Run it with:
    pip install -r requirements.txt
    python app.py

It listens on http://localhost:5001 by default (override with PORT env var).
"""

import os
from datetime import datetime

from flask import Flask, jsonify, request
import yt_dlp

app = Flask(__name__)


def get_video_metadata(url: str) -> dict:
    """Extract basic metadata for a YouTube video using yt-dlp."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    upload_date_raw = info.get("upload_date")
    upload_date_formatted = None
    if upload_date_raw:
        try:
            upload_date_formatted = datetime.strptime(
                upload_date_raw, "%Y%m%d"
            ).strftime("%Y-%m-%d")
        except ValueError:
            upload_date_formatted = upload_date_raw

    return {
        "title": info.get("title"),
        "duration_seconds": info.get("duration"),
        "view_count": info.get("view_count"),
        "upload_date": upload_date_formatted,
        "url": url,
        "video_id": info.get("id"),
        "channel": info.get("uploader") or info.get("channel"),
        "thumbnail": info.get("thumbnail"),
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/metadata", methods=["POST"])
def metadata():
    body = request.get_json(silent=True) or {}
    url = body.get("url")

    if not url:
        return jsonify({"error": "Missing 'url' in request body."}), 400

    try:
        data = get_video_metadata(url)
        return jsonify(data)
    except yt_dlp.utils.DownloadError as e:
        return jsonify({"error": f"Could not fetch video info: {e}"}), 502
    except Exception as e: 
        return jsonify({"error": f"Unexpected error: {e}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)

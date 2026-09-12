"""

Fetches basic metadata for a YouTube video using yt-dlp and outputs it as
clean JSON. Optionally saves the JSON to a local file.

Requirements:
    pip install yt-dlp

Usage:
    python youtube_metadata.py "https://www.youtube.com/watch?v=zw47_q9wbBE"
    python youtube_metadata.py "https://www.youtube.com/watch?v=zw47_q9wbBE" --save
    python youtube_metadata.py "https://www.youtube.com/watch?v=zw47_q9wbBE" --save --output my_video.json
"""

import argparse
import json
import sys
from datetime import datetime

try:
    import yt_dlp
except ImportError:
    print(
        "Error: yt-dlp is not installed. Install it with:\n"
        "    pip install yt-dlp",
        file=sys.stderr,
    )
    sys.exit(1)


def get_video_metadata(url: str) -> dict:
    """
    Extract basic metadata for a YouTube video using yt-dlp.

    Args:
        url: The YouTube video URL.

    Returns:
        A dictionary containing title, duration, view count, and upload date.
    """
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

    metadata = {
        "title": info.get("title"),
        "duration_seconds": info.get("duration"),
        "view_count": info.get("view_count"),
        "upload_date": upload_date_formatted,
        "url": url,
        "video_id": info.get("id"),
        "channel": info.get("uploader") or info.get("channel"),
    }

    return metadata


def main():
    parser = argparse.ArgumentParser(
        description="Fetch basic YouTube video metadata as JSON using yt-dlp."
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save the JSON output to a local file instead of just printing it.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output file path (used with --save). Defaults to '<video_id>_metadata.json'.",
    )

    args = parser.parse_args()

    try:
        metadata = get_video_metadata(args.url)
    except yt_dlp.utils.DownloadError as e:
        print(f"Error: could not fetch video info -> {e}", file=sys.stderr)
        sys.exit(1)

    json_output = json.dumps(metadata, indent=2, ensure_ascii=False)

    print(json_output)

    if args.save:
        output_path = args.output or f"{metadata.get('video_id') or 'video'}_metadata.json"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"\nSaved metadata to: {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
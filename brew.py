#!/usr/bin/env python3
"""
brew.py — Brew session logger for Doug & George's Tea Party.

Local:   python brew.py  (writes to brew-log/brews.csv)
Railway: set GITHUB_TOKEN env var; sessions commit back to the repo.
"""

import base64
import csv
import io
import json
import os
import socket
import threading
import urllib.request
import webbrowser
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
TEAS_CSV = os.path.join(REPO_ROOT, "inventory", "teas.csv")
BREWS_CSV = os.path.join(REPO_ROOT, "brew-log", "brews.csv")
PORT = int(os.environ.get("PORT", 7890))
ON_RAILWAY = "PORT" in os.environ

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = "georgelgore/tea-party"
BREWS_API_PATH = "brew-log/brews.csv"

VESSELS = [
    ("Hario ChaCha Kyusu Maru", "Hario ChaCha Kyusu Maru (450ml western)"),
    ("100ml gaiwan", "100ml gaiwan (gong fu)"),
]


def load_tea_names():
    with open(TEAS_CSV, newline="", encoding="utf-8") as f:
        return [row["name"].strip() for row in csv.DictReader(f)]


def _build_row(fields):
    return [
        fields.get("date", str(date.today())),
        fields["tea_name"],
        fields["vessel"],
        fields["leaf_g"],
        fields["water_ml"],
        fields["temp_c"],
        fields["steep_time_seconds"],
        fields["steeps"],
        fields["rating"],
        fields.get("tasting_notes", "").replace("\r\n", " ").replace("\n", " "),
    ]


def _github_request(method, path, body=None):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def commit_brew(fields):
    if GITHUB_TOKEN:
        row = _build_row(fields)
        current = _github_request("GET", BREWS_API_PATH)
        existing = base64.b64decode(current["content"]).decode("utf-8")
        buf = io.StringIO()
        buf.write(existing if existing.endswith("\n") else existing + "\n")
        csv.writer(buf).writerow(row)
        new_content = base64.b64encode(buf.getvalue().encode()).decode()
        tea = fields.get("tea_name", "unknown")
        day = fields.get("date", str(date.today()))
        _github_request("PUT", BREWS_API_PATH, {
            "message": f"brew: log session for {tea} on {day}",
            "content": new_content,
            "sha": current["sha"],
        })
    else:
        with open(BREWS_CSV, "a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(_build_row(fields))


def build_page(tea_names, message=None, error=None):
    tea_options = "\n".join(
        f'<option value="{t}">{t}</option>' for t in tea_names
    )
    vessel_options = "\n".join(
        f'<option value="{v}">{label}</option>' for v, label in VESSELS
    )
    flash = ""
    if message:
        flash = f'<div class="flash ok">{message}</div>'
    if error:
        flash = f'<div class="flash err">{error}</div>'

    today = str(date.today())

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Log a Brew — Doug & George's Tea Party</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #faf9f7;
    color: #1a1a1a;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 2rem 1rem;
  }}

  .card {{
    background: #fff;
    border: 1px solid #e5e2dd;
    border-radius: 12px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 2px 12px rgba(0,0,0,.06);
  }}

  header {{
    margin-bottom: 2rem;
    text-align: center;
  }}

  header h1 {{
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: .03em;
    color: #5a4a3a;
  }}

  header p {{
    font-size: .85rem;
    color: #888;
    margin-top: .3rem;
  }}

  .flash {{
    padding: .75rem 1rem;
    border-radius: 8px;
    font-size: .9rem;
    margin-bottom: 1.5rem;
  }}

  .flash.ok {{ background: #f0faf0; color: #2d6a2d; border: 1px solid #b8dcb8; }}
  .flash.err {{ background: #fff0f0; color: #8b2020; border: 1px solid #f0baba; }}

  .grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .9rem;
  }}

  .full {{ grid-column: 1 / -1; }}

  label {{
    display: block;
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: #666;
    margin-bottom: .35rem;
  }}

  select, input[type="text"], input[type="number"], input[type="date"], textarea {{
    width: 100%;
    padding: .6rem .75rem;
    border: 1px solid #ddd;
    border-radius: 7px;
    font-size: .95rem;
    background: #fdfcfb;
    color: #1a1a1a;
    transition: border-color .15s;
    -webkit-appearance: none;
  }}

  select:focus, input:focus, textarea:focus {{
    outline: none;
    border-color: #9c7e5a;
    box-shadow: 0 0 0 3px rgba(156,126,90,.12);
  }}

  textarea {{
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }}

  /* Star rating */
  .stars {{
    display: flex;
    gap: .25rem;
    flex-direction: row-reverse;
    justify-content: flex-end;
  }}

  .stars input {{ display: none; }}

  .stars label {{
    font-size: 1.6rem;
    color: #ccc;
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    padding: 0;
    margin: 0;
    line-height: 1;
  }}

  .stars input:checked ~ label,
  .stars label:hover,
  .stars label:hover ~ label {{
    color: #c8922a;
  }}

  /* Half stars via data */
  .stars label[data-half]::after {{ content: attr(data-half); }}

  .submit-row {{
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }}

  button[type="submit"] {{
    background: #3d2b1f;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: .7rem 1.6rem;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s;
  }}

  button[type="submit"]:hover {{ background: #5a3e2b; }}

  .hint {{
    font-size: .8rem;
    color: #aaa;
  }}

  hr {{
    border: none;
    border-top: 1px solid #ede9e3;
    margin: 1.5rem 0;
  }}
</style>
</head>
<body>
<div class="card">
  <header>
    <h1>Doug &amp; George's Tea Party</h1>
    <p>Log a brew session</p>
  </header>

  {flash}

  <form method="POST" action="/">
    <div class="grid">

      <div class="full">
        <label for="tea_name">Tea</label>
        <select name="tea_name" id="tea_name" required>
          <option value="" disabled selected>Select a tea…</option>
          {tea_options}
        </select>
      </div>

      <div class="full">
        <label for="vessel">Vessel</label>
        <select name="vessel" id="vessel">
          {vessel_options}
        </select>
      </div>

      <div>
        <label for="leaf_g">Leaf (g)</label>
        <input type="number" id="leaf_g" name="leaf_g" step="0.1" min="0" required>
      </div>

      <div>
        <label for="water_ml">Water (ml)</label>
        <input type="number" id="water_ml" name="water_ml" step="1" min="0" required>
      </div>

      <div>
        <label for="temp_c">Temp (°C)</label>
        <input type="number" id="temp_c" name="temp_c" step="1" min="0" max="100" required>
      </div>

      <div>
        <label for="steep_time_seconds">Steep time (s)</label>
        <input type="number" id="steep_time_seconds" name="steep_time_seconds" step="1" min="0" required>
      </div>

      <div>
        <label for="steeps">Steeps</label>
        <input type="number" id="steeps" name="steeps" step="1" min="1" value="1" required>
      </div>

      <div>
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="{today}" required>
      </div>

      <div class="full">
        <label>Rating</label>
        <div class="stars">
          <input type="radio" id="r5"   name="rating" value="5">   <label for="r5"   title="5">★</label>
          <input type="radio" id="r4h"  name="rating" value="4.5"> <label for="r4h"  title="4.5">★</label>
          <input type="radio" id="r4"   name="rating" value="4">   <label for="r4"   title="4">★</label>
          <input type="radio" id="r3h"  name="rating" value="3.5"> <label for="r3h"  title="3.5">★</label>
          <input type="radio" id="r3"   name="rating" value="3">   <label for="r3"   title="3">★</label>
          <input type="radio" id="r2h"  name="rating" value="2.5"> <label for="r2h"  title="2.5">★</label>
          <input type="radio" id="r2"   name="rating" value="2">   <label for="r2"   title="2">★</label>
          <input type="radio" id="r1h"  name="rating" value="1.5"> <label for="r1h"  title="1.5">★</label>
          <input type="radio" id="r1"   name="rating" value="1">   <label for="r1"   title="1">★</label>
        </div>
      </div>

      <div class="full">
        <label for="tasting_notes">Tasting notes</label>
        <textarea id="tasting_notes" name="tasting_notes" placeholder="What did you notice?"></textarea>
      </div>

    </div>

    <div class="submit-row">
      <button type="submit">Log it →</button>
      <span class="hint">Saves to brew-log/brews.csv</span>
    </div>
  </form>
</div>
</body>
</html>"""


class Handler(BaseHTTPRequestHandler):
    tea_names = []

    def log_message(self, format, *args):
        pass  # silence request logs

    def do_GET(self):
        body = build_page(self.tea_names).encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode()
        params = {k: v[0] for k, v in parse_qs(raw).items()}

        message = error = None
        try:
            commit_brew(params)
            message = f"Logged: {params.get('tea_name', '')} on {params.get('date', '')}"
        except Exception as e:
            error = f"Error saving: {e}"

        body = build_page(self.tea_names, message=message, error=error).encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)


def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "0.0.0.0"


def main():
    Handler.tea_names = load_tea_names()
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    if ON_RAILWAY:
        print(f"  Tea Party brew logger running on port {PORT}")
    else:
        local_url = f"http://localhost:{PORT}"
        network_url = f"http://{local_ip()}:{PORT}"
        print("  Tea Party brew logger running at:")
        print(f"    Local:   {local_url}")
        print(f"    Network: {network_url}  ← open this on your iPhone")
        print("  Press Ctrl+C to stop.\n")
        threading.Timer(0.5, lambda: webbrowser.open(local_url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")


if __name__ == "__main__":
    main()

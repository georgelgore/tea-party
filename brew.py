#!/usr/bin/env python3
"""
brew.py — Flask JSON API for Doug & George's Tea Party.

Local:   python brew.py  (writes to local CSV files)
Railway: set GITHUB_TOKEN; sessions commit back to the repo.
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

from flask import Flask, jsonify, request
from flask_cors import CORS

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
TEAS_CSV = os.path.join(REPO_ROOT, "inventory", "teas.csv")
BREWS_CSV = os.path.join(REPO_ROOT, "brew-log", "brews.csv")
BREWERS_CSV = os.path.join(REPO_ROOT, "brew-log", "brewers.csv")
PORT = int(os.environ.get("PORT", 7890))
ON_RAILWAY = "PORT" in os.environ

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = "georgelgore/tea-party"

app = Flask(__name__)
CORS(app, origins=[
    "https://georgelgore.github.io",
    "http://localhost:5173",
    "http://localhost:4173",
])


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def load_teas():
    with open(TEAS_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_brewers():
    if not os.path.exists(BREWERS_CSV):
        return []
    with open(BREWERS_CSV, newline="", encoding="utf-8") as f:
        return [row["name"] for row in csv.DictReader(f) if row.get("name")]


def _ensure_brewer(name):
    if not name:
        return
    try:
        if GITHUB_TOKEN:
            current = _github_request("GET", "brew-log/brewers.csv")
            existing_text = base64.b64decode(current["content"]).decode("utf-8")
            existing_names = [r["name"] for r in csv.DictReader(io.StringIO(existing_text)) if r.get("name")]
            if name in existing_names:
                return
            buf = io.StringIO()
            buf.write(existing_text if existing_text.endswith("\n") else existing_text + "\n")
            csv.writer(buf).writerow([name])
            new_content = base64.b64encode(buf.getvalue().encode()).decode()
            _github_request("PUT", "brew-log/brewers.csv", {
                "message": f"brewers: add {name}",
                "content": new_content,
                "sha": current["sha"],
            })
        else:
            existing = load_brewers()
            if name not in existing:
                with open(BREWERS_CSV, "a", newline="", encoding="utf-8") as f:
                    csv.writer(f).writerow([name])
    except Exception:
        pass  # never block a brew submission over brewer persistence


def _github_request(method, path, body=None):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def _commit_csv_row(api_path, local_path, row, message):
    """Append a CSV row either via GitHub API or to the local file."""
    if GITHUB_TOKEN:
        current = _github_request("GET", api_path)
        existing = base64.b64decode(current["content"]).decode("utf-8")
        buf = io.StringIO()
        buf.write(existing if existing.endswith("\n") else existing + "\n")
        csv.writer(buf).writerow(row)
        new_content = base64.b64encode(buf.getvalue().encode()).decode()
        _github_request("PUT", api_path, {
            "message": message,
            "content": new_content,
            "sha": current["sha"],
        })
    else:
        with open(local_path, "a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(row)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/api/teas", methods=["GET"])
def get_teas():
    return jsonify(load_teas())


@app.route("/api/brewers", methods=["GET"])
def get_brewers():
    return jsonify(load_brewers())


@app.route("/api/brew", methods=["POST"])
def post_brew():
    data = request.get_json(force=True)
    try:
        tea = data.get("tea_name", "")
        day = data.get("date", str(date.today()))
        brewer = data.get("brewer", "").strip()
        row = [
            day,
            tea,
            data.get("vessel", ""),
            data.get("leaf_g", ""),
            data.get("water_ml", ""),
            data.get("temp_c", ""),
            data.get("steep_time_seconds", ""),
            data.get("steeps", ""),
            data.get("rating", ""),
            data.get("tasting_notes", "").replace("\n", " "),
            brewer,
        ]
        _commit_csv_row(
            "brew-log/brews.csv", BREWS_CSV, row,
            f"brew: log session for {tea} on {day}",
        )
        _ensure_brewer(brewer)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tea", methods=["POST"])
def post_tea():
    data = request.get_json(force=True)
    try:
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "name is required"}), 400
        quantity_g = data.get("quantity_g", "")
        row = [
            name,
            data.get("vendor", ""),
            data.get("category", ""),
            data.get("subcategory", ""),
            data.get("year", ""),
            quantity_g,
            quantity_g,  # quantity_remaining_g = quantity_g for new teas
            data.get("notes", ""),
            data.get("description", ""),
        ]
        _commit_csv_row(
            "inventory/teas.csv", TEAS_CSV, row,
            f"inventory: add {name}",
        )
        return jsonify({"ok": True, "name": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tea", methods=["PATCH"])
def patch_tea():
    data = request.get_json(force=True)
    try:
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "name is required"}), 400
        new_quantity = str(data.get("quantity_remaining_g", "")).strip()

        if GITHUB_TOKEN:
            current = _github_request("GET", "inventory/teas.csv")
            existing = base64.b64decode(current["content"]).decode("utf-8")
            lines = existing.splitlines(keepends=True)
            updated = []
            found = False
            reader = csv.reader(lines[1:])
            updated.append(lines[0])
            for line, row in zip(lines[1:], reader):
                if row and row[0].strip() == name:
                    row[6] = new_quantity
                    buf = io.StringIO()
                    csv.writer(buf).writerow(row)
                    updated.append(buf.getvalue())
                    found = True
                else:
                    updated.append(line)
            if not found:
                return jsonify({"error": f"Tea not found: {name}"}), 404
            new_content = base64.b64encode("".join(updated).encode()).decode()
            _github_request("PUT", "inventory/teas.csv", {
                "message": f"inventory: update remaining quantity for {name}",
                "content": new_content,
                "sha": current["sha"],
            })
        else:
            rows = []
            found = False
            with open(TEAS_CSV, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames
                for row in reader:
                    if row["name"].strip() == name:
                        row["quantity_remaining_g"] = new_quantity
                        found = True
                    rows.append(row)
            if not found:
                return jsonify({"error": f"Tea not found: {name}"}), 404
            with open(TEAS_CSV, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Local dev startup
# ---------------------------------------------------------------------------

def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "0.0.0.0"


if __name__ == "__main__":
    if ON_RAILWAY:
        print(f"  Tea Party API running on port {PORT}")
        app.run(host="0.0.0.0", port=PORT)
    else:
        local_url = f"http://localhost:{PORT}"
        network_url = f"http://{local_ip()}:{PORT}"
        print("  Tea Party API running at:")
        print(f"    Local:   {local_url}")
        print(f"    Network: {network_url}")
        print("  Press Ctrl+C to stop.\n")
        threading.Timer(0.8, lambda: webbrowser.open("http://localhost:5173")).start()
        app.run(host="0.0.0.0", port=PORT, debug=True, use_reloader=False)

# Doug & George's Tea Party 🍵

A cozy little corner of the internet for tracking our tea collection. We have too many teas, we brew them often, and now we have a whole system about it.

This repo is the single source of truth for what's in the tin, how much is left, and what we've been steeping lately.

---

## What's in here

| Path | What it does |
|---|---|
| `inventory/teas.csv` | Every tea we own, with quantities |
| `brew-log/brews.csv` | A record of every brew session |
| `menu/generate_menu.py` | Generates the printable PDF menu |
| `menu/output/doug_and_georges_tea_menu.pdf` | The latest menu (auto-rebuilt on push) |
| `brew.py` | Local Python server for logging brews on the same WiFi |
| `frontend/` | The hosted web app (GitHub Pages + Railway backend) |

**Current collection:** 35 teas across 7 categories — White · Green · Yellow · Oolong · Black · Ripe Pu-erh · Raw Pu-erh  
**Vendors we love:** [Yunnan Sourcing](https://yunnansourcing.com) · [white2tea](https://white2tea.com)

---

## The web app

The main app lives at **[georgelgore.github.io/tea-party](https://georgelgore.github.io/tea-party)** and has four pages:

- **Log Brew** — record a session (tea, vessel, leaf weight, temp, steep time, rating, notes)
- **Menu** — browse everything currently in stock, organised by category
- **Inventory** — see quantities and mark teas as empty
- **Add Tea** — add a new tea to the collection

Brew sessions commit directly back to `brew-log/brews.csv` in this repo via the Railway backend.

---

## Running locally

### The full web app (frontend + backend)

You'll need Node and Python installed.

**Backend (Railway / Flask):**
```bash
pip install -r requirements.txt
GITHUB_TOKEN=<your-pat> python app.py
```
The API runs at `http://localhost:7890`.

**Frontend (Vite / React):**
```bash
cd frontend
npm install
npm run dev
```
The dev server proxies `/api` calls to `localhost:7890`, so you don't need to set any env vars locally.

### Just the brew logger (no frontend needed)

If you're on the same WiFi and just want to log a session:
```bash
python brew.py
```
Opens a browser at `http://localhost:7890`. Also prints a network URL — works from any phone or tablet on the same network. Writes directly to `brew-log/brews.csv`.

---

## Deploying

### Backend (Railway)

1. Go to [railway.app](https://railway.app), create a project, and connect this repo
2. Create a fine-grained GitHub PAT at github.com/settings/tokens — scope it to `tea-party`, permission `Contents: read and write`
3. In the Railway dashboard → Variables → add `GITHUB_TOKEN = <your PAT>`
4. Railway auto-deploys on every push to `main`

### Frontend (GitHub Pages)

The frontend deploys automatically via GitHub Actions on every push to `main`. The build needs one variable set in your repo (or org) settings:

**Settings → Secrets and variables → Actions → Variables:**
```
VITE_API_URL = https://your-railway-app.up.railway.app
```

To trigger a manual redeploy: **Actions → Deploy Frontend to GitHub Pages → Run workflow**.

---

## Adding a new tea

1. Append a row to `inventory/teas.csv` (or use the **Add Tea** page in the web app)
2. The PDF menu regenerates automatically when the change hits `main`
3. If adding via CSV, grab the vendor name exactly as it appears — consistency helps

---

## Updating inventory

Use the **Inventory** page in the web app to update quantities or mark a tea as empty. Changes save immediately and sync back to `teas.csv`.

---

## Regenerating the PDF menu manually

```bash
pip install reportlab
cd menu && python generate_menu.py
```

Lands at `menu/output/doug_and_georges_tea_menu.pdf`. Also rebuilds automatically via GitHub Actions whenever `inventory/teas.csv` changes on `main`.

---

*At ~10g/day the current stash covers roughly 87 days. Pace yourselves.* ☕

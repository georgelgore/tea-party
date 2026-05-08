# Doug & George's Tea Party

A personal tea collection tracker for George and Doug. This repo keeps track of what teas we have, how much is left, and what we've been brewing.

---

## What's in here

| Path | What it does |
|---|---|
| `inventory/teas.csv` | Master list of all teas with quantities |
| `brew-log/brews.csv` | Log of every brew session |
| `menu/generate_menu.py` | Generates the printable tea menu PDF |
| `menu/output/doug_and_georges_tea_menu.pdf` | The latest menu (auto-updated on push) |
| `brew.py` | Local web app for logging brew sessions |

**Current collection:** 35 teas across 7 categories (~871g total)  
**Categories:** White · Green · Yellow · Oolong · Black · Ripe Pu-erh (shou) · Raw Pu-erh (sheng)  
**Vendors:** [Yunnan Sourcing](https://yunnansourcing.com) · [white2tea](https://white2tea.com)

---

## Logging a brew session

Run the local web app from the repo root:

```bash
python brew.py
```

A browser opens at `http://localhost:7890` with a form — pick the tea, fill in the parameters, hit **Log it**. The row is appended directly to `brew-log/brews.csv`. No internet required.

**Brewing vessels:**
- Western: Hario ChaCha Kyusu Maru 450ml
- Gong fu: 100ml gaiwan

---

## Updating inventory

When a tea runs out (or you weigh out a session), edit `quantity_remaining_g` directly in `inventory/teas.csv`. The PDF menu will regenerate automatically when the change hits `main`.

---

## Regenerating the menu PDF manually

```bash
pip install reportlab
cd menu && python generate_menu.py
```

The PDF lands at `menu/output/doug_and_georges_tea_menu.pdf`. It's also rebuilt automatically via GitHub Actions whenever `inventory/teas.csv` changes on `main`.

---

## Adding a new tea

1. Append a row to `inventory/teas.csv` following the existing schema
2. Fetch the tea description from [white2tea.com](https://white2tea.com) or [yunnansourcing.com](https://yunnansourcing.com) — don't make one up
3. The PDF menu will regenerate on merge

---

## Daily stats

At ~10g/day the current ~871g stash covers roughly **87 days**. Pace yourselves.

# EarnAYesDay — Development Plan

## Overview
A colourful, child-friendly web app that lets a parent (admin) set a target "Yes Day" date and assign tasks kids must earn. Kids track their own progress. Fully client-side, stored in `localStorage`, deployed to GitHub Pages via GitHub Actions.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Vanilla HTML/CSS/JS | No build step needed, zero deps, easy Pages deploy |
| Styling | CSS custom properties + hand-drawn-style fonts | Childish look, no framework overhead |
| Storage | `localStorage` | Fully offline, no backend needed |
| CI/CD | GitHub Actions | Native Pages integration |
| Hosting | GitHub Pages | Free, static-site ready |

---

## Data Model (localStorage)

```json
{
  "yesDayDate": "2026-06-14",
  "adminPasswordHash": "EarnAYesDay!",
  "tasks": [
    {
      "id": "uuid",
      "label": "Empty the dishwasher",
      "type": "positive",
      "target": 5,
      "completions": ["2026-05-01", "2026-05-03"]
    },
    {
      "id": "uuid",
      "label": "Don't pee on the seat",
      "type": "negative",
      "target": 5,
      "failures": ["2026-05-02"]
    }
  ]
}
```

---

## File Structure

```
EarnAYesDay/
├── index.html           # Child view — home/progress
├── admin.html           # Admin login + dashboard
├── css/
│   ├── main.css         # Shared styles, colour palette, fonts
│   ├── child.css        # Child-view specific
│   └── admin.css        # Admin-view specific
├── js/
│   ├── storage.js       # All localStorage read/write helpers
│   ├── child.js         # Child view logic
│   ├── admin.js         # Admin view logic + password check
│   └── utils.js         # Shared helpers (date calc, UUID, hash)
├── assets/
│   └── (star icons, confetti, fun illustrations)
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Actions → Pages
```

---

## Pages / Views

### 1. Child View (`index.html`)
- Big colourful countdown: **"X days until YES DAY! 🎉"**
- Progress summary bar: overall % earned
- Task cards — two sections:
  - **Earn it!** (positive tasks) — star per completion, tap to log one
  - **Keep it!** (negative tasks) — coloured "safe streak" counter, tap to log a slip
- Confetti animation when all tasks are complete
- "Go to Admin" link (subtle, bottom of page)

### 2. Admin View (`admin.html`)
- Password prompt on first load (hashed against stored SHA-256)
- Default password: `yesday` (shown on first run, user prompted to note it)
- Dashboard:
  - Date picker for Yes Day
  - Task manager: add / edit / delete tasks
    - Task label
    - Type toggle: **Positive** / **Negative**
    - Target count
  - Reset all progress button
  - Live preview of child view

---

## Phases

### Phase 1 — Scaffold & Deploy Pipeline
- Init `index.html`, `admin.html`, folder structure
- Write `deploy.yml` GitHub Actions workflow (push to `gh-pages` branch)
- Confirm GitHub Pages serves from `gh-pages`

### Phase 2 — Storage Layer
- `storage.js`: `getState()`, `setState()`, `resetProgress()`
- `utils.js`: `generateId()`, `hashPassword()`, `daysUntil()`

### Phase 3 — Admin Interface
- Password gate with SHA-256 check (Web Crypto API, no plaintext stored)
- Add/edit/delete tasks (form + task list)
- Date picker + save
- Reset progress with confirmation dialog

### Phase 4 — Child Interface
- Countdown display
- Task card rendering (positive & negative styled differently)
- Tap-to-complete with undo (accidental tap protection)
- Overall progress bar
- Celebration screen when 100% reached

### Phase 5 — Design & Polish
- Google Fonts: **Fredoka One** (headings) + **Nunito** (body)
- Colour palette: bright primary colours + pastels
- CSS animations: bounce, wiggle, star-fill, confetti burst
- Fully responsive — works on phones (kids will use it)
- Fun illustrated background (CSS-only or SVG)

### Phase 6 — QA & Hardening
- Test on mobile (iOS Safari, Android Chrome)
- Test localStorage edge cases (first run, empty state)
- Password: never stored in plaintext — SHA-256 hash only
- Sanitise all admin text inputs before storing/rendering (prevent XSS)

---

## GitHub Actions Workflow (`deploy.yml`)

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          exclude_assets: '.github'
```

---

## Security Notes
- Password is hashed with `SubtleCrypto.digest('SHA-256')` — never stored plaintext
- All user-supplied task labels are HTML-escaped before `innerHTML`
- No external network calls — fully offline capable

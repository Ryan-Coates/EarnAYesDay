# Earn A Yes Day! 🌟

A colourful, child-friendly web app where kids earn a [Yes Day](https://en.wikipedia.org/wiki/Yes_Day) by completing tasks set by a parent.

**[Live site →](https://ryan-coates.github.io/EarnAYesDay/)**  
**[GitHub repo →](https://github.com/Ryan-Coates/EarnAYesDay)**

---

## How it works

- **Parent (admin)** logs in and sets a target Yes Day date, then creates tasks for the kids to complete or avoid.
- **Kids** visit the main page to see their progress, tick off completed tasks, and watch the countdown to Yes Day.
- When all tasks are earned, a confetti celebration fires and Yes Day is confirmed!

## Features

- Positive tasks (do X number of times) and negative tasks (avoid doing Y)
- Countdown timer to Yes Day
- Confetti celebration on completion
- Fully offline — no accounts, no backend, no tracking
- Mobile-friendly

## Tech

| Concern | Choice |
|---|---|
| Framework | Vanilla HTML/CSS/JS |
| Styling | CSS custom properties + playful fonts |
| Storage | `localStorage` |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Local development

No build step needed. Just open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

## Project structure

```
EarnAYesDay/
├── index.html       # Child view — progress & task list
├── admin.html       # Admin login & task management
├── favicon.svg      # Site icon
├── css/
│   ├── main.css     # Shared styles & colour palette
│   ├── child.css    # Child view styles
│   └── admin.css    # Admin view styles
└── js/
    ├── storage.js   # localStorage helpers
    ├── utils.js     # Shared utilities
    ├── child.js     # Child view logic
    └── admin.js     # Admin view logic
```

## License

MIT

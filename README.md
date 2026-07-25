# DSA Tutor — Frontend

React client for DSA Tutor, a Socratic AI tutor for Data Structures &
Algorithms practice.

**Live app:** https://dsa-tutor-frontend-omega.vercel.app
**Backend repo:** [DSA-TUTOR](https://github.com/forpradeep/DSA-TUTOR)

## Features

- Chat-style interface for pasting or photographing a DSA problem
- Paste-to-upload (Ctrl+V a screenshot directly, no file picker needed)
- Live hint-progress indicator (a lit trail of dots as hints escalate)
- Session sidebar: search, rename, and delete past problem sessions
- Typing indicator while the tutor is generating a response
- Copy button on any reply containing a code block
- JWT-based auth with persistent login

## Tech stack

- **React** (Vite)
- **Redux Toolkit** for auth state
- **React Router** for client-side routing
- **Axios** for API calls
- Custom design system (no UI framework) — ink/paper/amber palette,
  Fraunces + Inter + JetBrains Mono typography

## Local setup

```bash
git clone https://github.com/forpradeep/DSA-TUTOR-FRONTEND.git
cd DSA-TUTOR-FRONTEND
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
```

(Point this at the deployed backend URL instead if you want to develop
against production data.)

Run it:

```bash
npm run dev
```

## Deployment

Deployed on Vercel. `vercel.json` includes a rewrite rule so that
client-side routes (e.g. `/chat`) resolve correctly on hard refresh or
direct navigation, since this is a single-page app.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Design notes

The visual design intentionally avoids generic "AI app" styling — an
ink-navy background with warm amber accents and a serif display face,
meant to feel like a mentor's notebook rather than a dashboard. The hint
trail (dots that light up amber as hints escalate) is the one custom
visual metaphor tied directly to the product's core idea: gradual,
earned revelation rather than instant answers.

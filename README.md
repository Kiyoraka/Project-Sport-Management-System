# ArenaOne — Sport Booking System

A hardcoded, framework-free court-booking demo for a Malaysian sports venue (badminton, futsal,
basketball and more). Built with **plain HTML, CSS and JavaScript** — no backend, no build step,
no dependencies. Open a file and it runs.

It has two sides that share live data: a **public landing page** where customers book courts, and
an **admin console** where the venue manages courts, bookings and analytics. A booking made on the
landing page appears instantly in the admin console (and vice-versa) via `localStorage`.

---

## Features

### Public landing (`index.html`)
- Court timetable grid — pick a date, filter by sport or court, tap free 2-hour slots
- Live cell states: available · selected · booked · maintenance · yours
- Multi-slot selection with a running total and floating selection bar
- 3-step booking modal: details (with validation) → payment → confirmation
- Four payment methods: card, FPX online banking, Touch 'n Go eWallet (QR), pay at venue
- Mobile "My bookings" tab and bottom navigation

### Admin console (`admin.html`)
- Login gate (demo credentials, tap-to-fill)
- **Dashboard** — today's bookings, revenue, pending count, active courts
- **Analysis** — 7-day revenue chart and per-court booking bars (pure CSS)
- **Sport management** — add courts, set maintenance, delete
- **Bookings** — filter by status, confirm or cancel
- **Settings** — venue name, auto-confirm toggle, reset demo data
- **Help** — FAQ accordion
- Responsive: fixed sidebar on desktop, bottom nav + Account menu on mobile

---

## Demo credentials

```
Email:    admin@gmail.com
Password: admin123
```

On the sign-in screen you can tap the demo hint to auto-fill both fields.

---

## Project structure

```
index.html          Landing page (public booking)
admin.html          Admin console (login-gated)
css/
  base.css          Design tokens, reset, shared components (buttons, inputs, cards, modals, toast)
  landing.css       Hero, timetable grid, chips, selection bar, mobile nav, booking modal
  admin.css         Sidebar, stat cards, charts, tables, forms, tabs, mobile nav
js/
  data.js           Seed data + localStorage store layer (shared by both pages)
  landing.js        Timetable render, slot selection, booking flow, My-bookings
  admin.js          Login gate, tab router, all admin tab renders
```

---

## Running it

No build step required.

**Option A — just open it**
Double-click `index.html` (localStorage works on `file://` too).

**Option B — local server** (recommended for a clean demo)
```bash
python -m http.server 8123
# then open http://127.0.0.1:8123/index.html
```

---

## Data & persistence

All state lives in the browser's `localStorage` under `arenaone.*` keys (courts, bookings,
settings). Data survives page refreshes and is shared between the two pages. The admin
**Settings → Reset demo data** button restores the seeded courts and clears all bookings.

There is no server and no real payment processing — the payment step is cosmetic, as in the
original design.

---

## Tech

- Plain HTML5 + CSS3 + vanilla JavaScript (ES5-compatible, no framework)
- Archivo web font (Google Fonts)
- `localStorage` for persistence
- Responsive via CSS media queries (breakpoint 768px)

Design source: Claude Design prototype "Sport Booking System".

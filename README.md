# TripGo — Trip.com-style travel booking demo

A responsive home page closely modeled on
[Trip.com](https://www.trip.com/?locale=en-XX&curr=USD). Built with plain
HTML, CSS and vanilla JavaScript — no build step or dependencies.

> Demo / educational clone. Not affiliated with Trip.com.

## Layout (matches Trip.com)

- **White top bar**: logo, global search box, App, List your property,
  Language/Currency, Customer support, Find bookings, Sign in / register.
- **Left sidebar navigation** with every service: Hotels & Homes, Flights,
  Trains, Cars, Attractions & Tours, Flight + Hotel, Private Tours, Group
  Tours, Trip.Planner, Travel Inspiration, Map, Deals, Rewards, App — with
  hover **flyout sub-menus** on Cars, Attractions & Tours and Travel Inspiration.
- **Hero** with the pill **search tabs**: Hotels & Homes (default), Flights,
  Trains, Cars, Attractions & Tours, Flight + Hotel.
- Content sections: New user exclusive coupons, promo banners, "Get inspired"
  destination chips, Popular attractions, Featured hotels, Travel inspiration,
  and a full footer (Contact / About / Other services / Payment / Follow us).

## Tabs & dropdowns (all interactive)

Each tab renders its own search fields, and the following dropdowns are fully
functional:

- **Language / Currency** popover (top bar) — selecting a currency updates the
  top-bar label.
- **Sign in / register** popover.
- **Rooms & guests** stepper (Hotels, Flight + Hotel) — rooms / adults /
  children with +/− steppers and live label updates.
- **Passengers & cabin class** stepper (Flights, Trains) — adults / children /
  infants plus an Economy / Premium / Business / First selector.
- **Date range calendar** — a two-month picker with disabled past dates, range
  highlighting, nights count, and month navigation. Single-date mode is used
  for Trains / Attractions.
- **Trip type** (Round-trip / One-way / Multi-city) on Flights and Flight + Hotel
  — One-way hides the return date.
- **Swap** buttons for origin/destination.

## Run it

No installation needed — open `index.html`, or serve locally (recommended so
images/fonts load cleanly):

```bash
# from this folder
python -m http.server 5500
# then visit http://localhost:5500/#search
```

## Structure

```
trip-clone/
├── index.html   # top bar, sidebar, hero/tabs, sections, popover markup
├── styles.css   # design tokens, sidebar layout, pills, dropdowns, calendar
├── script.js    # tab forms, popover system, calendar, steppers, content
└── README.md
```

## Sign-in with real email codes

The sign-in/register modal (`signin.js`) sends a **real 6-digit verification
code** by email through two Vercel serverless functions:

- `api/send-code.js` — generates a code, emails it via SMTP, and returns a
  stateless HMAC token (no database is used).
- `api/verify-code.js` — recomputes the HMAC over the entered code and the
  token, validating it server-side.

### Configure email (Vercel → Project → Settings → Environment Variables)

| Variable     | Example                          | Notes                                  |
| ------------ | -------------------------------- | -------------------------------------- |
| `SMTP_HOST`  | `smtp.gmail.com`                 | Your SMTP server                       |
| `SMTP_PORT`  | `465`                            | `465` (SSL) or `587` (STARTTLS)        |
| `SMTP_USER`  | `you@gmail.com`                  | SMTP username                          |
| `SMTP_PASS`  | `abcd efgh ijkl mnop`            | SMTP password / app password           |
| `MAIL_FROM`  | `TripGo <you@gmail.com>`         | Optional; defaults to `SMTP_USER`      |
| `OTP_SECRET` | `<long random string>`           | Recommended; signs the OTP tokens      |

**Gmail:** enable 2-Step Verification, then create an **App Password**
(Google Account → Security → App passwords) and use it as `SMTP_PASS`.

Until SMTP vars are set, the flow still works in **demo mode**: the code is
shown on screen instead of being emailed. Once the vars are configured and the
project redeploys, codes are emailed for real.

## Notes

- Destination/hotel/attraction images load from Unsplash via URL, so an
  internet connection is needed for them to appear.
- Search and booking actions are non-functional demos that show a toast.

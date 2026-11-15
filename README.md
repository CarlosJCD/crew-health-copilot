# ORBIT

**Catch the early signals. Act onboard.**

ORBIT is an offline health companion for astronauts on long missions. It reads body, mind and crew life
against each astronaut's own baseline, flags an early cross-domain signal when two domains stay yellow
for two days, and helps the astronaut choose a protective action before escalating, at the pace the
communication delay allows. NASA Space Apps Challenge 2026, challenge "Create Health Monitoring Software
for Astronauts on Space Missions".

- App: https://carlosjcd.github.io/orbit/ (public, no sign-in, works offline after the first visit)
- Repository: https://github.com/CarlosJCD/orbit

> **Synthetic data, not a diagnostic tool.** ORBIT supports decisions; it does not diagnose.
> The demo follows a fictional astronaut, Lena Ortiz, on days 121 to 128 of a Mars transit.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/ (includes the offline service worker)
npm run preview  # serve the production build locally
npm test         # Vitest: ORBIT engine acceptance tests, rules file, data checks, translations
node scripts/fetch-space-weather.mjs  # refresh the NASA DONKI snapshot (no key needed)
node scripts/fetch-sep-replay.mjs     # refresh the May 2024 SEP replay file (committed)
node scripts/screenshots.mjs [url]    # deck screenshots with headless Chrome into screenshots/
```

Deep links open a module on a given day, and optionally a card's "Why?":
`#/today?day=125`, `#/today?day=121&why=temp`, `#/transmit?day=125`, `#/mind?day=125`.

## Structure

| Path | What it is | Owner |
|---|---|---|
| `src/orbit/orbit-indicators.json` | **Single source of rules, sources and texts** (Psychology 1 and 2, unchanged). Nobody changes thresholds outside this file; P1 approves changes | Psychology 1 |
| `src/orbit/scenarios.json` | Four scenarios: one-way delay, estimated dose, first responder, ground contact (handoff 2.2) | Psychology + Data science |
| `src/orbit/config.ts` | Typed reader for both files; lists every param the engine needs | Engineering |
| `src/orbit/engine.ts` | ORBIT engine: one rule per indicator, Body / Mind / Crew roll-up, state (GREEN, YELLOW, EARLY_SIGNAL, RED_PHYSICAL, RED_PSYCH) | Data science + Engineering |
| `src/orbit/engine.test.ts` | Acceptance table of the handoff (days 121 to 128) plus rules the story does not exercise | Data science + Engineering |
| `src/orbit/demoData.ts` | `demo-data.json` contract, checks, and the built-in copy of the demo story | Data science |
| `src/modules/Today.tsx` | Rings, state, cards with "Why?", day control, radiation context | Engineering |
| `src/orbit/transmit.ts`, `src/modules/Transmit.tsx` | Outbox with the scenario delay, privacy switches, packets (share with the crew medical officer, weekly summary, escalation) | Engineering |
| `src/orbit/checkin.ts`, `src/modules/Mind.tsx` | Daily check-in (4 sliders) and "I want to talk to someone today"; answers replace that day's values on the device | Engineering (items: Psychology 2) |
| `src/components/SepReplay.tsx`, `public/data/donki-sep-2024-05.json` | Replay of the real solar particle event of May 9, 2024 in the radiation layer | Engineering |
| `src/modules/registry.ts` | Module list and owners (drives navigation) | Engineering |
| `src/data/knowledge.json` | Data team's reference catalog (`datos_nasav1.json`): plausible ranges used to check `demo-data.json`, NASA sources, physics | Data science |
| `src/data/spaceWeather.ts`, `scripts/fetch-space-weather.mjs` | NASA DONKI snapshot (flares and SEP events) | Engineering |
| `src/i18n/strings.ts` | Interface text in English (default) and Spanish. Rule texts come from the JSON, in English | Everyone who adds text |
| `public/sw.js` | Offline service worker | Engineering |
| `src/index.css` | Design tokens (dark and light themes), layout and components. See "Design" below | Engineering |
| `src/components/Logo.tsx`, `public/favicon.svg`, `public/icons/` | Logo (the ring is the O of ORBIT) and app icons | Engineering |
| `src/lib/orbit.ts` | Maps each ORBIT state to the step of the Observe, Read, Boost, Iterate, Transmit loop shown on Today | Engineering |

## Rules and the ORBIT engine

`orbit-indicators.json` drives every color. Each indicator is compared with the astronaut's own baseline
(`persona.baseline` in the demo data); population ranges only act as physical safety rails (blood pressure,
heart rate, temperature, glucose). The day's state:

| State | When | Who sees it |
|---|---|---|
| `RED_PHYSICAL` | Any red in Body | Crew medical officer; packet to Earth with the scenario delay |
| `RED_PSYCH` | She taps "I want to talk to someone today" | The person she chooses |
| `EARLY_SIGNAL` | 2 or more domains yellow today and the day before | Her; she can share with the crew medical officer |
| `YELLOW` | Any yellow | Her (self-care), checked again in 24 h |
| `GREEN` | Otherwise | Her |

Thresholds marked `team_criterion` in the JSON are design choices pending validation; the "Why?" panel lists them.
To change a rule, edit the JSON and run `npm test`: the acceptance table must still pass.

Open points for P1:
- The app is named ORBIT; texts in `orbit-indicators.json` still say "Orbit" (13 times). Update them in the next version.
- `contact.yellow_drop_fraction_vs_14d` is read as "mean of the last 14 days vs the 14 days before". Comparing
  shorter windows with the previous 14 days would turn day 122 or 127 yellow, against the acceptance table.
- `screen.offer_conference_if_weeks_gte` is implemented (offer only, never red). `pulse.practice_sessions` is used by
  `pulseBaseline()` for live sessions; the demo gives the baseline directly.

Privacy in Transmit: Body status and red physical safety rails always reach the crew medical officer (agreed before
the mission); Mind and Crew go out only if she switches them on; check-in answers, journal and game content never
leave the device. Everything the app stores (check-ins, outbox, switches) stays in the browser's localStorage.

## Demo data (`public/data/demo-data.json`)

Data science generates it (handoff 2.3). If the file is missing, the app uses its built-in copy of the story:
days 121 to 128 with the exact values of the handoff, days 107 to 120 as seeded noise around the baseline.

```json
{
  "synthetic": true,
  "persona": { "name": "Lena Ortiz", "role": "Mission specialist", "scenario": "mars_transit", "mission_length_days": 180,
               "baseline": { "sleep_h": [6.5, 0.3], "hr": [58, 2], "sbp": [112, 3], "dbp": [72, 3], "temp": [37.9, 0.1],
                             "mood": [7, 0.6], "stress": [4, 0.7], "fatigue": [4, 0.7], "crew_climate": [7, 0.5],
                             "pulse_ms": [320, 12], "contact": [2, 0.6], "exercise_prescription_min": 120 } },
  "days": [
    { "day": 121, "sleep_h": 6.6, "hr": 58, "sbp": 114, "dbp": 73, "temp": 38.0, "mood": 7, "stress": 4, "fatigue": 4,
      "crew_climate": 7, "pulse_ms": 318, "contact": 2, "exercise_min": 120, "glucose": 89,
      "symptoms": [], "screen": null, "events": [], "talk_request": false }
  ]
}
```

Each baseline is `[mean, sd]`. Numbers may be `null` (no reading). Proposed additions to the handoff example:
`glucose` (weekly, `null` on other days) and `talk_request` (red psych state). Values outside the plausible
ranges of the data team's catalog are rejected and listed in a notice on Today.

## NASA data

| Resource | Where it appears | Link |
|---|---|---|
| Human Research Program risks | "Why?" on every indicator card | https://www.nasa.gov/hrp/risks/ |
| Human Research Program hazards | Radiation context panel | https://www.nasa.gov/hrp/hazards/ |
| DONKI space weather (NASA CCMC) | Solar flares and SEP events of the last 30 days, downloaded at build time and daily | https://ccmc.gsfc.nasa.gov/tools/DONKI/ |
| DONKI SEP events of May 2024 | "Solar particle event replay" in the radiation layer (file committed; entries marked MODEL come from a forecast model) | https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-01&endDate=2024-05-31 |
| MSL RAD dose measurements | Estimated mission dose per scenario (1.84 mSv/day cruise, 0.64 mSv/day Mars surface) | https://doi.org/10.1126/science.1235989, https://doi.org/10.1126/science.1244797 |

CI reads `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` and `/SEP` (no key). api.nasa.gov is a fallback and
uses the repository secret `NASA_API_KEY` if present. If NASA does not answer, the last published snapshot is kept.

## Other sources and libraries

Clinical and research sources are listed per indicator in `orbit-indicators.json` and shown in "Why?".

| Library | License |
|---|---|
| React | MIT |
| Vite | MIT |
| TypeScript | Apache-2.0 |
| Vitest | MIT |
| oxlint | MIT |
| Inter, Public Sans, DM Mono (via Fontsource) | SIL OFL 1.1 (fonts), MIT (Fontsource packages) |
| NASA Horizon Design System tokens (colors, type roles) | CC0 1.0 |

## Design

The visual language follows the public (CC0) tokens of the
[NASA Horizon Design System](https://github.com/nasa/hds-core): carbon neutrals, NASA blue and red, and the
Inter / Public Sans / DM Mono typefaces (SIL OFL, bundled with the app so it looks the same offline).
ORBIT uses no NASA insignia ("meatball"), logotype ("worm") or mission patch, does not use "NASA" in its
name, and says in the footer that it is not affiliated with or endorsed by NASA.

- Blue means "you can act on this" (links, buttons, the active tab). Red only means a red ORBIT state,
  plus the pulse inside the logo. Status is always color + shape + word: ● green, ▲ yellow, ■ red, ○ no data.
- Dark "Mission" theme by default (less glare in the cabin); the light "Day" theme is for projectors.
- Wordmark: the logo ring is the O of ORBIT. The favicon and app icons use the ring alone.
- The header always shows the mission, the mission day and the one-way signal delay to Earth.
- Today opens with the Body, Mind and Crew rings next to the ORBIT state. The state shows the
  O-R-B-I-T loop with today's letter: GREEN → **O**bserve; YELLOW and EARLY_SIGNAL → **B**oost (then
  **I**terate in 24 h); RED_PHYSICAL and RED_PSYCH → **T**ransmit. Verbs stay in English in both languages.
- The demo replay is framed and labelled as a demo, with a play button for the story days.

## Deploy

Push to `main` on GitHub. `.github/workflows/deploy.yml` runs lint and tests, downloads the DONKI snapshot,
builds and publishes to GitHub Pages. It also runs daily at 12:00 UTC.

## Use of Super Intelligence (SI)

Required by the 2026 Project Submission Guide ("Code and data: must acknowledge SI generation in descriptive text and metadata").

- The concept (ORBIT model and product, demo story, games) came from the team.
- Code in this repository (app, ORBIT engine, tests, service worker, DONKI script, built-in demo data) was written
  with assistance from Claude (Anthropic) and reviewed by the team.
- The rules file and the data team's reference catalog were drafted with assistance from Claude; values marked
  `team_criterion` or "Extraído (revisar página)" stay unverified until a team member checks them.
- The UI redesign (design tokens, layout, wordmark) and the logo (`src/components/Logo.tsx`, `public/favicon.svg`,
  `public/icons/`) were drawn with assistance from Claude from the team's brief, and reviewed by the team. The logo
  is a vector drawing written as SVG code. Team decision (Nov 2026): it is declared here and in the SVG metadata
  (`<desc>` in `public/favicon.svg`) instead of carrying a visible watermark. It contains no NASA branding.
- No SI-generated photos, audio or video. Any that are added must carry a visible "AI-generated" watermark and no NASA branding.

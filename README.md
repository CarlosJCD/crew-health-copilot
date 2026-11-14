# Crew Health Copilot (working title)

Offline-first, preventive health self-assessment for astronauts. NASA Space Apps Challenge 2026,
challenge "Create Health Monitoring Software for Astronauts on Space Missions".

> Decision support only. This prototype does not diagnose. All data shown is synthetic.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/ (includes the offline service worker)
npm run preview  # serve the production build locally
npm test         # unit tests (Vitest): alert logic, escalation, data validation, translations
node scripts/fetch-space-weather.mjs  # refresh the NASA DONKI snapshot (NASA_API_KEY optional)
```

## Structure

| Path | What it is | Owner |
|---|---|---|
| `src/data/types.ts` | Data contracts (`Measurement`, `IndicatorDef`, `Scenario`) | Engineering |
| `src/data/indicators.ts` | Indicator catalog: method, explainer, alert bands **with source** | Science team fills sources |
| `src/data/scenarios.ts` | Mission scenarios and signal delay | Science team verifies delays |
| `src/data/sample.ts` | Placeholder synthetic data; swap for the data-science JSON | Data science |
| `src/lib/status.ts` | Traffic-light logic: absolute bands + deviation from personal pre-flight baseline | Engineering + Data science |
| `src/modules/registry.ts` | Module list and owners (drives navigation) | Engineering |
| `src/modules/*.tsx` | One file per module | See registry |
| `public/sw.js` | Offline service worker | Engineering |
| `src/data/validate.ts` | Checks `public/data/synthetic.json` row by row; problems appear in a notice on Today | Engineering |
| `src/lib/escalation.ts` | Maps today's statuses + mission delay to the recommended escalation step | Engineering (mapping pending Phase 2 model) |
| `scripts/fetch-space-weather.mjs` | Downloads NASA DONKI flares and SEP events to `public/data/space-weather.json` | Engineering |
| `src/i18n/strings.ts` | UI text in English and Spanish (EN/ES toggle in the header). Data files use `{ en, es }` values | Everyone who adds text |

## NASA data

The Today tab shows recent solar flares and solar energetic particle events from
[NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) as context for the space-radiation hazard.
CI downloads a fresh snapshot on every deploy and once a day. Add a free key from https://api.nasa.gov/
as the repository secret `NASA_API_KEY`; without it the shared `DEMO_KEY` is used and is often rate-limited.

## Synthetic data format

One row per astronaut, mission day and indicator. Negative days are the pre-flight baseline.

```json
{ "astronautId": "demo-astronaut", "day": -3, "indicatorId": "sleep", "value": 7.1, "unit": "h", "source": "synthetic" }
```

Indicator ids: `sleep, hr, sbp, glucose, temp, mood, stress, rt, contact, exercise`.

Save it as `public/data/synthetic.json`. If the file is missing the app uses its built-in placeholder;
if some rows are invalid they are skipped and listed in a notice on the Today tab.

## Rules for thresholds

Every alert band needs a `SourceRef`. Leave `verified: false` until someone on the team has opened the source;
the UI then marks it "(unverified)". Never present a status as a diagnosis.

## Deploy

Push to `main` on GitHub. The workflow in `.github/workflows/deploy.yml` publishes to GitHub Pages
(Settings > Pages > Source: GitHub Actions).

## Use of Super Intelligence (SI)

Required by the 2026 Project Submission Guide ("Code and data: must acknowledge SI generation in descriptive text and metadata").

- The project concept (biopsychosocial, preventive, protective factors, games) came from the team.
- Initial code scaffold, the traffic-light logic, the service worker and the placeholder synthetic-data generator
  were written with assistance from Claude (Anthropic) and reviewed by the team.
- Literature and benchmark searches were assisted by Claude; every source is opened and checked by a team member before use.
- No SI-generated images, audio or video so far. Any that are added must carry a visible watermark and no NASA branding.

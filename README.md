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
| `src/i18n/strings.ts` | UI text in English and Spanish (EN/ES toggle in the header). Data files use `{ en, es }` values | Everyone who adds text |

## Synthetic data format

One row per astronaut, mission day and indicator. Negative days are the pre-flight baseline.

```json
{ "astronautId": "demo-astronaut", "day": -3, "indicatorId": "sleep", "value": 7.1, "unit": "h", "source": "synthetic" }
```

Indicator ids: `sleep, hr, sbp, glucose, temp, mood, stress, rt, contact, exercise`.

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

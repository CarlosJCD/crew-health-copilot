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
| `src/data/knowledge.json` | **Data team's reference catalog** (their `datos_nasav1.json`, unchanged): indicators, clinical categories, sources, mission physics | Data science |
| `src/data/knowledge.ts` | Typed reader and checks for `knowledge.json` | Engineering |
| `src/data/knowledge.en.ts` | English for the Spanish catalog texts the app shows | Engineering |
| `src/data/indicators.ts` | Builds the indicators from the catalog and adds the app model: domain, HRP hazards, "why it matters" | Engineering + Psychology |
| `src/data/scenarios.ts` | Mission scenarios; signal delays from the catalog physics | Engineering |
| `src/data/sample.ts` | Placeholder synthetic data; swap for the data-science JSON | Data science |
| `src/lib/status.ts` | Traffic-light logic: catalog categories + deviation from the personal pre-flight baseline | Engineering + Data science |
| `src/modules/registry.ts` | Module list and owners (drives navigation) | Engineering |
| `src/index.css` | Design tokens (dark and light themes), layout and components. See "Design" below | Engineering |
| `src/components/Logo.tsx`, `public/favicon.svg`, `public/icons/` | Logo (concept A, "domain ring") and app icons | Engineering |
| `src/components/StatusSummary.tsx` | Top of Today: overall status, counts per domain, early signal | Engineering |
| `src/components/IndicatorCard.tsx`, `DetailsPanel.tsx` | Indicator card, compact list of nominal indicators, details panel with numbers and sources | Engineering |
| `src/lib/summary.ts` | Counts per status and domain, card order, plain-text summary for the Crew Medical Officer | Engineering |
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
If NASA does not answer, the last published snapshot is kept; a list that could not be downloaded is
stored as `null` and the app says "not downloaded" instead of showing zero.

## Reference catalog (knowledge.json)

To update thresholds, sources or delays, replace `src/data/knowledge.json` with the new export and run
`npm test`. The tests say exactly what to fix: entries that break the contract, overlapping categories,
indicators without an app model entry (`indicators.ts`) or texts without English (`knowledge.en.ts`).
CI does not publish if a test fails.

How the app uses each indicator setting:

| Catalog field | Use in the app |
|---|---|
| `clinical_categories` (min included, max excluded) | Reference range and traffic light; its `confirm_n` readings must agree |
| `smooth_n` | The rules look at the average of the last N readings |
| `sd_floor` | Minimum SD for the personal pre-flight baseline |
| `confirm_n` | Consecutive readings needed for a personal-baseline alert |
| `expected_inflight_shift` | Added to the baseline from launch day (e.g. systolic -8 mmHg) |
| `evaluate_on: cambio_pct` | Categories apply to the % change vs. pre-flight (body mass) |
| `plausible_min` / `plausible_max` | Dataset rows outside the range are rejected |

Every catalog source is shown as "(unverified)" because the file marks all parameters as
"Extraído (revisar página)". The personal-baseline cut-offs (1.5 and 2.5 SD; 2 and 3 for temperature)
are an app design choice, not from the catalog.

## Synthetic data format

One row per astronaut, mission day and indicator. Negative days are the pre-flight baseline.

```json
{ "astronautId": "demo-astronaut", "day": -3, "indicatorId": "sleep", "value": 7.1, "unit": "h", "source": "synthetic" }
```

Indicator ids and units (from the catalog; `unit` must match exactly):

| id | unit | id | unit |
|---|---|---|---|
| `sleep` | `h` | `mood` | `0-10` |
| `hr` | `bpm` | `stress` | `0-10` |
| `sbp` | `mmHg` | `rt` | `ms` |
| `dbp` | `mmHg` | `pvt_lapses` | `lapsos` |
| `glucose` | `mg/dL` | `contact` | `mensajes/semana` |
| `temp` | `°C` | `exercise` | `min/día` |
| `body_mass` | `kg` | `spo2` | `%` |

Save it as `public/data/synthetic.json`. If the file is missing the app uses its built-in placeholder;
if some rows are invalid they are skipped and listed in a notice on the Today tab.

## Design

The visual language follows the public (CC0) tokens of the
[NASA Horizon Design System](https://github.com/nasa/hds-core): carbon neutrals, NASA blue and red, and the
Inter / Public Sans / DM Mono typefaces (SIL OFL, bundled with the app so it looks the same offline).
The app uses no NASA insignia ("meatball"), logotype ("worm") or mission patch, does not use "NASA" in its
name, and says in the footer that it is not affiliated with or endorsed by NASA.

- Blue means "you can act on this" (links, buttons, the active tab).
- Red only means **Act**, plus the pulse inside the logo. Never use it for navigation or decoration.
- Status is always color + shape + word: ● Nominal, ▲ Watch, ■ Act, ○ No data.
- Dark "Mission" theme by default (less glare in the cabin); the light "Day" theme is for projectors.
- Today puts the summary first: overall status, counts per domain and the next escalation step.
  Indicators at Act or Watch get a full card; nominal ones share a compact list.

## Rules for thresholds

Every threshold needs a source. Leave `verified: false` until someone on the team has opened the source;
the UI then marks it "(unverified)". Never present a status as a diagnosis.

## Deploy

Push to `main` on GitHub. The workflow in `.github/workflows/deploy.yml` publishes to GitHub Pages
(Settings > Pages > Source: GitHub Actions).

## Use of Super Intelligence (SI)

Required by the 2026 Project Submission Guide ("Code and data: must acknowledge SI generation in descriptive text and metadata").

- The project concept (biopsychosocial, preventive, protective factors, games) came from the team.
- Initial code scaffold, the traffic-light logic, the service worker and the placeholder synthetic-data generator
  were written with assistance from Claude (Anthropic) and reviewed by the team.
- The reference catalog (`knowledge.json`) was extracted from NASA and clinical documents with assistance from
  Claude (`captured_by` field); each value stays "unverified" until a team member checks the page and quote.
- Literature and benchmark searches were assisted by Claude; every source is opened and checked by a team member before use.
- The UI redesign (layout, design tokens, components) and the logo (concept A, "domain ring":
  `src/components/Logo.tsx`, `public/favicon.svg`, `public/icons/`) were drawn with assistance from Claude
  from the team's brief, and reviewed by the team. The logo is a vector drawing written as SVG code. Team decision
  (Nov 2026): it is declared here and in the SVG metadata (`<desc>` in `public/favicon.svg`) instead of carrying a
  visible watermark. It contains no NASA branding.
- No SI-generated photos, audio or video so far. Any that are added must carry a visible watermark and no NASA branding.

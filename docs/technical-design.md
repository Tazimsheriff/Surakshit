# Technical design

## Requirements

SURAKSHIT helps a person review a message or a URL before they act on it. The result must say what was found, how many points that pattern contributed, and what to do next. It must not claim that the content is proven fraud or proven safe.

The checker works with no account, no AI key, and no database. English and Tamil cover the interface, the rule explanations, the lessons, and the quizzes.

## API contracts

All JSON errors use `{ "ok": false, "error": { "code": string } }`. Validation errors add `issues: [{ "path": string, "code": string }]`. Successful analysis uses HTTP 200.

### `GET /api/health`

```json
{ "ok": true, "service": "surakshit-api", "aiConfigured": false, "persistence": "memory" }
```

`persistence` is `memory` or `supabase`. The body never includes secrets.

### `POST /api/analyze/message`

Request:

```json
{ "text": "string, 1 to 4000 characters", "consentToAi": false, "language": "en" }
```

`language` is `en` or `ta`. `consentToAi` defaults to false.

Response `result` fields:

| Field | Meaning |
| --- | --- |
| `riskCategory` | `low`, `medium`, `high`, or `critical` |
| `score` | Integer 0–100 from the rules |
| `scoreSource` | Always `heuristic_rules` |
| `indicators` | `{ code, appliedWeight, severity, evidence? }` |
| `recommendationCodes` | Keys translated by the client |
| `limitationCodes` | Keys translated by the client |
| `highlightedPhrases` | Short snippets, at most 80 characters |
| `ai` | `{ used, reason?, explanation?, extraCautions? }` |

Evidence is a short match, not the full message. The analytics record does not include `text`.

### `POST /api/analyze/url`

Request: `{ "url": "string, 1 to 2048 characters", "consentToAi": false, "language": "en" }`.

A parsed address adds `parsedUrl`: protocol, hostname, pathname, port, query key names, and `missingScheme`. Usernames, passwords, and query values are not returned.

| Status | When |
| --- | --- |
| 400 | Empty, too long, or otherwise invalid JSON or fields |
| 413 | Body above 32 KB |
| 422 | `invalid_url` for a malformed address or a non-http(s) scheme |
| 429 | More than the configured number of analysis calls per minute |
| 200 | A rule result, including low-scoring ordinary addresses |

### `GET /api/analytics/summary`

```json
{
  "ok": true,
  "summary": {
    "mode": "demo",
    "illustrative": true,
    "persistence": "memory",
    "disclaimer": "illustrative_demo",
    "total": 128,
    "distribution": { "low": 46, "medium": 38, "high": 32, "critical": 12 },
    "topIndicators": [{ "code": "credential_request", "count": 41 }],
    "recent": []
  }
}
```

`disclaimer` is one of `illustrative_demo`, `session_memory`, `supabase_live`, `supabase_empty`, or `supabase_unavailable`. Illustrative mode is used only when nothing has been recorded in memory and Supabase is not configured. A database outage does not fall back to those sample numbers.

### `GET /api/learning/modules`

Returns `{ "ok": true, "modules": [ ... ] }` from `data/learning_modules.json`. Each module has English and Tamil fields and a quiz whose `correctIndex` is inside `choices`.

## Database

`supabase/migrations/001_analytics.sql` creates:

- `analysis_events`: id, timestamp, kind, risk category, score band, indicator codes, language, `ai_used`, `consent_to_ai`.
- `learning_progress`: reserved for a future signed-in sync. The MVP stores quiz progress in the browser only.

Both tables enable and force row level security. There is no anon policy. The server uses the service role only if both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. Inserts and reads go through the Supabase REST API. A failed write does not fail the person's check.

## Scoring

Documented weights live in `server/src/detectors/weights.ts`.

Within a group, findings are ordered by weight. The first counts in full, the second at half, and the rest at a quarter. The group is then capped. The total is capped at 100.

Bands: 0–24 low, 25–49 medium, 50–74 high, 75–100 critical.

### Message groups

| Code | Weight | Group | Group cap |
| --- | --- | --- | --- |
| Urgency | 16 | pressure | 28 |
| Account or legal threat | 18 | pressure | 28 |
| Secret request, OTP or account password | 30 | secrets | 56 |
| Secret request, ordinary password | 18 | secrets | 56 |
| Transfer to verify or unlock | 54 | secrets | 56 |
| UPI or wallet approval | 16 | secrets | 56 |
| Prize or job fee | 52 | lure | 52 |
| Named organization | 10 | identity | 12 |
| Shortened link | 14 | links | 16 |
| HTTP link | 8 | links | 16 |
| Remote-access tool | 40 | install | 40 |
| Generic app install | 18 | install | 40 |

A request for an OTP is ignored when the surrounding words say not to share it. A lone password request, such as a Wi-Fi password, stays in the low band. Naming Amazon or a bank is recorded and stays low unless other patterns are present.

### URL groups

| Code | Weight | Group | Group cap |
| --- | --- | --- | --- |
| HTTP | 12 | transport | 14 |
| Missing scheme | 6 | transport | 14 |
| IP hostname | 30 | host | 30 |
| Five or more labels | 14 | structure | 26 |
| Port other than 80 or 443 | 16 | structure | 26 |
| Long address or path | 10 | structure | 26 |
| Brand token on a non-official domain | 32 | deception | 40 |
| Lookalike or digit homoglyph | 30 | deception | 40 |
| Punycode host | 16 | deception | 40 |
| Account-style path | 12 | deception | 40 |
| Known shortener | 14 | shortener | 14 |
| Embedded username or password | 52 | credentials | 52 |
| Sensitive query name | 18 | credentials | 52 |

Official brand domains are listed in `server/src/detectors/url/brands.ts`. HTTPS adds no trust points. HTTP alone stays low. A shortener alone stays low. The parser accepts only `http` and `https`.

## Security

- JSON bodies are limited to 32 KB. Messages are limited to 4,000 characters and URLs to 2,048.
- Zod validates every analysis body. Helmet sets security headers. CORS origins come from `CORS_ORIGIN`.
- Analysis routes are rate-limited. The default is 30 requests per minute. `TRUST_PROXY=true` is required before the limiter should trust `X-Forwarded-For`.
- Errors return a code. They do not return stack traces, environment values, or the parser's raw message.
- Request logs contain the method, path, status, and duration. They do not contain the body.
- Submitted URLs are not fetched. Tests replace `fetch` and assert it is not called by the URL engine.
- The AI prompt puts the system rules in a system message and the person's text in a delimited untrusted block. The reply must match a Zod schema: an explanation up to 800 characters and at most four short cautions.
- The client renders text with React. It does not inject HTML. Highlighting splits strings into text nodes.
- The copied summary omits the submission, evidence snippets, and any AI text that might repeat them.

## Testing

Server tests use Vitest and Supertest. Client tests use Vitest, Testing Library, and jsdom.

```bash
npm test
npm run lint
npm run typecheck
```

`data/sample_messages.json` is executed by the detector tests. Expected codes and bands are exact. See `docs/test-cases.md`.

## Known limitations

- The rules miss calm scams that avoid these phrases, and they can flag an ordinary password or a real delivery notice.
- Short brand names are matched as whole tokens. Edit-distance lookalikes run only for names of six or more letters, so some short typos pass.
- Punycode is flagged. Confusable letters from other scripts are not fully mapped to Latin brands.
- A shortener's destination is unknown because the server does not follow links.
- Tamil detection covers the phrases in the detectors, not every dialect or spelling.
- Session counts disappear when the API process stops. Illustrative dashboard numbers are labeled and are not measurements.
- Quiz progress is per browser. The `learning_progress` table is not written yet.
- There is no login. That is deliberate for the checker.

# SURAKSHIT

Think before you click.

SURAKSHIT is an open-source helper for people who want a plain explanation of a suspicious message or link. It is aimed at students, first-time internet users, older adults, rural users, and anyone who sends money from a phone and should not have to be a security specialist.

The checker lists the patterns it recognized and a heuristic score from 0 to 100. That score is not a probability, and it is not a verdict. A low result is not a promise that something is safe.

## Repository checklist

- [x] [README](README.md) with [setup steps](#local-setup) and [environment variables](#environment-variables)
- [x] [Technical design document](docs/technical-design.md), including the [architecture diagram](docs/technical-design.md#architecture)
- [x] [Sample data](data/sample_messages.json) and [test cases](docs/test-cases.md)
- [x] [License file](LICENSE)

## Problem

People are asked every day to forward a one-time code, approve a payment, pay a fee for a prize or a job, or install a remote-access app. The message often wears the name of a bank, a courier, or a help desk. Tools that only say "scam" or "safe" are hard to trust, and they are often wrong.

SURAKSHIT slows that moment down. It shows which rules matched, explains them in English or Tamil, and suggests a safer next step. It does not open the link.

## Features

- Message checks for urgency, secrets, prize and job fees, threats, payment requests, shortened links, and remote-access apps.
- URL checks for scheme, IP hosts, long or lookalike names, shorteners, unusual ports, embedded passwords, and sensitive query names. The server does not fetch the address.
- Risk bands: low, medium, high, and critical, with the points that remained after overlapping rules were discounted.
- Optional AI note. The model can explain the rules that already fired. It cannot change the score. The app is fully usable with no AI key.
- Learning center with six short lessons and a knowledge check. Scores stay in the browser.
- Activity view. Before any check, the numbers are labeled illustrative demo data. After a check, the view shows the current server session. Raw text is not stored.
- English and Tamil, with the choice saved locally. Light and dark appearance.

## Screenshots

Images are not stored in this repository. These are the screens a local run shows:

1. **Home.** The tagline, two actions (check a message, check a URL), three steps, the feature list, safety habits, and the privacy note.
2. **Check.** A message or URL form, a sample paste button, a character count, an opt-in for AI, and a result panel with the band, the meter, the patterns, and the next steps.
3. **Learn.** Six lesson cards. Each lesson has warning signs, a synthetic example, safer actions, and a three-question check.
4. **Activity.** A banner that says whether the figures are illustrative, from the current session, or from Supabase, plus band and pattern charts.
5. **About.** Language, privacy, limits, the scoring bands, the MIT license, links to cybercrime.gov.in and CERT-In, and the helpline number 1930.

## Architecture

The React client talks to an Express API. The API runs a deterministic rule engine. Supabase and an OpenAI-compatible model are optional. Details and a diagram are in [docs/architecture.md](docs/architecture.md). The scoring tables and API fields are in [docs/technical-design.md](docs/technical-design.md).

```text
client/     React, Vite, TypeScript, Tailwind
server/     Express, TypeScript, Zod
data/       Synthetic messages and bilingual lessons
supabase/   Optional migration for anonymized events
docs/       Architecture, design, and test cases
```

## Technology

- React 18, React Router, Tailwind CSS, Lucide, Recharts, React Hook Form, Zod
- Node.js 20+, Express, Helmet, CORS, express-rate-limit, Zod
- Vitest, Testing Library, Supertest, ESLint, TypeScript
- Optional: Supabase Postgres, any OpenAI-compatible chat API

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

No database and no API key are required.

## Local setup

```bash
npm install
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env`. Leave the secrets blank.

Start both processes:

```bash
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:4000

The Vite dev server proxies `/api` to the API. You can also run them separately:

```bash
npm run dev:server
npm run dev:client
```

## Environment variables

See `.env.example`.

| Name | Where | Purpose |
| --- | --- | --- |
| `PORT` | Server | API port. Default 4000 |
| `CORS_ORIGIN` | Server | Comma-separated browser origins |
| `TRUST_PROXY` | Server | Set `true` only behind a trusted proxy |
| `RATE_LIMIT_MAX` | Server | Analysis calls per minute. Default 30 |
| `AI_API_KEY` | Server only | Optional. Never put this in a `VITE_` variable |
| `AI_MODEL` | Server | Model name for the chat endpoint |
| `AI_BASE_URL` | Server | OpenAI-compatible base URL |
| `AI_TIMEOUT_MS` | Server | Provider timeout. Default 8000 |
| `SUPABASE_URL` | Server | Optional project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Optional. Bypasses RLS. Never expose it to the browser |
| `VITE_API_BASE_URL` | Client | Empty in local dev. In production, the public API origin |

## Supabase

1. Create a project.
2. Run `supabase/migrations/001_analytics.sql` in the SQL editor.
3. Put the project URL and the service role key in the server environment only.
4. Restart the API. `/api/health` then reports `"persistence": "supabase"`.

The tables store codes and bands, not messages or URLs. Row Level Security is on, with no policies for the public keys. If the database is unset or unreachable, checks still work. An unreachable database does not get replaced with fake counts.

Quiz rows are not written. Lesson scores stay in `localStorage`.

## Tests and lint

```bash
npm test
npm run lint
npm run typecheck
```

`npm test` runs the server tests, then the client tests. Case-by-case expectations are in [docs/test-cases.md](docs/test-cases.md).

## Production build

```bash
npm run build
npm start
```

`npm start` serves the bundled API from `server/dist/index.js`. Serve `client/dist` as static files and set `VITE_API_BASE_URL` at build time to the API origin. Set `CORS_ORIGIN` to the site origin.

### Vercel

The client is a Vite single-page app. Import `client` as a Vite project, set `VITE_API_BASE_URL`, and deploy. Host the API on a Node service that can run `npm start`. Do not put server secrets in Vercel client environment variables.

## API

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/health` | Process status, without secrets |
| POST | `/api/analyze/message` | Rule check for a message |
| POST | `/api/analyze/url` | Rule check for an address. The address is not opened |
| GET | `/api/analytics/summary` | Illustrative, session, or database counts |
| GET | `/api/learning/modules` | Bilingual lessons and quizzes |

Field-level contracts are in [docs/technical-design.md](docs/technical-design.md).

## Privacy and security

- The checker does not require an account.
- Raw messages and full URLs are not stored.
- Query values and URL passwords are not returned or logged.
- AI runs only after a visible opt-in, and only if the server has a key. URL userinfo and query values are removed before that call. Long digit runs are removed from messages.
- Analysis bodies are size-limited, validated, and rate-limited.
- Submitted content is rendered as text, not as HTML.
- Official reporting for incidents in India: [cybercrime.gov.in](https://cybercrime.gov.in), [CERT-In](https://www.cert-in.org.in), helpline 1930. SURAKSHIT does not file the report.

## Known limitations

A careful scam that avoids these phrases can score low. A real bank alert or a request for a Wi-Fi password can score above zero. HTTPS does not prove a site is trustworthy, and HTTP does not prove it is malicious. Shorteners are cautions because the destination is never fetched. Lookalike detection is a small brand list plus simple confusable digits, not a full Unicode confusable table. Tamil coverage is the phrases in the detectors and the translated interface, not every way a scam can be written.

More detail is in the technical design.

## Future improvements

- Stronger Internationalized Domain Name confusable mapping.
- A signed-in option that writes `learning_progress` without storing message text.
- More Indian languages.
- A way for a local facilitator to download the anonymized session counts.

## License

MIT. Copyright (c) 2026 R. Tazim Sheriff, Seerthi Adhavan, and Sakthi Saran. See [LICENSE](LICENSE).

## Sample data

`data/sample_messages.json` holds the synthetic messages and addresses used by the tests. `data/learning_modules.json` holds the lessons. Do not replace them with real personal data or live malicious links.

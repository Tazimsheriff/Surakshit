# Test cases

Synthetic inputs only. Do not open the sample URLs. None of them are invitations to visit a live site. IP addresses used here are from the documentation ranges TEST-NET-1 (`192.0.2.0/24`) and TEST-NET-3 (`203.0.113.0/24`).

The machine-readable copy is `data/sample_messages.json`. Detector tests load that file and require the indicator codes and risk band to match.

## Messages

| Id | What it checks | Expected band | Expected indicators |
| --- | --- | --- | --- |
| `safe-meeting` | Ordinary plans | Low | None |
| `safe-otp-advice` | "Never share your OTP" | Low | None. Negation suppresses the secret-request rule |
| `safe-shipping` | A real-looking delivery sentence | Low | `impersonation` only. A familiar name is context |
| `wifi-password` | False positive for fraud | Low | `credential_request` at the lower password weight |
| `otp-and-threat` | Bank name, block threat, OTP, urgency | High | `account_threat`, `credential_request`, `impersonation`, `urgency` |
| `prize-fee` | Lottery plus a processing fee | High | `prize_or_job_fee` |
| `job-fee` | Job plus a registration fee | High | `prize_or_job_fee` |
| `remote-support` | Support desk plus AnyDesk | High | `app_install`, `impersonation` |
| `unlock-transfer` | Pay to unlock a wallet | High | `verification_transfer` |
| `tamil-otp` | Tamil account threat and OTP request | High | Same four codes as `otp-and-threat` |
| `critical-combo` | Threat, OTP, transfer, AnyDesk, and a short HTTP link | Critical | Those patterns together |

Additional unit cases, not all repeated in the JSON file:

- An OTP split by a zero-width character is still detected after normalization.
- Empty text and text longer than 4,000 characters are rejected.
- The analysis object does not contain the full submitted message.

## URLs

| Id | What it checks | Expected band or error | Expected indicators |
| --- | --- | --- | --- |
| `ordinary-https` | A normal HTTPS page | Low | None. HTTPS is not treated as proof of trust |
| `plain-http` | `http://example.com` | Low | `insecure_http` |
| `missing-scheme` | `example.com/docs` | Low | `missing_scheme` |
| `ip-host` | HTTPS on `192.0.2.20` | Medium | `ip_hostname` |
| `shortener` | A shortener host | Low | `url_shortener`. Not labeled as confirmed fraud |
| `lookalike` | `paypa1.com` | Medium | `lookalike_domain` |
| `brand-in-unrelated-domain` | Brand token on `example.com` | Medium | `brand_impersonation` |
| `deceptive-path-only` | `/secure-login` on `example.com` | Low | `deceptive_path` |
| `many-labels` | Five or more host labels | Low | `excessive_subdomains` |
| `punycode` | `xn--` host | Low | `punycode_host` |
| `stacked-url-signals` | HTTP, test-net IP, port 8080, brand-like path | High | `deceptive_path`, `insecure_http`, `ip_hostname`, `unusual_port` |
| `malformed` | `http://` | Error `malformed` | Not scored |
| `unsupported-scheme` | `javascript:` | Error `unsupported_scheme` | Not executed |

Separate tests use a fake username and password in a URL and assert that neither value appears in the API response or the analytics summary. They also assert that global `fetch` is not called while a URL is scored.

## API cases

| Case | Expected |
| --- | --- |
| `GET /api/health` with a fake key in the environment | 200, `aiConfigured: true`, body does not contain the key |
| Empty message | 400 `validation_error` |
| Message of 4,001 characters | 400 `validation_error` |
| Malformed URL | 422 `invalid_url` |
| Broken JSON | 400 `invalid_json` without the parser's internal text |
| Four analysis calls when the test limit is 3 | The fourth is 429 `rate_limited` |
| First summary before any check | `illustrative: true`, disclaimer `illustrative_demo` |
| Summary after a check | `illustrative: false`, mode `session`, and the message text is absent |
| Learning modules | Six modules in a stable order |

## AI cases

| Case | Expected |
| --- | --- |
| No consent, key present | Provider is not called. Reason `no_consent`. Score unchanged |
| Consent, no key | Provider is not called. Reason `not_configured` |
| Consent, provider throws | 200, reason `unavailable`, rule score kept |
| Consent, reply is not the JSON schema | Reason `invalid_response` |
| Consent, valid JSON explanation | `used: true`. The system message stays separate from the untrusted block |
| Provider never completes | The request aborts and the rule result is returned |

## Client cases

| Case | Expected |
| --- | --- |
| Language button தமிழ் | Navigation shows முகப்பு and `localStorage` stores `ta` |
| Analyze with an empty message | A validation alert, and `fetch` is not called |
| Paste sample message | The first synthetic sample fills the field |
| Highlight markup | An `<img>` string stays text. No image element is created |
| Copy summary | Contains the score and the pattern title. Omits an OTP that was only in the evidence |

## How to run

From the repository root, with Node.js 20 or newer:

```bash
npm install
npm test
npm run lint
npm run typecheck
```

`npm test` runs the server suite first, then the client suite. Server tests do not need a listening port. They build the Express app in memory.

# Security Policy

Thanks for helping keep **WhatsApp Clone** and its users safe.

This project implements several security-relevant mechanisms (AES-256-GCM encryption at rest, stateless JWT with Redis-based revocation, per-user/per-IP rate limiting, input validation, Helmet, CORS, contact-gated authorization, and per-user soft deletes) and we take reports seriously.

---

## Supported Versions

Only the latest `main` branch receives security updates at this time. Once the project issues tagged releases, the most recent `MINOR` version will be supported.

| Version     | Supported          |
| ----------- | ------------------ |
| `main`      | :white_check_mark: |
| Older tags  | :x:                |

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately via one of:

1. **GitHub Security Advisory** *(preferred)* — open a draft advisory at
   [github.com/Raghu128/whatsApp_clone/security/advisories/new](https://github.com/Raghu128/whatsApp_clone/security/advisories/new).
   This keeps the report private until a fix is ready.
2. **Email** — send details to `raghu22386@iiitd.ac.in` with the subject line `SECURITY: whatsApp_clone`.

### What to include

- A clear description of the vulnerability and its impact.
- Steps to reproduce (minimal repro case, affected endpoint/service, request payload).
- Affected commit SHA or branch.
- Any suggested mitigation if you have one.

### What to expect

- **Acknowledgement** within **72 hours** of the initial report.
- **Initial assessment** within **7 days**, including a severity classification.
- **Fix + coordinated disclosure** — we'll keep you updated on progress and credit you in the advisory unless you prefer to remain anonymous.

Please give us a reasonable window to fix the issue before public disclosure. As a rough default we aim for **90 days**, but this can be shorter for critical issues and longer for complex ones; we will coordinate with you.

---

## Out of Scope

The following are typically **not** considered vulnerabilities for this project:

- Missing rate limiting on endpoints that are explicitly public (e.g. `/health`).
- Theoretical cryptographic concerns without a concrete exploit path (the project uses NIST-approved AES-256-GCM and industry-standard JWT).
- Social-engineering attacks against the project maintainer or individual users.
- Denial-of-service attacks that merely exhaust finite compute/memory on a single-node deployment. (This is a portfolio project; production hardening against DoS is an explicit non-goal of the current codebase.)

When in doubt — report it anyway; we'd rather triage a false positive than miss a real issue.

---

## Known Hardening Gaps (Transparent Disclosure)

This project is a learning/portfolio codebase and is **not** hardened for production deployment out of the box. Known limitations (also tracked in the README's Roadmap section):

- **Encryption key management** is environment-variable based, not KMS-backed. Key rotation is unimplemented; rotating the AES key would render existing messages undecryptable.
- **gRPC between services does not use mTLS.** Services trust each other based on network position; this is safe only inside a private cluster.
- **No circuit breakers or retry budgets** between services — a slow downstream can cascade.
- **No observability stack** (metrics/tracing) is included; you get structured logs only.
- **Single-node databases** in the default Docker Compose — sharding/replication is documented as strategy, not deployed.

None of the above are accepted as vulnerabilities in this repository *as shipped*; they are upstream architectural constraints. However, if you find a bug that makes any of them exploitable beyond the documented limits, please report it.

---

## Thank You

Responsible disclosure from security researchers is the single biggest force-multiplier for keeping open-source projects safe. If you report a valid issue, you will be credited in the GitHub Security Advisory and the fix commit unless you prefer to stay anonymous.

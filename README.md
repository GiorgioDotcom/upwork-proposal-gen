# upwork-proposal-gen

Generates a personalized Upwork proposal from a pasted job post, calibrated to a
freelancer profile (stack, rate, tone). Stores every job post + proposal +
outcome so you can later learn what actually converts.

Built with **NestJS + PostgreSQL + Claude API**.

## How it works

1. `POST /proposal` with the job post text.
2. A fast model (Haiku) extracts keywords / requirements as JSON.
3. A stronger model (Sonnet) writes the proposal using a system prompt built
   from your profile in [`src/config/profile.config.ts`](src/config/profile.config.ts).
4. The job post and proposal are saved to Postgres (`outcome = pending`).
5. After applying, mark the result with `PATCH /proposals/:id`.
6. `GET /analytics/win-rate` shows win rate per keyword.

The single highest-leverage file is `src/config/profile.config.ts` — edit it to
change how proposals sound.

## Setup

```bash
cp .env.example .env        # then fill ANTHROPIC_API_KEY
createdb upwork_proposals   # local Postgres
npm install
npm run start:dev
```

Schema auto-syncs in dev (TypeORM `synchronize`). Switch to migrations before
any real deploy.

## API

| Method | Route                    | Body                          | Purpose                       |
| ------ | ------------------------ | ----------------------------- | ----------------------------- |
| GET    | `/health`                | —                             | Health check                  |
| POST   | `/proposal`              | `{ "jobText": "..." }`        | Generate + store a proposal   |
| PATCH  | `/proposals/:id`         | `{ "outcome": "won\|lost" }`  | Record the outcome            |
| GET    | `/analytics/win-rate`    | —                             | Win rate grouped by keyword   |

### Example

```bash
curl -s localhost:3000/proposal \
  -H 'content-type: application/json' \
  -d '{"jobText":"We need a NestJS dev to build a multi-tenant REST API on AWS Lambda with Postgres..."}' | jq

curl -s -X PATCH localhost:3000/proposals/<id> \
  -H 'content-type: application/json' \
  -d '{"outcome":"won"}'
```

## Models

- Extraction: `claude-haiku-4-5-20251001`
- Writing: `claude-sonnet-4-6`

Override via `EXTRACT_MODEL` / `WRITE_MODEL` env vars.

## Roadmap

- Minimal web form / Retool UI instead of curl
- Migrations (replace `synchronize`)
- Tone A/B + analytics on what converts

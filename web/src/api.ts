const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type Outcome = 'pending' | 'won' | 'lost';

export interface ProposalListItem {
  id: string;
  content: string;
  model: string;
  outcome: Outcome;
  createdAt: string;
  keywords: string[];
  jobExcerpt: string;
}

export interface GenerateResponse {
  id: string;
  content: string;
  model: string;
  outcome: Outcome;
}

export interface WinRateRow {
  keyword: string;
  total: number;
  won: number;
  win_rate: number | null;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function generateProposal(jobText: string) {
  return fetch(`${BASE}/proposal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jobText }),
  }).then((r) => handle<GenerateResponse>(r));
}

export function listProposals() {
  return fetch(`${BASE}/proposals`).then((r) =>
    handle<ProposalListItem[]>(r),
  );
}

export function setOutcome(id: string, outcome: Outcome) {
  return fetch(`${BASE}/proposals/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ outcome }),
  }).then((r) => handle<unknown>(r));
}

export function getWinRate() {
  return fetch(`${BASE}/analytics/win-rate`).then((r) =>
    handle<WinRateRow[]>(r),
  );
}

import { useEffect, useState } from 'react';
import './App.css';
import {
  generateProposal,
  getWinRate,
  listProposals,
  setOutcome,
  type Outcome,
  type ProposalListItem,
  type WinRateRow,
} from './api';

type Tab = 'generate' | 'history' | 'analytics';

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={`badge badge-${outcome}`}>{outcome}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function OutcomeControls({
  id,
  current,
  onChange,
}: {
  id: string;
  current: Outcome;
  onChange: (o: Outcome) => void;
}) {
  const opts: Outcome[] = ['pending', 'won', 'lost'];
  return (
    <div className="outcome-controls">
      {opts.map((o) => (
        <button
          key={o}
          className={`chip ${current === o ? 'chip-active' : ''}`}
          onClick={async () => {
            await setOutcome(id, o);
            onChange(o);
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function GeneratePanel({ onGenerated }: { onGenerated: () => void }) {
  const [jobText, setJobText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateProposal(jobText);
      setResult(res.content);
      onGenerated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <label className="label">Paste the Upwork job post</label>
      <textarea
        className="textarea"
        rows={10}
        value={jobText}
        placeholder="Paste the full job description here…"
        onChange={(e) => setJobText(e.target.value)}
      />
      <div className="row">
        <button
          className="btn-primary"
          disabled={loading || jobText.trim().length < 30}
          onClick={run}
        >
          {loading ? 'Generating…' : 'Generate proposal'}
        </button>
        <span className="hint">{jobText.trim().length} chars</span>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <div className="result-head">
            <strong>Generated proposal</strong>
            <CopyButton text={result} />
          </div>
          <pre className="proposal-text">{result}</pre>
          <p className="hint">
            Review it, then paste into Upwork and submit yourself. Mark the
            outcome under History once you know.
          </p>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({
  items,
  reload,
}: {
  items: ProposalListItem[];
  reload: () => void;
}) {
  if (items.length === 0)
    return <div className="empty">No proposals yet. Generate one first.</div>;

  return (
    <div className="panel">
      {items.map((p) => (
        <div key={p.id} className="card">
          <div className="card-head">
            <div className="meta">
              <OutcomeBadge outcome={p.outcome} />
              <span className="muted">
                {new Date(p.createdAt).toLocaleString()}
              </span>
              <span className="muted">· {p.model}</span>
            </div>
            <CopyButton text={p.content} />
          </div>

          {p.keywords.length > 0 && (
            <div className="keywords">
              {p.keywords.slice(0, 12).map((k) => (
                <span key={k} className="kw">
                  {k}
                </span>
              ))}
            </div>
          )}

          {p.jobExcerpt && <div className="excerpt">{p.jobExcerpt}…</div>}

          <details>
            <summary>Show proposal</summary>
            <pre className="proposal-text">{p.content}</pre>
          </details>

          <OutcomeControls id={p.id} current={p.outcome} onChange={reload} />
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel({ rows }: { rows: WinRateRow[] }) {
  if (rows.length === 0)
    return (
      <div className="empty">
        No data yet. Win rate appears once you mark outcomes as won/lost.
      </div>
    );
  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Total</th>
            <th>Won</th>
            <th>Win rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.keyword}>
              <td>{r.keyword}</td>
              <td>{r.total}</td>
              <td>{r.won}</td>
              <td>
                {r.win_rate == null ? '—' : `${Math.round(r.win_rate * 100)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [items, setItems] = useState<ProposalListItem[]>([]);
  const [rows, setRows] = useState<WinRateRow[]>([]);

  function reloadHistory() {
    listProposals().then(setItems).catch(() => {});
  }
  function reloadAnalytics() {
    getWinRate().then(setRows).catch(() => {});
  }

  useEffect(() => {
    reloadHistory();
    reloadAnalytics();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Upwork Proposal Generator</h1>
        <nav className="tabs">
          {(['generate', 'history', 'analytics'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? 'tab-active' : ''}`}
              onClick={() => {
                setTab(t);
                if (t === 'history') reloadHistory();
                if (t === 'analytics') reloadAnalytics();
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'generate' && (
          <GeneratePanel
            onGenerated={() => {
              reloadHistory();
              reloadAnalytics();
            }}
          />
        )}
        {tab === 'history' && (
          <HistoryPanel
            items={items}
            reload={() => {
              reloadHistory();
              reloadAnalytics();
            }}
          />
        )}
        {tab === 'analytics' && <AnalyticsPanel rows={rows} />}
      </main>
    </div>
  );
}

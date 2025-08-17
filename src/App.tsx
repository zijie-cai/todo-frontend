import { useState } from "react";

const API_BASE = "https://todo-scheduler-api.zai28.workers.dev"; // <-- change

type Block = { title: string; start: string | null; end: string | null; explanation: string };

export default function App() {
  const [raw, setRaw] = useState(
    `finish SoP by 5pm (~90m)
email Sam (10m)
gym 45m`
  );
  const [plan, setPlan] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseToTasks = (text: string) =>
    text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const mMin = /(\d+)\s?m/i.exec(line);
        const mHr = /(\d+)\s?h/i.exec(line);
        const duration_min = mMin ? +mMin[1] : mHr ? +mHr[1] * 60 : 30;

        const due = /(\d{1,2}):(\d{2})\s?(am|pm)?/i.exec(line);
        const due_at = due
          ? (() => {
              const d = new Date();
              let h = +due[1],
                mi = +due[2];
              const ap = (due[3] || "").toLowerCase();
              if (ap === "pm" && h < 12) h += 12;
              if (ap === "am" && h === 12) h = 0;
              d.setHours(h, mi, 0, 0);
              return d.toISOString();
            })()
          : null;

        return { title: line.replace(/\(.*?\)/g, "").trim(), duration_min, due_at };
      });

  async function preview() {
    setLoading(true);
    setError(null);
    try {
      const tasks = parseToTasks(raw);
      const r = await fetch(`${API_BASE}/plan/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setPlan(j.blocks || []);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>Auto-Prioritize & Schedule — Preview</h2>
      <p style={{ color: "#555" }}>Type tasks (one per line). Include hints like “(~90m)” or “5:00pm”.</p>
      <textarea
        rows={8}
        style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={preview} disabled={loading} style={{ padding: "8px 14px", borderRadius: 6 }}>
          {loading ? "Planning…" : "Preview plan"}
        </button>
      </div>
      {error && <div style={{ color: "crimson", marginTop: 10 }}>Error: {error}</div>}
      <div style={{ marginTop: 16 }}>
        {plan.map((b, i) => (
          <div key={i} style={{ padding: 10, border: "1px solid #eee", borderRadius: 8, margin: "10px 0" }}>
            <b>{b.title}</b>
            <div>
              {b.start && b.end
                ? `${new Date(b.start).toLocaleTimeString()} – ${new Date(b.end).toLocaleTimeString()}`
                : "No slot today"}
            </div>
            <small style={{ color: "#666" }}>{b.explanation}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
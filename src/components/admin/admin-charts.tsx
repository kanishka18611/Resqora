import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_TONES = ["var(--success)", "var(--warning)", "var(--alert)", "var(--primary)"];

export function CountBarChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <section className="glass-panel rounded-3xl p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No data recorded yet.</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function SharePieChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="glass-panel rounded-3xl p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No data recorded yet.</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_TONES[index % PIE_TONES.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: PIE_TONES[index % PIE_TONES.length] }}
            />
            {entry.name} · {entry.value}
          </li>
        ))}
      </ul>
    </section>
  );
}

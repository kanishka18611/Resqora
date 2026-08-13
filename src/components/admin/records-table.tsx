import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/system/empty-state";

export type RecordColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  /** Plain text used by the search box. */
  text?: (row: T) => string;
};

/** Searchable, responsive table used by every admin log/report view. */
export function RecordsTable<T extends { id: string }>({
  rows,
  columns,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = "Search records",
}: {
  rows: T[];
  columns: RecordColumn<T>[];
  emptyTitle: string;
  emptyDescription: string;
  searchPlaceholder?: string;
}) {
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      columns.some((column) => (column.text?.(row) ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, columns, term]);

  return (
    <section className="glass-panel rounded-3xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="rounded-2xl pl-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="pb-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 pr-4 align-top text-foreground">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

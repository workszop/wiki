import { listAuditEntries } from "@/lib/audit";

export const metadata = { title: "Audit log — Firmowe Wiki" };
export const dynamic = "force-dynamic"; // always fresh

const ACTION_LABELS: Record<string, string> = {
  "page.create": "Utworzenie",
  "page.update": "Edycja",
  "page.delete": "Usunięcie",
  "page.restore": "Przywrócenie",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { entries, total } = await listAuditEntries({
    limit,
    offset,
    action: params.action,
    space: params.space,
    actorEmail: params.actor,
    from: params.from,
    to: params.to,
  }).catch(() => ({ entries: [], total: 0 }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-gray-500">Historia zmian w bazie wiedzy ({total} wpisów)</p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          name="actor"
          defaultValue={params.actor}
          placeholder="E-mail autora"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          name="action"
          defaultValue={params.action}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Wszystkie akcje</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          name="space"
          defaultValue={params.space}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Wszystkie przestrzenie</option>
          <option value="companies">Spółki</option>
          <option value="products">Produkty</option>
          <option value="contacts">Kontakty</option>
          <option value="technologies">Technologie</option>
        </select>
        <input
          name="from"
          type="date"
          defaultValue={params.from}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          name="to"
          type="date"
          defaultValue={params.to}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="rounded bg-[var(--color-brand)] text-white px-4 py-1.5 text-sm hover:bg-[var(--color-brand-dark)] transition-colors"
        >
          Filtruj
        </button>
        <a
          href="/admin/audit"
          className="rounded border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Resetuj
        </a>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Czas</th>
              <th className="px-4 py-3 text-left">Autor</th>
              <th className="px-4 py-3 text-left">Akcja</th>
              <th className="px-4 py-3 text-left">Artykuł</th>
              <th className="px-4 py-3 text-left">Przestrzeń</th>
              <th className="px-4 py-3 text-left">Opis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Brak wpisów spełniających kryteria.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {new Date(e.event_time).toLocaleString("pl-PL")}
                </td>
                <td className="px-4 py-3 text-gray-700">{e.actor_email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.action === "page.delete"
                        ? "bg-red-100 text-red-700"
                        : e.action === "page.create"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ACTION_LABELS[e.action] ?? e.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {e.entity_id ? (
                    <a href={`/wiki/${e.entity_id}`} className="text-blue-600 hover:underline">
                      {e.entity_title ?? e.entity_id}
                    </a>
                  ) : (
                    e.entity_title ?? "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize">{e.space ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{e.diff_summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <a
              href={`?page=${page - 1}&action=${params.action ?? ""}&space=${params.space ?? ""}&actor=${params.actor ?? ""}&from=${params.from ?? ""}&to=${params.to ?? ""}`}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              Poprzednia
            </a>
          )}
          <span className="text-gray-500">
            Strona {page} z {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?page=${page + 1}&action=${params.action ?? ""}&space=${params.space ?? ""}&actor=${params.actor ?? ""}&from=${params.from ?? ""}&to=${params.to ?? ""}`}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              Następna
            </a>
          )}
        </div>
      )}
    </div>
  );
}

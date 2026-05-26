import { getStalePages, getTopAuthors, getTotalPageCount } from "@/lib/wikijs-client";

export const metadata = { title: "Dashboard — Firmowe Wiki" };

// Revalidate every 5 minutes — dashboard data doesn't need to be real-time
export const revalidate = 300;

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-3xl font-bold text-[var(--color-brand)]">{value}</div>
      <div className="mt-1 font-medium text-gray-700">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const [total, stale, authors] = await Promise.all([
    getTotalPageCount().catch(() => 0),
    getStalePages(180).catch(() => []),
    getTopAuthors(10).catch(() => []),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Dashboard administratora</h1>
        <p className="mt-1 text-sm text-gray-500">Przegląd stanu bazy wiedzy</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Artykułów łącznie" value={total} />
        <StatCard
          label="Nieaktualnych"
          value={stale.length}
          sub="starsze niż 6 miesięcy"
        />
        <StatCard label="Autorów aktywnych" value={authors.length} />
        <StatCard
          label="Do przejrzenia"
          value={stale.filter((p) => !p.isPublished).length}
          sub="nieopublikowanych"
        />
      </div>

      {/* Stale content table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Stale content ({stale.length})
        </h2>
        {stale.length === 0 ? (
          <p className="text-sm text-gray-500">Brak nieaktualnych artykułów.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Tytuł</th>
                  <th className="px-4 py-3 text-left">Przestrzeń</th>
                  <th className="px-4 py-3 text-left">Autor</th>
                  <th className="px-4 py-3 text-left">Ostatnia edycja</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stale.map((p) => {
                  const space = p.path.split("/")[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <a href={`/wiki/${p.path}`} className="text-blue-600 hover:underline">
                          {p.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{space}</td>
                      <td className="px-4 py-3 text-gray-500">{p.authorName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.updatedAt).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.isPublished
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.isPublished ? "Opublikowany" : "Wersja robocza"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top authors */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Top autorzy</h2>
        <div className="flex flex-wrap gap-3">
          {authors.map((a, i) => (
            <div
              key={a.name}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
            >
              <span className="text-gray-400 text-xs w-4 text-right">{i + 1}.</span>
              <span className="font-medium">{a.name}</span>
              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
                {a.count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

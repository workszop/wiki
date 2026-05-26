import { getRecentPages, getMostViewedPages } from "@/lib/wikijs-client";

const SPACES = [
  {
    key: "companies",
    label: "Spółki",
    icon: "🏢",
    description: "Informacje o spółkach grupy",
    href: "/wiki/companies",
    color: "bg-blue-50 border-blue-200",
  },
  {
    key: "products",
    label: "Produkty",
    icon: "📦",
    description: "Katalog produktów i usług",
    href: "/wiki/products",
    color: "bg-green-50 border-green-200",
  },
  {
    key: "contacts",
    label: "Kontakty",
    icon: "👥",
    description: "Katalog pracowników i działów",
    href: "/wiki/contacts",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    key: "technologies",
    label: "Technologie",
    icon: "⚙️",
    description: "Narzędzia, systemy i standardy",
    href: "/wiki/technologies",
    color: "bg-purple-50 border-purple-200",
  },
];

function PageCard({ page }: { page: { id: number; path: string; title: string; updatedAt: string } }) {
  return (
    <a
      href={`/wiki/${page.path}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400 hover:shadow transition-shadow"
    >
      <div className="font-medium text-blue-700 line-clamp-1">{page.title}</div>
      <div className="mt-1 text-xs text-gray-400">
        Zaktualizowano: {new Date(page.updatedAt).toLocaleDateString("pl-PL")}
      </div>
    </a>
  );
}

export default async function LandingPage() {
  const [recent, popular] = await Promise.all([
    getRecentPages(8).catch(() => []),
    getMostViewedPages(8).catch(() => []),
  ]);

  return (
    <div className="space-y-12">
      {/* Search */}
      <section className="rounded-xl bg-[var(--color-brand)] px-8 py-12 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Firmowe Wiki</h1>
        <p className="mb-6 text-blue-100">Wewnętrzna baza wiedzy grupy kapitałowej</p>
        <form action="/wiki/s" method="get" className="flex max-w-xl mx-auto gap-2">
          <input
            name="q"
            type="search"
            placeholder="Szukaj w bazie wiedzy..."
            aria-label="Szukaj"
            className="flex-1 rounded-lg px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-white text-[var(--color-brand)] font-semibold px-5 py-3 text-sm hover:bg-blue-50 transition-colors"
          >
            Szukaj
          </button>
        </form>
      </section>

      {/* Spaces */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Przestrzenie</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SPACES.map((s) => (
            <a
              key={s.key}
              href={s.href}
              className={`rounded-xl border-2 p-6 hover:shadow-md transition-shadow ${s.color}`}
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-semibold text-gray-800">{s.label}</div>
              <div className="mt-1 text-sm text-gray-500">{s.description}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Recently added */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Ostatnio dodane</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recent.map((p) => (
              <PageCard key={p.id} page={p} />
            ))}
          </div>
        </section>
      )}

      {/* Most viewed (falls back to popular/recent) */}
      {popular.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Najczęściej oglądane</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {popular.map((p) => (
              <PageCard key={p.id} page={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

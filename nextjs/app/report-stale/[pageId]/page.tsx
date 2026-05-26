import ReportStaleForm from "./ReportStaleForm";
import { getPageById } from "@/lib/wikijs-client";

export const metadata = { title: "Zgłoś nieaktualny artykuł — Firmowe Wiki" };

export default async function ReportStalePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const id = parseInt(pageId, 10);
  const page = isNaN(id) ? null : await getPageById(id).catch(() => null);

  if (!page) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Zgłoś nieaktualny artykuł</h1>
        <p className="text-gray-500">Nie znaleziono artykułu.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Zgłoś nieaktualny artykuł</h1>
      <p className="mb-6 text-sm text-gray-500">
        Artykuł:{" "}
        <a href={`/wiki/${page.path}`} className="text-blue-600 hover:underline">
          {page.title}
        </a>
      </p>
      <ReportStaleForm pageId={id} pageTitle={page.title} pagePath={page.path} />
    </div>
  );
}

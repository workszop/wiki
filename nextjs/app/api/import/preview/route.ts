import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import matter from "gray-matter";

const VALID_SPACES = new Set(["companies", "products", "contacts", "technologies"]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("zip");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Brak pliku ZIP" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy plik ZIP" }, { status: 400 });
  }

  const articles: {
    path: string;
    title: string;
    description: string;
    tags: string[];
    space: string;
    content: string;
    error?: string;
  }[] = [];

  const mdFiles = Object.entries(zip.files).filter(
    ([name, f]) => name.endsWith(".md") && !f.dir
  );

  if (mdFiles.length === 0) {
    return NextResponse.json({ error: "ZIP nie zawiera plików .md" }, { status: 400 });
  }

  for (const [filename, zipEntry] of mdFiles) {
    const raw = await zipEntry.async("string");

    let parsed: ReturnType<typeof matter>;
    try {
      parsed = matter(raw);
    } catch (e) {
      articles.push({
        path: filename,
        title: filename,
        description: "",
        tags: [],
        space: "",
        content: "",
        error: `Błąd parsowania YAML front matter: ${String(e)}`,
      });
      continue;
    }

    const fm = parsed.data as Record<string, unknown>;
    const title = (fm.title as string | undefined) ?? "";
    const description = (fm.description as string | undefined) ?? "";
    const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
    const content = parsed.content.trim();

    // Determine space from front matter or directory structure
    const dirPart = filename.split("/")[0];
    const space =
      (fm.space as string | undefined) ??
      (VALID_SPACES.has(dirPart) ? dirPart : "");

    if (!title) {
      articles.push({
        path: filename,
        title: filename,
        description,
        tags,
        space,
        content,
        error: "Brak pola 'title' w front matter",
      });
      continue;
    }

    if (!VALID_SPACES.has(space)) {
      articles.push({
        path: filename,
        title,
        description,
        tags,
        space,
        content,
        error: `Nieprawidłowa przestrzeń '${space}'. Dozwolone: ${[...VALID_SPACES].join(", ")}`,
      });
      continue;
    }

    // Build Wiki.js path: space/slug-from-title or provided path
    const customPath = fm.path as string | undefined;
    const articlePath =
      customPath && customPath.startsWith(`${space}/`)
        ? customPath
        : `${space}/${slugify(title)}`;

    articles.push({ path: articlePath, title, description, tags, space, content });
  }

  return NextResponse.json({ articles });
}

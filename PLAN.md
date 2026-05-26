# Plan MVP — Firmowe Wiki grupy kapitałowej

## Kontekst

Grupa kapitałowa potrzebuje wewnętrznej bazy wiedzy dla ~5 000 pracowników, początkowo zasilonej do ~200 artykułów, docelowo do 50 000. PRD (v1.0, 26.05.2026) obejmuje cztery przestrzenie (Spółki / Produkty / Kontakty / Technologie), pełnotekstowe wyszukiwanie z polskim stemmingiem, edytor Markdown+WYSIWYG, wersjonowanie, SSO przez Microsoft 365, panel administracyjny z importem masowym Markdown, audit log oraz WCAG 2.1 AA. Wiedza jest dziś rozproszona po mailach, dyskach i głowach — celem jest skrócenie czasu wyszukiwania o 60% i onboardingu o 30%.

Decyzje architektoniczne uzgodnione z użytkownikiem:
- **Wiki.js 2.5+** jako rdzeń (edytor, wersjonowanie, search, SSO, audit, GraphQL API).
- **Next.js 15 + TypeScript** jako warstwa portalowa nad Wiki.js (custom landing, dashboard admina, statystyki, kreator importu, formularz „zgłoś nieaktualne", strona raportów). Konsumuje GraphQL Wiki.js.
- **Postgres 15** współdzielony.
- **On-prem / VPS firmowy**, deploy przez Docker Compose, reverse proxy (Caddy lub Traefik) z dzieloną domeną cookie.
- **SSO: Microsoft 365 / Entra ID przez OIDC** z mapowaniem grup na role.

## Zasada nadrzędna: nie powielamy tego, co robi Wiki.js

Każdy widok, który Wiki.js już ma (edytor, historia/diff, drzewo nawigacji, komentarze, lista artykułów, admin uprawnień, asset manager), pozostaje w Wiki.js. Next.js dodaje **wyłącznie** to, czego Wiki.js nie ma natywnie albo co wymaga brandingu grupy. Reguła egzekwowana w code review.

## Podział odpowiedzialności

**Wiki.js (natywnie, bez modyfikacji kodu):**
- `/wiki/*` — przeglądanie, edycja, historia, diff, restore, komentarze, drzewo, breadcrumbs, TOC, asset upload, admin użytkowników/grup/uprawnień, locale `pl`.
- Cztery przestrzenie jako top-level page groups z osobnymi page rules per grupa Entra ID.
- Tagi, statusy (Draft/Published), powiązane artykuły przez native page links.

**Next.js (portal + admin-extras):**
- `/` — landing z kafelkami 4 przestrzeni, „Ostatnio dodane", „Najczęściej oglądane", globalne pole wyszukiwania (przekierowuje do `/wiki/s`).
- `/dashboard` — dashboard admina: liczba artykułów, stale content (>X miesięcy bez modyfikacji), top autorzy, nieużywane tagi.
- `/admin/import` — kreator masowego importu ZIP+YAML front matter.
- `/admin/audit` — przeglądanie audit logu (z custom tabeli `audit_log`).
- `/report-stale/[pageId]` — formularz „Zgłoś nieaktualne".
- `/api/graphql-proxy` — server-side proxy do GraphQL Wiki.js z wstrzykiwanym tokenem serwisowym.
- Theme override Wiki.js dla nagłówka, logotypu grupy, panelu backlinków w sidebar artykułu.

## Luki PRD vs. Wiki.js — gdzie budujemy

| Funkcja PRD | Pokrycie Wiki.js | Gdzie budujemy |
|---|---|---|
| Polski stemming w search (F-10) | Postgres FTS z `polish` dictionary OK do 10K; **Manticore z analizatorem Stempel** rekomendowane przy 50K. | Wiki.js search module config + Docker service. Decision gate w tygodniu 6 na bazie realnego korpusu. |
| Bulk import ZIP + YAML front matter (F-29) | Brak. Jest Git sync i disk storage. | **Next.js `/admin/import`**: parser ZIP → odczyt front matter (`gray-matter`) → mapowanie folderów na przestrzenie → tworzenie stron przez GraphQL `pages.create`. Podgląd przed zatwierdzeniem + log błędów. |
| Backlinki / „Co linkuje do tego" (F-5) | Dane są (`pageLinks` w DB), brak UI. | Theme override sidebar Wiki.js, dane przez GraphQL `pages.links`. |
| Dashboard, stale content, top autorzy (F-31) | Brak. | **Next.js `/dashboard`** + zapytania GraphQL `pages.list` z filtrami `updatedAt`. |
| „Zgłoś nieaktualne" + notyfikacje (F-25, F-26) | Brak. | **Next.js form** → custom tabela Postgres → SMTP (Nodemailer) → mail do autora + moderatora przestrzeni. Subskrypcje: cron job z dziennym digest. |
| Audit log granularny (F-32) | Logi auth + część admin, brak strony-level. | Postgres trigger na `pages` i `pageHistory` zapisujący do `audit_log`; UI w Next.js `/admin/audit`. |
| Sync użytkowników z IdP (F-34, F-35) | OIDC z group claims + JIT provisioning. | **MVP: tylko OIDC group claims** (Entra ID Group ID → rola Wiki.js w `auth.strategies.oidc.mapGroups`). SCIM endpoint odłożony poza MVP. |
| Markdown export (F-30) | Można obejść przez page.list + page.single GraphQL. | **Next.js endpoint** generujący ZIP z Markdown + obrazami. |

## Rollout 12-tygodniowy

**Faza 1 — Fundament (tygodnie 1–4). Cel: pierwsze logowanie pracowników, edycja, search.**
- Docker Compose: `wiki`, `db`, `caddy`. Helmcharts/Kubernetes odłożone.
- Konfiguracja Entra ID: rejestracja aplikacji, redirect URI, claim `groups` (Group ID, security groups only).
- `wiki/config.yml`: OIDC strategy z `mapGroups`, locale `pl`, search = Postgres FTS z `polish` dictionary.
- Cztery przestrzenie utworzone ręcznie z page rules per grupa.
- Smoke test: 5 pilotażowych użytkowników, każda rola.
- **Definition of Done:** Anna (czytelnik) może wyszukać, Marek (edytor) edytuje, Katarzyna (admin) widzi audit log auth.

**Faza 2 — Portal i wyszukiwanie (tygodnie 5–8). Cel: branded UX, sensowny search przy realnym korpusie.**
- Next.js landing + dashboard v1 + backlinks panel.
- Theme override Wiki.js (logo, kolory grupy).
- Decision gate tydzień 6: Postgres FTS vs. Manticore — testujemy oba na 1 000 zaimportowanych artykułów. Kryterium: p95 < 500 ms i akceptowalna jakość PL.
- Subskrypcje + dzienny digest mailowy.
- **DoD:** landing dostępny pod root, 1 000 testowych artykułów, search p95 < 500 ms.

**Faza 3 — Admin i jakość (tygodnie 9–12). Cel: produkcyjna gotowość, import 200+ artykułów.**
- Kreator importu ZIP+YAML z podglądem i logiem.
- Formularz „Zgłoś nieaktualne" + notyfikacje.
- Audit log (trigger + UI).
- Markdown export.
- Audyt a11y WCAG 2.1 AA (axe-core + ręczny test klawiatury).
- Load test przy 10 000 artykułów.
- Backup Postgres (cron + retencja 30 dni), runbook RTO/RPO.
- **DoD:** 200+ artykułów produkcyjnych, SLO 99,5% w godz. pracy, RPO ≤ 24h, RTO ≤ 4h zweryfikowane.

**Odłożone poza MVP:** SCIM, AI (podsumowania/semantic search), aplikacja natywna, tryb offline, Slack/Teams, wielojęzyczność, workflow akceptacji, eksport PDF/Confluence, „did you mean" (chyba że dostarczy silnik search natywnie).

## Ryzyka i mitygacje

- **Drift API Wiki.js.** Wiki.js 3.x to przepisanie. **Pinujemy 2.5.x explicitly** w docker-compose, typowany klient GraphQL (`graphql-codegen`), upgrade traktujemy jako osobny projekt.
- **Mapowanie grup Entra ID.** Grupy w tokenie to GUIDy, nie nazwy; grupy nested/dynamic czasem nie przepływają. **Mapowanie GUIDów jawnie w config.yml**, tabela mapowań w dokumentacji, test na nie-admin pilotażu przed rollout.
- **Drift indeksu search.** Manticore/ES jeśli wybrane — indeksacja sterowana przez Wiki.js (nie dual-write). Scheduled reindex + health endpoint widoczny w dashboardzie.
- **Double-maintenance.** Regulamin code review: jeśli Wiki.js to robi, my tego nie budujemy. Każda nowa strona Next.js wymaga uzasadnienia „dlaczego nie w Wiki.js".
- **Sanityzacja Markdown (F-7.4).** Wiki.js renderuje przez DOMPurify; dla niestandardowych komponentów Next.js używamy `rehype-sanitize` z listą dozwolonych tagów.

## Krytyczne pliki / konfiguracje do utworzenia

- `/docker-compose.yml` — serwisy: `wiki` (Wiki.js 2.5.x pinned), `db` (Postgres 15), `search` (warunkowo Manticore), `nextjs`, `caddy` z TLS i shared cookie domain.
- `/wiki/config.yml` — sekcje: `db.host`, `auth.strategies.oidc` (clientId, clientSecret, authorizationURL, tokenURL, userInfoURL, groupsClaim=`groups`, mapGroups: GUID→nazwa grupy Wiki.js), `search.module`, `logLevel=info`, `uploads.maxFileSize=10MB`.
- `/nextjs/app/page.tsx` — landing.
- `/nextjs/app/dashboard/page.tsx` — dashboard admina.
- `/nextjs/app/admin/import/page.tsx` — kreator importu.
- `/nextjs/app/admin/audit/page.tsx` — audit log UI.
- `/nextjs/app/report-stale/[pageId]/page.tsx` — formularz zgłoszenia.
- `/nextjs/lib/wikijs-client.ts` — typed GraphQL client z `graphql-codegen`.
- `/nextjs/lib/audit.ts` — query helper do `audit_log`.
- `/nextjs/.env` — `WIKIJS_GRAPHQL_URL`, `WIKIJS_SERVICE_TOKEN`, `SMTP_*`, `DATABASE_URL`.
- `/db/migrations/001_audit_log.sql` — tabela `audit_log` + triggery na `pages` i `pageHistory`.
- `/db/migrations/002_stale_reports.sql` — tabela `stale_reports`.
- `/db/migrations/003_subscriptions.sql` — tabela `subscriptions`.
- **Entra ID app registration** (poza repo): redirect URI `https://wiki.<domena>/login/oidc/callback`, ID token claims `groups` (Group ID, security groups), API permissions `openid profile email`, client secret w vault grupy.

## Weryfikacja end-to-end

1. **Smoke SSO.** Otwórz `https://wiki.<domena>`, login przez Entra ID, sprawdź że ról i widocznych przestrzeni odpowiada grupie użytkownika.
2. **Edycja + wersjonowanie.** Jako Marek-Edytor: utwórz artykuł, opublikuj, edytuj, zobacz historię, porównaj wersje, przywróć starszą.
3. **Search.** Wyszukaj polski termin z odmianą (np. „spółka" → znajduje „spółki", „spółką"). Zmierz p95 z 50 zapytaniami (`hey` lub k6).
4. **Import masowy.** ZIP z 50 plikami `.md` + YAML front matter + 1 błędnym plikiem. Sprawdź podgląd, log błędów, że obrazy się podlinkowały.
5. **Backlinki.** Artykuł A linkuje do B. Otwórz B — w sidebar widać A pod „Co linkuje do tego artykułu".
6. **„Zgłoś nieaktualne".** Kliknij na artykule, wyślij formularz, sprawdź mail u autora.
7. **Subskrypcja.** Zasubskrybuj artykuł, niech inny user go zmodyfikuje, sprawdź dzienny digest.
8. **Audit.** Zmień rolę użytkownikowi, sprawdź wpis w `/admin/audit`.
9. **Backup/restore.** Zatrzymaj DB, przywróć z dump'a, sprawdź spójność. Zmierz czas — cel RTO ≤ 4h.
10. **a11y.** `axe-core` na landing, dashboard, widoku artykułu, edytorze. Pełna obsługa klawiaturą `Tab` po landing → search → wynik → artykuł → edytor.
11. **Load.** k6 na 10 000 artykułów: 100 concurrent readers, p95 page load < 1s, p95 search < 500 ms.

## Open issues do uzgodnienia przed startem

- **Decyzja Postgres FTS vs. Manticore** — tydzień 6, decision owner: Katarzyna (admin) + IT.
- **Polityka retencji audit log** — PRD mówi 12 miesięcy. Zweryfikować z compliance grupy.
- **Domena i certyfikat TLS** — wymaga IT (LE czy wewnętrzny CA).
- **Tabela mapowania grup Entra ID → role Wiki.js** — wymaga HR/IT współpracy przed konfiguracją OIDC.
- **Skąd przyjdą pierwsze 200 artykułów** — Confluence? Dyski? Maile? To definiuje wymagania importera (czy YAML front matter wystarczy, czy parser trzeba rozszerzyć).

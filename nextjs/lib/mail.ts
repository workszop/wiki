import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

export async function sendStaleNotification(params: {
  authorEmail: string;
  pageTitle: string;
  pagePath: string;
  reason: string;
  reporterEmail?: string;
}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_WIKI_BASE_URL ?? "";
  const pageUrl = `${base}/wiki/${params.pagePath}`;

  await sendMail({
    to: params.authorEmail,
    subject: `[Wiki] Artykuł zgłoszony jako nieaktualny: ${params.pageTitle}`,
    html: `
      <p>Artykuł <strong><a href="${pageUrl}">${params.pageTitle}</a></strong>
      został zgłoszony jako nieaktualny.</p>
      ${params.reason ? `<p><strong>Powód:</strong> ${params.reason}</p>` : ""}
      ${params.reporterEmail ? `<p><strong>Zgłosił(a):</strong> ${params.reporterEmail}</p>` : ""}
      <p>Sprawdź artykuł i zaktualizuj treść, jeśli to konieczne.</p>
    `,
    text: `Artykuł "${params.pageTitle}" zgłoszony jako nieaktualny.\n${params.reason ? `Powód: ${params.reason}\n` : ""}Adres: ${pageUrl}`,
  });
}

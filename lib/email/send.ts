import { Resend } from "resend";

function fromAddress() {
  return (
    process.env.EMAIL_FROM ?? "No Boring Cars <onboarding@resend.dev>"
  );
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false as const, skipped: true, error: "Missing RESEND_API_KEY" };
  }

  const to = (Array.isArray(options.to) ? options.to : [options.to]).filter(
    Boolean,
  );
  if (to.length === 0) {
    return { ok: false as const, skipped: true, error: "No recipients" };
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (error) {
    return { ok: false as const, skipped: false, error: error.message };
  }
  return { ok: true as const, skipped: false };
}

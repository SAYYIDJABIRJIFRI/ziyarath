import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Ziyarath" },
      {
        name: "description",
        content:
          "How Ziyarath collects, uses and protects your information. Read our full privacy policy.",
      },
      { property: "og:title", content: "Privacy Policy — Ziyarath" },
      { property: "og:description", content: "Our commitment to your privacy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Legal</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: May 2026</p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 prose prose-neutral dark:prose-invert">
        <div className="space-y-8 text-foreground">
          {[
            {
              h: "Introduction",
              p: "Ziyarath respects your privacy and is committed to protecting the personal information you share with us. This policy explains what we collect and how we use it.",
            },
            {
              h: "Information We Collect",
              p: "We may collect your email address and optional WhatsApp number when you subscribe to our newsletter, and basic analytics about how visitors use our site.",
            },
            {
              h: "How We Use Information",
              p: "Your contact information is used solely to deliver content you have requested. We never sell your data to third parties.",
            },
            {
              h: "Cookies",
              p: "We use minimal cookies to remember your theme preference and gather anonymous usage statistics.",
            },
            {
              h: "Your Rights",
              p: "You can unsubscribe at any time and request deletion of your data by emailing hello@ziyarath.com.",
            },
            {
              h: "Contact",
              p: "For any privacy-related questions, please contact hello@ziyarath.com.",
            },
          ].map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
      </article>
    </SiteLayout>
  );
}

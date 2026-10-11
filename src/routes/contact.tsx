import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Mail, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Ziyarath — Get in Touch" },
      {
        name: "description",
        content:
          "Reach out to Ziyarath for collaboration, contributions, or to share Islamic heritage stories from your community.",
      },
      { property: "og:title", content: "Contact Ziyarath" },
      { property: "og:description", content: "Get in touch with the Ziyarath team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            We'd love to hear from you
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Questions, contributions, or a story to share? Send us a message — we read every one.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            {[
              { Icon: Mail, title: "Email", text: "hello@ziyarath.com" },
              { Icon: MessageCircle, title: "WhatsApp", text: "+91 00000 00000" },
              { Icon: MapPin, title: "Based in", text: "Kerala, India" },
            ].map(({ Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-hero text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-2xl border border-border bg-card p-8 shadow-card"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-foreground">Name</span>
                <input
                  required
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-foreground">Email</span>
                <input
                  type="email"
                  required
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-foreground">Subject</span>
              <input
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-foreground">Message</span>
              <textarea
                rows={5}
                required
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              className="mt-6 w-full rounded-full gradient-hero px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]"
            >
              Send message
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

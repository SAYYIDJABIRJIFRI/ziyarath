import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Heart, Globe, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Ziyarath — Our Mission for Islamic Heritage" },
      {
        name: "description",
        content:
          "Ziyarath is a modern Islamic heritage platform documenting mosques, dargahs, scholars and sacred history across Kerala, India and the world.",
      },
      { property: "og:title", content: "About Ziyarath" },
      { property: "og:description", content: "Our mission to preserve and share Islamic heritage." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { Icon: Heart, title: "Reverence", text: "Every place we document is treated with the dignity it deserves." },
  { Icon: Globe, title: "Global, Local", text: "From Mecca to Malabar — heritage that connects ummah across geographies." },
  { Icon: BookOpen, title: "Authentic Sources", text: "Carefully researched history grounded in scholarship." },
  { Icon: Users, title: "Community", text: "Built with and for travelers, students and seekers." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 pattern-soft opacity-50" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">About Us</p>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl lg:text-6xl">
            Preserving the <span className="text-gradient-gold">Sacred Stories</span> of Islam
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/80 leading-relaxed sm:text-lg">
            Ziyarath is a modern digital companion for those who seek to understand,
            visit and honor the Islamic heritage of Kerala, India and the world.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl font-semibold">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We believe sacred places carry the breath of centuries — the prayers of
              scholars, the footsteps of saints, the labor of artisans. Ziyarath exists
              to make this heritage accessible, beautifully and respectfully, for the
              next generation of Muslims and curious travelers alike.
            </p>
          </div>
          <div className="animate-fade-up">
            <h2 className="font-display text-3xl font-semibold">Our Story</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Born from a love for Kerala's ancient mosques and the realization that so
              much of our shared Islamic story remains unwritten online, Ziyarath is a
              quiet labor of preservation — page by page, place by place.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-gold">
                <Icon className="h-5 w-5 text-gold-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

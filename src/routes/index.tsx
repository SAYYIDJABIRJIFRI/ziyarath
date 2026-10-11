import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, BookOpen, Sparkles, Compass, Mail } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import heroMosque from "@/assets/hero-mosque.jpg";
import placeHaram from "@/assets/place-haram.jpg";
import placeNabawi from "@/assets/place-nabawi.jpg";
import placeMalikDinar from "@/assets/place-malikdinar.jpg";
import keralaHeritage from "@/assets/kerala-heritage.jpg";
import { getAllPosts, type BlogPost } from "@/data/posts";
import { resolveCover } from "@/lib/post-images";

export const Route = createFileRoute("/")({
  loader: async () => {
    const posts = getAllPosts();
    return { posts: posts.slice(0, 3) };
  },
  head: () => {
    const SITE = "https://ziyarath.com";
    return {
      meta: [
        { title: "Ziyarath — Islamic Heritage in Kerala, India & World" },
        {
          name: "description",
          content:
            "Explore mosques, dargahs, Islamic history, scholars and sacred places through Ziyarath, a modern Islamic heritage discovery platform.",
        },
        { property: "og:title", content: "Ziyarath — Islamic Heritage Discovery" },
        {
          property: "og:description",
          content:
            "A modern platform to discover sacred mosques, dargahs and Islamic heritage in Kerala, India and worldwide.",
        },
        { property: "og:image", content: heroMosque },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE}/` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: heroMosque },
      ],
      links: [
        { rel: "canonical", href: `${SITE}/` },
        { rel: "preload", as: "image", href: heroMosque, fetchpriority: "high" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${SITE}/#webpage`,
            url: `${SITE}/`,
            name: "Ziyarath — Discover Islamic Heritage",
            description:
              "Explore mosques, dargahs, Islamic history, scholars and sacred places across Kerala, India and the world.",
            isPartOf: { "@id": `${SITE}/#website` },
            about: { "@id": `${SITE}/#organization` },
            inLanguage: "en",
          }),
        },
      ],
    };
  },
  component: HomePage,
});

const PLACES = [
  {
    name: "Masjid al-Haram",
    location: "Mecca, Saudi Arabia",
    image: placeHaram,
    desc: "The Sacred Mosque, holiest site in Islam, surrounding the Kaaba — the qiblah of every Muslim.",
  },
  {
    name: "Al-Masjid an-Nabawi",
    location: "Medina, Saudi Arabia",
    image: placeNabawi,
    desc: "The Prophet's Mosque, second holiest site in Islam, built by Prophet Muhammad ﷺ himself.",
  },
  {
    name: "Malik Dinar Mosque",
    location: "Kasaragod, Kerala",
    image: placeMalikDinar,
    desc: "One of the oldest mosques in India, built by Malik Ibn Dinar — a foundation of Kerala's Islamic heritage.",
  },
];

const HIGHLIGHTS = [
  { Icon: MapPin, title: "Ancient Mosques", text: "Centuries-old wooden mosques dotting Kerala's coast." },
  { Icon: BookOpen, title: "Islamic Scholars", text: "Lives and works of luminaries who shaped Malabar Islam." },
  { Icon: Compass, title: "Trade History", text: "How Arab traders bridged Arabia and the Malabar Coast." },
  { Icon: Sparkles, title: "Cultural Heritage", text: "Living traditions, architecture and devotional practice." },
];

function HomePage() {
  const { posts: BLOG } = Route.useLoaderData() as { posts: BlogPost[] };
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 pattern-soft opacity-60" />
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--gold)] opacity-20 blur-3xl animate-glow"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="text-primary-foreground animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Premium Islamic Heritage Platform
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Discover Islamic Heritage Across{" "}
              <span className="text-gradient-gold">Kerala, India & The World</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Explore mosques, dargahs, Islamic history, scholars, and sacred places
              through a modern Islamic heritage platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#places"
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-elegant transition-transform hover:scale-[1.03]"
              >
                Explore Places <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-white/15"
              >
                Read Articles
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-gold/30 to-transparent blur-2xl" />
            <img
              src={heroMosque}
              alt="Serene mosque silhouette at dawn with Islamic geometric patterns"
              width={1536}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="relative w-full rounded-[2rem] border border-white/10 shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* FEATURED PLACES */}
      <section id="places" className="relative py-20 sm:py-28">
        <div className="absolute inset-0 pattern-geometric opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Featured Places
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Sacred Destinations Worth a Lifetime
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the holy cities of Arabia to Kerala's ancient coastal mosques.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {PLACES.map((p, i) => (
              <article
                key={p.name}
                style={{ animationDelay: `${i * 120}ms` }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                    <MapPin className="h-3 w-3 text-primary" />
                    {p.location}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  <button
                    aria-label={`Explore ${p.name}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
                  >
                    Explore <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* KERALA HERITAGE */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative animate-fade-up">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-gold/20 blur-2xl" />
            <img
              src={keralaHeritage}
              alt="Carved wooden interior of an ancient Kerala mosque"
              loading="lazy"
              width={1280}
              height={896}
              className="relative w-full rounded-3xl shadow-elegant"
            />
          </div>
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Kerala Islamic Heritage
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              A Thousand Years of Faith on the Malabar Coast
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Kerala's Islamic story is one of the oldest in the subcontinent — woven by
              Arab traders, scholars and saints whose legacy still stands in carved
              teakwood mosques and living traditions.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {HIGHLIGHTS.map(({ Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section className="relative py-20 sm:py-28 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                From the Journal
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Stories, History & Reflections
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
            >
              View all articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-3">
            {BLOG.map((post, i) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                search={{}}
                style={{ animationDelay: `${i * 120}ms` }}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={resolveCover(post.slug, post.image)}
                    alt={post.title}
                    loading="lazy"
                    width={800}
                    height={576}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-primary-foreground shadow-elegant sm:p-14">
            <div className="absolute inset-0 pattern-soft opacity-50" />
            <div
              aria-hidden
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl"
            />
            <div className="relative">
              <Mail className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
                Join the Ziyarath Community
              </h2>
              <p className="mt-3 max-w-xl text-white/80">
                Receive thoughtful articles on Islamic heritage, sacred sites and rare history — delivered with care.
              </p>
              <form
                className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  aria-label="Email address"
                  placeholder="Email address"
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm placeholder:text-white/60 backdrop-blur outline-none focus:border-gold"
                />
                <label htmlFor="newsletter-phone" className="sr-only">
                  WhatsApp number (optional)
                </label>
                <input
                  id="newsletter-phone"
                  type="tel"
                  aria-label="WhatsApp number (optional)"
                  placeholder="WhatsApp number (optional)"
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm placeholder:text-white/60 backdrop-blur outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to the Ziyarath newsletter"
                  className="rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:scale-105"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { getAllPosts, formatDate, type BlogPost } from "@/data/posts";
import { resolveCover } from "@/lib/post-images";
import { organizationLd, websiteLd, SITE_URL } from "@/lib/site-ld";

const PAGE_SIZE = 6;

const searchSchema = z.object({
  page: fallback(z.number().int().min(1), 1).default(1),
  q: fallback(z.string().max(100), "").default(""),
});

export const Route = createFileRoute("/blog/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => {
    return { q: deps.q.trim().slice(0, 80), posts: getAllPosts() };
  },
  head: ({ loaderData }) => {
    const q = loaderData?.q ?? "";
    const title = q
      ? `Search: “${q}” — Ziyarath Blog`
      : "Blog — Ziyarath | Islamic Heritage Articles";
    const description = q
      ? `Search results for “${q}” across Ziyarath articles on Islamic history, Kerala heritage and sacred mosques.`
      : "Articles on Islamic history, Kerala heritage, sacred mosques, scholars and the etiquette of ziyarath.";
    const url = q ? `${SITE_URL}/blog?q=${encodeURIComponent(q)}` : `${SITE_URL}/blog`;
    const blogLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${SITE_URL}/blog#blog`,
      name: "Ziyarath Blog",
      description,
      url: `${SITE_URL}/blog`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(q ? [{ name: "robots", content: "noindex,follow" }] : []),
        { property: "og:title", content: q ? `Search: “${q}” — Ziyarath` : "Ziyarath Blog" },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: "/blog" }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(organizationLd) },
        { type: "application/ld+json", children: JSON.stringify(websiteLd) },
        { type: "application/ld+json", children: JSON.stringify(blogLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-display text-3xl font-semibold">Could not load articles</h1>
        <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </SiteLayout>
  ),
  component: BlogPage,
});

function BlogPage() {
  const { page, q } = Route.useSearch();
  const { posts } = Route.useLoaderData() as { posts: BlogPost[]; q: string };
  const navigate = useNavigate({ from: "/blog/" });
  const [input, setInput] = useState(q);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) {
        navigate({ search: { q: input, page: 1 } as never, replace: true });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [input, q, navigate]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) => {
      const haystack = `${p.title} ${p.excerpt ?? ""} ${p.tag ?? ""} ${p.author ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [q, posts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const allTags = useMemo(
    () => Array.from(new Set(posts.map((p) => p.tag).filter(Boolean) as string[])).sort(),
    [posts],
  );
  const popularPosts = useMemo(() => posts.slice(0, 3), [posts]);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Journal
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Stories of Faith, History &amp; Heritage
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Carefully researched articles on Islamic history, sacred places and the
            living traditions of the ummah.
          </p>

          <div className="mt-8 max-w-xl">
            <label htmlFor="blog-search" className="sr-only">
              Search articles
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="blog-search"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search by title, topic or author…"
                maxLength={100}
                className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-11 text-sm shadow-card outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {q && (
          <p className="mb-8 text-sm text-muted-foreground">
            {filtered.length === 0
              ? "No articles found for"
              : `Showing ${filtered.length} ${filtered.length === 1 ? "article" : "articles"} for`}{" "}
            <span className="font-medium text-foreground">"{q}"</span>
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="space-y-12">
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="font-display text-2xl">Nothing matches “{q}”.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try a different keyword — a place, person or topic — or explore the
                suggestions below.
              </p>
              <button
                type="button"
                onClick={() => setInput("")}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Clear search
              </button>
            </div>

            {allTags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Browse by topic
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setInput(tag)}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Popular articles
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Readers are loving these
              </h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {popularPosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Blog pagination"
            className="mt-12 flex items-center justify-center gap-2"
          >
            <Link
              to="/blog"
              search={{ q, page: Math.max(1, current - 1) }}
              aria-label="Previous page"
              aria-disabled={current === 1}
              className={`inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground ${
                current === 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Link>

            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              const active = n === current;
              return (
                <Link
                  key={n}
                  to="/blog"
                  search={{ q, page: n }}
                  aria-current={active ? "page" : undefined}
                  className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {n}
                </Link>
              );
            })}

            <Link
              to="/blog"
              search={{ q, page: Math.min(totalPages, current + 1) }}
              aria-label="Next page"
              aria-disabled={current === totalPages}
              className={`inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground ${
                current === totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </section>
    </SiteLayout>
  );
}

function PostCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const img = resolveCover(post.slug, post.image);
  return (
    <article
      style={{ animationDelay: `${index * 100}ms` }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
    >
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        search={{}}
        className="block"
        aria-label={post.title}
      >
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={img}
            alt={post.title}
            loading="lazy"
            width={800}
            height={500}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {post.tag && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                {post.tag}
              </span>
            )}
            {post.isoDate && (
              <time dateTime={post.isoDate} className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(post.isoDate)}
              </time>
            )}
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold leading-snug group-hover:text-primary">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Read article{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}

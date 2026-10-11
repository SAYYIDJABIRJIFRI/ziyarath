import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArrowLeft, Calendar, User } from "lucide-react";
import {
  getAllPosts,
  getPostBySlug,
  formatDate,
  type BlogPost,
} from "@/data/posts";
import { resolveCover } from "@/lib/post-images";
import { organizationLd, websiteLd } from "@/lib/site-ld";

export const Route = createFileRoute("/blog_/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    const related = getAllPosts()
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) {
      return { meta: [{ title: "Article not found — Ziyarath" }] };
    }
    const SITE = "https://ziyarath.com";
    const url = `${SITE}/blog/${params.slug}`;
    const title = `${post.title} — Ziyarath`;
    const description = post.excerpt || "";
    const image = resolveCover(post.slug, post.image);

    const articleLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      isPartOf: {
        "@type": "Blog",
        "@id": `${SITE}/blog#blog`,
        name: "Ziyarath Journal",
      },
      headline: post.title,
      description,
      image: [image],
      datePublished: post.isoDate,
      dateModified: post.isoDate,
      inLanguage: "en-US",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
      publisher: organizationLd,
      author: {
        "@type": "Person",
        name: post.author,
      },
    };

    const breadcrumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "author", content: post.author },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "article:published_time", content: post.isoDate },
        { property: "article:modified_time", content: post.isoDate },
        ...(post.tag ? [{ property: "article:section", content: post.tag }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(websiteLd),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(articleLd),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbsLd),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Article not found</h1>
        <p className="mt-3 text-muted-foreground">
          The requested article could not be found or has been moved.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all articles
        </Link>
      </div>
    </SiteLayout>
  ),
  component: PostPage,
});

function PostPage() {
  const { post, related } = Route.useLoaderData() as {
    post: BlogPost;
    related: BlogPost[];
  };
  const coverImage = resolveCover(post.slug, post.image);
  const dateLabel = formatDate(post.isoDate);

  return (
    <SiteLayout>
      <article>
        <header className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
            {post.tag && (
              <span className="mt-6 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {post.tag}
              </span>
            )}
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {post.author && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {post.author}
                </span>
              )}
              {post.isoDate && (
                <time dateTime={post.isoDate} className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {dateLabel}
                </time>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <img
            src={coverImage}
            alt={post.title}
            width={1200}
            height={675}
            className="-mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-elegant"
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {post.content && post.content.length > 0 ? (
              post.content.map((item, idx) => {
                if (typeof item === "object" && "h" in item) {
                  return (
                    <h2
                      key={idx}
                      className="pt-6 font-display text-2xl font-semibold text-foreground sm:text-3xl"
                    >
                      {item.h}
                    </h2>
                  );
                }
                return (
                  <p
                    key={idx}
                    className="text-base leading-relaxed text-foreground/90 sm:text-lg"
                  >
                    {item}
                  </p>
                );
              })
            ) : (
              <p className="text-muted-foreground">No content yet.</p>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Continue reading
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((p) => {
                const img = resolveCover(p.slug, p.image);
                return (
                  <Link
                    key={p.slug}
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    search={{}}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={img}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      {p.tag && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {p.tag}
                        </span>
                      )}
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-primary">
                        {p.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

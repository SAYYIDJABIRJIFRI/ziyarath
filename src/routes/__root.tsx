import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void; info?: unknown }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "gU5Mrgagf-0z_bJT-xy7ekCJsLdLiCwF5UWvCsQWxG4" },
      { title: "Ziyarath — Islamic Heritage in Kerala, India & World" },
      { name: "description", content: "Explore mosques, dargahs, Islamic history, scholars and sacred places through Ziyarath, a modern Islamic heritage discovery platform." },
      { name: "author", content: "Ziyarath" },
      { name: "theme-color", content: "#0e6b4f" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Ziyarath" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Ziyarath — Islamic Heritage in Kerala, India & World" },
      { name: "twitter:title", content: "Ziyarath — Islamic Heritage in Kerala, India & World" },
      { property: "og:description", content: "Explore mosques, dargahs, Islamic history, scholars and sacred places through Ziyarath, a modern Islamic heritage discovery platform." },
      { name: "twitter:description", content: "Explore mosques, dargahs, Islamic history, scholars and sacred places through Ziyarath, a modern Islamic heritage discovery platform." },
      { property: "og:image", content: "https://ziyarath.com/hero-mosque.jpg" },
      { name: "twitter:image", content: "https://ziyarath.com/hero-mosque.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://ziyarath.com/#organization",
          name: "Ziyarath",
          url: "https://ziyarath.com",
          logo: {
            "@type": "ImageObject",
            url: "https://ziyarath.com/favicon.png",
          },
          description:
            "A modern Islamic heritage discovery platform — mosques, dargahs, scholars and sacred places of Kerala, India and the world.",
          sameAs: [],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://ziyarath.com/#website",
          url: "https://ziyarath.com",
          name: "Ziyarath",
          description:
            "Discover mosques, dargahs, scholars and sacred places across Kerala, India and the world.",
          inLanguage: "en",
          publisher: {
            "@id": "https://ziyarath.com/#organization",
          },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://ziyarath.com/maqam?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: (p) => <ErrorComponent error={p.error as Error} reset={p.reset} />,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

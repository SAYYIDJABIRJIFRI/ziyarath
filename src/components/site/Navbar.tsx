import { Link } from "@tanstack/react-router";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AdminProfileMenu } from "./AdminProfileMenu";
import logoMark from "@/assets/ziyarath-mark.png";
import logoFull from "@/assets/ziyarath-logo.png";
import { extractSubdomain, ROOT_DOMAIN } from "@/lib/subdomain-config";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "Blog" },
  { to: "/uroos", label: "ഉറൂസ്" },
  { to: "/maqam", label: "മഖാം" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const rootUrl = `https://${ROOT_DOMAIN}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    setIsSubdomain(Boolean(extractSubdomain(window.location.hostname)));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {isSubdomain ? (
          <a href={rootUrl} className="flex items-center group" aria-label="Ziyarath home">
            <img
              src={logoFull}
              alt="Ziyarath"
              className="hidden h-9 w-auto sm:block"
            />
            <img
              src={logoMark}
              alt="Ziyarath"
              className="h-9 w-9 sm:hidden"
            />
          </a>
        ) : (
          <Link to="/" className="flex items-center group" aria-label="Ziyarath home">
            <img
              src={logoFull}
              alt="Ziyarath"
              className="hidden h-9 w-auto sm:block"
            />
            <img
              src={logoMark}
              alt="Ziyarath"
              className="h-9 w-9 sm:hidden"
            />
          </Link>
        )}

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => {
            const isExternalToRoot = isSubdomain && item.to !== "/uroos" && item.to !== "/maqam";
            if (isExternalToRoot) {
              return (
                <a
                  key={item.to}
                  href={`${rootUrl}${item.to === "/" ? "" : item.to}`}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Top Right Admin Button showing personal profile & role actions */}
          <AdminProfileMenu className="hidden sm:inline-flex" />

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="md:hidden grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => {
              const isExternalToRoot = isSubdomain && item.to !== "/uroos" && item.to !== "/maqam";
              if (isExternalToRoot) {
                return (
                  <a
                    key={item.to}
                    href={`${rootUrl}${item.to === "/" ? "" : item.to}`}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-1">
              <AdminProfileMenu className="w-full justify-between" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

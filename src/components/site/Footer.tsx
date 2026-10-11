import { Link } from "@tanstack/react-router";
import { Github, Twitter, Instagram, Mail } from "lucide-react";
import logoFull from "@/assets/ziyarath-logo.png";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logoFull} alt="Ziyarath" className="h-10 w-auto" />
            <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
              A modern Islamic heritage discovery platform — exploring sacred mosques,
              dargahs, scholars and the rich Islamic history of Kerala, India and the world.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Connect
            </h4>
            <div className="mt-4 flex gap-3">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Github, href: "https://github.com/ziyarath", label: "GitHub" },
                { Icon: Mail, href: "mailto:hello@ziyarath.com", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Ziyarath. All rights reserved.</p>
          <p className="font-display italic">
            “And whoever holds firmly to Allah is indeed guided to a straight path.”
          </p>
        </div>
      </div>
    </footer>
  );
}

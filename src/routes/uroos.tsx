import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { UROOS_MONTHS, SOURCE_URL, type UroosMonth } from "@/data/uroos";
import { ALL_DEDICATED_UROOS } from "@/data/uroos-pages";
import { listUroosPublicFn } from "@/lib/content.functions";
import type { DbUroos } from "@/types/content";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  ExternalLink,
  Search,
  MapPin,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Globe2,
  Building2,
  Hash,
  BookOpen,
  Calendar,
  ArrowRight,
  Plus,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestDialog } from "@/components/site/RequestDialog";
import { REGION_LABELS, type MaqamRegion } from "@/data/maqams";

/* ---------- Search Schema ---------- */

const uroosRegionEnum = z.enum(["all", "kerala", "india", "middle-east", "worldwide"]);
const uroosViewEnum = z.enum(["featured", "grid", "timeline"]);
const uroosConnEnum = z.enum(["all", "connected", "standalone"]);

const uroosSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  month: fallback(z.union([z.coerce.number().int().min(1).max(12), z.literal("all")]), "all").default("all"),
  day: fallback(z.coerce.number().int().min(1).max(30).nullable(), null).default(null),
  region: fallback(uroosRegionEnum, "all").default("all"),
  view: fallback(uroosViewEnum, "featured").default("featured"),
  conn: fallback(uroosConnEnum, "all").default("all"),
});

export type UroosSearch = z.infer<typeof uroosSearchSchema>;

export const Route = createFileRoute("/uroos")({
  validateSearch: zodValidator(uroosSearchSchema),
  loader: async () => {
    const dynamicUroos = await listUroosPublicFn();
    return { dynamicUroos };
  },
  head: () => ({
    meta: [
      { title: "ഉറൂസ് കലണ്ടർ & സമഗ്ര ഗൈഡ് — Ziyarath" },
      {
        name: "description",
        content:
          "ഹിജ്റ വർഷത്തിലെ ഓരോ മാസത്തിലെയും ഉറൂസ് ദിനങ്ങളും മഹാന്മാരുടെ വിശദാംശങ്ങളും, സമഗ്ര സമർപ്പിത പേജുകളും.",
      },
      { property: "og:title", content: "ഉറൂസ് കലണ്ടർ & സമഗ്ര ഗൈഡ് — Ziyarath" },
      {
        property: "og:description",
        content:
          "ഹിജ്റ വർഷത്തിലെ ഓരോ മാസത്തിലെയും ഉറൂസ് ദിനങ്ങളും മഹാന്മാരുടെ വിശദാംശങ്ങളും, സമഗ്ര സമർപ്പിത പേജുകളും.",
      },
    ],
  }),
  component: UroosPage,
});

/* ---------- helpers ---------- */

function currentHijriMonth(): number {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      month: "numeric",
    }).formatToParts(new Date());
    const m = parts.find((p) => p.type === "month")?.value;
    const n = m ? parseInt(m, 10) : NaN;
    if (n >= 1 && n <= 12) return n;
  } catch {
    /* fall through */
  }
  // Fallback approximation
  const epoch = Date.UTC(622, 6, 16);
  const days = (Date.now() - epoch) / 86400000;
  const hYear = Math.floor((days * 30) / 10631) + 1;
  const yearStart = epoch + Math.floor(((hYear - 1) * 10631) / 30) * 86400000;
  const dayOfYear = Math.floor((Date.now() - yearStart) / 86400000);
  let acc = 0;
  for (let m = 1; m <= 12; m++) {
    acc += m % 2 === 1 ? 30 : 29;
    if (dayOfYear < acc) return m;
  }
  return 12;
}

const KERALA_KEYWORDS = [
  "ചാലിയം",
  "പെരുമ്പടപ്പ്",
  "നൂഞ്ഞേരി",
  "അമ്പങ്കുന്ന്",
  "ചെറുവണ്ണൂര്",
  "വാളക്കുളം",
  "തട്ടാങ്ങര",
  "പടിഞ്ഞാറങ്ങാടി",
  "താനൂര്",
  "കോഴിക്കോട്",
  "എടപ്പാള്",
  "ഐലക്കാട്",
  "മാമ്പുറം",
  "കൊണ്ടോട്ടി",
  "കണ്ണൂർ",
  "മാടായി",
  "പൊന്നാനി",
  "വയനാട്",
  "തങ്ങൾ",
  "ബീമാപള്ളി",
  "തിരുവനന്തപുരം",
  "കോട്ടക്കൽ",
  "വെളിയങ്കോട്",
  "വളപട്ടണം",
  "കാസർകോട്",
  "പാനൂർ",
  "തൃക്കരിപ്പൂർ",
];

const INDIA_KEYWORDS = [
  "അജ്മീർ",
  "വേലൂർ",
  "നാഗൂർ",
  "ട്രിച്ചി",
  "മുത്തുപ്പേട്ട",
  "ഡൽഹി",
  "ഖാജാ",
  "ബഖിയാത്ത്",
  "നതഹർ",
  "തമിഴ്നാട്",
  "കർണാടക",
  "ബംഗളൂരു",
  "മുംബൈ",
];

const MIDDLE_EAST_KEYWORDS = [
  "ഈജിപ്ത്",
  "ഇറാഖ്",
  "ബസ്വറ",
  "മക്ക",
  "മദീന",
  "ബഗ്ദാദ്",
  "സിറിയ",
  "യമൻ",
  "സൗദി",
  "തുർക്കി",
  "കൂഫ",
  "ഖുദ്സ്",
];

export type Region = MaqamRegion;

export function getUroosRegion(u: DbUroos): Region {
  if (u.region) return u.region;
  if (u.state?.toLowerCase() === "kerala") return "kerala";
  if (u.country?.toLowerCase() === "india") return "india";
  const meCountries = [
    "saudi arabia",
    "uae",
    "iraq",
    "syria",
    "egypt",
    "yemen",
    "oman",
    "qatar",
    "kuwait",
    "turkey",
    "jordan",
    "palestine",
  ];
  if (meCountries.includes(u.country?.toLowerCase() || "")) return "middle-east";
  return "worldwide";
}

function classifyRegion(text: string, pageId?: string): Region {
  if (pageId) {
    const found = ALL_DEDICATED_UROOS.find((u) => u.id === pageId);
    if (found?.region) return found.region;
  }
  if (KERALA_KEYWORDS.some((k) => text.includes(k))) return "kerala";
  if (INDIA_KEYWORDS.some((k) => text.includes(k))) return "india";
  if (MIDDLE_EAST_KEYWORDS.some((k) => text.includes(k))) return "middle-east";
  return "worldwide";
}

export type Flat = {
  month: UroosMonth;
  day: number;
  text: string;
  url: string | null;
  pageId?: string;
  region: Region;
};

function flatten(months: UroosMonth[]): Flat[] {
  const out: Flat[] = [];
  for (const m of months) {
    for (const d of m.days) {
      for (const e of d.entries) {
        out.push({
          month: m,
          day: d.day,
          text: e.text,
          url: e.url,
          pageId: e.pageId,
          region: classifyRegion(e.text, e.pageId),
        });
      }
    }
  }
  return out;
}

function highlightText(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--gold,oklch(0.85_0.14_85))]/40 text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/* ---------- page ---------- */

function UroosPage() {
  const { dynamicUroos = [] } = Route.useLoaderData() as { dynamicUroos: DbUroos[] };
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/uroos" });
  const hijri = useMemo(currentHijriMonth, []);

  // Sync state from query parameters
  const active = search.month;
  const selectedDay = search.day;
  const region = search.region;
  const view = search.view;
  const connFilter = search.conn;

  // Local search query with immediate typing reflection
  const [query, setQuery] = useState(search.q || "");
  const [detail, setDetail] = useState<Flat | null>(null);

  useEffect(() => {
    setQuery(search.q || "");
  }, [search.q]);

  const updateSearch = (patch: Partial<UroosSearch>) => {
    navigate({
      search: (prev: UroosSearch) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateSearch({ q: val });
  };

  const all = useMemo(() => flatten(UROOS_MONTHS), []);
  const totalEntries = all.length;
  const keralaCount = all.filter((e) => e.region === "kerala").length;
  const indiaCount = all.filter((e) => e.region === "india").length;
  const middleEastCount = all.filter((e) => e.region === "middle-east").length;
  const worldCount = all.filter((e) => e.region === "worldwide").length;

  const filteredDynamic = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dynamicUroos.filter((u) => {
      if (connFilter === "connected" && (u.isStandalone || !u.maqamId)) return false;
      if (connFilter === "standalone" && (!u.isStandalone && u.maqamId)) return false;
      if (region !== "all") {
        const uReg = getUroosRegion(u);
        if (uReg !== region) return false;
      }
      if (active !== "all" && u.hijriMonth !== active) return false;
      if (selectedDay !== null && u.hijriDay !== selectedDay) return false;
      if (!q) return true;
      return (
        u.title.toLowerCase().includes(q) ||
        (u.malayalamTitle && u.malayalamTitle.toLowerCase().includes(q)) ||
        u.city.toLowerCase().includes(q) ||
        (u.restingPerson && u.restingPerson.toLowerCase().includes(q))
      );
    });
  }, [dynamicUroos, connFilter, region, active, selectedDay, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((f) => {
      if (active !== "all" && f.month.num !== active) return false;
      if (region !== "all" && f.region !== region) return false;
      if (selectedDay !== null && f.day !== selectedDay) return false;
      if (!q) return true;
      return (
        f.text.toLowerCase().includes(q) ||
        f.month.name.toLowerCase().includes(q)
      );
    });
  }, [all, active, query, region, selectedDay]);

  // Month for the mini calendar (meaningful when a specific month is selected)
  const activeMonth =
    active === "all" ? null : UROOS_MONTHS.find((m) => m.num === active) ?? null;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Hijri Calendar · {totalEntries} Festival Dates · {dynamicUroos.length} Dedicated Pages
          </span>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-semibold tracking-tight">
            ഉറൂസ് കലണ്ടർ & സമഗ്ര ഗൈഡ്
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            ഹിജ്റ വർഷത്തിലെ 12 മാസങ്ങളിലെയും സമഗ്രമായ ഉറൂസ് ദിനങ്ങൾ, ചരിത്രപരമായ മഖാമുകൾ,
            പ്രത്യേക സമർപ്പിത പേജുകൾ, യാത്രാവിവരങ്ങൾ.
          </p>

          <div className="mt-5 flex justify-center">
            <RequestDialog
              type="uroos"
              title="Request an Uroos date"
              description="Missing an uroos date or page? Send us the Hijri date and details of the mahan — we'll review and create the page."
              subjectPlaceholder="ഉദാ. റജബ് 6 — ഖാജാ മുഈനുദ്ദീൻ (റ), അജ്മീർ"
              detailsPlaceholder="ഹിജ്റ മാസം, ദിവസം, മഹാന്റെ പേര്, സ്ഥലം, ആധാര സ്രോതസ്സ്…"
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5 shadow-sm">
                  <Plus className="h-4 w-4" /> ഉറൂസ് ദിനം നിർദ്ദേശിക്കുക
                </Button>
              }
            />
          </div>

          {/* Search + view toggle */}
          <div className="mt-8 mx-auto flex max-w-2xl flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <label htmlFor="uroos-search" className="sr-only">
                Search uroos by name, place, or month
              </label>
              <Input
                id="uroos-search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                aria-label="Search uroos by name, place, or month"
                placeholder="തിരയുക — പേര്, സ്ഥലം, മാസം..."
                className="pl-9 pr-9 h-11 bg-card"
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="inline-flex rounded-lg border border-border bg-card p-1 shrink-0">
              <button
                onClick={() => updateSearch({ view: "featured" })}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none",
                  view === "featured"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" /> Dedicated Pages ({dynamicUroos.length})
              </button>
              <button
                onClick={() => updateSearch({ view: "grid" })}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none",
                  view === "grid"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                onClick={() => updateSearch({ view: "timeline" })}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-none",
                  view === "timeline"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" /> Timeline
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Month chip nav */}
      <section className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
            <ChipButton
              active={active === "all"}
              onClick={() => updateSearch({ month: "all", day: null })}
              label="എല്ലാം"
              count={totalEntries}
            />
            {UROOS_MONTHS.map((m) => {
              const count = m.days.reduce((n, d) => n + d.entries.length, 0);
              return (
                <ChipButton
                  key={m.num}
                  active={active === m.num}
                  onClick={() => updateSearch({ month: m.num, day: null })}
                  label={m.name}
                  count={count}
                  highlight={m.num === hijri}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Region filter + mini calendar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Geographic Region
              </p>
              <div className="flex flex-wrap gap-2">
                <RegionChip
                  active={region === "all"}
                  onClick={() => updateSearch({ region: "all" })}
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="All Regions"
                  count={totalEntries}
                />
                <RegionChip
                  active={region === "kerala"}
                  onClick={() => updateSearch({ region: "kerala" })}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Kerala"
                  count={keralaCount}
                />
                <RegionChip
                  active={region === "india"}
                  onClick={() => updateSearch({ region: "india" })}
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="India"
                  count={indiaCount}
                />
                <RegionChip
                  active={region === "middle-east"}
                  onClick={() => updateSearch({ region: "middle-east" })}
                  icon={<Compass className="h-3.5 w-3.5" />}
                  label="Middle East"
                  count={middleEastCount}
                />
                <RegionChip
                  active={region === "worldwide"}
                  onClick={() => updateSearch({ region: "worldwide" })}
                  icon={<Globe2 className="h-3.5 w-3.5" />}
                  label="Worldwide"
                  count={worldCount}
                />
              </div>
            </div>

            {(selectedDay !== null || region !== "all" || query || active !== "all") && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Active filters:</span>
                {active !== "all" && (
                  <FilterPill
                    onClear={() => updateSearch({ month: "all", day: null })}
                    label={`Month: ${UROOS_MONTHS.find((m) => m.num === active)?.name || active}`}
                  />
                )}
                {selectedDay !== null && (
                  <FilterPill
                    onClear={() => updateSearch({ day: null })}
                    label={`Day ${selectedDay}`}
                  />
                )}
                {region !== "all" && (
                  <FilterPill
                    onClear={() => updateSearch({ region: "all" })}
                    label={`Region: ${REGION_LABELS[region] || region}`}
                  />
                )}
                {query && (
                  <FilterPill
                    onClear={() => handleQueryChange("")}
                    label={`"${query}"`}
                  />
                )}
                <button
                  onClick={() =>
                    updateSearch({
                      q: "",
                      month: "all",
                      day: null,
                      region: "all",
                      conn: "all",
                    })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                >
                  Reset all
                </button>
              </div>
            )}
          </div>

          {/* Mini calendar */}
          {activeMonth ? (
            <MiniCalendar
              month={activeMonth}
              selectedDay={selectedDay}
              onSelectDay={(d) => updateSearch({ day: d === selectedDay ? null : d })}
            />
          ) : (
            <Card className="p-5 text-center text-sm text-muted-foreground">
              <CalendarDays className="mx-auto mb-2 h-5 w-5 text-primary" />
              Pick a month above to see the day grid and filter by date.
            </Card>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <p className="mb-6 text-sm text-muted-foreground">
          {view === "featured" ? (
            <>
              Showing <span className="font-medium text-foreground">{filteredDynamic.length}</span>{" "}
              dedicated Uroos page{filteredDynamic.length === 1 ? "" : "s"}
              {query && <> for "{query}"</>}
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "entry" : "entries"}
              {query && <> for "{query}"</>}
            </>
          )}
        </p>

        {view === "featured" ? (
          <FeaturedUroosView
            uroosList={filteredDynamic}
            connFilter={connFilter}
            setConnFilter={(c) => updateSearch({ conn: c })}
            query={query}
            region={region}
            onResetRegion={() => updateSearch({ region: "all", conn: "all", q: "" })}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            onReset={() => {
              updateSearch({
                q: "",
                month: "all",
                region: "all",
                day: null,
                conn: "all",
              });
            }}
          />
        ) : view === "grid" ? (
          <GridView
            entries={filtered}
            months={
              active === "all"
                ? UROOS_MONTHS
                : UROOS_MONTHS.filter((m) => m.num === active)
            }
            query={query}
            hijri={hijri}
            onOpen={setDetail}
          />
        ) : (
          <TimelineView entries={filtered} onOpen={setDetail} />
        )}

        <p className="mt-14 text-center text-xs text-muted-foreground">
          ഉറവിടം:{" "}
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            ziyarathinfo.wordpress.com
          </a>
        </p>
      </section>

      <EntryDialog
        entry={detail}
        dynamicUroos={dynamicUroos}
        onClose={() => setDetail(null)}
      />
    </SiteLayout>
  );
}

/* ---------- subcomponents ---------- */

function ChipButton({
  active,
  onClick,
  label,
  count,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      {highlight && !active && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--gold,oklch(0.78_0.14_85))] ring-2 ring-background" />
      )}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function RegionChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold scale-[1.02]"
          : "border-border bg-card/90 backdrop-blur text-foreground hover:border-primary/40 hover:bg-accent hover:text-primary",
      )}
    >
      <span className={cn("transition-transform duration-200 group-hover:scale-110", active && "scale-110")}>
        {icon}
      </span>
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] tabular-nums font-mono transition-colors",
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 pl-2.5 pr-1 py-1 text-primary">
      {label}
      <button
        onClick={onClear}
        className="grid h-7 w-7 place-items-center rounded-full hover:bg-primary/20"
        aria-label="Remove filter"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function MiniCalendar({
  month,
  selectedDay,
  onSelectDay,
}: {
  month: UroosMonth;
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
}) {
  const totalDays = month.num % 2 === 1 ? 30 : 29;
  const dayMap = new Map<number, number>();
  for (const d of month.days) dayMap.set(d.day, d.entries.length);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold">
          {month.num}. {month.name}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Tap a day
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
          const count = dayMap.get(d) ?? 0;
          const has = count > 0;
          const isSel = selectedDay === d;
          return (
            <button
              key={d}
              onClick={() => has && onSelectDay(d)}
              disabled={!has}
              title={has ? `${count} entries` : "No entries"}
              className={cn(
                "relative grid min-h-11 place-items-center rounded-md text-xs font-medium tabular-nums transition-all",
                isSel
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : has
                    ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed",
              )}
            >
              {d}
              {has && !isSel && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
      {selectedDay !== null && (
        <button
          onClick={() => onSelectDay(selectedDay)}
          className="mt-3 grid min-h-10 w-full place-items-center rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-primary"
        >
          Clear day filter
        </button>
      )}
    </Card>
  );
}

function GridView({
  entries,
  months,
  query,
  hijri,
  onOpen,
}: {
  entries: Flat[];
  months: UroosMonth[];
  query: string;
  hijri: number;
  onOpen: (f: Flat) => void;
}) {
  const byMonth = new Map<number, Map<number, Flat[]>>();
  for (const e of entries) {
    if (!byMonth.has(e.month.num)) byMonth.set(e.month.num, new Map());
    const dMap = byMonth.get(e.month.num)!;
    if (!dMap.has(e.day)) dMap.set(e.day, []);
    dMap.get(e.day)!.push(e);
  }

  const visibleMonths = months.filter((m) => byMonth.has(m.num));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {visibleMonths.map((m) => {
        const dMap = byMonth.get(m.num)!;
        const days = Array.from(dMap.keys()).sort((a, b) => a - b);
        const count = days.reduce((n, d) => n + dMap.get(d)!.length, 0);
        const isCurrent = m.num === hijri;
        return (
          <Card
            key={m.num}
            className={cn(
              "group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant",
              isCurrent && "ring-2 ring-primary/40",
            )}
          >
            {isCurrent && (
              <div className="absolute top-3 right-3">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Now
                </Badge>
              </div>
            )}
            <div className="mb-5 flex items-baseline gap-3 border-b border-border pb-3">
              <span className="font-sans text-2xl font-bold text-primary/70 tabular-nums tracking-tight">
                {String(m.num).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold leading-tight">
                  {m.name}
                </h2>
                <p className="text-xs text-muted-foreground">{count} entries</p>
              </div>
            </div>

            <ul className="space-y-3">
              {days.map((day) => (
                <li key={day} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary tabular-nums">
                    {day}
                  </span>
                  <div className="flex-1 space-y-1">
                    {dMap.get(day)!.map((e, i) => (
                      <div
                        key={i}
                        className="group/item flex items-center justify-between gap-1.5 rounded-md py-1 px-1.5 -mx-1 hover:bg-muted/60 transition-colors"
                      >
                        <button
                          onClick={() => onOpen(e)}
                          className="group/link flex min-h-9 flex-1 items-start gap-2 text-left text-sm leading-snug text-foreground hover:text-primary transition-colors"
                        >
                          <span className="min-w-0 flex-1 break-words">{highlightText(e.text, query)}</span>
                          <RegionDot region={e.region} />
                        </button>
                        {e.pageId && (
                          <Link
                            to="/uroos/$id"
                            params={{ id: e.pageId }}
                            title="Dedicated Page"
                            className="shrink-0 p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/15 transition-colors"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function TimelineView({
  entries,
  onOpen,
}: {
  entries: Flat[];
  onOpen: (f: Flat) => void;
}) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute left-[1.125rem] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
      <ul className="space-y-4">
        {entries.map((f, i) => (
          <li key={i} className="relative pl-12">
            <span className="absolute left-0 top-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold tabular-nums ring-4 ring-background">
              {f.day}
            </span>
            <div
              onClick={() => onOpen(f)}
              className="block w-full text-left cursor-pointer"
            >
              <Card className="p-4 transition-shadow hover:shadow-elegant">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {f.month.num}. {f.month.name}
                    </Badge>
                    <RegionBadge region={f.region} />
                  </div>
                  {f.pageId && (
                    <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Dedicated Page
                    </Badge>
                  )}
                </div>
                <span className="flex items-start gap-1.5 text-sm font-medium">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 break-words">{f.text}</span>
                </span>
                {f.pageId && (
                  <div className="mt-3 pt-2 border-t border-border flex justify-end">
                    <Link
                      to="/uroos/$id"
                      params={{ id: f.pageId }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      Explore Dedicated Uroos Page <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegionDot({ region }: { region: Region }) {
  const isK = region === "kerala";
  const isI = region === "india";
  const isME = region === "middle-east";
  return (
    <span
      title={REGION_LABELS[region] || "Worldwide"}
      className={cn(
        "mt-1 h-2 w-2 shrink-0 rounded-full",
        isK
          ? "bg-primary"
          : isI
          ? "bg-emerald-500"
          : isME
          ? "bg-amber-500"
          : "bg-sky-500",
      )}
    />
  );
}

function RegionBadge({ region }: { region: Region }) {
  const isK = region === "kerala";
  const isI = region === "india";
  const isME = region === "middle-east";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-medium transition-colors shadow-xs",
        isK
          ? "border-primary/40 text-primary bg-primary/5"
          : isI
          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
          : isME
          ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5"
          : "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/5",
      )}
    >
      {isK ? (
        <Building2 className="h-2.5 w-2.5 shrink-0" />
      ) : isI ? (
        <MapPin className="h-2.5 w-2.5 shrink-0" />
      ) : isME ? (
        <Compass className="h-2.5 w-2.5 shrink-0" />
      ) : (
        <Globe2 className="h-2.5 w-2.5 shrink-0" />
      )}
      {REGION_LABELS[region] || "Worldwide"}
    </Badge>
  );
}

function FeaturedUroosView({
  uroosList,
  connFilter,
  setConnFilter,
  query,
  region,
  onResetRegion,
}: {
  uroosList: DbUroos[];
  connFilter: "all" | "connected" | "standalone";
  setConnFilter: (f: "all" | "connected" | "standalone") => void;
  query: string;
  region: z.infer<typeof uroosRegionEnum>;
  onResetRegion: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Sub-filters for connection status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={connFilter === "all" ? "default" : "outline"}
            onClick={() => setConnFilter("all")}
            className="text-xs h-8"
          >
            All Dedicated ({uroosList.length})
          </Button>
          <Button
            size="sm"
            variant={connFilter === "connected" ? "default" : "outline"}
            onClick={() => setConnFilter("connected")}
            className="text-xs h-8 gap-1.5"
          >
            <Building2 className="h-3 w-3" />
            Connected to Maqam
          </Button>
          <Button
            size="sm"
            variant={connFilter === "standalone" ? "default" : "outline"}
            onClick={() => setConnFilter("standalone")}
            className="text-xs h-8 gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            Standalone Festivals
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {uroosList.length} comprehensive Uroos guide{uroosList.length === 1 ? "" : "s"}
        </p>
      </div>

      {uroosList.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <h3 className="mt-2 text-base font-semibold">No dedicated Uroos pages found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {region !== "all" && region in REGION_LABELS
              ? `Currently showing zero dedicated pages in ${REGION_LABELS[region as MaqamRegion]}. You can suggest one or switch back to All Regions.`
              : "Try adjusting your filters or search keywords."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onResetRegion}
            >
              Show all regions
            </Button>
            <RequestDialog
              type="uroos"
              title="Suggest an Uroos Page"
              description="Missing an uroos date or page? Send us the details and we will review and publish it."
              subjectPlaceholder="e.g. Uroos celebration of saint in Cairo, Egypt"
              detailsPlaceholder="City, country, resting person, Hijri date, significance…"
              trigger={
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Suggest Uroos
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {uroosList.map((u) => {
            const uRegion = getUroosRegion(u);
            return (
              <Card
                key={u.id}
                className="group flex flex-col overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                {/* Cover header */}
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  {u.coverImage ? (
                    <img
                      src={u.coverImage}
                      alt={u.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950 to-background text-emerald-400">
                      <Sparkles className="h-10 w-10 opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

                  {/* Status & Hijri Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                    <Badge variant="secondary" className="bg-background/85 backdrop-blur text-[11px] font-semibold">
                      {u.hijriMonthName} • Day {u.hijriDay}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <RegionBadge region={uRegion} />
                      {u.isStandalone ? (
                        <Badge className="bg-amber-600/90 text-white backdrop-blur text-[10px]">
                          Standalone
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600/90 text-white backdrop-blur text-[10px]">
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3">
                    {u.malayalamTitle && (
                      <p className="text-xs font-semibold text-emerald-400 font-sans line-clamp-1">
                        {u.malayalamTitle}
                      </p>
                    )}
                    <h3 className="text-base font-bold text-foreground leading-tight line-clamp-1">
                      {u.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="line-clamp-1">{u.city}, {u.state || u.country}</span>
                    </div>

                    {u.restingPerson && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <span className="font-medium text-foreground">Saint:</span> {u.restingPerson}
                      </p>
                    )}

                    <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                      {u.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    {u.maqamId ? (
                      <Link
                        to="/maqam/$id"
                        params={{ id: u.maqamId }}
                        className="text-[11px] text-emerald-600 hover:underline font-medium inline-flex items-center gap-1 line-clamp-1"
                      >
                        <Building2 className="h-3 w-3 shrink-0" />
                        Host Maqam
                      </Link>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-medium inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        Independent Venue
                      </span>
                    )}

                    <Button asChild size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ml-auto">
                      <Link to="/uroos/$id" params={{ id: u.id }}>
                        Explore Page
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EntryDialog({
  entry,
  dynamicUroos = [],
  onClose,
}: {
  entry: Flat | null;
  dynamicUroos?: DbUroos[];
  onClose: () => void;
}) {
  const matchedUroos = entry
    ? (entry.pageId ? dynamicUroos.find((u) => u.id === entry.pageId) : null) ||
      dynamicUroos.find(
        (u) =>
          u.id === entry.pageId ||
          entry.text.toLowerCase().includes(u.title.toLowerCase()) ||
          (u.malayalamTitle && entry.text.includes(u.malayalamTitle)) ||
          (u.restingPerson && entry.text.toLowerCase().includes(u.restingPerson.toLowerCase())) ||
          (entry.month.num === u.hijriMonth && entry.day === u.hijriDay)
      )
    : null;

  return (
    <Dialog open={entry !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {entry && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  Day {entry.day}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {entry.month.num}. {entry.month.name}
                </Badge>
                <RegionBadge region={entry.region} />
                {matchedUroos && (
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    Has Dedicated Page
                  </Badge>
                )}
              </div>
              <DialogTitle className="mt-3 font-display text-xl sm:text-2xl leading-tight break-words pr-8">
                {entry.text}
              </DialogTitle>
              <DialogDescription>
                ഹിജ്റ {entry.month.name} {entry.day} ന് നടക്കുന്ന ഉറൂസ്.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <MetaRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date"
                value={`${entry.month.name} ${entry.day}`}
              />
              <MetaRow
                icon={<MapPin className="h-4 w-4" />}
                label="Region"
                value={REGION_LABELS[entry.region] || "Worldwide"}
              />
              <MetaRow
                icon={<Hash className="h-4 w-4" />}
                label="Month no."
                value={String(entry.month.num)}
              />
              {matchedUroos && (
                <MetaRow
                  icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
                  label="Dedicated Profile"
                  value={matchedUroos.title}
                />
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {matchedUroos ? (
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Link to="/uroos/$id" params={{ id: matchedUroos.id }}>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    View Dedicated Uroos Page
                  </Link>
                </Button>
              ) : entry.url ? (
                <Button asChild>
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4" />
                    Read full details
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </Button>
              ) : null}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted/80 ring-1 ring-border shadow-inner">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold">No matching Uroos events</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        We couldn&apos;t find any festival dates matching your current filter combination.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Button onClick={onReset} variant="outline" className="h-9">
          Reset all filters
        </Button>
        <RequestDialog
          type="uroos"
          title="Request an Uroos date"
          description="Missing an uroos date or page? Send us the Hijri date and details of the mahan — we'll review and create the page."
          subjectPlaceholder="ഉദാ. റജബ് 6 — ഖാജാ മുഈനുദ്ദീൻ (റ), അജ്മീർ"
          detailsPlaceholder="ഹിജ്റ മാസം, ദിവസം, മഹാന്റെ പേര്, സ്ഥലം, ആധാര സ്രോതസ്സ്…"
          trigger={
            <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              Submit festival date
            </Button>
          }
        />
      </div>
    </div>
  );
}

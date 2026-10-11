import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { dbHealthFn } from "@/lib/requests.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw } from "lucide-react";

type Health = Awaited<ReturnType<typeof dbHealthFn>>;

function ago(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function DbHealthPanel() {
  const fn = useServerFn(dbHealthFn);
  const [h, setH] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setH(await fn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setLoading(false);
    }
  }, [fn]);

  useEffect(() => {
    load();
  }, [load]);

  const ok = h?.reachable && !err;
  const label = loading && !h ? "Checking…" : ok ? "Reachable" : h && !h.configured ? "Not configured" : "Unreachable";

  return (
    <Card className="mb-5" aria-live="polite">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Database className="h-4 w-4 text-muted-foreground" />
          Database
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${loading && !h ? "bg-muted-foreground" : ok ? "bg-primary" : "bg-destructive"}`}
            aria-hidden
          />
          <span className={ok ? "text-primary" : "text-destructive"}>{label}</span>
        </div>
        {h?.latencyMs != null && <span className="text-muted-foreground">Response: {h.latencyMs} ms</span>}
        {h?.reachable && (
          <span className="text-muted-foreground">
            Latest request:{" "}
            {h.latestRequestAt ? (
              <time dateTime={h.latestRequestAt} title={new Date(h.latestRequestAt).toLocaleString()}>
                {new Date(h.latestRequestAt).toLocaleString()} ({ago(h.latestRequestAt)})
              </time>
            ) : (
              "none yet"
            )}
          </span>
        )}
        {h?.totalRequests != null && <span className="text-muted-foreground">Stored: {h.totalRequests}</span>}
        {(err || h?.error) && <span className="w-full text-xs text-destructive">{err ?? h?.error}</span>}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={load} disabled={loading} aria-label="Re-check database">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardContent>
    </Card>
  );
}

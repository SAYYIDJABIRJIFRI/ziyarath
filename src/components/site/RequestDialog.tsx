import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type RequestType = "maqam" | "uroos";

type Props = {
  type: RequestType;
  title: string;
  description: string;
  subjectPlaceholder: string;
  detailsPlaceholder: string;
  trigger: ReactNode;
};

const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhul Qadah",
  "Dhul Hijjah",
];
const CATEGORIES = ["Awliya", "Sahaba", "Scholar", "Historic"];

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  // maqam
  maqam_name: string;
  resting_person: string;
  location: string;
  maps_link: string;
  category: string;
  visiting_hours: string;
  facilities: string;
  // uroos
  uroos_connection: "connected" | "standalone";
  connected_maqam_name: string;
  venue_name: string;
  hijri_month: string;
  hijri_day: string;
  gregorian: string;
  program: string;
  // verification
  source: string;
  notes: string;
  website: string; // honeypot
};

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  city: "",
  country: "",
  maqam_name: "",
  resting_person: "",
  location: "",
  maps_link: "",
  category: "",
  visiting_hours: "",
  facilities: "",
  uroos_connection: "connected",
  connected_maqam_name: "",
  venue_name: "",
  hijri_month: "",
  hijri_day: "",
  gregorian: "",
  program: "",
  source: "",
  notes: "",
  website: "",
};

const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/\S+$/i;

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState, mode: RequestType, extra: boolean): Errors {
  const e: Errors = {};
  const showMaqam = mode === "maqam" || extra;
  const showUroos = mode === "uroos" || extra;
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!PHONE_RE.test(f.phone.trim())) e.phone = "Enter a valid mobile / WhatsApp number.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (f.resting_person.trim().length < 2)
    e.resting_person = "Required.";
  if (showMaqam && f.maqam_name.trim().length < 2) e.maqam_name = "Required.";
  if (f.location.trim().length < 2) e.location = "Required.";
  if (f.maps_link && !URL_RE.test(f.maps_link.trim()))
    e.maps_link = "Must be a link starting with http(s)://";
  if (showUroos && mode === "uroos" && !f.hijri_month)
    e.hijri_month = "Select a Hijri month.";
  if (f.source && !URL_RE.test(f.source.trim()) && f.source.length > 300)
    e.source = "Too long.";
  return e;
}

function buildPayload(f: FormState, mode: RequestType, extra: boolean) {
  const showMaqam = mode === "maqam" || extra;
  const showUroos = mode === "uroos" || extra;
  const lines: string[] = [];
  const add = (k: string, v: string) => v.trim() && lines.push(`${k}: ${v.trim()}`);

  if (showMaqam) {
    lines.push("== MAQAM / DARGAH ==");
    add("Maqam name", f.maqam_name);
  } else {
    lines.push("== UROOS ==");
  }
  add("Resting Mahan / Wali / Scholar", f.resting_person);
  add("Location", f.location);
  add("Google Maps", f.maps_link);
  if (showMaqam) {
    add("Category", f.category);
    add("Visiting hours", f.visiting_hours);
    add("Facilities & nercha", f.facilities);
  }
  if (showUroos) {
    if (mode === "maqam") lines.push("", "== ANNUAL UROOS ==");
    add("Uroos connection type", f.uroos_connection === "standalone" ? "Standalone Page" : "Connected to Maqam");
    if (f.uroos_connection === "connected" && f.connected_maqam_name) {
      add("Host Maqam name", f.connected_maqam_name);
    }
    if (f.venue_name) {
      add("Venue name", f.venue_name);
    }
    const hijri = [f.hijri_day, f.hijri_month].filter(Boolean).join(" ");
    add("Hijri date", hijri);
    add("Gregorian / season", f.gregorian);
    add("Program & duration", f.program);
  }
  add("Source / reference", f.source);

  const hijri = [f.hijri_day, f.hijri_month].filter(Boolean).join(" ");
  const subject =
    mode === "maqam"
      ? f.maqam_name.trim()
      : `Uroos of ${f.resting_person.trim()}`;
  return {
    type: mode,
    name: f.name.trim(),
    phone: f.phone.trim(),
    email: f.email.trim(),
    city: f.city,
    country: f.country,
    subject: subject.slice(0, 200),
    requested_date: [hijri, f.gregorian.trim()].filter(Boolean).join(" / ").slice(0, 120),
    details: lines.join("\n").slice(0, 4000),
    supporting_notes: f.notes,
    website: f.website,
  };
}

export function RequestDialog({ type, title, description, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<RequestType>(type);
  const [extra, setExtra] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Errors>({});
  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };

  const reset = () => {
    setForm(EMPTY);
    setFieldErrors({});
    setStatus("idle");
    setError(null);
    setMode(type);
    setExtra(false);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setTimeout(reset, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, mode, extra);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(`req-${first}`)?.focus();
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const elapsed_ms = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
      const res = await fetch("/api/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(form, mode, extra), elapsed_ms }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const showMaqam = mode === "maqam" || extra;
  const showUroos = mode === "uroos" || extra;
  const fe = fieldErrors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-medium">Thank you — your request was submitted.</p>
            <p className="text-sm text-muted-foreground">
              We'll review it and get in touch if we need more details.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            <div role="radiogroup" aria-label="Request type" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(["maqam", "uroos"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => {
                    setMode(m);
                    setExtra(false);
                  }}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "maqam" ? "Maqam / Dargah" : "Uroos date"}
                </button>
              ))}
            </div>

            <Section step={1} title="Contributor details">
              <F id="name" label="Full name" required form={form} set={set} fe={fe} autoComplete="name" placeholder="e.g. Muhammad Ali" />
              <div className="grid gap-4 sm:grid-cols-2">
                <F id="phone" label="Mobile / WhatsApp" required form={form} set={set} fe={fe} type="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" />
                <F id="email" label="Email" required form={form} set={set} fe={fe} type="email" autoComplete="email" placeholder="you@gmail.com" />
                <F id="city" label="City" form={form} set={set} fe={fe} autoComplete="address-level2" placeholder="e.g. Kozhikode" />
                <F id="country" label="Country" form={form} set={set} fe={fe} autoComplete="country-name" placeholder="e.g. India" />
              </div>
            </Section>

            <Section step={2} title={mode === "maqam" ? "Maqam / Dargah details" : "Uroos details"}>
              {showMaqam && (
                <F id="maqam_name" label="Maqam / Dargah name" required form={form} set={set} fe={fe} placeholder="e.g. Mampuram Maqam" />
              )}
              <F id="resting_person" label="Resting Mahan / Wali / Scholar" required form={form} set={set} fe={fe} placeholder="e.g. Sayyid Alavi Thangal" />
              <div className="grid gap-4 sm:grid-cols-2">
                <F id="location" label="Location (town, district, state)" required form={form} set={set} fe={fe} placeholder="e.g. Tirurangadi, Malappuram" />
                <F id="maps_link" label="Google Maps link" form={form} set={set} fe={fe} type="url" placeholder="https://maps.app.goo.gl/…" />
              </div>

              {mode === "uroos" && <UroosFields form={form} set={set} fe={fe} />}

              {showMaqam && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="req-category">Category</Label>
                      <select
                        id="req-category"
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <F id="visiting_hours" label="Visiting hours" form={form} set={set} fe={fe} placeholder="e.g. 5 AM – 10 PM daily" />
                  </div>
                  <TA id="facilities" label="Facilities & nercha traditions" form={form} set={set} fe={fe} max={1500} placeholder="Parking, wudu area, nercha days, food distribution…" />
                </>
              )}

              {mode === "maqam" && (
                <label className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm">
                  <Checkbox checked={extra} onCheckedChange={(v) => setExtra(v === true)} />
                  Include annual Uroos details for this Maqam
                </label>
              )}
              {mode === "uroos" && (
                <label className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm">
                  <Checkbox checked={extra} onCheckedChange={(v) => setExtra(v === true)} />
                  Include full Maqam directory profile details
                </label>
              )}

              {mode === "maqam" && showUroos && <UroosFields form={form} set={set} fe={fe} />}
            </Section>

            <Section step={3} title="Verification & reference notes">
              <F id="source" label="Source / website / trust committee link" form={form} set={set} fe={fe} placeholder="https://…" />
              <TA id="notes" label="Additional supporting notes" form={form} set={set} fe={fe} max={2000} placeholder="Anything that helps us verify." />
            </Section>

            {status === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={status === "loading"}>
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Submit request"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  fe: Errors;
};

function UroosFields({ form, set, fe }: FieldProps) {
  return (
    <div className="space-y-4 rounded-md bg-muted/40 p-3">
      <div className="grid gap-2">
        <Label>Uroos Page Type</Label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => set("uroos_connection", "connected")}
            className={cn(
              "p-2.5 rounded-lg border text-left font-medium transition-all",
              form.uroos_connection === "connected"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-input bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            Connected to Maqam
            <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
              Held at an existing sacred tomb / dargah
            </span>
          </button>
          <button
            type="button"
            onClick={() => set("uroos_connection", "standalone")}
            className={cn(
              "p-2.5 rounded-lg border text-left font-medium transition-all",
              form.uroos_connection === "standalone"
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-input bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            Standalone Page
            <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
              Held at independent grounds or venue
            </span>
          </button>
        </div>
      </div>

      {form.uroos_connection === "connected" ? (
        <F
          id="connected_maqam_name"
          label="Name of Host Maqam / Dargah"
          form={form}
          set={set}
          fe={fe}
          placeholder="e.g. Mampuram Juma Masjid Maqam, Kondotty Khubba…"
        />
      ) : (
        <F
          id="venue_name"
          label="Celebration Venue / Grounds Name"
          form={form}
          set={set}
          fe={fe}
          placeholder="e.g. Peringathur Grand Dargah Ground…"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="req-hijri_month">Hijri month</Label>
          <select
            id="req-hijri_month"
            value={form.hijri_month}
            onChange={(e) => set("hijri_month", e.target.value)}
            aria-invalid={!!fe.hijri_month}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select month…</option>
            {HIJRI_MONTHS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {fe.hijri_month && <p className="text-xs text-destructive">{fe.hijri_month}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="req-hijri_day">Day</Label>
          <select
            id="req-hijri_day"
            value={form.hijri_day}
            onChange={(e) => set("hijri_day", e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      </div>
      <F id="gregorian" label="Gregorian date / season" form={form} set={set} fe={fe} placeholder="e.g. Around September each year" />
      <TA id="program" label="Program highlights & duration" form={form} set={set} fe={fe} max={1500} placeholder="e.g. 3 days — Mouloud, Ratib, annadanam…" />
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {step}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function F({
  id,
  label,
  required,
  form,
  set,
  fe,
  placeholder,
  autoComplete,
  type = "text",
}: FieldProps & {
  id: keyof FormState;
  label: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`req-${id}`}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={`req-${id}`}
        type={type}
        maxLength={300}
        value={form[id]}
        onChange={(e) => set(id, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!fe[id]}
      />
      {fe[id] && <p className="text-xs text-destructive">{fe[id]}</p>}
    </div>
  );
}

function TA({
  id,
  label,
  form,
  set,
  fe,
  max,
  placeholder,
}: FieldProps & { id: keyof FormState; label: string; max: number; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`req-${id}`}>{label}</Label>
      <Textarea
        id={`req-${id}`}
        rows={3}
        maxLength={max}
        value={form[id]}
        onChange={(e) => set(id, e.target.value)}
        placeholder={placeholder}
      />
      {fe[id] && <p className="text-xs text-destructive">{fe[id]}</p>}
    </div>
  );
}

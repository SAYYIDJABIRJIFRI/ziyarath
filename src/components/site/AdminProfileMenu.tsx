import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listAllotmentsFn } from "@/lib/content.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  Mail,
  CheckCircle2,
  Copy,
  ExternalLink,
  LogOut,
  Inbox,
  FileText,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  Shield,
  Key,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface AdminProfileMenuProps {
  className?: string;
}

export function AdminProfileMenu({ className }: AdminProfileMenuProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [allotmentCount, setAllotmentCount] = useState<number | null>(null);
  const listAllotFn = useServerFn(listAllotmentsFn);

  useEffect(() => {
    let mounted = true;

    const checkAllotments = async (email: string, uid?: string) => {
      try {
        const allots: any = await listAllotFn();
        if (!mounted || !allots) return;
        const norm = email.toLowerCase().trim();
        const userAllots = allots.filter(
          (a: any) => a.userEmail?.toLowerCase() === norm || (uid && a.userId === uid)
        );
        setAllotmentCount(userAllots.length);
      } catch {
        // Fallback
      }
    };

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          setUser(data.session.user);
          setLoading(false);
          if (data.session.user.email) {
            checkAllotments(data.session.user.email, data.session.user.id);
          }
          return;
        }
      } catch {
        // Continue to fallback
      }

      // Check for local persona sync if not logged in
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("ziyarath_mock_user") : null;
        if (stored && mounted) {
          const parsed = JSON.parse(stored);
          setUser({
            email: parsed.email,
            id: parsed.id,
            user_metadata: {
              full_name: parsed.name || (parsed.email.includes("superadmin") ? "Super Admin" : "Page Admin"),
            },
            is_mock: true,
          });
          setLoading(false);
          if (parsed.email) {
            checkAllotments(parsed.email, parsed.id);
          }
          return;
        }
      } catch {}

      if (mounted) {
        setUser(null);
        setLoading(false);
        setAllotmentCount(null);
      }
    };

    checkUser();

    // Subscribe to auth state updates
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        if (session.user.email) {
          checkAllotments(session.user.email, session.user.id);
        }
      } else {
        checkUser();
      }
    });

    const handleCustomUpdate = () => {
      if (mounted) checkUser();
    };
    window.addEventListener("ziyarath-auth-update", handleCustomUpdate);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("ziyarath-auth-update", handleCustomUpdate);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("ziyarath_mock_user");
      await supabase.auth.signOut();
      setUser(null);
      window.dispatchEvent(new Event("ziyarath-auth-update"));
      toast.success("Signed out successfully");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // If no user is logged in
  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${className}`}
            title="Admin Portal"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Admin</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1.5">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Admin Portal
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/auth" className="flex items-center gap-2 cursor-pointer font-medium text-xs">
              <Key className="h-3.5 w-3.5 text-primary" />
              Sign in to Admin Portal
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/auth" className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <UserCheck className="h-3.5 w-3.5" />
              Register New Admin
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const email = user.email || "";
  const metaRole = user.app_metadata?.role || user.user_metadata?.role;
  const isSuperAdmin = email.toLowerCase().includes("superadmin") || metaRole === "super_admin";
  const isUnallotted =
    !isSuperAdmin &&
    (allotmentCount === 0 ||
      (allotmentCount === null && (email.toLowerCase().includes("newadmin") || metaRole === "unallotted_admin")));

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (isSuperAdmin
      ? "Super Administrator"
      : isUnallotted
      ? "New Admin (Unallotted)"
      : "Allotted Page Admin");

  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";

  const roleTitle = isSuperAdmin
    ? "Super Admin"
    : isUnallotted
    ? "New Admin (Unallotted)"
    : allotmentCount !== null
    ? `Allotted Admin (${allotmentCount})`
    : "Allotted Admin";

  const roleSubtitle = isSuperAdmin
    ? "Master Authority"
    : isUnallotted
    ? "New Admin Access Only"
    : "Allotted Admin Access Only";

  const userId = user.id || `usr-${email.toLowerCase().replace(/[^a-z0-9]/gi, "")}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`inline-flex items-center gap-2 h-9 px-2.5 rounded-full border border-border bg-card/90 hover:bg-accent hover:border-primary/40 transition-all text-xs font-medium text-foreground group ${className}`}
            title="Personal Profile & Admin Console"
          >
            <div className="relative">
              <Avatar className="h-6 w-6 text-[10px] ring-1 ring-border group-hover:ring-primary/60 transition-all">
                <AvatarFallback
                  className={
                    isSuperAdmin
                      ? "bg-primary/20 text-primary font-bold"
                      : isUnallotted
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                      : "bg-emerald-600/20 text-emerald-600 font-bold"
                  }
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Online status beacon */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
            </div>

            <span className="max-w-[110px] truncate hidden sm:inline-block font-semibold">
              {fullName}
            </span>

            <Badge
              variant="outline"
              className={`hidden md:inline-flex text-[10px] px-1.5 py-0 h-4 border leading-none font-normal ${
                isSuperAdmin
                  ? "bg-primary/10 text-primary border-primary/30"
                  : isUnallotted
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              }`}
            >
              {roleTitle}
            </Badge>

            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-2 shadow-xl border border-border/80">
          {/* Header Personal Profile Card */}
          <div className="rounded-lg bg-gradient-to-br from-primary/10 via-card to-background p-3 border border-border/60">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarFallback
                  className={
                    isSuperAdmin
                      ? "bg-primary text-primary-foreground font-bold text-sm"
                      : isUnallotted
                      ? "bg-amber-600 text-white font-bold text-sm"
                      : "bg-emerald-600 text-white font-bold text-sm"
                  }
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-foreground truncate">{fullName}</h4>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate" title={email}>
                  {email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge
                    className={`text-[10px] px-1.5 py-0 border leading-tight ${
                      isSuperAdmin
                        ? "bg-primary/20 text-primary border-primary/40 font-semibold"
                        : isUnallotted
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold"
                        : "bg-emerald-600/20 text-emerald-600 border-emerald-600/40 font-semibold"
                    }`}
                  >
                    {roleTitle} • {roleSubtitle}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Status Tag */}
            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active Session
              </span>
              <button
                type="button"
                onClick={() => setProfileDialogOpen(true)}
                className="text-primary hover:underline font-medium text-[11px]"
              >
                Full Profile →
              </button>
            </div>
          </div>

          <DropdownMenuSeparator className="my-1.5" />

          {/* Navigation Links based on Role */}
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/admin/pages" className="flex items-center gap-2 cursor-pointer text-xs py-2">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {isSuperAdmin ? "All Portal Pages" : "My Allotted Pages"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isSuperAdmin
                      ? "Edit content for all Maqams & Uroos"
                      : "Edit only your designated pages"}
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>

            {isSuperAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-xs py-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Admin Hub</span>
                      <span className="text-[10px] text-muted-foreground">
                        Super Admin Overview & Metrics
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/admin/requests" className="flex items-center gap-2 cursor-pointer text-xs py-2">
                    <Inbox className="h-4 w-4 text-amber-500" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Requests Queue</span>
                      <span className="text-[10px] text-muted-foreground">
                        Review submissions & approve pages
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/admin/allotments" className="flex items-center gap-2 cursor-pointer text-xs py-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Allotments & Subdomains</span>
                      <span className="text-[10px] text-muted-foreground">
                        Assign pages & dedicated subdomains
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5" />

          {/* Action Row */}
          <DropdownMenuItem
            onClick={() => setProfileDialogOpen(true)}
            className="flex items-center gap-2 cursor-pointer text-xs text-foreground py-1.5"
          >
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Personal Profile Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 cursor-pointer text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 py-1.5"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-600" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Comprehensive Personal Profile Modal Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold font-display">
              Personal Profile Information
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Authenticated Administrator Account Details & Permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* User Main Banner */}
            <div className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3.5">
              <Avatar className="h-14 w-14 ring-2 ring-primary/40">
                <AvatarFallback
                  className={
                    isSuperAdmin
                      ? "bg-primary text-primary-foreground font-bold text-lg"
                      : "bg-emerald-600 text-white font-bold text-lg"
                  }
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground truncate">{fullName}</h3>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                    Verified
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-primary">
                    {roleTitle}
                  </span>
                  <span className="text-[11px] text-muted-foreground">•</span>
                  <span className="text-[11px] text-muted-foreground">
                    {roleSubtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Attributes List */}
            <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/40 text-xs">
              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email Address
                </span>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(email, "Email")}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Copy Email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-primary" />
                  User ID
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[180px]">{userId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(userId, "User ID")}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    title="Copy User ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Account Authority
                </span>
                <Badge
                  className={
                    isSuperAdmin
                      ? "bg-primary text-primary-foreground text-xs"
                      : isUnallotted
                      ? "bg-amber-500 text-white text-xs"
                      : "bg-emerald-600 text-white text-xs"
                  }
                >
                  {isSuperAdmin
                    ? "Super Admin (Unrestricted)"
                    : isUnallotted
                    ? "New Admin (Unallotted Access Only)"
                    : `Allotted Admin (${allotmentCount ?? 1} Allotted)`}
                </Badge>
              </div>

              <div className="p-3 space-y-1">
                <span className="text-muted-foreground block text-[11px] uppercase font-semibold tracking-wider">
                  Permission Scope
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {isSuperAdmin
                    ? "Full master control: Super Admins are allowed to access Super Admin access, Allotted Admin access, and New Admin (Unallotted) preview access across all pages, requests, and allotments."
                    : isUnallotted
                    ? "New Admin (Unallotted) access: You currently have an active verified login account with 0 pages allotted. A Super Admin must assign pages before you can edit content."
                    : `Allotted Admin access: You have active access to manage and update ${allotmentCount ?? 1} allotted ${allotmentCount === 1 ? "page" : "pages"}. Non-allotted pages and Super Admin controls are restricted.`}
                </p>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProfileDialogOpen(false);
                  navigate({ to: "/admin/pages" });
                }}
                className="gap-1.5 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Go to Managed Pages
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setProfileDialogOpen(false);
                  handleSignOut();
                }}
                className="gap-1.5 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

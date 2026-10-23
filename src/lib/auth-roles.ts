/**
 * Centralized Role & Access Control Utilities
 */

export const SUPER_ADMIN_EMAILS = [
  "superadmin@ziyarath.com",
  "sayyidjabirjifri@gmail.com",
  "jabirjifri@gmail.com",
];

/**
 * Check if a user is a Super Admin based on email, role, or metadata
 */
export function checkIsSuperAdmin(
  email?: string | null,
  role?: string | null,
  userMetadata?: Record<string, any> | null
): boolean {
  if (!email && !role && !userMetadata) return false;

  const normalizedEmail = (email || "").trim().toLowerCase();

  // 1. Direct super admin email match or includes superadmin
  if (
    normalizedEmail &&
    (SUPER_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalizedEmail) ||
      normalizedEmail.includes("superadmin"))
  ) {
    return true;
  }

  // 2. User metadata check (Supabase app_metadata or user_metadata)
  const metaRole =
    userMetadata?.role ||
    userMetadata?.app_metadata?.role ||
    userMetadata?.user_metadata?.role;
  if (metaRole === "super_admin") {
    return true;
  }

  // 3. Explicit role check: only honored if no email identity is provided (mock/dev fallback)
  // or if the email is a recognized super admin email. An explicit non-super admin email
  // (e.g. admin@ziyarath.com or newadmin@ziyarath.com) CANNOT be elevated by passing role="super_admin".
  if (role === "super_admin") {
    if (!normalizedEmail) return true;
    return (
      SUPER_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalizedEmail) ||
      normalizedEmail.includes("superadmin")
    );
  }

  return false;
}

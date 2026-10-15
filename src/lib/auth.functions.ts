import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getServerSupabaseClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    import.meta.env.VITE_SUPABASE_URL ||
    "https://nnvdwxskbaevzupbhdks.supabase.co";
  const anonKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_EkunrX2CYc-QbmjmGG8_wA_W8u7NIt8";

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getServerSupabaseAdminClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    import.meta.env.VITE_SUPABASE_URL ||
    "https://nnvdwxskbaevzupbhdks.supabase.co";
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const serverSignUpFn = createServerFn({ method: "POST" })
  .inputValidator((input: {
    email: string;
    password: string;
    fullName?: string;
  }) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const adminClient = getServerSupabaseAdminClient();
    const publicClient = getServerSupabaseClient();

    // 1. If service role key is available, create confirmed user directly (bypasses email rate limit)
    if (adminClient) {
      try {
        const { data: createData, error: createError } =
          await adminClient.auth.admin.createUser({
            email: data.email.trim(),
            password: data.password,
            email_confirm: true,
            user_metadata: {
              full_name: data.fullName?.trim() || undefined,
            },
          });

        if (createError) {
          // If already registered, fall through or return error
          return { error: createError.message, session: null };
        }

        // Auto sign in to retrieve session
        const { data: signInData, error: signInError } =
          await publicClient.auth.signInWithPassword({
            email: data.email.trim(),
            password: data.password,
          });

        if (signInError) {
          return {
            error: null,
            info: "Account created successfully! Please sign in.",
            session: null,
          };
        }

        return {
          error: null,
          session: signInData.session,
          user: signInData.user,
        };
      } catch (err: any) {
        console.error("Admin user creation error:", err);
      }
    }

    // 2. Fallback to standard Supabase sign up
    const { data: signUpData, error: signUpError } =
      await publicClient.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName?.trim() || undefined,
          },
        },
      });

    if (signUpError) {
      return { error: signUpError.message, session: null };
    }

    if (signUpData.session) {
      return {
        error: null,
        session: signUpData.session,
        user: signUpData.user,
      };
    }

    return {
      error: null,
      info: "Account created! If email confirmation is required, check your inbox, then sign in.",
      session: null,
    };
  });

export const serverSignInFn = createServerFn({ method: "POST" })
  .inputValidator((input: {
    email: string;
    password: string;
  }) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const publicClient = getServerSupabaseClient();

    const { data: signInData, error } =
      await publicClient.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

    if (error) {
      return { error: error.message, session: null };
    }

    return {
      error: null,
      session: signInData.session,
      user: signInData.user,
    };
  });

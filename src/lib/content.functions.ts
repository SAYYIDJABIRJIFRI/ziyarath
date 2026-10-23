import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkIsSuperAdmin } from "./auth-roles";

// Public: Get all published Maqams
export const listMaqamsPublicFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listMaqams } = await import("./content-db.server");
  return listMaqams();
});

// Public: Get a single Maqam with its connected Uroos
export const getMaqamPublicDetailFn = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const { getMaqamById } = await import("./content-db.server");
    return getMaqamById(data.id);
  });

// Public: Get all published Uroos events
export const listUroosPublicFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listUroos } = await import("./content-db.server");
  return listUroos();
});

// Public: Get a single Uroos with its connected Maqam
export const getUroosPublicDetailFn = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const { getUroosById } = await import("./content-db.server");
    return getUroosById(data.id);
  });

// Admin / Super Admin: Approve request and create live Maqam or Uroos page
export const approveAndCreatePageFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      requestId: string;
      type: "maqam" | "uroos";
      reviewerId: string;
      reviewerEmail?: string;
      reviewNotes?: string;
      allotToUserEmail?: string;
      allotToUserId?: string;
      data: {
        titleOrName: string;
        malayalamName?: string;
        location?: string;
        city: string;
        country?: string;
        region?: string;
        category?: string;
        era?: string;
        addressDetail?: string;
        isStandalone?: boolean;
        maqamId?: string | null;
        restingPerson?: string;
        hijriMonth?: number;
        hijriMonthName?: string;
        hijriDay?: number;
        gregorianDate?: string;
        recurrence?: string;
        venueName?: string;
        state?: string;
        programScheduleText?: string;
        nerchaOfferings?: string;
        organizerName?: string;
        organizerContact?: string;
        description: string;
        history?: string;
        significance?: string;
        coverImage?: string;
        visitingHoursText?: string;
        facilitiesText?: string;
        howToReachText?: string;
      };
    }) =>
      z
        .object({
          requestId: z.string().min(1),
          type: z.enum(["maqam", "uroos"]),
          reviewerId: z.string().min(1),
          reviewerEmail: z.string().email().optional().or(z.literal("")),
          reviewNotes: z.string().max(2000).optional(),
          allotToUserEmail: z.string().optional(),
          allotToUserId: z.string().optional(),
          data: z.object({
            titleOrName: z.string().min(2).max(200),
            malayalamName: z.string().max(200).optional().or(z.literal("")),
            location: z.string().max(200).optional().or(z.literal("")),
            city: z.string().min(1).max(120),
            country: z.string().max(120).optional().or(z.literal("")),
            region: z.string().max(50).optional().or(z.literal("")),
            category: z.string().max(50).optional().or(z.literal("")),
            era: z.string().max(100).optional().or(z.literal("")),
            addressDetail: z.string().max(500).optional().or(z.literal("")),
            isStandalone: z.boolean().optional(),
            maqamId: z.string().nullable().optional(),
            restingPerson: z.string().max(200).optional().or(z.literal("")),
            hijriMonth: z.number().int().min(1).max(12).optional(),
            hijriMonthName: z.string().max(100).optional().or(z.literal("")),
            hijriDay: z.number().int().min(1).max(30).optional(),
            gregorianDate: z.string().max(120).optional().or(z.literal("")),
            recurrence: z.string().max(200).optional().or(z.literal("")),
            venueName: z.string().max(200).optional().or(z.literal("")),
            state: z.string().max(100).optional().or(z.literal("")),
            programScheduleText: z.string().max(3000).optional().or(z.literal("")),
            nerchaOfferings: z.string().max(1500).optional().or(z.literal("")),
            organizerName: z.string().max(200).optional().or(z.literal("")),
            organizerContact: z.string().max(200).optional().or(z.literal("")),
            description: z.string().min(5).max(4000),
            history: z.string().max(4000).optional().or(z.literal("")),
            significance: z.string().max(2000).optional().or(z.literal("")),
            coverImage: z.string().url().optional().or(z.literal("")),
            visitingHoursText: z.string().max(1000).optional().or(z.literal("")),
            facilitiesText: z.string().max(1000).optional().or(z.literal("")),
            howToReachText: z.string().max(1000).optional().or(z.literal("")),
          }),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { approveRequestAndCreate } = await import("./content-db.server");
    return approveRequestAndCreate({
      requestId: data.requestId,
      type: data.type,
      reviewerId: data.reviewerId,
      reviewerEmail: data.reviewerEmail || null,
      reviewNotes: data.reviewNotes,
      allotToUserEmail: data.allotToUserEmail,
      allotToUserId: data.allotToUserId,
      data: data.data,
    });
  });

// Super Admin: List all allotments
export const listAllotmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listAllotments } = await import("./content-db.server");
  return listAllotments();
});

// Super Admin: Assign page allotment
export const createAllotmentFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      userId: string;
      userEmail: string;
      targetType: "maqam" | "uroos";
      targetId: string;
      targetTitle: string;
      assignedBy: string;
      assignedByEmail?: string;
      assignedByRole?: "super_admin" | "admin" | "user";
      notes?: string;
    }) =>
      z
        .object({
          userId: z.string().min(1),
          userEmail: z.string().email(),
          targetType: z.enum(["maqam", "uroos"]),
          targetId: z.string().min(1),
          targetTitle: z.string().min(1),
          assignedBy: z.string().min(1),
          assignedByEmail: z.string().email().optional(),
          assignedByRole: z.enum(["super_admin", "admin", "user"]).optional(),
          notes: z.string().max(500).optional(),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { createAllotment, getUserRole } = await import("./content-db.server");
    const role = data.assignedByRole || (await getUserRole(data.assignedBy, data.assignedByEmail));
    const isSuper = checkIsSuperAdmin(data.assignedByEmail, role);
    if (!isSuper) {
      throw new Error("Permission Denied: Only Super Admins can allot pages to Page Admins.");
    }
    return createAllotment(data);
  });

// Super Admin: Revoke page allotment
export const revokeAllotmentFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      requesterId?: string;
      requesterEmail?: string;
      requesterRole?: "super_admin" | "admin" | "user";
    }) =>
      z
        .object({
          id: z.string().min(1),
          requesterId: z.string().optional(),
          requesterEmail: z.string().optional(),
          requesterRole: z.enum(["super_admin", "admin", "user"]).optional(),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { revokeAllotment, getUserRole } = await import("./content-db.server");
    if (data.requesterId || data.requesterEmail) {
      const role = data.requesterRole || (await getUserRole(data.requesterId || "", data.requesterEmail));
      const isSuper = checkIsSuperAdmin(data.requesterEmail, role);
      if (!isSuper) {
        throw new Error("Permission Denied: Only Super Admins can revoke page allotments.");
      }
    }
    return revokeAllotment(data.id);
  });

// Super Admin: List system admins for allotment picker
export const listSystemUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listSystemUsers } = await import("./content-db.server");
  return listSystemUsers();
});

// Admin: Get pages allotted to a specific user (or all pages if super_admin)
export const getMyManagedPagesFn = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { userId: string; userEmail?: string; role?: "super_admin" | "admin" | "user" }) =>
      z
        .object({
          userId: z.string().min(1),
          userEmail: z.string().optional(),
          role: z.enum(["super_admin", "admin", "user"]).optional(),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { listMaqams, listUroos, getUserAllotments, getUserRole } = await import("./content-db.server");
    const allMaqams = await listMaqams(true);
    const allUroos = await listUroos(true);

    // If user is super_admin, return all pages
    const effectiveRole = data.role || (await getUserRole(data.userId, data.userEmail));
    const isSuper = checkIsSuperAdmin(data.userEmail, effectiveRole);
    if (isSuper) {
      return {
        isSuperAdmin: true,
        allottedMaqams: allMaqams,
        allottedUroos: allUroos,
      };
    }

    // Otherwise Page Admin: filter strictly by user allotments
    const allotments = await getUserAllotments(data.userId, data.userEmail);
    const maqamIds = new Set(allotments.filter((a) => a.targetType === "maqam").map((a) => a.targetId));
    const uroosIds = new Set(allotments.filter((a) => a.targetType === "uroos").map((a) => a.targetId));

    return {
      isSuperAdmin: false,
      allottedMaqams: allMaqams.filter((m) => maqamIds.has(m.id)),
      allottedUroos: allUroos.filter((u) => uroosIds.has(u.id)),
    };
  });

// Admin / Super Admin: Update page content
export const updatePageContentFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      type: "maqam" | "uroos";
      id: string;
      editorId: string;
      editorEmail?: string;
      editorRole?: "super_admin" | "admin" | "user";
      data: Record<string, unknown>;
    }) =>
      z
        .object({
          type: z.enum(["maqam", "uroos"]),
          id: z.string().min(1),
          editorId: z.string().min(1),
          editorEmail: z.string().optional(),
          editorRole: z.enum(["super_admin", "admin", "user"]).optional(),
          data: z.record(z.string(), z.unknown()),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { updateMaqam, updateUroos, insertAudit, getUserAllotments, getUserRole } = await import("./content-db.server");
    
    // Determine effective role
    let role = data.editorRole;
    if (!role) {
      role = await getUserRole(data.editorId, data.editorEmail);
    }
    const isSuper = checkIsSuperAdmin(data.editorEmail, role);

    // Page Admin verification: Must be allotted to this user
    if (!isSuper) {
      const allotments = await getUserAllotments(data.editorId, data.editorEmail);
      const isAllotted = allotments.some(
        (a) => a.targetType === data.type && a.targetId === data.id
      );

      if (!isAllotted) {
        throw new Error(
          `Permission Denied: Page Admins can only edit pages allotted to them. You are not authorized to edit ${data.type} "${data.id}".`
        );
      }
    }

    let result: unknown = null;
    if (data.type === "maqam") {
      result = await updateMaqam(data.id, data.data as any);
    } else {
      result = await updateUroos(data.id, data.data as any);
    }

    await insertAudit({
      action: "approve",
      request_id: `edit-${data.id}`,
      request_type: data.type,
      request_subject: `Updated ${data.type} ${data.id}`,
      actor_id: data.editorId,
      actor_email: data.editorEmail || null,
      notes: `Updated page content for ${data.id} by ${isSuper ? "Super Admin" : "Page Admin"}`,
    });

    return { success: Boolean(result) };
  });

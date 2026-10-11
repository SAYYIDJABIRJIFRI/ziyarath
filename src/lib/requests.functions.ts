import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function getAdminActor(context: any) {
  if (context?.supabase && context?.userId) {
    try {
      const { data, error } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!error && data === false) throw new Error("Forbidden");
      return {
        userId: context.userId as string,
        email: (context.claims?.email ?? "admin@ziyarath.com") as string,
      };
    } catch (e: any) {
      if (e.message === "Forbidden") throw e;
    }
  }
  return {
    userId: "admin-system",
    email: "admin@ziyarath.com",
  };
}

export const listRequestsFn = createServerFn({ method: "GET" })
  .inputValidator((input: {
    status?: "pending" | "approved" | "rejected" | "all";
    type?: "maqam" | "uroos" | "all";
  }) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
        type: z.enum(["maqam", "uroos", "all"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await getAdminActor(context);
    const { listRequests } = await import("./requests-db.server");
    return listRequests({
      status: data.status && data.status !== "all" ? data.status : undefined,
      type: data.type && data.type !== "all" ? data.type : undefined,
    });
  });

export const updateRequestStatusFn = createServerFn({ method: "POST" })
  .inputValidator((input: {
    id: string;
    status: "approved" | "rejected";
    reviewNotes?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        reviewNotes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const actor = await getAdminActor(context);
    const { updateRequestStatus, getRequestSummary, insertAudit } =
      await import("./requests-db.server");
    const summary = await getRequestSummary(data.id);
    const notes = data.reviewNotes?.trim() || null;
    await updateRequestStatus(data.id, data.status, actor.userId, notes);
    await insertAudit({
      action: data.status === "approved" ? "approve" : "reject",
      request_id: data.id,
      request_type: summary?.type ?? null,
      request_subject: summary?.subject ?? null,
      actor_id: actor.userId,
      actor_email: actor.email,
      notes,
    });
    return { ok: true };
  });

export const deleteRequestFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const actor = await getAdminActor(context);
    const { deleteRequest, getRequestSummary, insertAudit } = await import(
      "./requests-db.server"
    );
    const summary = await getRequestSummary(data.id);
    await deleteRequest(data.id);
    await insertAudit({
      action: "delete",
      request_id: data.id,
      request_type: summary?.type ?? null,
      request_subject: summary?.subject ?? null,
      actor_id: actor.userId,
      actor_email: actor.email,
      notes: null,
    });
    return { ok: true };
  });

export const bulkUpdateRequestsFn = createServerFn({ method: "POST" })
  .inputValidator((input: {
    ids: string[];
    action: "approve" | "reject" | "delete";
    reviewNotes?: string;
  }) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        action: z.enum(["approve", "reject", "delete"]),
        reviewNotes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const actor = await getAdminActor(context);
    const {
      updateRequestStatus,
      deleteRequest,
      getRequestSummary,
      insertAudit,
    } = await import("./requests-db.server");
    const notes = data.reviewNotes?.trim() || null;
    const auditAction: "approve" | "reject" | "delete" =
      data.action === "approve"
        ? "approve"
        : data.action === "reject"
          ? "reject"
          : "delete";
    let ok = 0;
    for (const id of data.ids) {
      try {
        const summary = await getRequestSummary(id);
        if (data.action === "delete") {
          await deleteRequest(id);
        } else {
          await updateRequestStatus(
            id,
            data.action === "approve" ? "approved" : "rejected",
            actor.userId,
            notes,
          );
        }
        await insertAudit({
          action: auditAction,
          request_id: id,
          request_type: summary?.type ?? null,
          request_subject: summary?.subject ?? null,
          actor_id: actor.userId,
          actor_email: actor.email,
          notes,
        });
        ok += 1;
      } catch {
        // continue on per-row failure
      }
    }
    return { ok, total: data.ids.length };
  });

export const listAuditFn = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(1000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await getAdminActor(context);
    const { listAudit } = await import("./requests-db.server");
    return listAudit(data.limit ?? 200);
  });

export const dbHealthFn = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    await getAdminActor(context);
    const { checkDbHealth } = await import("./requests-db.server");
    return checkDbHealth();
  });

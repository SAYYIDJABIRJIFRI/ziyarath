import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/allotments")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/allotments",
    });
  },
  head: () => ({
    meta: [
      { title: "Page Allotments — Ziyarath Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Navigate to="/admin/allotments" replace />,
});

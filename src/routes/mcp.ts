import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      ANY: async () => {
        return new Response(JSON.stringify({ status: "not_configured" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});


import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "admin@thaynanpablo.com";
        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          password: "admin2026",
          email_confirm: true,
          user_metadata: { full_name: "ADMIN" },
        });
        let userId = created.data.user?.id;
        if (!userId) {
          const list = await supabaseAdmin.auth.admin.listUsers();
          userId = list.data.users.find((u) => u.email === email)?.id;
        }
        if (!userId) return Response.json({ ok: false, error: created.error?.message });
        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        return Response.json({ ok: !error, userId, error: error?.message ?? null });
      },
    },
  },
});

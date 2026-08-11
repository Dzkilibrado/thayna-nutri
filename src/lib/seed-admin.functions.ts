import { createServerFn } from "@tanstack/react-start";

/** Temporário: cria a conta administrativa inicial. */
export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "admin@thaynanpablo.com";
  const password = "admin2026";

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "ADMIN" },
  });

  let userId = created.data.user?.id;
  if (!userId) {
    const list = await supabaseAdmin.auth.admin.listUsers();
    userId = list.data.users.find((u) => u.email === email)?.id;
  }
  if (!userId) return { ok: false, error: created.error?.message ?? "no user" };

  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { ok: !error, userId, error: error?.message ?? null };
});

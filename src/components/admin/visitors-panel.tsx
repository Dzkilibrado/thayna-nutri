import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

async function countSince(iso: string) {
  const { count, error } = await supabase
    .from("site_visits")
    .select("id", { count: "exact", head: true })
    .gte("visited_at", iso);
  if (error) throw error;
  return count ?? 0;
}

export function VisitorsPanel() {
  const query = useQuery({
    queryKey: ["admin-visits"],
    queryFn: async () => {
      const [today, last7, last30] = await Promise.all([
        countSince(startOfDay(0)),
        countSince(startOfDay(6)),
        countSince(startOfDay(29)),
      ]);
      return { today, last7, last30 };
    },
  });

  const stats = [
    { label: "Hoje", value: query.data?.today },
    { label: "Últimos 7 dias", value: query.data?.last7 },
    { label: "Últimos 30 dias", value: query.data?.last30 },
  ];

  return (
    <div className="space-y-5">
      <p className="max-w-md text-sm text-muted-foreground">
        Cada visitante conta uma vez por acesso ao site, mesmo navegando por várias páginas. Nenhum
        dado que identifique a pessoa é guardado — só a data e a página.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface p-5 text-center"
          >
            <span className="icon-tile mx-auto flex size-11 items-center justify-center rounded-xl text-primary">
              <Users className="size-5" />
            </span>
            <p className="mt-3 font-display text-3xl">{query.isLoading ? "…" : (s.value ?? 0)}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {query.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os números agora.</p>
      ) : null}
    </div>
  );
}

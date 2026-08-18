import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Medal, TrendingUp, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  ACCESS_LINK_COLUMNS,
  ATHLETE_COLUMNS,
  ATTENDANCE_OPTIONS,
  CONTACT_STATUS_OPTIONS,
  type Athlete,
  type ClientAccessLink,
} from "@/lib/site";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-center">
      <span className="icon-tile mx-auto flex size-11 items-center justify-center rounded-xl text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-display text-3xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {count} <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function IndicatorsPanel() {
  const clientsQuery = useQuery({
    queryKey: ["admin-access-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_access_links")
        .select(ACCESS_LINK_COLUMNS)
        .is("message_template_id", null);
      if (error) throw error;
      return (data ?? []) as ClientAccessLink[];
    },
  });

  const athletesQuery = useQuery({
    queryKey: ["admin-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select(ATHLETE_COLUMNS)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Athlete[];
    },
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const isLoading = clientsQuery.isLoading || athletesQuery.isLoading;

  const total = clients.length;
  const activeCount = clients.filter((c) => c.contact_status === "cliente_ativo").length;
  const pendingCount = clients.filter(
    (c) => c.contact_status === "contato_inicial" || c.contact_status === "em_negociacao",
  ).length;
  const conversionRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const statusBreakdown = useMemo(
    () =>
      CONTACT_STATUS_OPTIONS.map((o) => ({
        label: o.label,
        count: clients.filter((c) => c.contact_status === o.value).length,
      })),
    [clients],
  );

  // "Contratado" = quem já passou pela negociação e virou cliente, ativo ou
  // não hoje. Não conta quem ainda está em contato inicial, porque o tipo de
  // atendimento dessas pessoas ainda nem foi decidido.
  const contracted = useMemo(
    () =>
      clients.filter(
        (c) => c.contact_status === "cliente_ativo" || c.contact_status === "cliente_inativo",
      ),
    [clients],
  );
  const attendanceBreakdown = useMemo(
    () =>
      ATTENDANCE_OPTIONS.map((o) => ({
        label: o.label,
        count: contracted.filter((c) => c.attendance_type === o.value).length,
      })),
    [contracted],
  );
  const undefinedAttendance = contracted.filter((c) => !c.attendance_type).length;

  const referralRows = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const c of clients) {
      if (!c.referred_by_athlete_id) continue;
      const entry = map.get(c.referred_by_athlete_id) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (c.contact_status === "cliente_ativo") entry.active += 1;
      map.set(c.referred_by_athlete_id, entry);
    }
    return [...map.entries()]
      .map(([athleteId, stats]) => {
        const athlete = athletes.find((a) => a.id === athleteId);
        return {
          id: athleteId,
          name: athlete?.name ?? "Atleta removido",
          sponsored: athlete?.sponsored ?? false,
          ...stats,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [clients, athletes]);

  if (isLoading) {
    return <p className="text-sm">Carregando…</p>;
  }

  return (
    <div className="space-y-8">
      <p className="max-w-md text-sm text-muted-foreground">
        Números calculados a partir dos clientes cadastrados em Cadastros → Clientes. Atualiza
        sozinho conforme os cadastros mudam.
      </p>

      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ainda não há clientes cadastrados para gerar indicadores.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Total de clientes" value={total} Icon={Users} />
            <StatCard label="Em andamento" value={pendingCount} Icon={Users} />
            <StatCard
              label="Taxa de conversão para ativo"
              value={`${conversionRate}%`}
              Icon={TrendingUp}
            />
          </div>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-lg">Status do contato</h3>
            <div className="space-y-4">
              {statusBreakdown.map((s) => (
                <Bar key={s.label} label={s.label} count={s.count} total={total} />
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-lg">Atendimento contratado</h3>
            <p className="text-xs text-muted-foreground">
              Entre quem já virou cliente (ativo ou inativo) — {contracted.length} no total.
            </p>
            {contracted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente convertido ainda.</p>
            ) : (
              <div className="space-y-4">
                {attendanceBreakdown.map((a) => (
                  <Bar key={a.label} label={a.label} count={a.count} total={contracted.length} />
                ))}
                {undefinedAttendance > 0 ? (
                  <Bar
                    label="Ainda não definido"
                    count={undefinedAttendance}
                    total={contracted.length}
                  />
                ) : null}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-lg">Indicações por atleta</h3>
            <p className="text-xs text-muted-foreground">
              Mostra se vale a pena manter o patrocínio: quantos clientes cada atleta trouxe e
              quantos desses viraram cliente ativo.
            </p>
            {referralRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente com indicação de atleta registrada ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {referralRows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3"
                  >
                    <span className="icon-tile flex size-9 shrink-0 items-center justify-center rounded-lg text-primary">
                      <Medal className="size-[16px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.total} {r.total === 1 ? "indicado" : "indicados"} · {r.active} virou
                        {r.active === 1 ? "" : "m"} cliente ativo
                      </p>
                    </div>
                    {r.sponsored ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px]",
                          "bg-primary/15 text-primary",
                        )}
                      >
                        Patrocinado
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

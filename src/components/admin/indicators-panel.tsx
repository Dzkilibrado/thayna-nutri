import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Medal, TrendingUp, Users } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

function daysSince(dateStr: string) {
  const ms = Date.now() - new Date(`${dateStr}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Cartão de número — a unidade básica do painel. */
function Kpi({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string | number;
  Icon: typeof Users;
  tone?: "warn" | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "warn" ? "bg-destructive/15 text-destructive" : "icon-tile text-primary",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

const SEGMENT_TONES = [
  "bg-primary",
  "bg-primary/70",
  "bg-primary/45",
  "bg-primary/25",
  "bg-surface-2",
];

/** Funil/composição em barra única segmentada, com legenda ao lado. Lê como
 * um gráfico sem depender de nenhuma biblioteca de gráficos. */
function SegmentedBar({ segments }: { segments: { label: string; count: number }[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-3.5 overflow-hidden rounded-full bg-surface-2">
        {total === 0
          ? null
          : segments.map((s, i) =>
              s.count === 0 ? null : (
                <div
                  key={s.label}
                  className={cn(SEGMENT_TONES[i % SEGMENT_TONES.length], "h-full")}
                  style={{ width: `${(s.count / total) * 100}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              ),
            )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                SEGMENT_TONES[i % SEGMENT_TONES.length],
              )}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.label}</span>
            <span className="shrink-0 font-medium">
              {s.count}
              {total > 0 ? (
                <span className="ml-1 text-muted-foreground">
                  ({Math.round((s.count / total) * 100)}%)
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ALL = "all";
const RETURN_WINDOWS = [
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

export function IndicatorsPanel() {
  const [attendanceFilter, setAttendanceFilter] = useState(ALL);
  const [returnWindow, setReturnWindow] = useState("30");
  const threshold = Number(returnWindow);

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

  const allClients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const isLoading = clientsQuery.isLoading || athletesQuery.isLoading;

  // O filtro de atendimento se aplica a tudo que vem de cliente — KPIs,
  // funil de status e composição de atendimento. Atletas não têm tipo de
  // atendimento, então não são afetados por esse filtro.
  const clients = useMemo(
    () =>
      attendanceFilter === ALL
        ? allClients
        : allClients.filter((c) => c.attendance_type === attendanceFilter),
    [allClients, attendanceFilter],
  );

  const total = clients.length;
  const activeClients = clients.filter((c) => c.contact_status === "cliente_ativo");
  const pendingCount = clients.filter(
    (c) => c.contact_status === "contato_inicial" || c.contact_status === "em_negociacao",
  ).length;
  const conversionRate = total > 0 ? Math.round((activeClients.length / total) * 100) : 0;

  // "Sem retorno" só faz sentido para quem já é cliente ativo — um contato
  // inicial ainda não teve consulta para "retornar", e um inativo já está
  // marcado como perdido por outro motivo.
  const clientsOverdue = activeClients
    .filter((c) => c.last_appointment_date && daysSince(c.last_appointment_date) >= threshold)
    .sort((a, b) => daysSince(b.last_appointment_date!) - daysSince(a.last_appointment_date!));

  const athletesOverdue = athletes
    .filter((a) => a.last_appointment_date && daysSince(a.last_appointment_date) >= threshold)
    .sort((a, b) => daysSince(b.last_appointment_date!) - daysSince(a.last_appointment_date!));

  const sponsoredCount = athletes.filter((a) => a.sponsored).length;

  const statusSegments = useMemo(
    () =>
      CONTACT_STATUS_OPTIONS.map((o) => ({
        label: o.label,
        count: clients.filter((c) => c.contact_status === o.value).length,
      })),
    [clients],
  );

  const contracted = useMemo(
    () =>
      clients.filter(
        (c) => c.contact_status === "cliente_ativo" || c.contact_status === "cliente_inativo",
      ),
    [clients],
  );
  const attendanceSegments = useMemo(() => {
    const base = ATTENDANCE_OPTIONS.map((o) => ({
      label: o.label,
      count: contracted.filter((c) => c.attendance_type === o.value).length,
    }));
    const undefinedCount = contracted.filter((c) => !c.attendance_type).length;
    return undefinedCount > 0
      ? [...base, { label: "Ainda não definido", count: undefinedCount }]
      : base;
  }, [contracted]);

  const referralRows = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const c of allClients) {
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
  }, [allClients, athletes]);
  const maxReferrals = referralRows[0]?.total ?? 0;

  if (isLoading) {
    return <p className="text-sm">Carregando…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="w-full sm:w-48">
          <Field label="Atendimento">
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {ATTENDANCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="w-full sm:w-48">
          <Field label="Considerar sem retorno após">
            <Select value={returnWindow} onValueChange={setReturnWindow}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_WINDOWS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {total === 0 && athletes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ainda não há dados suficientes para gerar indicadores.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-lg">Clientes</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Cadastrados" value={total} Icon={Users} />
              <Kpi label="Ativos" value={activeClients.length} Icon={Users} />
              <Kpi label="Em andamento" value={pendingCount} Icon={Users} />
              <Kpi
                label={`Sem retorno (${threshold}+ dias)`}
                value={clientsOverdue.length}
                Icon={AlertCircle}
                tone={clientsOverdue.length > 0 ? "warn" : undefined}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg">Atletas</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Cadastrados" value={athletes.length} Icon={Medal} />
              <Kpi label="Patrocinados atualmente" value={sponsoredCount} Icon={Medal} />
              <Kpi
                label={`Sem retorno (${threshold}+ dias)`}
                value={athletesOverdue.length}
                Icon={AlertCircle}
                tone={athletesOverdue.length > 0 ? "warn" : undefined}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <div>
              <h3 className="text-lg">Funil de status</h3>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão para cliente ativo:{" "}
                <strong className="text-foreground">{conversionRate}%</strong>
              </p>
            </div>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente com este filtro.</p>
            ) : (
              <SegmentedBar segments={statusSegments} />
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <div>
              <h3 className="text-lg">Atendimento contratado</h3>
              <p className="text-xs text-muted-foreground">
                Entre quem já virou cliente (ativo ou inativo) — {contracted.length} no total.
              </p>
            </div>
            {contracted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente convertido ainda.</p>
            ) : (
              <SegmentedBar segments={attendanceSegments} />
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
            <div>
              <h3 className="text-lg">Indicações por atleta</h3>
              <p className="text-xs text-muted-foreground">
                Quantos clientes cada atleta trouxe e quantos viraram cliente ativo — a base para
                decidir se vale manter o patrocínio.
              </p>
            </div>
            {referralRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente com indicação de atleta registrada ainda.
              </p>
            ) : (
              <ol className="space-y-3">
                {referralRows.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                        i === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-2 text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {r.name}
                          {r.sponsored ? (
                            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                              Patrocinado
                            </span>
                          ) : null}
                        </p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {r.total} indicado{r.total === 1 ? "" : "s"} · {r.active} ativo
                          {r.active === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${maxReferrals > 0 ? (r.total / maxReferrals) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <OverdueList
              title="Clientes sem retorno"
              rows={clientsOverdue.map((c) => ({
                id: c.id,
                name: c.client_name || c.client_phone || "Sem nome",
                date: c.last_appointment_date!,
              }))}
            />
            <OverdueList
              title="Atletas sem retorno"
              rows={athletesOverdue.map((a) => ({
                id: a.id,
                name: a.name,
                date: a.last_appointment_date!,
              }))}
            />
          </section>
        </>
      )}
    </div>
  );
}

function OverdueList({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; date: string }[];
}) {
  const shown = rows.slice(0, 6);
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">{title}</h3>
        <TrendingUp className="size-4 text-muted-foreground" />
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém precisando de contato agora.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{r.name}</span>
              <span className="shrink-0 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] text-destructive">
                há {daysSince(r.date)} dias · {formatDate(r.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > shown.length ? (
        <p className="text-[11px] text-muted-foreground">
          + {rows.length - shown.length} outro{rows.length - shown.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

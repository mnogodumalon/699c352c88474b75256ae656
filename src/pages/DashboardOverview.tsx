import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichAnalyseergebnisse } from '@/lib/enrich';
import { APP_IDS } from '@/types/app';
import type { Analysen, Analyseergebnisse } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, displayLookup } from '@/lib/formatters';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AnalysenDialog } from '@/components/dialogs/AnalysenDialog';
import { AnalyseergebnisseDialog } from '@/components/dialogs/AnalyseergebnisseDialog';
import { SchnellanalyseDialog } from '@/components/dialogs/SchnellanalyseDialog';
import {
  AlertCircle, Plus, Trash2, Edit2, ChevronRight, ChevronDown,
  FlaskConical, Zap, Leaf, ShieldAlert, CheckCircle2, XCircle,
  AlertTriangle, Circle, Package, Search
} from 'lucide-react';

// ─── Rating helpers ────────────────────────────────────────────────

const BEWERTUNG_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  sehr_empfehlenswert: { label: 'Sehr empfehlenswert', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
  empfehlenswert:      { label: 'Empfehlenswert',      color: 'text-green-700',   bg: 'bg-green-50 border-green-200',   icon: <CheckCircle2 size={14} className="text-green-600" /> },
  akzeptabel:          { label: 'Akzeptabel',           color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: <AlertTriangle size={14} className="text-amber-600" /> },
  nicht_empfehlenswert:{ label: 'Nicht empfehlenswert',color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', icon: <XCircle size={14} className="text-orange-600" /> },
  bedenklich:          { label: 'Bedenklich',           color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       icon: <XCircle size={14} className="text-red-600" /> },
};

const EINZELBEWERTUNG_CONFIG: Record<string, { label: string; dot: string }> = {
  allergen_vorhanden: { label: 'Allergen', dot: 'bg-red-500' },
  positiv:            { label: 'Positiv',  dot: 'bg-emerald-500' },
  neutral:            { label: 'Neutral',  dot: 'bg-slate-400' },
  negativ:            { label: 'Negativ',  dot: 'bg-orange-500' },
};

function BewertungBadge({ value }: { value?: string }) {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg = BEWERTUNG_CONFIG[value];
  if (!cfg) return <span className="text-xs">{value}</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function EinzelbewertungDot({ value }: { value?: string }) {
  if (!value) return null;
  const cfg = EINZELBEWERTUNG_CONFIG[value];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────

export default function DashboardOverview() {
  const {
    zutatendatenbank, analysen, analyseergebnisse, schnellanalyse,
    zutatendatenbankMap, analysenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedErgebnisse = enrichAnalyseergebnisse(analyseergebnisse, { analysenMap, zutatendatenbankMap });

  // Dialog state
  const [analyseDialogOpen, setAnalyseDialogOpen] = useState(false);
  const [editAnalyse, setEditAnalyse] = useState<Analysen | null>(null);
  const [deleteAnalyse, setDeleteAnalyse] = useState<Analysen | null>(null);

  const [ergebnisDialogOpen, setErgebnisDialogOpen] = useState(false);
  const [editErgebnis, setEditErgebnis] = useState<Analyseergebnisse | null>(null);
  const [deleteErgebnis, setDeleteErgebnis] = useState<Analyseergebnisse | null>(null);
  const [newErgebnisAnalyseId, setNewErgebnisAnalyseId] = useState<string | null>(null);

  const [schnellDialogOpen, setSchnellDialogOpen] = useState(false);

  // Expanded analyses
  const [expandedAnalyseIds, setExpandedAnalyseIds] = useState<Set<string>>(new Set());

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const allergenCount = useMemo(() =>
    zutatendatenbank.filter(z => z.fields.ist_allergen).length,
  [zutatendatenbank]);

  const bedenklichCount = useMemo(() =>
    analysen.filter(a => a.fields.gesamtbewertung === 'bedenklich' || a.fields.gesamtbewertung === 'nicht_empfehlenswert').length,
  [analysen]);

  const allergenErgebnisse = useMemo(() =>
    analyseergebnisse.filter(e => {
      const k = e.fields.einzelbewertung;
      return k && (typeof k === 'object' ? (k as {key:string}).key === 'allergen_vorhanden' : k === 'allergen_vorhanden');
    }).length,
  [analyseergebnisse]);

  // Filtered analyses
  const filteredAnalysen = useMemo(() => {
    if (!searchQuery.trim()) return analysen;
    const q = searchQuery.toLowerCase();
    return analysen.filter(a => (a.fields.analyse_titel || '').toLowerCase().includes(q));
  }, [analysen, searchQuery]);

  // Ergebnisse per Analyse
  const ergebnisseByAnalyse = useMemo(() => {
    const map = new Map<string, typeof enrichedErgebnisse>();
    enrichedErgebnisse.forEach(e => {
      const analyseId = extractRecordId(e.fields.zugehoerende_analyse);
      if (analyseId) {
        if (!map.has(analyseId)) map.set(analyseId, []);
        map.get(analyseId)!.push(e);
      }
    });
    return map;
  }, [enrichedErgebnisse]);

  function toggleExpand(id: string) {
    setExpandedAnalyseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analysen-Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Produkte analysieren · Zutaten bewerten · Allergene erkennen</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSchnellDialogOpen(true)}
            className="gap-2"
          >
            <Zap size={15} />
            Schnellanalyse
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditAnalyse(null); setAnalyseDialogOpen(true); }}
            className="gap-2"
          >
            <Plus size={15} />
            Neue Analyse
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Analysen"
          value={String(analysen.length)}
          description="Gesamt"
          icon={<FlaskConical size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Zutaten"
          value={String(zutatendatenbank.length)}
          description="in Datenbank"
          icon={<Leaf size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Allergene"
          value={String(allergenCount)}
          description="Zutaten markiert"
          icon={<ShieldAlert size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Bedenklich"
          value={String(bedenklichCount)}
          description="Analyseergebnisse"
          icon={<AlertCircle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Schnellanalyse summary strip */}
      {schnellanalyse.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              Letzte Schnellanalysen
            </span>
            <span className="text-xs text-muted-foreground">{schnellanalyse.length} Einträge</span>
          </div>
          <div className="flex flex-col gap-2">
            {schnellanalyse.slice(0, 3).map(s => {
              const bewKey = s.fields.schnell_gesamtbewertung;
              const bewStr = typeof bewKey === 'object' && bewKey !== null ? (bewKey as {key:string}).key : (bewKey as string | undefined);
              const cfg = bewStr ? BEWERTUNG_CONFIG[bewStr] : null;
              return (
                <div key={s.record_id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 border-border/50">
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {s.fields.schnell_titel || 'Ohne Titel'}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDate(s.fields.schnell_datum)}</span>
                    {cfg ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main: Analysen master-detail */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Table header + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
          <span className="font-semibold text-sm text-foreground">Produktanalysen</span>
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Analyse suchen…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
            />
          </div>
        </div>

        {filteredAnalysen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Package size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Noch keine Analysen</p>
              <p className="text-xs text-muted-foreground mt-0.5">Starten Sie eine neue Produktanalyse</p>
            </div>
            <Button size="sm" onClick={() => { setEditAnalyse(null); setAnalyseDialogOpen(true); }} className="gap-2 mt-1">
              <Plus size={14} /> Neue Analyse
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAnalysen.map(analyse => {
              const isExpanded = expandedAnalyseIds.has(analyse.record_id);
              const ergebnisse = ergebnisseByAnalyse.get(analyse.record_id) || [];
              const bewKey = analyse.fields.gesamtbewertung;
              const bewStr = typeof bewKey === 'object' && bewKey !== null ? (bewKey as {key:string}).key : (bewKey as string | undefined);

              return (
                <div key={analyse.record_id} className="group">
                  {/* Analyse row */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(analyse.record_id)}
                  >
                    {/* Expand icon */}
                    <span className="text-muted-foreground shrink-0">
                      {isExpanded
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />
                      }
                    </span>

                    {/* Product image or icon */}
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {analyse.fields.produktbild
                        ? <img src={analyse.fields.produktbild} alt="" className="w-full h-full object-cover rounded-xl" />
                        : <FlaskConical size={16} className="text-muted-foreground" />
                      }
                    </div>

                    {/* Title + date */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {analyse.fields.analyse_titel || 'Ohne Titel'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {formatDate(analyse.fields.analysedatum)}
                        {ergebnisse.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Circle size={3} className="fill-muted-foreground text-muted-foreground" />
                            {ergebnisse.length} Zutat{ergebnisse.length !== 1 ? 'en' : ''}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Rating badge */}
                    <div className="shrink-0 hidden sm:block">
                      <BewertungBadge value={bewStr} />
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setNewErgebnisAnalyseId(analyse.record_id);
                          setEditErgebnis(null);
                          setErgebnisDialogOpen(true);
                        }}
                        title="Zutat hinzufügen"
                      >
                        <Plus size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditAnalyse(analyse); setAnalyseDialogOpen(true); }}
                        title="Bearbeiten"
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive"
                        onClick={() => setDeleteAnalyse(analyse)}
                        title="Löschen"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: ingredient results */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-border/50">
                      {ergebnisse.length === 0 ? (
                        <div className="px-14 py-4 text-sm text-muted-foreground flex items-center justify-between">
                          <span>Keine Zutaten erfasst</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-7 text-xs"
                            onClick={() => {
                              setNewErgebnisAnalyseId(analyse.record_id);
                              setEditErgebnis(null);
                              setErgebnisDialogOpen(true);
                            }}
                          >
                            <Plus size={12} /> Zutat erfassen
                          </Button>
                        </div>
                      ) : (
                        <div className="px-5 py-3 space-y-1">
                          {ergebnisse.map(e => {
                            const einzelKey = e.fields.einzelbewertung;
                            const einzelStr = typeof einzelKey === 'object' && einzelKey !== null
                              ? (einzelKey as {key:string}).key
                              : (einzelKey as string | undefined);
                            return (
                              <div
                                key={e.record_id}
                                className="flex items-center justify-between py-2 pl-9 pr-2 rounded-lg hover:bg-background/70 group/row transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <EinzelbewertungDot value={einzelStr} />
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {e.erkannte_zutatName || '—'}
                                  </span>
                                  {e.fields.menge_anteil && (
                                    <span className="text-xs text-muted-foreground shrink-0">{e.fields.menge_anteil}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => { setEditErgebnis(e); setErgebnisDialogOpen(true); }}
                                  >
                                    <Edit2 size={11} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:text-destructive"
                                    onClick={() => setDeleteErgebnis(e)}
                                  >
                                    <Trash2 size={11} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          <div className="pl-9 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-7 text-xs text-muted-foreground"
                              onClick={() => {
                                setNewErgebnisAnalyseId(analyse.record_id);
                                setEditErgebnis(null);
                                setErgebnisDialogOpen(true);
                              }}
                            >
                              <Plus size={12} /> Zutat hinzufügen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Dialogs ─── */}

      {/* Analyse create/edit */}
      <AnalysenDialog
        open={analyseDialogOpen}
        onClose={() => { setAnalyseDialogOpen(false); setEditAnalyse(null); }}
        onSubmit={async (fields) => {
          if (editAnalyse) {
            await LivingAppsService.updateAnalysenEntry(editAnalyse.record_id, fields);
          } else {
            await LivingAppsService.createAnalysenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editAnalyse?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Analysen']}
      />

      {/* Analyse delete */}
      <ConfirmDialog
        open={!!deleteAnalyse}
        title="Analyse löschen"
        description={`"${deleteAnalyse?.fields.analyse_titel || 'Analyse'}" wirklich löschen? Alle Ergebnisse bleiben erhalten.`}
        onConfirm={async () => {
          if (deleteAnalyse) {
            await LivingAppsService.deleteAnalysenEntry(deleteAnalyse.record_id);
            setDeleteAnalyse(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteAnalyse(null)}
      />

      {/* Analyseergebnis create/edit */}
      <AnalyseergebnisseDialog
        open={ergebnisDialogOpen}
        onClose={() => { setErgebnisDialogOpen(false); setEditErgebnis(null); setNewErgebnisAnalyseId(null); }}
        onSubmit={async (fields) => {
          if (editErgebnis) {
            await LivingAppsService.updateAnalyseergebnisseEntry(editErgebnis.record_id, fields);
          } else {
            await LivingAppsService.createAnalyseergebnisseEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          editErgebnis
            ? editErgebnis.fields
            : newErgebnisAnalyseId
              ? { zugehoerende_analyse: createRecordUrl(APP_IDS.ANALYSEN, newErgebnisAnalyseId) }
              : undefined
        }
        analysenList={analysen}
        zutatendatenbankList={zutatendatenbank}
        enablePhotoScan={AI_PHOTO_SCAN['Analyseergebnisse']}
      />

      {/* Analyseergebnis delete */}
      <ConfirmDialog
        open={!!deleteErgebnis}
        title="Ergebnis löschen"
        description="Diesen Eintrag wirklich löschen?"
        onConfirm={async () => {
          if (deleteErgebnis) {
            await LivingAppsService.deleteAnalyseergebnisseEntry(deleteErgebnis.record_id);
            setDeleteErgebnis(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteErgebnis(null)}
      />

      {/* Schnellanalyse */}
      <SchnellanalyseDialog
        open={schnellDialogOpen}
        onClose={() => setSchnellDialogOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createSchnellanalyseEntry(fields);
          fetchAll();
        }}
        zutatendatenbankList={zutatendatenbank}
        enablePhotoScan={AI_PHOTO_SCAN['Schnellanalyse']}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

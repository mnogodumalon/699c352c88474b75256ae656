import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Schnellanalyse, Zutatendatenbank } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { SchnellanalyseDialog } from '@/components/dialogs/SchnellanalyseDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { displayLookup } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function SchnellanalysePage() {
  const [records, setRecords] = useState<Schnellanalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Schnellanalyse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schnellanalyse | null>(null);
  const [zutatendatenbankList, setZutatendatenbankList] = useState<Zutatendatenbank[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, zutatendatenbankData] = await Promise.all([
        LivingAppsService.getSchnellanalyse(),
        LivingAppsService.getZutatendatenbank(),
      ]);
      setRecords(mainData);
      setZutatendatenbankList(zutatendatenbankData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Schnellanalyse['fields']) {
    await LivingAppsService.createSchnellanalyseEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Schnellanalyse['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateSchnellanalyseEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchnellanalyseEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getZutatendatenbankDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return zutatendatenbankList.find(r => r.record_id === id)?.fields.zutat_name ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Schnellanalyse"
      subtitle={`${records.length} Schnellanalyse im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Schnellanalyse suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel der Analyse</TableHead>
              <TableHead>Produktbild</TableHead>
              <TableHead>Analysedatum und -zeit</TableHead>
              <TableHead>Zutaten auswählen</TableHead>
              <TableHead>Menge/Anteil</TableHead>
              <TableHead>Gesamtbewertung des Produkts</TableHead>
              <TableHead>Notizen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.schnell_titel ?? '—'}</TableCell>
                <TableCell>{record.fields.schnell_bild ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.schnell_datum)}</TableCell>
                <TableCell>{getZutatendatenbankDisplayName(record.fields.erkannte_zutaten)}</TableCell>
                <TableCell>{record.fields.schnell_menge ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.schnell_gesamtbewertung)}</Badge></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.schnell_notizen ?? '—'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Schnellanalyse. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SchnellanalyseDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        zutatendatenbankList={zutatendatenbankList}
        enablePhotoScan={AI_PHOTO_SCAN['Schnellanalyse']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Schnellanalyse löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}
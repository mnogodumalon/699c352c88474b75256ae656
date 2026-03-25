import type { Analyseergebnisse, Analysen, Zutatendatenbank } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface AnalyseergebnisseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Analyseergebnisse | null;
  onEdit: (record: Analyseergebnisse) => void;
  analysenList: Analysen[];
  zutatendatenbankList: Zutatendatenbank[];
}

export function AnalyseergebnisseViewDialog({ open, onClose, record, onEdit, analysenList, zutatendatenbankList }: AnalyseergebnisseViewDialogProps) {
  function getAnalysenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return analysenList.find(r => r.record_id === id)?.fields.analyse_titel ?? '—';
  }

  function getZutatendatenbankDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return zutatendatenbankList.find(r => r.record_id === id)?.fields.zutat_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analyseergebnisse anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehörige Analyse</Label>
            <p className="text-sm">{getAnalysenDisplayName(record.fields.zugehoerende_analyse)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erkannte Zutat</Label>
            <p className="text-sm">{getZutatendatenbankDisplayName(record.fields.erkannte_zutat)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Menge/Anteil</Label>
            <p className="text-sm">{record.fields.menge_anteil ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertung dieser Zutat</Label>
            <Badge variant="secondary">{record.fields.einzelbewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkung zu dieser Zutat</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkung_zutat ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
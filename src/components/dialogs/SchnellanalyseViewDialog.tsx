import type { Schnellanalyse, Zutatendatenbank } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface SchnellanalyseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schnellanalyse | null;
  onEdit: (record: Schnellanalyse) => void;
  zutatendatenbankList: Zutatendatenbank[];
}

export function SchnellanalyseViewDialog({ open, onClose, record, onEdit, zutatendatenbankList }: SchnellanalyseViewDialogProps) {
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
          <DialogTitle>Schnellanalyse anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Titel der Analyse</Label>
            <p className="text-sm">{record.fields.schnell_titel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Produktbild</Label>
            {record.fields.schnell_bild ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.schnell_bild} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Analysedatum und -zeit</Label>
            <p className="text-sm">{formatDate(record.fields.schnell_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zutaten auswählen</Label>
            <p className="text-sm">{getZutatendatenbankDisplayName(record.fields.erkannte_zutaten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Menge/Anteil</Label>
            <p className="text-sm">{record.fields.schnell_menge ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtbewertung des Produkts</Label>
            <Badge variant="secondary">{record.fields.schnell_gesamtbewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.schnell_notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
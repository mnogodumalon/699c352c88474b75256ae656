import { useState, useEffect, useRef, useCallback } from 'react';
import type { Schnellanalyse, Zutatendatenbank } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2, Upload, FileText, ImagePlus, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

interface SchnellanalyseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Schnellanalyse['fields']) => Promise<void>;
  defaultValues?: Schnellanalyse['fields'];
  zutatendatenbankList: Zutatendatenbank[];
  enablePhotoScan?: boolean;
}

export function SchnellanalyseDialog({ open, onClose, onSubmit, defaultValues, zutatendatenbankList, enablePhotoScan = false }: SchnellanalyseDialogProps) {
  const [fields, setFields] = useState<Partial<Schnellanalyse['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Schnellanalyse['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const uri = await fileToDataUri(file);
      if (file.type.startsWith('image/')) setPreview(uri);
      const schema = `{\n  "schnell_titel": string | null, // Titel der Analyse\n  "schnell_bild": string | null, // Produktbild\n  "schnell_datum": string | null, // YYYY-MM-DDTHH:MM // Analysedatum und -zeit\n  "erkannte_zutaten": string | null, // Name des Zutatendatenbank-Eintrags (z.B. "Jonas Schmidt")\n  "schnell_menge": string | null, // Menge/Anteil\n  "schnell_gesamtbewertung": string | null, // Gesamtbewertung des Produkts\n  "schnell_notizen": string | null, // Notizen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["erkannte_zutaten"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const erkannte_zutatenName = raw['erkannte_zutaten'] as string | null;
        if (erkannte_zutatenName && !merged['erkannte_zutaten']) {
          const erkannte_zutatenMatch = zutatendatenbankList.find(r => matchName(erkannte_zutatenName!, [String(r.fields.zutat_name ?? '')]));
          if (erkannte_zutatenMatch) merged['erkannte_zutaten'] = createRecordUrl(APP_IDS.ZUTATENDATENBANK, erkannte_zutatenMatch.record_id);
        }
        return merged as Partial<Schnellanalyse['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handlePhotoScan(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handlePhotoScan(file);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Schnellanalyse bearbeiten' : 'Schnellanalyse hinzufügen'}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              KI-Erkennung
              <span className="text-muted-foreground font-normal">(füllt Felder automatisch aus)</span>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">KI analysiert...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Felder werden automatisch ausgefüllt</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Felder ausgefüllt!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Prüfe die Werte und passe sie ggf. an</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <ImagePlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto oder Dokument hochladen</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <Camera className="h-3.5 w-3.5 mr-1.5" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />Foto wählen
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <FileText className="h-3.5 w-3.5 mr-1.5" />Dokument
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schnell_titel">Titel der Analyse</Label>
            <Input
              id="schnell_titel"
              value={fields.schnell_titel ?? ''}
              onChange={e => setFields(f => ({ ...f, schnell_titel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schnell_bild">Produktbild</Label>
            <Input
              id="schnell_bild"
              value={fields.schnell_bild ?? ''}
              onChange={e => setFields(f => ({ ...f, schnell_bild: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schnell_datum">Analysedatum und -zeit</Label>
            <Input
              id="schnell_datum"
              type="datetime-local"
              step="60"
              value={fields.schnell_datum ?? ''}
              onChange={e => setFields(f => ({ ...f, schnell_datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="erkannte_zutaten">Zutaten auswählen</Label>
            <Select
              value={extractRecordId(fields.erkannte_zutaten) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, erkannte_zutaten: v === 'none' ? undefined : createRecordUrl(APP_IDS.ZUTATENDATENBANK, v) }))}
            >
              <SelectTrigger id="erkannte_zutaten"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {zutatendatenbankList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.zutat_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schnell_menge">Menge/Anteil</Label>
            <Input
              id="schnell_menge"
              value={fields.schnell_menge ?? ''}
              onChange={e => setFields(f => ({ ...f, schnell_menge: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schnell_gesamtbewertung">Gesamtbewertung des Produkts</Label>
            <Select
              value={lookupKey(fields.schnell_gesamtbewertung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, schnell_gesamtbewertung: v === 'none' ? undefined : v as 'sehr_empfehlenswert' | 'empfehlenswert' | 'akzeptabel' | 'nicht_empfehlenswert' | 'bedenklich' }))}
            >
              <SelectTrigger id="schnell_gesamtbewertung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="sehr_empfehlenswert">Sehr empfehlenswert</SelectItem>
                <SelectItem value="empfehlenswert">Empfehlenswert</SelectItem>
                <SelectItem value="akzeptabel">Akzeptabel</SelectItem>
                <SelectItem value="nicht_empfehlenswert">Nicht empfehlenswert</SelectItem>
                <SelectItem value="bedenklich">Bedenklich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schnell_notizen">Notizen</Label>
            <Textarea
              id="schnell_notizen"
              value={fields.schnell_notizen ?? ''}
              onChange={e => setFields(f => ({ ...f, schnell_notizen: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
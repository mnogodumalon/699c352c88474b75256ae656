import { useState, useEffect, useRef, useCallback } from 'react';
import type { Zutatendatenbank } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile } from '@/services/livingAppsService';
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
import { Checkbox } from '@/components/ui/checkbox';
import { IconCamera, IconCircleCheck, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromPhoto, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey, lookupKeys } from '@/lib/formatters';

interface ZutatendatenbankDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Zutatendatenbank['fields']) => Promise<void>;
  defaultValues?: Zutatendatenbank['fields'];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function ZutatendatenbankDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false, enablePhotoLocation = true }: ZutatendatenbankDialogProps) {
  const [fields, setFields] = useState<Partial<Zutatendatenbank['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'zutatendatenbank');
      await onSubmit(clean as Zutatendatenbank['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const [uri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
      if (file.type.startsWith('image/')) setPreview(uri);
      const gps = enablePhotoLocation ? meta?.gps ?? null : null;
      const parts: string[] = [];
      let geoAddr = '';
      if (gps) {
        geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
        parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
        if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
      }
      if (meta?.dateTime) {
        parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "zutat_name": string | null, // Name der Zutat\n  "kategorie": LookupValue | null, // Kategorie (select one key: "fleisch_fisch" | "sonstiges" | "nuesse_samen" | "konservierungsstoffe" | "farbstoffe" | "aromen" | "gewuerze_kraeuter" | "getreide_mehl" | "zucker_suessungsmittel" | "fette_oele" | "milchprodukte" | "fruechte_gemuese" | "eier" | "zusatzstoffe") mapping: fleisch_fisch=Fleisch & Fisch, sonstiges=Sonstiges, nuesse_samen=Nüsse & Samen, konservierungsstoffe=Konservierungsstoffe, farbstoffe=Farbstoffe, aromen=Aromen, gewuerze_kraeuter=Gewürze & Kräuter, getreide_mehl=Getreide & Mehl, zucker_suessungsmittel=Zucker & Süßungsmittel, fette_oele=Fette & Öle, milchprodukte=Milchprodukte, fruechte_gemuese=Früchte & Gemüse, eier=Eier, zusatzstoffe=Zusatzstoffe\n  "ist_allergen": boolean | null, // Ist Allergen\n  "allergen_typ": LookupValue[] | null, // Allergen-Typ (select one or more keys: "gluten" | "krebstiere" | "eier" | "fisch" | "erdnuesse" | "soja" | "milch_laktose" | "schalenfruechte" | "sellerie" | "senf" | "sesam" | "lupinen" | "weichtiere" | "schwefeldioxid_sulfite") mapping: gluten=Gluten, krebstiere=Krebstiere, eier=Eier, fisch=Fisch, erdnuesse=Erdnüsse, soja=Soja, milch_laktose=Milch/Laktose, schalenfruechte=Schalenfrüchte, sellerie=Sellerie, senf=Senf, sesam=Sesam, lupinen=Lupinen, weichtiere=Weichtiere, schwefeldioxid_sulfite=Schwefeldioxid/Sulfite\n  "gesundheitsbewertung": LookupValue | null, // Gesundheitsbewertung (select one key: "sehr_gut" | "gut" | "neutral" | "bedenklich" | "schaedlich") mapping: sehr_gut=Sehr gut, gut=Gut, neutral=Neutral, bedenklich=Bedenklich, schaedlich=Schädlich\n  "naehrwert_hinweise": string | null, // Nährwert-Hinweise\n  "bemerkungen": string | null, // Weitere Bemerkungen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null) merged[k] = v;
        }
        return merged as Partial<Zutatendatenbank['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
      alert(err instanceof Error ? err.message : String(err));
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

  const DIALOG_INTENT = defaultValues ? 'Zutatendatenbank bearbeiten' : 'Zutatendatenbank hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <IconSparkles className="h-4 w-4 text-primary" />
                KI-Assistent
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Versteht deine Fotos / Dokumente und füllt alles für dich aus</p>
            </div>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  KI-Assistent darf zusätzlich Informationen zu meiner Person verwenden
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? 'Lade...' : '(mehr Infos)'}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">Folgende Infos über dich können von der KI genutzt werden:</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">Profil konnte nicht geladen werden</span>
                )}
              </div>
            )}

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
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">KI analysiert...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Felder werden automatisch ausgefüllt</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Felder ausgefüllt!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Prüfe die Werte und passe sie ggf. an</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto oder Dokument hierher ziehen oder auswählen</p>
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
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1.5" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1.5" />Foto wählen
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
                <IconFileText className="h-3.5 w-3.5 mr-1.5" />Dokument
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zutat_name">Name der Zutat</Label>
            <Input
              id="zutat_name"
              value={fields.zutat_name ?? ''}
              onChange={e => setFields(f => ({ ...f, zutat_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kategorie">Kategorie</Label>
            <Select
              value={lookupKey(fields.kategorie) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, kategorie: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="kategorie"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="fleisch_fisch">Fleisch & Fisch</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
                <SelectItem value="nuesse_samen">Nüsse & Samen</SelectItem>
                <SelectItem value="konservierungsstoffe">Konservierungsstoffe</SelectItem>
                <SelectItem value="farbstoffe">Farbstoffe</SelectItem>
                <SelectItem value="aromen">Aromen</SelectItem>
                <SelectItem value="gewuerze_kraeuter">Gewürze & Kräuter</SelectItem>
                <SelectItem value="getreide_mehl">Getreide & Mehl</SelectItem>
                <SelectItem value="zucker_suessungsmittel">Zucker & Süßungsmittel</SelectItem>
                <SelectItem value="fette_oele">Fette & Öle</SelectItem>
                <SelectItem value="milchprodukte">Milchprodukte</SelectItem>
                <SelectItem value="fruechte_gemuese">Früchte & Gemüse</SelectItem>
                <SelectItem value="eier">Eier</SelectItem>
                <SelectItem value="zusatzstoffe">Zusatzstoffe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ist_allergen">Ist Allergen</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="ist_allergen"
                checked={!!fields.ist_allergen}
                onCheckedChange={(v) => setFields(f => ({ ...f, ist_allergen: !!v }))}
              />
              <Label htmlFor="ist_allergen" className="font-normal">Ist Allergen</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergen_typ">Allergen-Typ</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_gluten"
                  checked={lookupKeys(fields.allergen_typ).includes('gluten')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'gluten'] : current.filter(k => k !== 'gluten');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_gluten" className="font-normal">Gluten</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_krebstiere"
                  checked={lookupKeys(fields.allergen_typ).includes('krebstiere')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'krebstiere'] : current.filter(k => k !== 'krebstiere');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_krebstiere" className="font-normal">Krebstiere</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_eier"
                  checked={lookupKeys(fields.allergen_typ).includes('eier')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'eier'] : current.filter(k => k !== 'eier');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_eier" className="font-normal">Eier</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_fisch"
                  checked={lookupKeys(fields.allergen_typ).includes('fisch')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'fisch'] : current.filter(k => k !== 'fisch');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_fisch" className="font-normal">Fisch</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_erdnuesse"
                  checked={lookupKeys(fields.allergen_typ).includes('erdnuesse')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'erdnuesse'] : current.filter(k => k !== 'erdnuesse');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_erdnuesse" className="font-normal">Erdnüsse</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_soja"
                  checked={lookupKeys(fields.allergen_typ).includes('soja')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'soja'] : current.filter(k => k !== 'soja');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_soja" className="font-normal">Soja</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_milch_laktose"
                  checked={lookupKeys(fields.allergen_typ).includes('milch_laktose')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'milch_laktose'] : current.filter(k => k !== 'milch_laktose');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_milch_laktose" className="font-normal">Milch/Laktose</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_schalenfruechte"
                  checked={lookupKeys(fields.allergen_typ).includes('schalenfruechte')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'schalenfruechte'] : current.filter(k => k !== 'schalenfruechte');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_schalenfruechte" className="font-normal">Schalenfrüchte</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_sellerie"
                  checked={lookupKeys(fields.allergen_typ).includes('sellerie')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'sellerie'] : current.filter(k => k !== 'sellerie');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_sellerie" className="font-normal">Sellerie</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_senf"
                  checked={lookupKeys(fields.allergen_typ).includes('senf')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'senf'] : current.filter(k => k !== 'senf');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_senf" className="font-normal">Senf</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_sesam"
                  checked={lookupKeys(fields.allergen_typ).includes('sesam')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'sesam'] : current.filter(k => k !== 'sesam');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_sesam" className="font-normal">Sesam</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_lupinen"
                  checked={lookupKeys(fields.allergen_typ).includes('lupinen')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'lupinen'] : current.filter(k => k !== 'lupinen');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_lupinen" className="font-normal">Lupinen</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_weichtiere"
                  checked={lookupKeys(fields.allergen_typ).includes('weichtiere')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'weichtiere'] : current.filter(k => k !== 'weichtiere');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_weichtiere" className="font-normal">Weichtiere</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allergen_typ_schwefeldioxid_sulfite"
                  checked={lookupKeys(fields.allergen_typ).includes('schwefeldioxid_sulfite')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.allergen_typ);
                      const next = checked ? [...current, 'schwefeldioxid_sulfite'] : current.filter(k => k !== 'schwefeldioxid_sulfite');
                      return { ...f, allergen_typ: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="allergen_typ_schwefeldioxid_sulfite" className="font-normal">Schwefeldioxid/Sulfite</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gesundheitsbewertung">Gesundheitsbewertung</Label>
            <Select
              value={lookupKey(fields.gesundheitsbewertung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, gesundheitsbewertung: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="gesundheitsbewertung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="sehr_gut">Sehr gut</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="bedenklich">Bedenklich</SelectItem>
                <SelectItem value="schaedlich">Schädlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="naehrwert_hinweise">Nährwert-Hinweise</Label>
            <Textarea
              id="naehrwert_hinweise"
              value={fields.naehrwert_hinweise ?? ''}
              onChange={e => setFields(f => ({ ...f, naehrwert_hinweise: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bemerkungen">Weitere Bemerkungen</Label>
            <Textarea
              id="bemerkungen"
              value={fields.bemerkungen ?? ''}
              onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
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
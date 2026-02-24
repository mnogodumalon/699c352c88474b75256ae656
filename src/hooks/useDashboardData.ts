import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Zutatendatenbank, Analysen, Analyseergebnisse, Schnellanalyse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [zutatendatenbank, setZutatendatenbank] = useState<Zutatendatenbank[]>([]);
  const [analysen, setAnalysen] = useState<Analysen[]>([]);
  const [analyseergebnisse, setAnalyseergebnisse] = useState<Analyseergebnisse[]>([]);
  const [schnellanalyse, setSchnellanalyse] = useState<Schnellanalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [zutatendatenbankData, analysenData, analyseergebnisseData, schnellanalyseData] = await Promise.all([
        LivingAppsService.getZutatendatenbank(),
        LivingAppsService.getAnalysen(),
        LivingAppsService.getAnalyseergebnisse(),
        LivingAppsService.getSchnellanalyse(),
      ]);
      setZutatendatenbank(zutatendatenbankData);
      setAnalysen(analysenData);
      setAnalyseergebnisse(analyseergebnisseData);
      setSchnellanalyse(schnellanalyseData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const zutatendatenbankMap = useMemo(() => {
    const m = new Map<string, Zutatendatenbank>();
    zutatendatenbank.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zutatendatenbank]);

  const analysenMap = useMemo(() => {
    const m = new Map<string, Analysen>();
    analysen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [analysen]);

  return { zutatendatenbank, setZutatendatenbank, analysen, setAnalysen, analyseergebnisse, setAnalyseergebnisse, schnellanalyse, setSchnellanalyse, loading, error, fetchAll, zutatendatenbankMap, analysenMap };
}
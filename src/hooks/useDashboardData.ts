import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Analysen, Analyseergebnisse, Zutatendatenbank, Schnellanalyse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [analysen, setAnalysen] = useState<Analysen[]>([]);
  const [analyseergebnisse, setAnalyseergebnisse] = useState<Analyseergebnisse[]>([]);
  const [zutatendatenbank, setZutatendatenbank] = useState<Zutatendatenbank[]>([]);
  const [schnellanalyse, setSchnellanalyse] = useState<Schnellanalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [analysenData, analyseergebnisseData, zutatendatenbankData, schnellanalyseData] = await Promise.all([
        LivingAppsService.getAnalysen(),
        LivingAppsService.getAnalyseergebnisse(),
        LivingAppsService.getZutatendatenbank(),
        LivingAppsService.getSchnellanalyse(),
      ]);
      setAnalysen(analysenData);
      setAnalyseergebnisse(analyseergebnisseData);
      setZutatendatenbank(zutatendatenbankData);
      setSchnellanalyse(schnellanalyseData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [analysenData, analyseergebnisseData, zutatendatenbankData, schnellanalyseData] = await Promise.all([
          LivingAppsService.getAnalysen(),
          LivingAppsService.getAnalyseergebnisse(),
          LivingAppsService.getZutatendatenbank(),
          LivingAppsService.getSchnellanalyse(),
        ]);
        setAnalysen(analysenData);
        setAnalyseergebnisse(analyseergebnisseData);
        setZutatendatenbank(zutatendatenbankData);
        setSchnellanalyse(schnellanalyseData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const analysenMap = useMemo(() => {
    const m = new Map<string, Analysen>();
    analysen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [analysen]);

  const zutatendatenbankMap = useMemo(() => {
    const m = new Map<string, Zutatendatenbank>();
    zutatendatenbank.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zutatendatenbank]);

  return { analysen, setAnalysen, analyseergebnisse, setAnalyseergebnisse, zutatendatenbank, setZutatendatenbank, schnellanalyse, setSchnellanalyse, loading, error, fetchAll, analysenMap, zutatendatenbankMap };
}
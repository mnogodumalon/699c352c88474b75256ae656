import type { EnrichedAnalyseergebnisse, EnrichedSchnellanalyse } from '@/types/enriched';
import type { Analyseergebnisse, Analysen, Schnellanalyse, Zutatendatenbank } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: string | undefined, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AnalyseergebnisseMaps {
  analysenMap: Map<string, Analysen>;
  zutatendatenbankMap: Map<string, Zutatendatenbank>;
}

export function enrichAnalyseergebnisse(
  analyseergebnisse: Analyseergebnisse[],
  maps: AnalyseergebnisseMaps
): EnrichedAnalyseergebnisse[] {
  return analyseergebnisse.map(r => ({
    ...r,
    zugehoerende_analyseName: resolveDisplay(r.fields.zugehoerende_analyse, maps.analysenMap, 'analyse_titel'),
    erkannte_zutatName: resolveDisplay(r.fields.erkannte_zutat, maps.zutatendatenbankMap, 'zutat_name'),
  }));
}

interface SchnellanalyseMaps {
  zutatendatenbankMap: Map<string, Zutatendatenbank>;
}

export function enrichSchnellanalyse(
  schnellanalyse: Schnellanalyse[],
  maps: SchnellanalyseMaps
): EnrichedSchnellanalyse[] {
  return schnellanalyse.map(r => ({
    ...r,
    erkannte_zutatenName: resolveDisplay(r.fields.erkannte_zutaten, maps.zutatendatenbankMap, 'zutat_name'),
  }));
}

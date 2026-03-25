import type { Analyseergebnisse, Schnellanalyse } from './app';

export type EnrichedAnalyseergebnisse = Analyseergebnisse & {
  zugehoerende_analyseName: string;
  erkannte_zutatName: string;
};

export type EnrichedSchnellanalyse = Schnellanalyse & {
  erkannte_zutatenName: string;
};

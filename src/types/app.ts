// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Zutatendatenbank {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zutat_name?: string;
    kategorie?: 'fleisch_fisch' | 'sonstiges' | 'nuesse_samen' | 'konservierungsstoffe' | 'farbstoffe' | 'aromen' | 'gewuerze_kraeuter' | 'getreide_mehl' | 'zucker_suessungsmittel' | 'fette_oele' | 'milchprodukte' | 'fruechte_gemuese' | 'eier' | 'zusatzstoffe';
    ist_allergen?: boolean;
    allergen_typ?: ('gluten' | 'krebstiere' | 'eier' | 'fisch' | 'erdnuesse' | 'soja' | 'milch_laktose' | 'schalenfruechte' | 'sellerie' | 'senf' | 'sesam' | 'lupinen' | 'weichtiere' | 'schwefeldioxid_sulfite')[];
    gesundheitsbewertung?: 'sehr_gut' | 'gut' | 'neutral' | 'bedenklich' | 'schaedlich';
    naehrwert_hinweise?: string;
    bemerkungen?: string;
  };
}

export interface Analysen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    analyse_titel?: string;
    produktbild?: string;
    analysedatum?: string; // Format: YYYY-MM-DD oder ISO String
    gesamtbewertung?: 'sehr_empfehlenswert' | 'empfehlenswert' | 'akzeptabel' | 'nicht_empfehlenswert' | 'bedenklich';
    allgemeine_notizen?: string;
  };
}

export interface Analyseergebnisse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zugehoerende_analyse?: string; // applookup -> URL zu 'Analysen' Record
    erkannte_zutat?: string; // applookup -> URL zu 'Zutatendatenbank' Record
    menge_anteil?: string;
    einzelbewertung?: 'allergen_vorhanden' | 'positiv' | 'neutral' | 'negativ';
    bemerkung_zutat?: string;
  };
}

export interface Schnellanalyse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schnell_titel?: string;
    schnell_bild?: string;
    schnell_datum?: string; // Format: YYYY-MM-DD oder ISO String
    erkannte_zutaten?: string; // applookup -> URL zu 'Zutatendatenbank' Record
    schnell_menge?: string;
    schnell_gesamtbewertung?: 'sehr_empfehlenswert' | 'empfehlenswert' | 'akzeptabel' | 'nicht_empfehlenswert' | 'bedenklich';
    schnell_notizen?: string;
  };
}

export const APP_IDS = {
  ZUTATENDATENBANK: '699c35017ca9d5e746867983',
  ANALYSEN: '699c3506b5c37b2fe49da856',
  ANALYSEERGEBNISSE: '699c350783673810f82e34c4',
  SCHNELLANALYSE: '699c35083159889d7927b682',
} as const;

// Helper Types for creating new records
export type CreateZutatendatenbank = Zutatendatenbank['fields'];
export type CreateAnalysen = Analysen['fields'];
export type CreateAnalyseergebnisse = Analyseergebnisse['fields'];
export type CreateSchnellanalyse = Schnellanalyse['fields'];
// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Analysen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    analyse_titel?: string;
    produktbild?: string;
    analysedatum?: string; // Format: YYYY-MM-DD oder ISO String
    gesamtbewertung?: LookupValue;
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
    einzelbewertung?: LookupValue;
    bemerkung_zutat?: string;
  };
}

export interface Zutatendatenbank {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zutat_name?: string;
    kategorie?: LookupValue;
    ist_allergen?: boolean;
    allergen_typ?: LookupValue[];
    gesundheitsbewertung?: LookupValue;
    naehrwert_hinweise?: string;
    bemerkungen?: string;
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
    schnell_gesamtbewertung?: LookupValue;
    schnell_notizen?: string;
  };
}

export const APP_IDS = {
  ANALYSEN: '699c3506b5c37b2fe49da856',
  ANALYSEERGEBNISSE: '699c350783673810f82e34c4',
  ZUTATENDATENBANK: '699c35017ca9d5e746867983',
  SCHNELLANALYSE: '699c35083159889d7927b682',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'analysen': {
    gesamtbewertung: [{ key: "sehr_empfehlenswert", label: "Sehr empfehlenswert" }, { key: "empfehlenswert", label: "Empfehlenswert" }, { key: "akzeptabel", label: "Akzeptabel" }, { key: "nicht_empfehlenswert", label: "Nicht empfehlenswert" }, { key: "bedenklich", label: "Bedenklich" }],
  },
  'analyseergebnisse': {
    einzelbewertung: [{ key: "allergen_vorhanden", label: "Allergen vorhanden" }, { key: "positiv", label: "Positiv" }, { key: "neutral", label: "Neutral" }, { key: "negativ", label: "Negativ" }],
  },
  'zutatendatenbank': {
    kategorie: [{ key: "fleisch_fisch", label: "Fleisch & Fisch" }, { key: "sonstiges", label: "Sonstiges" }, { key: "nuesse_samen", label: "Nüsse & Samen" }, { key: "konservierungsstoffe", label: "Konservierungsstoffe" }, { key: "farbstoffe", label: "Farbstoffe" }, { key: "aromen", label: "Aromen" }, { key: "gewuerze_kraeuter", label: "Gewürze & Kräuter" }, { key: "getreide_mehl", label: "Getreide & Mehl" }, { key: "zucker_suessungsmittel", label: "Zucker & Süßungsmittel" }, { key: "fette_oele", label: "Fette & Öle" }, { key: "milchprodukte", label: "Milchprodukte" }, { key: "fruechte_gemuese", label: "Früchte & Gemüse" }, { key: "eier", label: "Eier" }, { key: "zusatzstoffe", label: "Zusatzstoffe" }],
    allergen_typ: [{ key: "gluten", label: "Gluten" }, { key: "krebstiere", label: "Krebstiere" }, { key: "eier", label: "Eier" }, { key: "fisch", label: "Fisch" }, { key: "erdnuesse", label: "Erdnüsse" }, { key: "soja", label: "Soja" }, { key: "milch_laktose", label: "Milch/Laktose" }, { key: "schalenfruechte", label: "Schalenfrüchte" }, { key: "sellerie", label: "Sellerie" }, { key: "senf", label: "Senf" }, { key: "sesam", label: "Sesam" }, { key: "lupinen", label: "Lupinen" }, { key: "weichtiere", label: "Weichtiere" }, { key: "schwefeldioxid_sulfite", label: "Schwefeldioxid/Sulfite" }],
    gesundheitsbewertung: [{ key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "neutral", label: "Neutral" }, { key: "bedenklich", label: "Bedenklich" }, { key: "schaedlich", label: "Schädlich" }],
  },
  'schnellanalyse': {
    schnell_gesamtbewertung: [{ key: "sehr_empfehlenswert", label: "Sehr empfehlenswert" }, { key: "empfehlenswert", label: "Empfehlenswert" }, { key: "akzeptabel", label: "Akzeptabel" }, { key: "nicht_empfehlenswert", label: "Nicht empfehlenswert" }, { key: "bedenklich", label: "Bedenklich" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'analysen': {
    'analyse_titel': 'string/text',
    'produktbild': 'file',
    'analysedatum': 'date/datetimeminute',
    'gesamtbewertung': 'lookup/radio',
    'allgemeine_notizen': 'string/textarea',
  },
  'analyseergebnisse': {
    'zugehoerende_analyse': 'applookup/select',
    'erkannte_zutat': 'applookup/select',
    'menge_anteil': 'string/text',
    'einzelbewertung': 'lookup/radio',
    'bemerkung_zutat': 'string/textarea',
  },
  'zutatendatenbank': {
    'zutat_name': 'string/text',
    'kategorie': 'lookup/select',
    'ist_allergen': 'bool',
    'allergen_typ': 'multiplelookup/checkbox',
    'gesundheitsbewertung': 'lookup/radio',
    'naehrwert_hinweise': 'string/textarea',
    'bemerkungen': 'string/textarea',
  },
  'schnellanalyse': {
    'schnell_titel': 'string/text',
    'schnell_bild': 'file',
    'schnell_datum': 'date/datetimeminute',
    'erkannte_zutaten': 'applookup/select',
    'schnell_menge': 'string/text',
    'schnell_gesamtbewertung': 'lookup/radio',
    'schnell_notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateAnalysen = StripLookup<Analysen['fields']>;
export type CreateAnalyseergebnisse = StripLookup<Analyseergebnisse['fields']>;
export type CreateZutatendatenbank = StripLookup<Zutatendatenbank['fields']>;
export type CreateSchnellanalyse = StripLookup<Schnellanalyse['fields']>;
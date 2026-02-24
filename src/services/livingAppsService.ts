// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Zutatendatenbank, Analysen, Analyseergebnisse, Schnellanalyse } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- ZUTATENDATENBANK ---
  static async getZutatendatenbank(): Promise<Zutatendatenbank[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZUTATENDATENBANK}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getZutatendatenbankEntry(id: string): Promise<Zutatendatenbank | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ZUTATENDATENBANK}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createZutatendatenbankEntry(fields: Zutatendatenbank['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ZUTATENDATENBANK}/records`, { fields });
  }
  static async updateZutatendatenbankEntry(id: string, fields: Partial<Zutatendatenbank['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ZUTATENDATENBANK}/records/${id}`, { fields });
  }
  static async deleteZutatendatenbankEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ZUTATENDATENBANK}/records/${id}`);
  }

  // --- ANALYSEN ---
  static async getAnalysen(): Promise<Analysen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANALYSEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAnalysenEntry(id: string): Promise<Analysen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANALYSEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAnalysenEntry(fields: Analysen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ANALYSEN}/records`, { fields });
  }
  static async updateAnalysenEntry(id: string, fields: Partial<Analysen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ANALYSEN}/records/${id}`, { fields });
  }
  static async deleteAnalysenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ANALYSEN}/records/${id}`);
  }

  // --- ANALYSEERGEBNISSE ---
  static async getAnalyseergebnisse(): Promise<Analyseergebnisse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANALYSEERGEBNISSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAnalyseergebnisseEntry(id: string): Promise<Analyseergebnisse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANALYSEERGEBNISSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAnalyseergebnisseEntry(fields: Analyseergebnisse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ANALYSEERGEBNISSE}/records`, { fields });
  }
  static async updateAnalyseergebnisseEntry(id: string, fields: Partial<Analyseergebnisse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ANALYSEERGEBNISSE}/records/${id}`, { fields });
  }
  static async deleteAnalyseergebnisseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ANALYSEERGEBNISSE}/records/${id}`);
  }

  // --- SCHNELLANALYSE ---
  static async getSchnellanalyse(): Promise<Schnellanalyse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHNELLANALYSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSchnellanalyseEntry(id: string): Promise<Schnellanalyse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHNELLANALYSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSchnellanalyseEntry(fields: Schnellanalyse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHNELLANALYSE}/records`, { fields });
  }
  static async updateSchnellanalyseEntry(id: string, fields: Partial<Schnellanalyse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHNELLANALYSE}/records/${id}`, { fields });
  }
  static async deleteSchnellanalyseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHNELLANALYSE}/records/${id}`);
  }

}
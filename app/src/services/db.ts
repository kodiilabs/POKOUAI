import * as SQLite from 'expo-sqlite';
import type { DiagnosisResult, FarmLogEntry, InferenceTier, LanguageCode } from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('pokouai.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_uri TEXT NOT NULL,
      disease TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      confidence REAL NOT NULL,
      language TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      treatment TEXT NOT NULL,
      prevention TEXT NOT NULL,
      agronomist_advice TEXT NOT NULL,
      raw_response TEXT NOT NULL,
      model_version TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      tier TEXT NOT NULL DEFAULT 'local',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_diagnoses_created ON diagnoses(created_at DESC);

    CREATE TABLE IF NOT EXISTS loops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      initial_diagnosis_id INTEGER NOT NULL UNIQUE,
      followup_diagnosis_id INTEGER,
      hypothesis_category TEXT,
      hypothesis_note TEXT,
      hypothesis_audio_uri TEXT,
      comparison_response TEXT,
      scheduled_for TEXT NOT NULL,
      notification_id TEXT,
      outcome TEXT,
      hypothesis_confirmed INTEGER,
      lesson TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (initial_diagnosis_id) REFERENCES diagnoses(id),
      FOREIGN KEY (followup_diagnosis_id) REFERENCES diagnoses(id)
    );
    CREATE INDEX IF NOT EXISTS idx_loops_scheduled ON loops(scheduled_for);
    CREATE INDEX IF NOT EXISTS idx_loops_completed ON loops(completed_at DESC);
  `);
  // Additive migrations for existing installs
  try {
    await db.execAsync(`ALTER TABLE diagnoses ADD COLUMN tier TEXT NOT NULL DEFAULT 'local'`);
  } catch {
    /* column already exists */
  }
  try {
    await db.execAsync(`ALTER TABLE loops ADD COLUMN hypothesis_audio_uri TEXT`);
  } catch {
    /* column already exists */
  }
  try {
    await db.execAsync(`ALTER TABLE loops ADD COLUMN comparison_response TEXT`);
  } catch {
    /* column already exists */
  }
  return db;
}

function ensureDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('db not initialized — call initDb() at app start');
  return db;
}

export async function insertDiagnosis(
  imageUri: string,
  language: LanguageCode,
  result: DiagnosisResult,
  tier: InferenceTier = 'local',
): Promise<number> {
  const conn = ensureDb();
  const res = await conn.runAsync(
    `INSERT INTO diagnoses
     (image_uri, disease, disease_name, confidence, language,
      symptoms, treatment, prevention, agronomist_advice,
      raw_response, model_version, latency_ms, tier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      imageUri,
      result.disease,
      result.diseaseName,
      result.confidence,
      language,
      JSON.stringify(result.symptoms),
      JSON.stringify(result.treatment),
      JSON.stringify(result.prevention),
      result.whenToCallAgronomist,
      result.rawResponse,
      result.modelVersion,
      result.latencyMs,
      tier,
    ],
  );
  return res.lastInsertRowId;
}

export interface DiagnosisRow extends FarmLogEntry {
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  agronomistAdvice: string;
  rawResponse: string;
  modelVersion: string;
  latencyMs: number;
  tier: InferenceTier;
}

interface DbRow {
  id: number;
  image_uri: string;
  disease: string;
  disease_name: string;
  confidence: number;
  language: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  agronomist_advice: string;
  raw_response: string;
  model_version: string;
  latency_ms: number;
  tier: string | null;
  note: string | null;
  created_at: string;
  synced_at: string | null;
}

function rowToDiagnosis(r: DbRow): DiagnosisRow {
  return {
    id: r.id,
    imageUri: r.image_uri,
    disease: r.disease as DiagnosisRow['disease'],
    diseaseName: r.disease_name,
    confidence: r.confidence,
    language: r.language as LanguageCode,
    symptoms: JSON.parse(r.symptoms),
    treatment: JSON.parse(r.treatment),
    prevention: JSON.parse(r.prevention),
    agronomistAdvice: r.agronomist_advice,
    rawResponse: r.raw_response,
    modelVersion: r.model_version,
    latencyMs: r.latency_ms,
    tier: (r.tier as InferenceTier) ?? 'local',
    note: r.note,
    createdAt: r.created_at,
    syncedAt: r.synced_at,
  };
}

export async function getDiagnosis(id: number): Promise<DiagnosisRow | null> {
  const conn = ensureDb();
  const row = await conn.getFirstAsync<DbRow>('SELECT * FROM diagnoses WHERE id = ?', [id]);
  return row ? rowToDiagnosis(row) : null;
}

export async function listDiagnoses(limit = 50): Promise<DiagnosisRow[]> {
  const conn = ensureDb();
  const rows = await conn.getAllAsync<DbRow>(
    'SELECT * FROM diagnoses ORDER BY created_at DESC LIMIT ?',
    [limit],
  );
  return rows.map(rowToDiagnosis);
}

export async function recentDiagnoses(n = 3): Promise<DiagnosisRow[]> {
  return listDiagnoses(n);
}

export async function markSynced(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const conn = ensureDb();
  const placeholders = ids.map(() => '?').join(',');
  await conn.runAsync(
    `UPDATE diagnoses SET synced_at = datetime('now') WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function updateNote(id: number, note: string): Promise<void> {
  const conn = ensureDb();
  await conn.runAsync('UPDATE diagnoses SET note = ? WHERE id = ?', [note, id]);
}

/** Wipes every diagnosis and its follow-up loops. Dev-only: irreversible. */
export async function clearAllDiagnoses(): Promise<void> {
  const conn = ensureDb();
  await conn.execAsync(`
    DELETE FROM loops;
    DELETE FROM diagnoses;
    DELETE FROM sqlite_sequence WHERE name IN ('loops', 'diagnoses');
  `);
}

import { initDb } from './db';
import type { HypothesisCategory, Loop, LoopOutcome } from '@/types';

interface LoopRow {
  id: number;
  initial_diagnosis_id: number;
  followup_diagnosis_id: number | null;
  hypothesis_category: string | null;
  hypothesis_note: string | null;
  scheduled_for: string;
  notification_id: string | null;
  outcome: string | null;
  hypothesis_confirmed: number | null;
  lesson: string | null;
  created_at: string;
  completed_at: string | null;
}

function rowToLoop(r: LoopRow): Loop {
  return {
    id: r.id,
    initialDiagnosisId: r.initial_diagnosis_id,
    followupDiagnosisId: r.followup_diagnosis_id,
    hypothesisCategory: (r.hypothesis_category as HypothesisCategory | null) ?? null,
    hypothesisNote: r.hypothesis_note,
    scheduledFor: r.scheduled_for,
    notificationId: r.notification_id,
    outcome: (r.outcome as LoopOutcome | null) ?? null,
    hypothesisConfirmed:
      r.hypothesis_confirmed === null ? null : r.hypothesis_confirmed === 1,
    lesson: r.lesson,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

export async function createLoop(input: {
  diagnosisId: number;
  scheduledFor: string;
  notificationId: string | null;
}): Promise<number> {
  const conn = await initDb();
  const res = await conn.runAsync(
    `INSERT INTO loops (initial_diagnosis_id, scheduled_for, notification_id)
     VALUES (?, ?, ?)`,
    [input.diagnosisId, input.scheduledFor, input.notificationId],
  );
  return res.lastInsertRowId;
}

export async function setHypothesis(
  loopId: number,
  category: HypothesisCategory,
  note: string | null,
): Promise<void> {
  const conn = await initDb();
  await conn.runAsync(
    `UPDATE loops SET hypothesis_category = ?, hypothesis_note = ? WHERE id = ?`,
    [category, note, loopId],
  );
}

export async function completeLoop(
  loopId: number,
  data: {
    followupDiagnosisId: number | null;
    outcome: LoopOutcome;
    hypothesisConfirmed: boolean | null;
    lesson: string;
  },
): Promise<void> {
  const conn = await initDb();
  await conn.runAsync(
    `UPDATE loops
     SET followup_diagnosis_id = ?, outcome = ?, hypothesis_confirmed = ?, lesson = ?,
         completed_at = datetime('now')
     WHERE id = ?`,
    [
      data.followupDiagnosisId,
      data.outcome,
      data.hypothesisConfirmed === null ? null : data.hypothesisConfirmed ? 1 : 0,
      data.lesson,
      loopId,
    ],
  );
}

export async function getLoop(id: number): Promise<Loop | null> {
  const conn = await initDb();
  const row = await conn.getFirstAsync<LoopRow>(`SELECT * FROM loops WHERE id = ?`, [id]);
  return row ? rowToLoop(row) : null;
}

export async function getLoopByDiagnosis(diagnosisId: number): Promise<Loop | null> {
  const conn = await initDb();
  const row = await conn.getFirstAsync<LoopRow>(
    `SELECT * FROM loops WHERE initial_diagnosis_id = ?`,
    [diagnosisId],
  );
  return row ? rowToLoop(row) : null;
}

export async function listCompletedLoops(limit = 100): Promise<Loop[]> {
  const conn = await initDb();
  const rows = await conn.getAllAsync<LoopRow>(
    `SELECT * FROM loops WHERE completed_at IS NOT NULL
     ORDER BY completed_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(rowToLoop);
}

export async function listPendingLoops(): Promise<Loop[]> {
  const conn = await initDb();
  const rows = await conn.getAllAsync<LoopRow>(
    `SELECT * FROM loops WHERE completed_at IS NULL ORDER BY scheduled_for ASC`,
  );
  return rows.map(rowToLoop);
}

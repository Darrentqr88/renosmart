import { SupabaseClient } from '@supabase/supabase-js';

export interface WorkerRating {
  overall: number;        // 0-5 stars
  attendance: number;     // Check-in punctuality rate (20%)
  completion: number;     // On-time completion rate (20%)
  quality: number;        // Photo approval rate (20%)
  documentation: number;  // Receipt submission rate (20%)
  reliability: number;    // Overall reliability (20%)
  totalTasks: number;
  completedTasks: number;
}

const WEIGHTS = {
  attendance: 0.2,
  completion: 0.2,
  quality: 0.2,
  documentation: 0.2,
  reliability: 0.2,
};

/**
 * Calculate 5-dimension worker rating from project data.
 * Returns scores 0-5 for each dimension + weighted overall.
 */
export async function calculateWorkerRating(
  supabase: SupabaseClient,
  workerId: string,
): Promise<WorkerRating> {
  const now = new Date().toISOString().split('T')[0];

  // 1. Fetch assigned tasks (all time)
  const { data: tasks } = await supabase
    .from('gantt_tasks')
    .select('id, project_id, start_date, end_date, progress, updated_at')
    .filter('assigned_workers', 'cs', JSON.stringify([workerId]));

  const allTasks = tasks || [];
  const completedTasks = allTasks.filter(t => t.progress === 100);
  const pastDueTasks = allTasks.filter(t => t.end_date < now);

  // 2. Fetch check-in events
  const { data: checkins } = await supabase
    .from('project_events')
    .select('id, event_type, notes, created_at')
    .eq('user_id', workerId)
    .in('event_type', ['worker_checkin', 'worker_checkout']);

  const checkinEvents = (checkins || []).filter(e => e.event_type === 'worker_checkin');
  const checkoutEvents = (checkins || []).filter(e => e.event_type === 'worker_checkout');
  const autoCheckouts = checkoutEvents.filter(e => e.notes?.includes('auto_checkout'));

  // 3. Fetch photos
  const { data: photos } = await supabase
    .from('site_photos')
    .select('id, approved')
    .eq('uploaded_by', workerId);

  const allPhotos = photos || [];
  const approvedPhotos = allPhotos.filter(p => p.approved === true);

  // 4. Fetch receipts
  const { data: receipts } = await supabase
    .from('cost_records')
    .select('id, project_id')
    .eq('uploaded_by', workerId);

  const allReceipts = receipts || [];

  // ── DIMENSION CALCULATIONS ──

  // Attendance (20%): checkin days / expected work days from assigned tasks
  let attendanceScore = 5;
  if (pastDueTasks.length > 0) {
    // Count unique checkin dates
    const checkinDates = new Set(checkinEvents.map(e => e.created_at?.split('T')[0]));
    // Estimate expected days: sum task durations (weekdays between start-end)
    let expectedDays = 0;
    for (const t of pastDueTasks) {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      let d = new Date(start);
      while (d <= end) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) expectedDays++;
        d.setDate(d.getDate() + 1);
      }
    }
    if (expectedDays > 0) {
      const ratio = Math.min(1, checkinDates.size / expectedDays);
      attendanceScore = ratio * 5;
    }
  }

  // Completion (20%): on-time completed / total past-due
  let completionScore = 5;
  if (pastDueTasks.length > 0) {
    const onTime = completedTasks.filter(t => {
      if (!t.updated_at) return true;
      return t.updated_at.split('T')[0] <= t.end_date;
    });
    completionScore = (onTime.length / pastDueTasks.length) * 5;
  }

  // Quality (20%): approved photos / total photos
  let qualityScore = 5;
  if (allPhotos.length > 0) {
    qualityScore = (approvedPhotos.length / allPhotos.length) * 5;
  }

  // Documentation (20%): projects with receipts / completed task projects
  let documentationScore = 5;
  if (completedTasks.length > 0) {
    const completedProjectIds = new Set(completedTasks.map(t => t.project_id));
    const receiptProjectIds = new Set(allReceipts.map(r => r.project_id));
    const projectsWithReceipts = [...completedProjectIds].filter(id => receiptProjectIds.has(id));
    documentationScore = completedProjectIds.size > 0
      ? (projectsWithReceipts.length / completedProjectIds.size) * 5
      : 5;
  }

  // Reliability (20%): (1 - autoCheckout ratio) * 0.5 + task update frequency * 0.5
  let reliabilityScore = 5;
  if (checkoutEvents.length > 0) {
    const manualRatio = 1 - (autoCheckouts.length / checkoutEvents.length);
    // Task progress updates: tasks with progress > 0 / all tasks
    const activeTasks = allTasks.filter(t => t.progress > 0);
    const updateRatio = allTasks.length > 0 ? activeTasks.length / allTasks.length : 1;
    reliabilityScore = (manualRatio * 0.5 + updateRatio * 0.5) * 5;
  }

  // Clamp all scores 0-5
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(5, v)) * 10) / 10;
  const scores = {
    attendance: clamp(attendanceScore),
    completion: clamp(completionScore),
    quality: clamp(qualityScore),
    documentation: clamp(documentationScore),
    reliability: clamp(reliabilityScore),
  };

  const overall = clamp(
    scores.attendance * WEIGHTS.attendance +
    scores.completion * WEIGHTS.completion +
    scores.quality * WEIGHTS.quality +
    scores.documentation * WEIGHTS.documentation +
    scores.reliability * WEIGHTS.reliability
  );

  return {
    overall,
    ...scores,
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
  };
}

/**
 * Calculate and cache worker rating to profiles table.
 */
export async function updateCachedRating(
  supabase: SupabaseClient,
  workerId: string,
): Promise<WorkerRating> {
  const rating = await calculateWorkerRating(supabase, workerId);

  await supabase
    .from('profiles')
    .update({
      worker_rating: rating.overall,
      rating_breakdown: {
        attendance: rating.attendance,
        completion: rating.completion,
        quality: rating.quality,
        documentation: rating.documentation,
        reliability: rating.reliability,
        totalTasks: rating.totalTasks,
        completedTasks: rating.completedTasks,
        updated_at: new Date().toISOString(),
      },
    })
    .eq('user_id', workerId);

  return rating;
}

// XP engine. All stored in localStorage, no auth needed

export const XP_EVENTS = {
  LESSON_READ: 50,
  QUIZ_PASSED: 100,
  IMAGE_GENERATED: 25,   // per iteration, capped at 5
  VIDEO_GENERATED: 25,   // per clip, capped at 5
  TRACK_COMPLETED: 500,
  CONTEXT_LAB: 75,
  AGENT_TASK: 100,
  FIRST_LESSON: 50,      // bonus
  STREAK_DAY: 25,        // bonus per day
} as const;

export type AvatarType = "creator" | "scientist" | "builder" | "writer" | "explorer";

export interface XPRecord {
  username: string;
  avatarType: AvatarType;
  totalXp: number;
  completedLessons: string[];   // "trackSlug/lessonId"
  completedTracks: string[];
  skills: Record<string, boolean>;
  imagesGenerated: number;
  videosGenerated: number;
  lastSeen: string;             // ISO date
  streakDays: number;
}

const STORAGE_KEY = "versedai_xp";

function defaultRecord(username: string, avatarType: AvatarType): XPRecord {
  return {
    username,
    avatarType,
    totalXp: 0,
    completedLessons: [],
    completedTracks: [],
    skills: {},
    imagesGenerated: 0,
    videosGenerated: 0,
    lastSeen: new Date().toISOString(),
    streakDays: 1,
  };
}

export function getRecord(): XPRecord | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as XPRecord;
    if (parsed.videosGenerated == null) parsed.videosGenerated = 0;
    if (parsed.imagesGenerated == null) parsed.imagesGenerated = 0;
    return parsed;
  } catch {
    return null;
  }
}

export function initRecord(username: string, avatarType: AvatarType = "explorer"): XPRecord {
  const record = defaultRecord(username, avatarType);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
  return record;
}

function save(record: XPRecord) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
}

export function awardXP(amount: number, reason?: string): XPRecord | null {
  const record = getRecord();
  if (!record) return null;
  record.totalXp += amount;
  save(record);
  if (reason) console.log(`[XP] +${amount}. ${reason}`);
  return record;
}

export function markLessonComplete(trackSlug: string, lessonId: string, xp: number): { record: XPRecord; isNew: boolean } | null {
  const record = getRecord();
  if (!record) return null;
  const key = `${trackSlug}/${lessonId}`;
  const isNew = !record.completedLessons.includes(key);
  if (isNew) {
    record.completedLessons.push(key);
    record.totalXp += xp;
  }
  save(record);
  return { record, isNew };
}

export function markTrackComplete(trackSlug: string, bonusXp: number): { record: XPRecord; isNew: boolean } | null {
  const record = getRecord();
  if (!record) return null;
  const isNew = !record.completedTracks.includes(trackSlug);
  if (isNew) {
    record.completedTracks.push(trackSlug);
    record.totalXp += bonusXp;
  }
  save(record);
  return { record, isNew };
}

export function recordImageGenerated(): XPRecord | null {
  const record = getRecord();
  if (!record) return null;
  record.imagesGenerated += 1;
  // Award XP for first 5 images
  if (record.imagesGenerated <= 5) {
    record.totalXp += XP_EVENTS.IMAGE_GENERATED;
  }
  save(record);
  return record;
}

export function recordVideoGenerated(): XPRecord | null {
  const record = getRecord();
  if (!record) return null;
  record.videosGenerated = (record.videosGenerated || 0) + 1;
  if (record.videosGenerated <= 5) {
    record.totalXp += XP_EVENTS.VIDEO_GENERATED;
  }
  save(record);
  return record;
}

export function markSkill(skillKey: string): XPRecord | null {
  const record = getRecord();
  if (!record) return null;
  if (!record.skills[skillKey]) {
    record.skills[skillKey] = true;
    record.totalXp += 50; // bonus for new skill demonstrated
  }
  save(record);
  return record;
}

export function isLessonComplete(trackSlug: string, lessonId: string): boolean {
  const record = getRecord();
  if (!record) return false;
  return record.completedLessons.includes(`${trackSlug}/${lessonId}`);
}

export function isTrackComplete(trackSlug: string): boolean {
  const record = getRecord();
  if (!record) return false;
  return record.completedTracks.includes(trackSlug);
}

export function getLevelFromXP(xp: number): { level: number; label: string; nextAt: number } {
  const levels = [
    { min: 0, label: "Newcomer", next: 200 },
    { min: 200, label: "Learner", next: 500 },
    { min: 500, label: "Explorer", next: 1000 },
    { min: 1000, label: "Creator", next: 2000 },
    { min: 2000, label: "Builder", next: 3500 },
    { min: 3500, label: "Operator", next: 5000 },
    { min: 5000, label: "AI Frontrunner", next: Infinity },
  ];
  const idx = levels.findLastIndex((l) => xp >= l.min);
  const current = levels[Math.max(0, idx)];
  return {
    level: idx + 1,
    label: current.label,
    nextAt: current.next,
  };
}

export type StudioKind = "image" | "video";

export interface StudioItemMeta {
  id: string;
  kind: StudioKind;
  prompt: string;
  concept?: string;
  veoPrompt?: string;
  mimeType: string;
  createdAt: number;
  trackSlug?: string;
  lessonId?: string;
}

export interface StudioItem extends StudioItemMeta {
  blob: Blob;
}

const DB_NAME = "versedai_studio";
const STORE = "media";
const VERSION = 1;
const MAX_ITEMS = 40;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("kind", "kind");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open studio storage."));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Studio save failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Studio save aborted."));
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function saveStudioItem(
  input: Omit<StudioItem, "id" | "createdAt"> & { id?: string; createdAt?: number }
): Promise<StudioItem> {
  const item: StudioItem = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? Date.now(),
  };
  const db = await openDb();
  try {
    const write = db.transaction(STORE, "readwrite");
    write.objectStore(STORE).put(item);
    await txDone(write);
    await evictOldest(db);
  } finally {
    db.close();
  }
  return item;
}

async function evictOldest(db: IDBDatabase) {
  const read = db.transaction(STORE, "readonly");
  const store = read.objectStore(STORE);
  const all: StudioItem[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as StudioItem[]) || []);
    req.onerror = () => reject(req.error);
  });
  if (all.length <= MAX_ITEMS) return;
  const extra = all
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, all.length - MAX_ITEMS);
  const write = db.transaction(STORE, "readwrite");
  const dest = write.objectStore(STORE);
  extra.forEach((item) => dest.delete(item.id));
  await txDone(write);
}

export async function listStudioItems(kind?: StudioKind): Promise<StudioItem[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const rows: StudioItem[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StudioItem[]) || []);
      req.onerror = () => reject(req.error);
    });
    const filtered = kind ? rows.filter((r) => r.kind === kind) : rows;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function getStudioItem(id: string): Promise<StudioItem | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    return await new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StudioItem) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteStudioItem(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugFilename(prompt: string, ext: string) {
  const base = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `versedai-${base || "clip"}-${Date.now()}.${ext}`;
}

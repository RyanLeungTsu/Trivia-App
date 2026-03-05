import { supabase } from "./supabaseClient";
import { useAuthStore } from "./authStore";


const urlCache = new Map<string, { url: string; expires: number }>();

const DB_NAME = "jeopardy-media";
const DB_VERSION = 1;
const STORE_NAME = "media";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveMediaLocal(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getMediaLocal(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      const blob: Blob | undefined = req.result;
      if (!blob) return resolve(null);
      resolve(URL.createObjectURL(blob));
    };
    req.onerror = () => reject(req.error);
  });
}

// Saves media files to IndexedDB
export async function saveMedia(id: string, file: File): Promise<void> {
  const user = useAuthStore.getState().user;
  if (user) {
    const path = `${user.id}/${id}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) throw error;
  } else {
    await saveMediaLocal(id, file);
  }
}

// Retrieves a media file from IndexedDB, @returns A URL that can be used in img/video/audio src attributes
export async function getMedia(id: string): Promise<string | null> {
  const user = useAuthStore.getState().user;

  if (user) {
    // checks the cache first
    const cached = urlCache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    const path = `${user.id}/${id}`;
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUrl(path, 3600);

    if (!error && data?.signedUrl) {
      urlCache.set(id, {
        url: data.signedUrl,
        expires: Date.now() + 50 * 60 * 1000,
      });
      return data.signedUrl;
    }

    const localUrl = await getMediaLocal(id);
    if (localUrl) return localUrl;

    console.error(`Media not found anywhere: ${id}`);
    return null;
  } else {
    const localUrl = await getMediaLocal(id);
    if (!localUrl) console.error(`Media not found in IndexedDB: ${id}`);
    return localUrl;
  }
}
// To grab media for public/non 0signed in users
export async function getMediaPublic(
  id: string,
  ownerId: string,
): Promise<string | null> {
  const path = `${ownerId}/${id}`;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function migrateLocalMediaToDB(): Promise<void> {

  const user = useAuthStore.getState().user;
  if (!user) return;

  const db = await openDB();
  const keys: string[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });

  const migratedRaw = localStorage.getItem("migratedMediaIds");
  const migratedIds = new Set<string>(migratedRaw ? JSON.parse(migratedRaw) : []);

  const toMigrate = keys.filter((k) => !migratedIds.has(k));

  if (toMigrate.length === 0) {
    console.log("No media to migrate.");
    return;
  }

  console.log(`Migrating ${toMigrate.length} media files to Supabase...`);

  const BATCH_SIZE = 10;
  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = toMigrate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (key) => {
        const blob: Blob = await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (!blob) return;
        const path = `${user.id}/${key}`;
        const { error } = await supabase.storage
          .from("media")
          .upload(path, blob, { upsert: true });
        if (error) console.error(`Failed to migrate ${key}:`, error);
        else {
          migratedIds.add(key);
          console.log(`Migrated: ${key}`);
        }
      }),
    );
  }

  localStorage.setItem("migratedMediaIds", JSON.stringify([...migratedIds]));
  console.log("Migration complete!");
}

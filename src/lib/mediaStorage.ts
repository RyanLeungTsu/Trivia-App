import { supabase } from "./supabaseClient";
import { useAuthStore } from "./authStore";

const urlCache = new Map<string, { url: string; expires: number }>();
// interface MediaDB extends DBSchema {
//   media: {
//     key: string;
//     value: Blob;
//   };
// }

const DB_NAME = 'jeopardy-media';
const DB_VERSION = 1;
const STORE_NAME = 'media';



// let dbInstance: IDBPDatabase<MediaDB> | null = null;

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

// Inits Database
// async function getDB(): Promise<IDBPDatabase<MediaDB>> {
//   if (dbInstance) return dbInstance;

//   dbInstance = await openDB<MediaDB>(DB_NAME, DB_VERSION, {
//     upgrade(db) {
//       // Creates the object store
//       if (!db.objectStoreNames.contains(STORE_NAME)) {
//         db.createObjectStore(STORE_NAME);
//       }
//     },
//   });

//   return dbInstance;
// }

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
      urlCache.set(id, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
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

// export async function deleteMedia(id: string): Promise<void> {
//   const db = await getDB();
//   await db.delete(STORE_NAME, id);
//   console.log(`Media deleted: ${id}`);
// }

// grabs media IDs stored in db 
// export async function getAllMediaIds(): Promise<string[]> {
//   const db = await getDB();
//   const keys = await db.getAllKeys(STORE_NAME);
//   return keys;
// }

// IMPORTANT! function for clearing media
// export async function clearAllMedia(): Promise<void> {
//   const db = await getDB();
//   await db.clear(STORE_NAME);
//   console.log('All media cleared');
// }

// media check in db
// export async function mediaExists(id: string): Promise<boolean> {
//   const db = await getDB();
//   const blob = await db.get(STORE_NAME, id);
//   return blob !== undefined;
// }

// this grabs the total size of media for refrence
// export async function getTotalMediaSize(): Promise<number> {
//   const db = await getDB();
//   const allKeys = await db.getAllKeys(STORE_NAME);
//   let totalSize = 0;
  
//   for (const key of allKeys) {
//     const blob = await db.get(STORE_NAME, key);
//     if (blob) {
//       totalSize += blob.size;
//     }
//   }
  
//   return totalSize;
// }

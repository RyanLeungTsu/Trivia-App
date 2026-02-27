import JSZip from "jszip";
import { Board } from "../store/editorStore";
import { getMedia, saveMedia } from "./mediaStorage";

// Exports a board and all its media files as a zip
export async function exportBoardAsZip(board: Board): Promise<void> {
  const zip = new JSZip();

  // collect all media IDs referenced in this board
  const mediaIds: string[] = [];
  board.cells.forEach((cell) => {
    cell.slides.forEach((slide) => {
      slide.elements.forEach((el) => {
        if (el.kind !== "text" && el.content.startsWith("idb://")) {
          mediaIds.push(el.content.replace("idb://", ""));
        }
      });
    });
  });

  // fetch each media blob and add it to the zip
  for (const id of mediaIds) {
    try {
      const url = await getMedia(id);
      if (!url) continue;
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = blob.type.split("/")[1] || "bin";
      zip.file(`media/${id}.${ext}`, blob);
    } catch (e) {
      console.error(`Failed to export media ${id}:`, e);
    }
  }

  // adds JSOn Board
  zip.file("board.json", JSON.stringify(board, null, 2));

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${board.name || "board"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// Imports a board from a zip file, restoring all media into IndexedDB/Supabase, as well as returns the imported Board object ready to be added to the store
export async function importBoardFromZip(file: File): Promise<Board> {
  const zip = await JSZip.loadAsync(file);

  // read board.json
  const boardFile = zip.file("board.json");
  if (!boardFile) throw new Error("Invalid zip: missing board.json");
  const boardJson = await boardFile.async("string");
  const board: Board = JSON.parse(boardJson);

  // mime type map for restoring all media blobs
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    webm: "video/webm",
  };

  // restores all media files from the media/ folder
  const mediaFolder = zip.folder("media");
  if (mediaFolder) {
    const mediaEntries: { id: string; ext: string; zipEntry: JSZip.JSZipObject }[] = [];

    // collect all files in the media folder
    mediaFolder.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const id = relativePath.replace(/\.[^/.]+$/, "");
        const ext = relativePath.split(".").pop() || "bin";
        mediaEntries.push({ id, ext, zipEntry });
      }
    });

    // save each media file back into IndexedDB/Supabase using original id
    for (const item of mediaEntries) {
      try {
        const blob = await item.zipEntry.async("blob");
        const mime = mimeMap[item.ext] || "application/octet-stream";
        const typedBlob = new Blob([blob], { type: mime });
        await saveMedia(item.id, typedBlob as unknown as File);
      } catch (e) {
        console.error(`Failed to import media ${item.id}:`, e);
      }
    }
  }

  // gives the board a fresh id so no conflicting with existing boards
  return {
    ...board,
    id: crypto.randomUUID(),
    name: `${board.name} (imported)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
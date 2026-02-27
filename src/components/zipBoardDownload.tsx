"use client";
import React, { useRef, useState } from "react";
import { useBoardStore } from "../store/editorStore";
import { exportBoardAsZip, importBoardFromZip } from "../lib/boardexport";
import { Board } from "../store/editorStore";

interface ZipBoardDownloadProps {
  // board that is exporting 
  board: Board;
}

//for downloading the board as a zip (board.json + all of the media)
export const ZipDownloadButton: React.FC<ZipBoardDownloadProps> = ({ board }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBoardAsZip(board);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export board. Please try again.");
    }
    setExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 disabled:opacity-50 text-sm"
      title="Download board + all media as ZIP"
    >
      {exporting ? "..." : "Download"}
    </button>
  );
};

// hidden file input as well as for importing a board from a zip file
export const ZipImportButton: React.FC = () => {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const { boards, setActiveBoard } = useBoardStore();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const imported = await importBoardFromZip(file);

      // pushes the imported board into the store alongside existing boards
      const updatedBoards = [...boards, imported];
      useBoardStore.setState({ boards: updatedBoards });

      // for the new board list
      const { updateActiveBoard } = useBoardStore.getState();
      updateActiveBoard(imported);

      alert(`"${imported.name}" imported successfully!`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import. Make sure the file is a valid .zip exported from this app.");
    }

    // resets the input so the same file can be re-imported later
    e.target.value = "";
    setImporting(false);
  };

  return (
    <>
      <button
        onClick={() => zipInputRef.current?.click()}
        disabled={importing}
        className="mt-2 w-full bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 disabled:opacity-50"
      >
        {importing ? "Importing..." : "Import Board from ZIP"}
      </button>
      {/* only takes in zi files */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        onChange={handleImport}
        className="hidden"
      />
    </>
  );
};
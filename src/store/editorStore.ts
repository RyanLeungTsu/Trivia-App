import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../lib/authStore";

export type ElementKind = "text" | "image" | "audio" | "video";
export const DefaultFontSize = 40;
export interface SlideElement {
  id: string;
  kind: ElementKind;
  content: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Slide {
  elements: SlideElement[];
}

export interface JeopardyCell {
  row: number;
  col: number;
  points: number;
  slides: Slide[];
}

export interface Board {
  id: string;
  name: string;
  rows: number;
  columns: number;
  categories: string[];
  cells: JeopardyCell[];
  usedCells: { [key: string]: boolean };
  finalJeopardy?: JeopardyCell | null;
  createdAt: number;
  updatedAt: number;
  masterId?: string
}

interface BoardState {
  editMode: boolean;
  setEditMode: (mode: boolean) => void;

  boards: Board[];
  activeBoardId: string | null;
  activeBoard: Board | null;

  createBoard: (name?: string) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string) => void;
  updateActiveBoard: (board: Board) => void;

  selectedCell: JeopardyCell | null;
  selectCell: (cell: JeopardyCell | null) => void;
  updateCell: (cell: JeopardyCell) => void;
  markCellUsed: (cell: JeopardyCell) => void;
  stagedCell: JeopardyCell | null;
  setStagedCell: (cell: JeopardyCell | null) => void;
  commitStagedCell: () => void;

  featuredBoard: Board | null;
  loadFeaturedBoard: () => Promise<void>;
  publishAsFeaturedBoard: () => Promise<void>;

  rows: number;
  columns: number;
  addRow: () => void;
  addColumn: () => void;
  removeRow: () => void;
  removeColumn: () => void;
  addRowAt: (rowIndex: number) => void;
  removeRowAt: (rowIndex: number) => void;
  addColumnAt: (colIndex: number) => void;
  removeColumnAt: (colIndex: number) => void;

  setFinalJeopardy: (cell: JeopardyCell | null) => void;
  removeFinalJeopardy: () => void;

  // categories: string[];
  // setCategories: (cats: string[]) => void;
  setCategoryAt: (index: number, value: string) => void;

  resetPlayedCells: () => void;

  loadBoards: () => Promise<void>;
}

export function createEmptyBoard(name = ""): Board {
  const rows = 5;
  const columns = 6;
  const cells: JeopardyCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      cells.push({
        row: r,
        col: c,
        points: (r + 1) * 100,
        slides: [
          {
            elements: [
              {
                id: crypto.randomUUID(),
                kind: "text",
                content: "",
                x: 20,
                y: 20,
                width: 500,
                height: 300,
                fontSize: DefaultFontSize,
              },
            ],
          },
        ],
      });
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    rows,
    columns,
    categories: Array(columns).fill("Category"),
    cells,
    usedCells: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Persists boards to Supabase if signed in, otherwise falls back to localStorage
async function persistBoards(boards: Board[]): Promise<void> {
  const user = useAuthStore.getState().user;
  if (user) {
    const rows = boards.map((b) => ({
      id: b.id,
      user_id: user.id,
      name: b.name,
      data: b,
      created_at: b.createdAt,
      updated_at: b.updatedAt,
    }));
    const { error } = await supabase
      .from("boards")
      .upsert(rows, { onConflict: "id" });
    if (error) console.error("Error persisting boards to Supabase:", error);
  } else {
    localStorage.setItem("jeopardyBoards", JSON.stringify(boards));
  }
}

// Deletes a single board from Supabase if signed in, otherwise removes from localStorage
async function deleteBoardFromStorage(
  id: string,
  remainingBoards: Board[],
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (user) {
    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("Error deleting board from Supabase:", error);
  } else {
    localStorage.setItem("jeopardyBoards", JSON.stringify(remainingBoards));
  }
}

export const useBoardStore = create<BoardState>((set, get) => {
  const savedBoards =
    typeof window !== "undefined"
      ? localStorage.getItem("jeopardyBoards")
      : null;
  const boards: Board[] = savedBoards ? JSON.parse(savedBoards) : [];

  return {
    editMode: false,
    setEditMode: (mode: boolean) => set({ editMode: mode }),

    boards,
    activeBoardId: boards.length > 0 ? boards[0].id : null,
    activeBoard: boards.length > 0 ? boards[0] : null,

    // featured board that i set!
    featuredBoard: null,

    // Loads the featured board from Supabase, default baord for all users
    loadFeaturedBoard: async () => {
      console.log("loadFeaturedBoard called");
      const { data, error } = await supabase
        .from("featured_board")
        .select("data")
        .eq("id", "singleton")
        .single();

      console.log("raw data:", data);
      console.log("raw error:", error);

      if (error || !data?.data || Object.keys(data.data).length === 0) {
        console.log("bailing out — reason:", { error, data });
        return;
      }

      const featured = data.data as Board;
      set({ featuredBoard: featured });

      // shows the featured board
      const { boards } = get();
      if (boards.length === 0) {
        set({
          activeBoard: featured,
          activeBoardId: featured.id,
        });
      }
    },

    publishAsFeaturedBoard: async () => {
      const { activeBoard } = get();
      if (!activeBoard) return;

      const boardToPublish: Board = {
        ...activeBoard,
        usedCells: {},
        masterId: useAuthStore.getState().user?.id,
        updatedAt: Date.now(),
      };

      const { error } = await supabase.from("featured_board").upsert({
        id: "singleton",
        data: boardToPublish,
        updated_at: Date.now(),
      });

      if (error) {
        console.error("Error publishing featured board:", error);
        alert("Failed to publish featured board.");
      } else {
        alert(`"${activeBoard.name}" is now the featured board!`);
        set({ featuredBoard: boardToPublish });
      }
    },
    // Loads boards from Supabase when user signs in, or from localStorage for guests
    loadBoards: async () => {
      await new Promise((r) => setTimeout(r, 50));
      const { user } = useAuthStore.getState();
      console.log("loadBoards called, user:", user?.email); 
  console.log("local boards:", localStorage.getItem("jeopardyBoards"));

      if (user) {
        const localRaw = localStorage.getItem("jeopardyBoards");
        const localBoards: Board[] = localRaw ? JSON.parse(localRaw) : [];

        const { data } = await supabase
          .from("boards")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        const supabaseBoards: Board[] = (data ?? []).map((r) => r.data);
        const supabaseIds = new Set(supabaseBoards.map((b) => b.id));

        const migratedRaw = localStorage.getItem("migratedBoardIds");
        const migratedIds: Set<string> = new Set(
          migratedRaw ? JSON.parse(migratedRaw) : [],
        );

        const toMigrate = localBoards.filter(
          (b) => !supabaseIds.has(b.id) && !migratedIds.has(b.id),
        );

        if (toMigrate.length > 0) {
          await Promise.all(
            toMigrate.map((board) =>
              supabase.from("boards").upsert({
                id: board.id,
                user_id: user.id,
                data: board,
                updated_at: board.updatedAt ?? Date.now(),
              }),
            ),
          );

          toMigrate.forEach((b) => migratedIds.add(b.id));
          localStorage.setItem(
            "migratedBoardIds",
            JSON.stringify([...migratedIds]),
          );
        }

        const { activeBoardId } = get();
        const stillExists = supabaseBoards.find((b) => b.id === activeBoardId);
        const active = stillExists ?? supabaseBoards[0] ?? null;
        set({
          boards: supabaseBoards,
          activeBoard: active,
          activeBoardId: active?.id ?? null,
        });
      } else {
        const raw = localStorage.getItem("jeopardyBoards");
        const boards: Board[] = raw ? JSON.parse(raw) : [];
        const active = boards[0] ?? null;
        set({ boards, activeBoard: active, activeBoardId: active?.id ?? null });
      }
    },

    setCategoryAt: (index: number, value: string) => {
      const { activeBoard } = get();
      if (!activeBoard) return;

      const categories = [...activeBoard.categories];
      categories[index] = value;

      get().updateActiveBoard({
        ...activeBoard,
        categories,
        updatedAt: Date.now(),
      });
    },

    resetPlayedCells: () => {
      const { activeBoard, updateActiveBoard } = get();
      if (!activeBoard) return;

      const updatedBoard = {
        ...activeBoard,
        usedCells: {},
        updatedAt: Date.now(),
      };

      updateActiveBoard(updatedBoard);
    },

    setFinalJeopardy: (cell) => {
      const { activeBoard } = get();
      if (!activeBoard) return;
      const updated = {
        ...activeBoard,
        finalJeopardy: cell,
        updatedAt: Date.now(),
      };
      set({ activeBoard: updated });
      get().updateActiveBoard(updated);
    },

    removeFinalJeopardy: () => {
      const { activeBoard } = get();
      if (!activeBoard) return;
      const updated = {
        ...activeBoard,
        finalJeopardy: null,
        updatedAt: Date.now(),
      };
      set({ activeBoard: updated });
      get().updateActiveBoard(updated);
    },

    createBoard: (name) => {
      const { boards } = get();

      const newBoard: Board = {
        ...createEmptyBoard(name || "Untitled Board"),
        id: crypto.randomUUID(),
        name: name || "Untitled Board",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedBoards = [...boards, newBoard];
      persistBoards(updatedBoards).catch(console.error);

      persistBoards(updatedBoards).catch(console.error);

      set({
        boards: updatedBoards,
        activeBoardId: newBoard.id,
        activeBoard: newBoard,
      });
    },

    setActiveBoard: (id: string) => {
      const board = get().boards.find((b) => b.id === id) ?? null;
      set({ activeBoardId: id, activeBoard: board });
      localStorage.setItem("lastBoardId", id);
    },

    updateActiveBoard: (updatedBoard) => {
      set((state) => {
        const updatedBoards = state.boards.map((b) =>
          b.id === updatedBoard.id ? updatedBoard : b,
        );

        persistBoards(updatedBoards).catch(console.error);

        return {
          boards: updatedBoards,
          activeBoardId: updatedBoard.id,
          activeBoard: updatedBoard,
        };
      });
    },

    deleteBoard: (id) =>
      set((state) => {
        const remainingBoards = state.boards.filter((b) => b.id !== id);
        let newActiveBoard = null;
        let newActiveBoardId = null;
        if (remainingBoards.length > 0) {
          newActiveBoard = remainingBoards[0];
          newActiveBoardId = newActiveBoard.id;
        } else {
          const empty = createEmptyBoard();
          remainingBoards.push(empty);
          newActiveBoard = empty;
          newActiveBoardId = empty.id;
        }
        deleteBoardFromStorage(id, remainingBoards).catch(console.error);
        return {
          boards: remainingBoards,
          activeBoardId: newActiveBoardId,
          activeBoard: newActiveBoard,
        };
      }),

    stagedCell: null,

    setStagedCell: (cell) => set({ stagedCell: cell }),

    commitStagedCell: () => {
      const { stagedCell, activeBoard } = get();
      if (!stagedCell || !activeBoard) return;

      const newCells = activeBoard.cells.map((c) =>
        c.row === stagedCell.row && c.col === stagedCell.col ? stagedCell : c,
      );

      const updatedBoard = {
        ...activeBoard,
        cells: newCells,
        updatedAt: Date.now(),
      };

      get().updateActiveBoard(updatedBoard);
      set({ stagedCell: null });
    },

    selectedCell: null,
    selectCell: (cell) => set({ selectedCell: cell }),

    updateCell: (updated) => {
      set({ stagedCell: updated });
    },

    markCellUsed: (cell) => {
      const { activeBoard } = get();
      if (!activeBoard) return;
      const key = `${cell.row}-${cell.col}`;
      const updatedBoard = {
        ...activeBoard,
        usedCells: { ...activeBoard.usedCells, [key]: true },
        updatedAt: Date.now(),
      };
      get().updateActiveBoard(updatedBoard);
    },

    rows: boards[0]?.rows ?? 0,
    columns: boards[0]?.columns ?? 0,

    addRow: () => {
      const { activeBoard } = get();
      if (!activeBoard) return;
      const newRow = activeBoard.rows;
      const newCells = [...activeBoard.cells];

      for (let c = 0; c < activeBoard.columns; c++) {
        newCells.push({
          row: newRow,
          col: c,
          points: (newRow + 1) * 100,
          slides: [
            {
              elements: [
                {
                  id: crypto.randomUUID(),
                  kind: "text",
                  content: "",
                  x: 20,
                  y: 20,
                  width: 200,
                  height: 200,
                  fontSize: DefaultFontSize,
                },
              ],
            },
          ],
        });
      }

      get().updateActiveBoard({
        ...activeBoard,
        cells: newCells,
        rows: newRow + 1,
        updatedAt: Date.now(),
      });
    },

    addColumn: () => {
      const { activeBoard } = get();
      if (!activeBoard) return;
      const newCol = activeBoard.columns;
      const newCells = [...activeBoard.cells];

      for (let r = 0; r < activeBoard.rows; r++) {
        newCells.push({
          row: r,
          col: newCol,
          points: (r + 1) * 100,
          slides: [
            {
              elements: [
                {
                  id: crypto.randomUUID(),
                  kind: "text",
                  content: "",
                  x: 20,
                  y: 20,
                  width: 200,
                  height: 200,
                  fontSize: DefaultFontSize,
                },
              ],
            },
          ],
        });
      }

      get().updateActiveBoard({
        ...activeBoard,
        cells: newCells,
        columns: newCol + 1,
        categories: [...activeBoard.categories, ""],
        updatedAt: Date.now(),
      });
    },

    removeRow: () => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.rows <= 1) return;
      const updatedCells = activeBoard.cells.filter(
        (c) => c.row < activeBoard.rows - 1,
      );
      get().updateActiveBoard({
        ...activeBoard,
        cells: updatedCells,
        rows: activeBoard.rows - 1,
        updatedAt: Date.now(),
      });
    },

    removeColumn: () => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.columns <= 1) return;
      const updatedCells = activeBoard.cells.filter(
        (c) => c.col < activeBoard.columns - 1,
      );
      get().updateActiveBoard({
        ...activeBoard,
        cells: updatedCells,
        columns: activeBoard.columns - 1,
        categories: activeBoard.categories.slice(0, -1),
        updatedAt: Date.now(),
      });
    },
    addRowAt: (rowIndex: number) => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.rows >= 12) return;

      const newCells = activeBoard.cells.map((cell) => {
        if (cell.row > rowIndex) {
          return { ...cell, row: cell.row + 1 };
        }
        return cell;
      });

      for (let c = 0; c < activeBoard.columns; c++) {
        newCells.push({
          row: rowIndex + 1,
          col: c,
          points: (rowIndex + 2) * 100,
          slides: [
            {
              elements: [
                {
                  id: crypto.randomUUID(),
                  kind: "text",
                  content: "",
                  x: 20,
                  y: 20,
                  width: 200,
                  height: 200,
                  fontSize: DefaultFontSize,
                },
              ],
            },
          ],
        });
      }

      get().updateActiveBoard({
        ...activeBoard,
        cells: newCells,
        rows: activeBoard.rows + 1,
        updatedAt: Date.now(),
      });
    },

    removeRowAt: (rowIndex: number) => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.rows <= 1) return;

      const updatedCells = activeBoard.cells
        .filter((c) => c.row !== rowIndex)
        .map((cell) => {
          if (cell.row > rowIndex) {
            return { ...cell, row: cell.row - 1 };
          }
          return cell;
        });

      get().updateActiveBoard({
        ...activeBoard,
        cells: updatedCells,
        rows: activeBoard.rows - 1,
        updatedAt: Date.now(),
      });
    },

    addColumnAt: (colIndex: number) => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.columns >= 12) return;

      const newCells = activeBoard.cells.map((cell) => {
        if (cell.col > colIndex) {
          return { ...cell, col: cell.col + 1 };
        }
        return cell;
      });

      for (let r = 0; r < activeBoard.rows; r++) {
        newCells.push({
          row: r,
          col: colIndex + 1,
          points: (r + 1) * 100,
          slides: [
            {
              elements: [
                {
                  id: crypto.randomUUID(),
                  kind: "text",
                  content: "",
                  x: 20,
                  y: 20,
                  width: 200,
                  height: 200,
                  fontSize: DefaultFontSize,
                },
              ],
            },
          ],
        });
      }

      const newCategories = [...activeBoard.categories];
      newCategories.splice(colIndex + 1, 0, "Category");

      get().updateActiveBoard({
        ...activeBoard,
        cells: newCells,
        columns: activeBoard.columns + 1,
        categories: newCategories,
        updatedAt: Date.now(),
      });
    },

    removeColumnAt: (colIndex: number) => {
      const { activeBoard } = get();
      if (!activeBoard || activeBoard.columns <= 1) return;

      const updatedCells = activeBoard.cells
        .filter((c) => c.col !== colIndex)
        .map((cell) => {
          if (cell.col > colIndex) {
            return { ...cell, col: cell.col - 1 };
          }
          return cell;
        });

      const newCategories = activeBoard.categories.filter(
        (_, i) => i !== colIndex,
      );

      get().updateActiveBoard({
        ...activeBoard,
        cells: updatedCells,
        columns: activeBoard.columns - 1,
        categories: newCategories,
        updatedAt: Date.now(),
      });
      if (typeof window !== "undefined") {
        const store = useBoardStore.getState();
        if (store.boards.length === 0) {
          const defaultBoard = createEmptyBoard("Untitled Board");
          useBoardStore.setState({
            boards: [defaultBoard],
            activeBoardId: defaultBoard.id,
            activeBoard: defaultBoard,
          });
          persistBoards([defaultBoard]).catch(console.error);
        }
      }
    },
  };
});

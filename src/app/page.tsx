"use client";
import { useEffect, useState } from "react";
import JeopardyGrid from "../components/JeopardyGrid";
import Interface from "../components/Interface";
import FeaturedBoard from "../components/FeaturedBoard";
import { useAuthStore } from "../lib/authStore";
import { useBoardStore } from "../store/editorStore";
import DayNightBackground from "../components/DayNightBackground";

import { migrateLocalMediaToDB } from "../lib/mediaStorage";

export default function Home() {
  const init = useAuthStore((s) => s.init);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  // const activeBoard = useBoardStore((s) => s.activeBoard);
  // const boards = useBoardStore((s) => s.boards);
  // const user = useAuthStore((s) => s.user);
  // const loading = useAuthStore((s) => s.loading);
  const loadFeaturedBoard = useBoardStore((s) => s.loadFeaturedBoard);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = init();

    const setup = async () => {
      await useAuthStore.getState().waitForAuth();

        migrateLocalMediaToDB().catch(console.error);

      await loadFeaturedBoard();
      await loadBoards();

      // restores the last selected board(s)
      const lastId = localStorage.getItem("lastBoardId");
      if (lastId) {
        const { boards } = useBoardStore.getState();
        const found = boards.find((b) => b.id === lastId);
        if (found) {
          useBoardStore.setState({
            activeBoard: found,
            activeBoardId: found.id,
          });
        }
      }

      // falls back to feaure dboard if it cant find a board
      const { activeBoard, featuredBoard } = useBoardStore.getState();
      if (!activeBoard && featuredBoard) {
        useBoardStore.setState({
          activeBoard: featuredBoard,
          activeBoardId: featuredBoard.id,
        });
      }

      setReady(true);
    };

    setup();
    return unsub;
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <DayNightBackground />
        <div className="text-white text-2xl font-bold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <DayNightBackground />
      <FeaturedBoard />
      <JeopardyGrid />
      <Interface />
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import JeopardyGrid from "../components/JeopardyGrid";
import Interface from "../components/Interface";
import FeaturedBoard from "../components/FeaturedBoard";
import { useAuthStore } from "../lib/authStore";
import { useBoardStore } from "../store/editorStore";


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

      // load featured board first so new visitors always see something
      await loadFeaturedBoard();
      // debugging
      // const state = useBoardStore.getState();
      // console.log("featuredBoard after load:", state.featuredBoard);

      await loadBoards();

      // if no board is created by user uses featured board as default
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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-300 from-0% via-blue-200 via-70% via-orange-300 via-7% to-red-400 to-99%">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-300 from-0% via-blue-200 via-70% via-orange-300 via-7% to-red-400 to-99%">
      <FeaturedBoard />
      <JeopardyGrid />
      <Interface />
    </main>
  );
}


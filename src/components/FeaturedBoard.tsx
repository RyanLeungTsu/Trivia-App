"use client";
import React from "react";
import { useBoardStore } from "../store/editorStore";
import { useAuthStore } from "../lib/authStore";

// my supabase uid for setting admin
const ADMIN_USER_ID = "33f2fb59-e2fd-4271-89e6-79306974503b";

const FeaturedBoard: React.FC = () => {
  const {
    featuredBoard,
    setActiveBoard,
    boards,
    publishAsFeaturedBoard,
    activeBoard,
  } = useBoardStore();
  const { user } = useAuthStore();

  const isAdmin = user?.id === ADMIN_USER_ID;

  if (!featuredBoard || Object.keys(featuredBoard).length === 0) return null;

  const isAlreadyLoaded = boards.some((b) => b.id === featuredBoard.id);

  const loadFeaturedBoard = () => {
    if (isAlreadyLoaded) {
      setActiveBoard(featuredBoard.id);
    } else {
      // adds my featured board so everyone can play it :] yeah!
      const updatedBoards = [...boards, featuredBoard];
      useBoardStore.setState({ boards: updatedBoards });
      setActiveBoard(featuredBoard.id);
    }
  };

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-transparent px-4 py-2">
      <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
        Featured Board:
      </span>
      <span className="text-med" style={{ color: "var(--text)" }}>
        {featuredBoard.name}
      </span>
      <button
        onClick={loadFeaturedBoard}
        className="w-20 inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-purple-700 to-orange-400 text-purple-500 hover:text-white focus:outline-none focus:ring-0"
      >
        <span className="w-full relative px-4 py-2 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
          Play
        </span>
      </button>
      {/* only visible to you as admin */}
      {isAdmin && (
        <button
          onClick={() => {
            if (
              !confirm(
                `Publish "${activeBoard?.name}" as the new featured board? This replaces the current one.`,
              )
            )
              return;
            publishAsFeaturedBoard();
          }}
          className="w-40 inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-purple-700 to-orange-400 text-purple-500 hover:text-white focus:outline-none focus:ring-0"
        >
          <span className="w-full relative px-4 py-2 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
            Publish Current
          </span>
        </button>
      )}
    </div>
  );
};

export default FeaturedBoard;

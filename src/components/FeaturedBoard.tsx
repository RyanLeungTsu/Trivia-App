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
    resetPlayedCells,
  } = useBoardStore();
  const { user } = useAuthStore();

  const isAdmin = user?.id === ADMIN_USER_ID;

  if (!featuredBoard || Object.keys(featuredBoard).length === 0) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-2">
        <span
          className="text-xs opacity-40"
          style={{ color: "var(--ui-text)" }}
        >
          Loading featured board...
        </span>
      </div>
    );
  }

  const isAlreadyLoaded = boards.some((b) => b.id === featuredBoard.id);

  const loadFeaturedBoard = () => {
    const addedIds = JSON.parse(
      localStorage.getItem("addedFeaturedIds") || "[]",
    );

    if (isAlreadyLoaded) {
      // just switches to it without adding again
      setActiveBoard(featuredBoard.id);
    } else {
      if (!addedIds.includes(featuredBoard.id)) {
        const updatedBoards = [...boards, featuredBoard];
        useBoardStore.setState({ boards: updatedBoards });

        localStorage.setItem(
          "addedFeaturedIds",
          JSON.stringify([...addedIds, featuredBoard.id]),
        );
      }
      setActiveBoard(featuredBoard.id);
    }
  };

  return (
    <div className="w-full flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-sm border-b border-white/20">
      <span className="text-xs md:text-sm font-bold text-yellow-300">
        ⭐ Featured:
      </span>
      <span
        className="text-xs md:text-sm truncate max-w-[100px] sm:max-w-[200px] md:max-w-none"
        style={{ color: "var(--ui-text)" }}
      >
        {featuredBoard.name}
      </span>
      <button
        onClick={() => {
          loadFeaturedBoard();
          resetPlayedCells();
        }}
        className="px-2 md:px-3 py-1 bg-blue-500 text-white rounded text-xs md:text-sm hover:bg-blue-600 shrink-0"
      >
        Play
      </button>
      {/* only visible to admin */}
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
          className="px-2 md:px-3 py-1 bg-purple-500 text-white rounded text-xs md:text-sm hover:bg-purple-600 shrink-0"
        >
          Publish Current
        </button>
      )}
    </div>
  );
};

export default FeaturedBoard;

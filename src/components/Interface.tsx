"use client";
import React, { useState } from "react";
import { useBoardStore } from "../store/editorStore";
import AuthButton from "../components/authButton";
// For Zip loading boards
import {
  ZipDownloadButton,
  ZipImportButton,
} from "../components/zipBoardDownload";

type Player = {
  id: string;
  name: string;
  score: string;
};

const HamburgerIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const PlayersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Interface: React.FC = () => {
  const {
    boards,
    activeBoard,
    setActiveBoard,
    updateActiveBoard,
    createBoard,
    deleteBoard,

    editMode,
    setEditMode,
    resetPlayedCells,
  } = useBoardStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  // for players
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", score: "0" },
    { id: "2", name: "Player 2", score: "0" },
    { id: "3", name: "Player 3", score: "0" },
    { id: "4", name: "Player 4", score: "0" },
  ]);

  const addPlayer = () => {
    if (players.length >= 10) return;
    setPlayers([
      ...players,
      {
        id: Date.now().toString(),
        name: `Player ${players.length + 1}`,
        score: "0",
      },
    ]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayers((players) =>
      players.map((p, i) => (i === index ? { ...p, name } : p)),
    );
  };

  const updatePlayerScore = (index: number, score: string) => {
    if (!/^[-]?\d*$/.test(score)) return;

    setPlayers((players) =>
      players.map((p, i) => (i === index ? { ...p, score } : p)),
    );
  };

  const [expanded, setExpanded] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [rightCollapsed, setRightCollapsed] = useState(true);

  if (!activeBoard) return null;

  return (
    <>
      {/* left side ui for players/tooltips */}
      <div className="hidden md:flex fixed top-20 left-4 z-50 flex-col gap-2">
        <a
          href="https://buzzin.live"
          target="_blank"
          className="ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-amber-400 to-red-400  text-red-500 hover:text-white focus:outline-none focus:ring-0"
        >
          {" "}
          <span className="w-full relative px-6 py-3 inline-flex gap-3 transition-all ease-in duration-00 bg-gray-100 group-hover:bg-transparent">
            Click here for buzzer!
          </span>
        </a>

        <a
          href="https://ko-fi.com/tsubasals"
          target="_blank"
          className="ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-[#72A5F2] to-[#C19BFF] text-[#C19BFF] hover:text-white focus:outline-none focus:ring-0"
        >
          <span className="w-full relative px-6 py-3 inline-flex gap-3 transition-all ease-in duration-00 bg-gray-100 group-hover:bg-transparent">
            <img src="/kofi_symbol.svg" alt="Ko-fi" width="18" height="18" />
            Buy me a Coffee!
          </span>
        </a>
      </div>

      {/* Desktop players panel */}
      {expanded && (
        <div className="hidden md:block fixed left-0 top-1/2 transform -translate-y-1/2 w-50 bg-black/20 rounded-lg shadow-xl p-4 ml-2 z-100">
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
            title="Minimize"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Players
          </h2>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-lime-400/70 to-teal-300/70  text-green-500/70 rounded-sm p-3"
              >
                <div className="mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 min-w-0 text-sm font-semibold text-white bg-transparent border-none outline-none"
                      placeholder="Player name"
                    />

                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="shrink-0 text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={player.score}
                  onChange={(e) => updatePlayerScore(index, e.target.value)}
                  className="
                w-full text-gray-700 text-2xl font-bold text-center
                bg-white rounded px-2 py-1 border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500
                appearance-none
                "
                />
              </div>
            ))}
          </div>

          {players.length < 10 && (
            <button
              onClick={addPlayer}
              className="w-40 ml-1 mr-1 mt-3 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-lime-400 to-teal-300  text-green-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="w-full relative px-6 py-3 transition-all ease-in duration-00 bg-gray-100 group-hover:bg-transparent">
                Add Player
              </span>
            </button>
          )}
        </div>
      )}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="hidden md:inline-flex fixed left-4 top-1/2 w-30 ml-4 mr-1 items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-lime-400 to-teal-300  text-green-500 hover:text-white focus:outline-none focus:ring-0"
        >
          <span className=" w-full relative px-8 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
            Players
          </span>
        </button>
      )}

      {/* desktop right panel */}
      <div className="hidden md:flex fixed right-0 top-1/2 transform -translate-y-1/2 items-center z-50">
        <button
          onClick={() => setRightCollapsed(!rightCollapsed)}
          className="w-14 h-20 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600 shadow-blue-900"
          title={rightCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {
              rightCollapsed ? (
                <polyline points="15 18 9 12 15 6" /> 
              ) : (
                <polyline points="9 18 15 12 9 6" />
              ) 
            }
          </svg>
        </button>

        {/* Ui for the buttons*/}
        <div
          className={`flex flex-col gap-3 transition-all duration-300 overflow-hidden ${
            rightCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <button
            onClick={() => setEditMode(!editMode)}
            className={` w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold group ${editMode ? "bg-gradient-to-br from-green-600 to-lime-400" : "bg-gradient-to-br from-yellow-300 to-amber-700"} ${editMode ? "text-green-500" : "text-amber-400"}  focus:outline-none focus:ring-0  hover:text-white `}
          >
            <span className="w-full relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
              {editMode ? "Save" : "Edit"}
            </span>
          </button>

          <button
            onClick={() => {
              if (!confirm("Reset all cells to unplayed?")) return;
              resetPlayedCells();
            }}
            className="w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-red-700 to-orange-400  text-red-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="w-full relative px-8 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
              Reset Board
            </span>
          </button>
          {/* Profile Button */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-purple-700 to-pink-200  text-purple-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="w-full relative px-12 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
              Profile
            </span>
          </button>
          {/* My Boards */}
          <button
            onClick={() => setSaveModalOpen(true)}
            className="w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-blue-700 to-cyan-200  text-blue-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="w-full relative px-6 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
              Boards
            </span>
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-md flex-wrap">
          <a
            href="https://buzzin.live"
            target="_blank"
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group bg-gradient-to-br from-amber-400 to-red-400 text-red-500 hover:text-white focus:outline-none focus:ring-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="relative px-3 py-2 transition-all ease-in bg-gray-100 group-hover:bg-transparent whitespace-nowrap">
              🔔 Buzzer
            </span>
          </a>

          <a
            href="https://ko-fi.com/tsubasals"
            target="_blank"
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group bg-gradient-to-br from-[#72A5F2] to-[#C19BFF] text-[#C19BFF] hover:text-white focus:outline-none focus:ring-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="relative px-3 py-2 inline-flex gap-1 transition-all ease-in bg-gray-100 group-hover:bg-transparent whitespace-nowrap">
              <img src="/kofi_symbol.svg" alt="Ko-fi" width="14" height="14" />
              Ko-fi
            </span>
          </a>

          <button
            onClick={() => {
              setEditMode(!editMode);
              setMobileMenuOpen(false);
            }}
            className={`relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group ${editMode ? "bg-gradient-to-br from-green-600 to-lime-400 text-green-500" : "bg-gradient-to-br from-yellow-300 to-amber-700 text-amber-400"} hover:text-white focus:outline-none focus:ring-0`}
          >
            <span className="relative px-3 py-2 transition-all ease-in bg-white group-hover:bg-transparent">
              {editMode ? "✓ Save" : "✏️ Edit"}
            </span>
          </button>

          <button
            onClick={() => {
              if (!confirm("Reset all cells to unplayed?")) return;
              resetPlayedCells();
              setMobileMenuOpen(false);
            }}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group bg-gradient-to-br from-red-700 to-orange-400 text-red-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="relative px-3 py-2 transition-all ease-in bg-gray-100 group-hover:bg-transparent whitespace-nowrap">
              🔄 Reset
            </span>
          </button>

          <button
            onClick={() => {
              setProfileOpen(true);
              setMobileMenuOpen(false);
            }}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group bg-gradient-to-br from-purple-700 to-pink-200 text-purple-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="relative px-3 py-2 transition-all ease-in bg-gray-100 group-hover:bg-transparent">
              👤 Profile
            </span>
          </button>

          <button
            onClick={() => {
              setSaveModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold group bg-gradient-to-br from-blue-700 to-cyan-200 text-blue-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="relative px-3 py-2 transition-all ease-in bg-gray-100 group-hover:bg-transparent">
              📋 Boards
            </span>
          </button>

          {/* close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-white/70 hover:text-white text-lg px-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="md:hidden fixed bottom-24 right-2 z-50 flex flex-col items-center gap-3">
        {/* Hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            mobileMenuOpen
              ? "bg-gray-700 shadow-gray-600"
              : "bg-gray-800/80 hover:bg-gray-700 shadow-gray-900"
          }`}
          title="Menu"
        >
          <HamburgerIcon />
        </button>

        {/* Players button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            expanded
              ? "bg-teal-500 shadow-teal-400"
              : "bg-gradient-to-br from-lime-500 to-teal-400 shadow-teal-900"
          }`}
          title="Players"
        >
          <PlayersIcon />
        </button>
      </div>

      {/* mobile players panel */}
      {expanded && (
        <div className="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 w-50 bg-black/20 rounded-lg shadow-xl p-4 ml-2 z-40">
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
            title="Minimize"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Players
          </h2>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-lime-400/70 to-teal-300/70 text-green-500/70 rounded-sm p-3"
              >
                <div className="mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 min-w-0 text-sm font-semibold text-white bg-transparent border-none outline-none"
                      placeholder="Player name"
                    />
                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="shrink-0 text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={player.score}
                  onChange={(e) => updatePlayerScore(index, e.target.value)}
                  className="w-full text-gray-700 text-2xl font-bold text-center bg-white rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                />
              </div>
            ))}
          </div>

          {players.length < 10 && (
            <button
              onClick={addPlayer}
              className="w-40 ml-1 mr-1 mt-3 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-lime-400 to-teal-300 text-green-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="w-full relative px-6 py-3 transition-all ease-in duration-00 bg-gray-100 group-hover:bg-transparent">
                Add Player
              </span>
            </button>
          )}
        </div>
      )}

      {/* mobile/desktop components */}

      {profileOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-black/30 rounded shadow-lg p-4 z-[999]">
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
              title="Minimize"
            >
              ✕
            </button>
            <h2
              className="text-xl font-bold text-white mb-2"
              style={{
                color: "var(--ui-text)",
              }}
            >
              Current Board: {activeBoard?.name || "Untitled Board"}
            </h2>
            <div className="mt-4 border-t pt-3 flex justify-center">
              <AuthButton />
            </div>
          </div>
        </div>
      )}

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="relative p-4 rounded w-[90vw] max-w-[600px]"
            style={{
              backgroundColor: "rgba(33, 33, 33, 0.6)",
              color: "var(--ui-text)",
            }}
          >
            <button
              onClick={() => setSaveModalOpen(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
              title="Minimize"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Current Board</h2>

            <div className="mb-4">
              <button
                onClick={() => {
                  createBoard(boardName || "Untitled Board");
                  setBoardName("");
                }}
                className="mt-2 w-full bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600"
              >
                Create New Board
              </button>
              <ZipImportButton />
            </div>

            {boards.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">My Boards</h3>
                <ul className="max-h-64 overflow-y-auto border p-2 rounded">
                  {boards.map((board) => (
                    <li
                      key={board.id}
                      className="flex justify-between items-center mb-1 p-1 border rounded hover:bg-blue-500 cursor-pointer"
                    >
                      <span className="flex-1 truncate mr-1 text-sm">
                        {board.name}
                      </span>

                      <div className="flex gap-1 flex-wrap justify-end">
                        <button
                          onClick={() => {
                            setActiveBoard(board.id);
                            resetPlayedCells();
                          }}
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                        >
                          Load
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt(
                              "Enter new board name",
                              board.name,
                            );
                            if (!newName) return;
                            updateActiveBoard({
                              ...board,
                              name: newName,
                              updatedAt: Date.now(),
                            });
                          }}
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                        >
                          Rename
                        </button>
                        {/* downloads board as zip */}
                        <ZipDownloadButton board={board} />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !confirm(
                                `Delete "${board.name}"? This cannot be undone.`,
                              )
                            )
                              return;
                            deleteBoard(board.id);
                          }}
                          className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded hover:bg-gray-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Interface;

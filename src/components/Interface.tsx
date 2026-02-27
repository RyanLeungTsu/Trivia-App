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

const Interface: React.FC = () => {
  const {
    boards,
    activeBoard,
    activeBoardId,
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

  const [expanded, setExpanded] = useState(true);

  if (!activeBoard) return null;
  return (
    <>
      {/* left side ui for players */}
      {expanded && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 w-50 bg-white rounded-lg shadow-xl p-4 z-100">
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-sm"
            title="Minimize"
          >
            —
          </button>

          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Players
          </h2>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="mb-2">
                  {/* min-w-0 to shrink into flex container */}
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent border-none outline-none"
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
              className="w-40 ml-1 mr-1 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-lime-400 to-teal-300  text-green-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="w-full relative px-6 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
                Add Player
              </span>
            </button>
          )}
        </div>
      )}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="fixed left-4 top-1/2 w-30 ml-1 mr-1 inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-lime-400 to-teal-300  text-green-500 hover:text-white focus:outline-none focus:ring-0"
        >
          <span className=" w-full relative px-8 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
            Players
          </span>
        </button>
      )}

      {/* Ui for the buttons (stackin on the right side)*/}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-50">
        <button
          onClick={() => setEditMode(!editMode)}
          className={` w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold group ${editMode ? "bg-gradient-to-br from-green-600 to-lime-400" : "bg-gradient-to-br from-yellow-600 to-amber-500"} ${editMode ? "text-green-500" : "text-amber-400"}  focus:outline-none focus:ring-0  hover:text-white `}
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

      {profileOpen && (
        <div className="fixed right-16 top-1/4 w-64 bg-white border rounded shadow-lg p-4 z-50">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Current Board: {activeBoard?.name || "Untitled Board"}
          </h2>
          <h2 className="font-bold mb-2 text-gray-900">My Boards</h2>
          {boards.length === 0 && (
            <p className="text-gray-900">No boards yet</p>
          )}
          {boards.map((board) => (
            <div
              key={board.id}
              className={`p-2 cursor-pointer hover:bg-gray-200 rounded ${
                board.id === activeBoardId
                  ? "font-bold text-gray-900 bg-gray-100"
                  : "text-gray-900"
              }`}
              onClick={() => {
                setActiveBoard(board.id);
                setProfileOpen(false);
              }}
            >
              {board.name}
            </div>
          ))}
          <div className="mt-4 border-t pt-3">
            <AuthButton />
          </div>
        </div>
      )}

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded w-[90vw] max-w-[600px]">
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              Current Board
            </h2>

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
                <h3 className="font-semibold mb-2 text-gray-900">My Boards</h3>
                <ul className="max-h-64 overflow-y-auto border p-2 rounded">
                  {boards.map((board) => (
                    <li
                      key={board.id}
                      className="flex justify-between items-center mb-1 p-1 border rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="flex-1 text-gray-900 truncate mr-1">
                        {board.name}
                      </span>

                      <div className="flex gap-1">
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !confirm(
                                `Overwrite "${board.name}"? This will save all slide changes.`,
                              )
                            )
                              return;

                            const {
                              stagedCell,
                              activeBoard,
                              updateActiveBoard,
                              commitStagedCell,
                            } = useBoardStore.getState();

                            // saves changes to the cell
                            if (stagedCell) commitStagedCell();

            
                            const updatedBoard = {
                              ...activeBoard!,
                              id: board.id, 
                              updatedAt: Date.now(),
                            };

                            updateActiveBoard(updatedBoard);
                          }}
                          className="text-sm bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                        >
                          Overwrite
                        </button> */}

                        <button
                          onClick={() => {
                            setActiveBoard(board.id);
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded"
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
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
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
                          className="text-sm bg-gray-500 text-white px-2 py-0.5 rounded hover:bg-gray-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1 border rounded hover:bg-gray-200 text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Interface;

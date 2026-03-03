"use client";
import { useBoardStore } from "../store/editorStore";
import Slides from "./Slides";

const JeopardyGrid: React.FC = () => {
  const {
    activeBoard,
    editMode,
    selectedCell,
    selectCell,
    markCellUsed,
    setCategoryAt,
    updateCell,
    addRowAt,
    removeRowAt,
    addColumnAt,
    removeColumnAt,
    setFinalJeopardy,
    removeFinalJeopardy,
  } = useBoardStore();

  if (!activeBoard) return null;

  const rowHeight = 700 / (activeBoard.rows + 1);

  return (
    <div className="p-4 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[1400px]">
        {editMode && (
          <>
            <div
              className="absolute top-0 left-0 right-0 flex"
              style={{ marginTop: "-30px" }}
            >
              {activeBoard.categories.map((_, i) => (
                <div
                  key={`col-btn-${i}`}
                  className="flex gap-1 items-center justify-end pr-1"
                  style={{ width: `${100 / activeBoard.columns}%` }}
                >
                  <button
                    onClick={() => addColumnAt(i)}
                    className="bg-green-500 text-white rounded-full w-6 h-6 hover:bg-green-600 text-xs"
                    title="Add column after this"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeColumnAt(i)}
                    className="bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 text-xs"
                    title="Delete this column"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>

            <div
              className="absolute left-0 flex flex-col"
              style={{
                marginLeft: "-60px",
                top: `${100 / (activeBoard.rows + 1)}%`,
                height: `${(activeBoard.rows / (activeBoard.rows + 0.9)) * 100}%`,
              }}
            >
              {Array.from({ length: activeBoard.rows }).map((_, i) => (
                <div
                  key={`row-btn-${i}`}
                  className="flex gap-1 items-center justify-center"
                  style={{ height: `${100 / activeBoard.rows}%` }}
                >
                  <button
                    onClick={() => addRowAt(i)}
                    className="bg-green-500 text-white rounded-full w-6 h-6 hover:bg-green-600 text-xs"
                    title="Add row after this"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeRowAt(i)}
                    className="bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 text-xs"
                    title="Delete this row"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          className="grid w-full h-[700px]"
          style={{
            gridTemplateRows: `repeat(${activeBoard.rows + 1}, 1fr)`,
            gridTemplateColumns: `repeat(${activeBoard.columns}, 1fr)`,
          }}
        >
          {/* Categories */}
          {activeBoard.categories.map((cat, i) => (
            <div
              key={`cat-${i}`}
              className="border border-gray-400 bg-gray-800 text-white font-bold flex items-center justify-center px-1 text-center break-words relative"
              style={{ gridRow: 1, gridColumn: i + 1 }}
            >
              <textarea
                value={cat}
                onChange={(e) => setCategoryAt(i, e.target.value)}
                readOnly={!editMode}
                className="w-full h-full bg-gray-800 text-white text-center font-bold border-none outline-none resize-none overflow-hidden break-words p-1 pt-3 pb-3"
                rows={2}
              />
            </div>
          ))}
          {/* Cells */}
          {activeBoard.cells.map((cell) => {
            const isUsed = activeBoard.usedCells[`${cell.row}-${cell.col}`];
            return (
              <div
                key={`cell-${cell.row}-${cell.col}`}
                onClick={() => {
                  selectCell({
                    ...cell,
                    slides: cell.slides.map((s) => ({
                      elements: s.elements.map((el) => ({ ...el })),
                    })),
                  });
                  if (!editMode) markCellUsed(cell);
                }}
                className={`border border-gray-400 font-bold flex items-center justify-center cursor-pointer text-center px-1 break-words transition relative
                  ${isUsed ? "bg-gray-400 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                style={{
                  gridRow: cell.row + 2,
                  gridColumn: cell.col + 1,
                }}
              >
                {editMode ? (
                  <input
                    type="string"
                    value={cell.points}
                    onChange={(e) => {
                      const updatedCell = {
                        ...cell,
                        points: parseInt(e.target.value) || 0,
                      };
                      updateCell(updatedCell);
                    }}
                    className="w-full h-full bg-transparent text-center font-bold"
                  />
                ) : (
                  cell.points
                )}
              </div>
            );
          })}
        </div>
        {/* Final Jeopardy cell */}
        {activeBoard.finalJeopardy && (
          <div
            onClick={() => {
              if (editMode) return;
              if (!activeBoard.finalJeopardy) return;
              selectCell({
                ...activeBoard.finalJeopardy,
                slides: activeBoard.finalJeopardy.slides.map((s) => ({
                  elements: s.elements.map((el) => ({ ...el })),
                })),
              });
              markCellUsed(activeBoard.finalJeopardy);
            }}
            className={`w-full flex items-center justify-center font-bold text-2xl transition border border-gray-400
      ${editMode ? "cursor-default" : "cursor-pointer hover:bg-blue-600"}
      ${
        activeBoard.usedCells[
          `${activeBoard.finalJeopardy.row}-${activeBoard.finalJeopardy.col}`
        ]
          ? "bg-gray-400 text-white"
          : "bg-blue-500 text-white"
      }`}
            style={{ height: `${rowHeight}px` }}
          >
            {editMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFinalJeopardy();
                  }}
                  className=" bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 ml-5"
                >
                  Remove
                </button>
            ) : (
              <span>Final Jeopardy</span>
            )}
          </div>
        )}
      </div>

    {/* Adding Final jeopardy button */}
      {editMode && !activeBoard.finalJeopardy && (
        <button
          onClick={() => {
            setFinalJeopardy({
              row: activeBoard.rows + 1,
              col: 0,
              points: 0,
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
                      fontSize: 40,
                    },
                  ],
                },
              ],
            });
          }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold group bg-gradient-to-br from-amber-700 to-yellow-300 text-amber-700 hover:text-white focus:outline-none focus:ring-0 z-50"
        >
          <span className="w-full relative px-8 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
            + Add Final Jeopardy
          </span>
        </button>
      )}

      {/* Slides modal */}
      {selectedCell && (
        <Slides cell={selectedCell} close={() => selectCell(null)} />
      )}
    </div>
  );
};

export default JeopardyGrid;

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
  } = useBoardStore();

  if (!activeBoard) return null;

  return (
    <div className="p-4 flex items-center justify-center">
      <div className="relative">
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
                  style={{
                    width: `${100 / activeBoard.columns}%`,
                  }}
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
                  style={{
                    height: `${100 / activeBoard.rows}%`,
                  }}
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
          className="grid w-full h-[700px] max-w-[1400px]"
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
      </div>
      {/* Slides modal */}
      {selectedCell && (
        <Slides cell={selectedCell} close={() => selectCell(null)} />
      )}
    </div>
  );
};

export default JeopardyGrid;

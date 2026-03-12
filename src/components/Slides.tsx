"use client";
import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  JeopardyCell,
  Slide,
  SlideElement,
  DefaultFontSize,
} from "../store/editorStore";
import MediaUploader from "../components/MediaUploader";
import MediaDisplay from "../components/MediaDisplay";
import { saveMedia } from "../lib/mediaStorage";
import { useBoardStore } from "../store/editorStore";

interface SlidesProps {
  cell: JeopardyCell;
  close: () => void;
}

const Slides: React.FC<SlidesProps> = ({ cell, close }) => {
  const setStagedCell = useBoardStore((s) => s.setStagedCell);

  const [slides, setSlides] = useState<Slide[]>(cell.slides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<number | null>(null);
  const [unsavedSlide, savedSlide] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const mediaInputRef = useRef<HTMLInputElement>(null);

  const saveSlide = () => {
    savedSlide(false);
  };

  const updateElement = (id: string, changes: Partial<SlideElement>) => {
    const updated = slides.map((slide, idx) =>
      idx === currentSlideIndex
        ? {
            ...slide,
            elements: slide.elements.map((el) =>
              el.id === id ? { ...el, ...changes } : el,
            ),
          }
        : slide,
    );
    setSlides(updated);
    savedSlide(true);
  };

  // const for adding media
  const handleMediaAdded = (
    type: "image" | "audio" | "video",
    mediaId: string,
  ) => {
    if (mediaTarget === null) return;
    const updated = [...slides];
    updated[mediaTarget].elements.push({
      id: crypto.randomUUID(),
      kind: type,
      content: mediaId,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    });
    setSlides(updated);
    setMediaTarget(null);
    savedSlide(true);
  };
  // Const for deleting slides
  const deleteCurrentSlide = () => {
    if (slides.length <= 1) return;

    const updatedSlides = slides.filter((_, i) => i !== currentSlideIndex);

    let newIndex = currentSlideIndex;
    if (currentSlideIndex >= updatedSlides.length) {
      newIndex = updatedSlides.length - 1;
    }

    setSlides(updatedSlides);
    setCurrentSlideIndex(newIndex);
    savedSlide(true);
  };
  // const for removing elements
  const removeElement = (elementId: string) => {
    const updated = slides.map((slide, idx) =>
      idx === currentSlideIndex
        ? {
            ...slide,
            elements: slide.elements.filter((el) => el.id !== elementId),
          }
        : slide,
    );
    setSlides(updated);
    savedSlide(true);
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!editing) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith("image/")) {
          e.preventDefault();

          const file = item.getAsFile();
          if (!file) continue;

          try {
            const mediaId = crypto.randomUUID();
            await saveMedia(mediaId, file);

            const updated = [...slides];
            updated[currentSlideIndex].elements.push({
              id: crypto.randomUUID(),
              kind: "image",
              content: `idb://${mediaId}`,
              x: 50,
              y: 50,
              width: 300,
              height: 300,
            });
            setSlides(updated);
            savedSlide(true);

            console.log(`Image pasted successfully: ${mediaId}`);
          } catch (error) {
            console.error("Error pasting image:", error);
            alert("Failed to paste image. Please try again.");
          }

          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [editing, slides, currentSlideIndex]);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { width } = containerRef.current.getBoundingClientRect();
      console.log("container width:", width, "scale:", width / 1400);
      if (width < 100) return;
      setScale(width / 1400);
    };

    update();
    const t1 = setTimeout(update, 50);
    const t2 = setTimeout(update, 200);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleClose = () => {
    if (unsavedSlide && !confirm("You have unsaved changes. Close anyway?")) {
      return;
    }

    const updatedCell: JeopardyCell = {
      row: cell.row,
      col: cell.col,
      points: cell.points,
      slides: slides,
    };

    const { activeBoard, setFinalJeopardy } = useBoardStore.getState();
    const isFinalJeopardy =
      activeBoard?.finalJeopardy?.row === cell.row &&
      activeBoard?.finalJeopardy?.col === cell.col;

    if (isFinalJeopardy) {
      setFinalJeopardy(updatedCell);
    } else {
      setStagedCell(updatedCell);
      const { commitStagedCell } = useBoardStore.getState();
      commitStagedCell();
    }

    close();
  };

  return (
    <div className="fixed inset-0 backdrop-brightness-50 bg-opacity-5 backdrop-blur-sm flex items-center justify-center z-999">
      <div
        className="p-4 rounded w-[90vw] max-w-[1400px] relative"
        style={{ backgroundColor: "transparent", color: "var(--ui-text)" }}
      >
        {/*Exit button for slide ui */}
        <button
          onClick={handleClose}
          className="border rounded-full absolute top-2 right-2 w-10 h-10 inline-flex items-center justify-center p-[-2] overflow-hidden text-sm font-extrabold bg-white text-red-500 focus:outline-none focus:ring-0 z-10"
          title="Close"
        >
          <span className="relative px-4 py-2.5 transition-all ease-in duration-75 hover:bg-red-500 hover:text-white">
            ✕
          </span>
        </button>

        <div
          ref={containerRef}
          className="relative w-full border-3 border-blue-400 mb-4 overflow-hidden"
          style={{
            backgroundColor: "var(--ui-bg)",
            color: "var(--ui-text)",
            paddingBottom: "50%",
            height: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1400,
              height: 700,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}
          >
            {currentSlide.elements.map((el) =>
              editing ? (
                <Rnd
                  key={el.id}
                  size={{
                    width: el.width ?? 200,
                    height: el.height ?? 100,
                  }}
                  position={{ x: el.x, y: el.y }}
                  bounds="parent"
                  scale={scale}
                  dragHandleClassName="drag-handle"
                  onDragStop={(_, d) =>
                    updateElement(el.id, { x: d.x, y: d.y })
                  }
                  onResizeStop={(_, __, ref, ___, position) =>
                    updateElement(el.id, {
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      x: position.x,
                      y: position.y,
                    })
                  }
                  enableResizing={{
                    top: true,
                    right: true,
                    bottom: true,
                    left: true,
                    topRight: true,
                    bottomRight: true,
                    bottomLeft: true,
                    topLeft: true,
                  }}
                  style={{ boxSizing: "border-box" }}
                >
                  <div
                    className="border bg-transparent h-full relative group"
                    style={{ boxSizing: "border-box" }}
                  >
                    {el.kind === "text" && (
                      <>
                        <div
                          className="drag-handle absolute bottom-1 right-1 w-6 h-6 bg-gray-300 flex items-center justify-center cursor-move z-20"
                          title="Drag"
                        >
                          ↕
                        </div>
                        <textarea
                          className="w-full h-full resize-none bg-transparent p-1"
                          value={el.content}
                          style={{
                            fontSize: el.fontSize ?? DefaultFontSize,
                            textAlign: el.textAlign ?? "left",
                            boxSizing: "border-box",
                            backgroundColor: "var(--ui-bg)",
                            color: "var(--text)",
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateElement(el.id, { content: e.target.value })
                          }
                        />
                        <div className="absolute bottom-1 left-1 flex gap-1">
                          <button
                            onClick={() =>
                              updateElement(el.id, {
                                fontSize: (el.fontSize ?? DefaultFontSize) + 2,
                              })
                            }
                            className="bg-gray-300 p-1 rounded text-xs"
                            title="Increase Font"
                          >
                            A+
                          </button>
                          <button
                            onClick={() =>
                              updateElement(el.id, {
                                fontSize: Math.max(
                                  (el.fontSize ?? DefaultFontSize) - 2,
                                  8,
                                ),
                              })
                            }
                            className="bg-gray-300 p-1 rounded text-xs"
                            title="Decrease Font"
                          >
                            A-
                          </button>
                          <button
                            onClick={() =>
                              updateElement(el.id, { textAlign: "left" })
                            }
                            className="bg-gray-300 p-1 rounded text-xs"
                            title="Align Left"
                          >
                            ⬅
                          </button>
                          <button
                            onClick={() =>
                              updateElement(el.id, { textAlign: "center" })
                            }
                            className="bg-gray-300 p-1 rounded text-xs"
                            title="Align Center"
                          >
                            ⬌
                          </button>
                          <button
                            onClick={() =>
                              updateElement(el.id, { textAlign: "right" })
                            }
                            className="bg-gray-300 p-1 rounded text-xs"
                            title="Align Right"
                          >
                            ➡
                          </button>
                          <button
                            onClick={() => removeElement(el.id)}
                            className="bg-red-500 text-white p-1 rounded text-xs hover:bg-red-600"
                            title="Delete Text Box"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                    {el.kind !== "text" && (
                      <div className="drag-handle relative w-full h-full">
                        <MediaDisplay
                          element={el}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                            maxWidth: "none",
                            maxHeight: "none",
                            display: "block",
                            color: "var(--text)",
                          }}
                        />
                        <button
                          onClick={() => removeElement(el.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </Rnd>
              ) : (
                <div
                  key={el.id}
                  style={{
                    position: "absolute",
                    left: el.x,
                    top: el.y,
                    width: el.width ?? 200,
                    height: el.height ?? 100,
                  }}
                >
                  {el.kind === "text" && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        fontSize: el.fontSize ?? DefaultFontSize,
                        color: "var(--text)",
                        textAlign: el.textAlign ?? "left",
                        whiteSpace: "pre-wrap",
                        padding: 4,
                        boxSizing: "border-box",
                      }}
                    >
                      {el.content}
                    </div>
                  )}
                  {el.kind === "image" && (
                    <MediaDisplay
                      element={el}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        maxWidth: "none",
                        maxHeight: "none",
                        display: "block",
                      }}
                    />
                  )}
                  {el.kind === "audio" && <MediaDisplay element={el} />}
                  {el.kind === "video" && <MediaDisplay element={el} />}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Control button ui for slides */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {/* Prev Slide Button */}
          <button
            onClick={() =>
              setCurrentSlideIndex(Math.max(currentSlideIndex - 1, 0))
            }
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-blue-700 to-teal-200 text-blue-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
              Prev
            </span>
          </button>
          {/* Toggle for editing and non-editing for slides */}
          <button
            onClick={() => {
              setEditing(!editing);
              if (editing) savedSlide(false);
            }}
            className={`relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold group ${editing ? "bg-gradient-to-br from-yellow-400 to-red-400 text-orange-600" : "bg-gradient-to-br from-orange-500 to-purple-500 text-orange-400"} focus:outline-none focus:ring-0 hover:text-white`}
          >
            <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
              {editing ? "Save" : "Edit"}
            </span>
          </button>
          {/* Next slide button */}
          <button
            onClick={() => {
              if (currentSlideIndex < slides.length - 1)
                setCurrentSlideIndex(currentSlideIndex + 1);
            }}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-blue-700 to-teal-200 text-blue-500 hover:text-white focus:outline-none focus:ring-0"
          >
            <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
              Next
            </span>
          </button>
          {/* Button for adding a slide */}
          {editing && (
            <button
              onClick={() => {
                const newSlide: Slide = {
                  elements: [
                    {
                      id: crypto.randomUUID(),
                      kind: "text",
                      content: "",
                      x: 20,
                      y: 20,
                      width: 200,
                      height: 100,
                      fontSize: DefaultFontSize,
                    },
                  ],
                };
                const updatedSlides = [...slides];
                updatedSlides.splice(currentSlideIndex + 1, 0, newSlide);
                setSlides(updatedSlides);
                setCurrentSlideIndex(currentSlideIndex + 1);
                savedSlide(true);
              }}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold group bg-gradient-to-br from-teal-300 to-lime-400 text-teal-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
                Add Slide
              </span>
            </button>
          )}
          {/* Button for deleting a slide */}
          {editing && slides.length > 1 && (
            <button
              onClick={deleteCurrentSlide}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-red-600 to-orange-300 text-red-700 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
                Delete Slide
              </span>
            </button>
          )}
          {/* Add media button for slides */}
          {editing && (
            <button
              onClick={() => {
                setMediaTarget(currentSlideIndex);
                setTimeout(() => mediaInputRef.current?.click(), 0);
              }}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-purple-700 to-pink-400 text-purple-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
                Add Media
              </span>
            </button>
          )}
          {/* Adding more text boxes than default */}
          {editing && (
            <button
              onClick={() => {
                const updated = [...slides];
                updated[currentSlideIndex].elements.push({
                  id: crypto.randomUUID(),
                  kind: "text",
                  content: "",
                  x: 100,
                  y: 100,
                  width: 200,
                  height: 100,
                  fontSize: DefaultFontSize,
                });
                setSlides(updated);
                savedSlide(true);
              }}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-blue-700 to-teal-200 text-teal-500 hover:text-white focus:outline-none focus:ring-0"
            >
              <span className="relative px-4 py-2.5 transition-all ease-in duration-350 bg-white group-hover:bg-transparent">
                Add Text
              </span>
            </button>
          )}
        </div>
        {/* Upload Media */}
        <MediaUploader
          ref={mediaInputRef}
          onAdd={(type, mediaId) => handleMediaAdded(type, mediaId)}
        />
      </div>
    </div>
  );
};

export default Slides;

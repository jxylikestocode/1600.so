"use client";

import { useEffect, useRef, useState } from "react";
import { X, Minimize2, Maximize2, Move, MoreVertical } from "lucide-react";
import Draggable from "react-draggable";

/**
 * DesmosCalculator Component
 *
 * A draggable, floating Desmos graphing calculator panel
 * Similar to SAT Bluebook calculator interface
 */
export function DesmosCalculator({ isOpen, onClose }) {
  const graphingRef = useRef(null);
  const scientificRef = useRef(null);
  const graphingInstance = useRef(null);
  const scientificInstance = useRef(null);
  const nodeRef = useRef(null); // For react-draggable to avoid findDOMNode
  const [calculatorMode, setCalculatorMode] = useState("graphing"); // "graphing" or "scientific"
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Desmos graphing calculator
  useEffect(() => {
    if (isOpen && graphingRef.current && window.Desmos && !graphingInstance.current) {
      try {
        graphingInstance.current = window.Desmos.GraphingCalculator(graphingRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          pointsOfInterest: true,
          trace: true,
          border: false,
          lockViewport: false,
          expressionsCollapsed: false,
          administerSecretFolders: false,
          images: true,
          folders: true,
          notes: true,
          sliders: true,
          links: true,
          qwertyKeyboard: true,
          restrictedFunctions: false,
          forceLogMode: false,
          forceEnglish: false,
        });
      } catch (error) {
        console.error("Failed to initialize Desmos graphing calculator:", error);
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (graphingInstance.current) {
        graphingInstance.current.destroy();
        graphingInstance.current = null;
      }
    };
  }, [isOpen]);

  // Initialize Desmos scientific calculator
  useEffect(() => {
    if (isOpen && scientificRef.current && window.Desmos && !scientificInstance.current) {
      try {
        scientificInstance.current = window.Desmos.ScientificCalculator(scientificRef.current, {
          keypad: true,
          border: false,
          qwertyKeyboard: true,
        });
      } catch (error) {
        console.error("Failed to initialize Desmos scientific calculator:", error);
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (scientificInstance.current) {
        scientificInstance.current.destroy();
        scientificInstance.current = null;
      }
    };
  }, [isOpen]);

  // Load saved position and size from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem("desmosCalculatorPosition");
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
      const savedSize = localStorage.getItem("desmosCalculatorSize");
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
    }
  }, []);

  // Save position to localStorage when it changes
  const handleDragStop = (e, data) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    if (typeof window !== "undefined") {
      localStorage.setItem("desmosCalculatorPosition", JSON.stringify(newPosition));
    }
  };

  // Handle resize
  const handleMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e) => {
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("right")) {
        newWidth = Math.max(400, startWidth + (e.clientX - startX));
      }
      if (direction.includes("left")) {
        newWidth = Math.max(400, startWidth - (e.clientX - startX));
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(300, startHeight + (e.clientY - startY));
      }
      if (direction.includes("top")) {
        newHeight = Math.max(300, startHeight - (e.clientY - startY));
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("desmosCalculatorSize", JSON.stringify(size));
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen || !isMounted) return null;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".calculator-drag-handle"
      position={position}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 select-none"
        style={{
          width: `${isMaximized ? size.width * 2 : size.width}px`,
          height: `${size.height}px`,
          cursor: isResizing ? "nwse-resize" : "default",
        }}
      >
        {/* Header */}
        <div className="calculator-drag-handle flex items-center justify-between px-4 py-3 bg-gray-900 text-white rounded-t-lg cursor-move select-none">
          <div className="flex items-center gap-3">
            {/* Calculator Mode Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setCalculatorMode("graphing")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  calculatorMode === "graphing"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 12l4-8 4 8 4-4" />
                </svg>
                <span>Graphing</span>
              </button>
              <button
                onClick={() => setCalculatorMode("scientific")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  calculatorMode === "scientific"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <rect x="8" y="6" width="8" height="4" />
                  <line x1="8" y1="14" x2="8" y2="14" />
                  <line x1="12" y1="14" x2="12" y2="14" />
                  <line x1="16" y1="14" x2="16" y2="14" />
                </svg>
                <span>Scientific</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calculator Containers */}
        <div
          ref={graphingRef}
          className="w-full h-[calc(100%-60px)] rounded-b-lg"
          style={{
            backgroundColor: "#f7f7f7",
            display: calculatorMode === "graphing" ? "block" : "none"
          }}
        />
        <div
          ref={scientificRef}
          className="w-full h-[calc(100%-60px)] rounded-b-lg"
          style={{
            backgroundColor: "#f7f7f7",
            display: calculatorMode === "scientific" ? "block" : "none"
          }}
        />

        {/* Resize Handles */}
        {(
          <>
            {/* Right edge */}
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-200 transition-colors"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
            {/* Bottom edge */}
            <div
              className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-blue-200 transition-colors"
              onMouseDown={(e) => handleMouseDown(e, "bottom")}
            />
            {/* Bottom-right corner */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-300 transition-colors rounded-br-lg"
              onMouseDown={(e) => handleMouseDown(e, "right bottom")}
            />
          </>
        )}
      </div>
    </Draggable>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { X, Minimize2, Maximize2, Move } from "lucide-react";

/**
 * DesmosCalculator Component
 *
 * A draggable, floating Desmos graphing calculator panel
 * Similar to SAT Bluebook calculator interface
 */
export function DesmosCalculator({ isOpen, onClose }) {
  const calculatorRef = useRef(null);
  const desmosInstance = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  // Initialize Desmos calculator when component mounts and is open
  useEffect(() => {
    if (isOpen && calculatorRef.current && window.Desmos && !desmosInstance.current) {
      try {
        desmosInstance.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
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
        console.error("Failed to initialize Desmos calculator:", error);
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (desmosInstance.current) {
        desmosInstance.current.destroy();
        desmosInstance.current = null;
      }
    };
  }, [isOpen]);

  // Load saved position from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem("desmosCalculatorPosition");
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
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

  if (!isOpen) return null;

  return (
    <Draggable
      handle=".calculator-drag-handle"
      position={position}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300"
        style={{
          width: isMinimized ? "320px" : "600px",
          height: isMinimized ? "60px" : "500px",
        }}
      >
        {/* Header */}
        <div className="calculator-drag-handle flex items-center justify-between px-4 py-3 bg-gray-800 text-white rounded-t-lg cursor-move select-none">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            <span className="font-semibold text-sm">Calculator</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calculator Container */}
        {!isMinimized && (
          <div
            ref={calculatorRef}
            className="w-full h-[calc(100%-48px)] rounded-b-lg"
            style={{ backgroundColor: "#f7f7f7" }}
          />
        )}

        {/* Powered by Desmos footer (when minimized) */}
        {isMinimized && (
          <div className="px-4 py-2 text-xs text-gray-500 text-center">
            powered by desmos
          </div>
        )}
      </div>
    </Draggable>
  );
}

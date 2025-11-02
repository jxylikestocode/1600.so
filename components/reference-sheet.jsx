"use client";

import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2, MoreVertical } from "lucide-react";
import Draggable from "react-draggable";

/**
 * ReferenceSheet Component
 *
 * A draggable, floating SAT Math Reference Sheet panel
 * Similar to SAT Bluebook reference interface
 */
export function ReferenceSheet({ isOpen, onClose }) {
  const nodeRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 50 });
  const [size, setSize] = useState({ width: 450, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
    // Check if mobile
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Load saved position and size from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem("referenceSheetPosition");
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
      const savedSize = localStorage.getItem("referenceSheetSize");
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
      localStorage.setItem(
        "referenceSheetPosition",
        JSON.stringify(newPosition)
      );
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
        newWidth = Math.max(350, startWidth + (e.clientX - startX));
      }
      if (direction.includes("left")) {
        newWidth = Math.max(350, startWidth - (e.clientX - startX));
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(400, startHeight + (e.clientY - startY));
      }
      if (direction.includes("top")) {
        newHeight = Math.max(400, startHeight - (e.clientY - startY));
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("referenceSheetSize", JSON.stringify(size));
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen || !isMounted) return null;

  // On mobile, use fixed positioning; on desktop, use draggable
  const referenceContent = (
    <div
      ref={nodeRef}
      className="bg-white rounded-lg shadow-2xl border border-gray-300 select-none max-h-[80vh] overflow-hidden"
      style={{
        width: `${isMaximized ? Math.min(size.width * 1.5, window.innerWidth * 0.9) : Math.min(size.width, window.innerWidth * 0.9)}px`,
        height: `${Math.min(size.height, window.innerHeight * 0.8)}px`,
        cursor: isResizing ? "nwse-resize" : "default",
        ...(isMobile ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
        } : {}),
      }}
    >
        {/* Header */}
        <div className="reference-drag-handle flex items-center justify-between px-4 py-3 bg-gray-900 text-white rounded-t-lg cursor-move select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Reference Sheet</span>
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

        {/* Reference Sheet Content */}
        <div className="h-[calc(100%-60px)] overflow-y-auto p-6 bg-white rounded-b-lg">
          <div className="reference-images">
            {/* Top Row: All figures in one row */}
            <div className="grid grid-cols-6 gap-3 mb-3">
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 1 is a circle with radius r. Two equations are presented below reference figure 1. A equals pi times the square of r. ; C equals 2 pi r."
                  src="/reference-sheet/circle.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 2 is a rectangle with length l and width w. An equation is presented below reference figure 2. A equals l w."
                  src="/reference-sheet/rectangle.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 3 is a triangle with base b and height h. An equation is presented below reference figure 3. A equals one half b h."
                  src="/reference-sheet/triangle.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 4 is a right triangle. The two sides that form the right angle are labeled a and b, and the side opposite the right angle is labeled c. An equation is presented below reference figure 4. c squared equals a squared plus b squared"
                  src="/reference-sheet/right-triangle.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 5 is a right triangle with a 30 degree angle and a 60 degree angle. The side opposite the 30 degree angle is labeled x. The side opposite the 60 degree angle is labeled x times the square root of 3. The side opposite the right angle is labeled 2 x."
                  src="/reference-sheet/triangle-30-60-90.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 6 is a right triangle with two 45 degree angles. Two sides are each labeled s. The side opposite the right angle is labeled s times the square root of 2."
                  src="/reference-sheet/triangle-45-45-90.svg"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Special Right Triangles Label Row */}
            <div className="grid grid-cols-6 gap-3 mb-10 -mt-2">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div className="col-span-2 text-center font-semibold text-sm">
                Special Right Triangles
              </div>
            </div>

            {/* Bottom Row: Volume Formulas */}
            <div className="grid grid-cols-5 gap-3">
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 7 is a rectangular solid whose base has length l and width w and whose height is h. An equation is presented below reference figure 7. V equals l w h."
                  src="/reference-sheet/rectangular-solid.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 8 is a right circular cylinder whose base has radius r and whose height is h. An equation is presented below reference figure 8. V equals pi times the square of r times h."
                  src="/reference-sheet/cylinder.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 9 is a sphere with radius r. An equation is presented below reference figure 9. V equals four thirds pi times the cube of r."
                  src="/reference-sheet/sphere.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 10 is a cone whose base has radius r and whose height is h. An equation is presented below reference figure 10. V equals one third times pi times the square of r times h."
                  src="/reference-sheet/cone.svg"
                  className="w-full h-auto"
                />
              </div>
              <div className="imageContainer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Reference figure 11 is an asymmetrical pyramid whose base has length l and width w and whose height is h. An equation is presented below reference figure 11. V equals one third l w h"
                  src="/reference-sheet/pyramid.svg"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Reference Text */}
          <div className="reference-text mt-6 space-y-2 text-sm">
            <p>The number of degrees of arc in a circle is 360.</p>
            <p>
              The number of radians of arc in a circle is 2<i>π</i>.
            </p>
            <p>
              The sum of the measures in degrees of the angles of a triangle is
              180.
            </p>
          </div>
        </div>

        {/* Resize Handles */}
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
    </div>
  );

  return isMobile ? referenceContent : (
    <Draggable
      nodeRef={nodeRef}
      handle=".reference-drag-handle"
      position={position}
      onStop={handleDragStop}
      bounds="parent"
    >
      {referenceContent}
    </Draggable>
  );
}

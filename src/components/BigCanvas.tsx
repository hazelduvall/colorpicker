import { useCallback, useEffect, useRef } from "preact/hooks";

export const BigCanvas = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onResize = useCallback(() => {
    const div = divRef.current;
    if (!div) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = div.offsetWidth;
    const height = div.offsetHeight;

    // Trim to a 1:1 aspect ratio
    canvas.width = Math.min(width, height);
    canvas.height = Math.min(width, height);
  }, [divRef, canvasRef]);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]);

  // Screen:
  // * Every time the "L" in state.lab updates, spawn a promise to update the image.
  // * Every time the screen resizes, spawn a promise to update the image.
  // * If there is an existing screen update outstanding, abort it w/ a funky AbortController wrapper thingy
  // * Once that new spawned promise resolves, do a normal redraw
  //
  // Cursor:
  // * TODO: look up if pointerdown is the correct event type for what I want here
  // * Get the X and Y coordinates from it, convert it to new "a" and "b" elements
  // * Choose the new Lab color from that
  // * Do a normal redraw
  //
  // A redraw looks like:
  // 1. await the animation frame
  // 2. draw the background image from the render manager
  // 3. draw the current cursor position

  return (
    <div ref={divRef} class="BigCanvas">
      <canvas ref={canvasRef}>Canvas is not supported by your browser</canvas>
    </div>
  );
};

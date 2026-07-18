import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { labToInp } from "../color/conversions";
import { Renderer } from "../color/Renderer";
import { useColorState } from "../hooks/useColorState";

export const BigCanvas = () => {
  const { state } = useColorState();
  const inp = labToInp(state.lab.val);

  const cursorX = useRef(inp[1]);
  const cursorY = useRef(inp[2]);

  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const renderer = useMemo(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    return new Renderer(ctx, navigator.hardwareConcurrency || 2, inp[0]);
  }, [canvas]);

  const draw = useCallback(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const img = renderer?.getImageBitmap();
    if (img?.width === width && img?.height === height) {
      ctx.save();
      ctx.putImageData(img, 0, 0);
      ctx.restore();
    }

    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(
      width * cursorX.current,
      height * (1 - cursorY.current),
      4,
      0,
      2 * Math.PI,
    );
    ctx.stroke();

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(
      width * cursorX.current,
      height * (1 - cursorY.current),
      5,
      0,
      2 * Math.PI,
    );
    ctx.stroke();
  }, [canvas, renderer, cursorX, cursorY]);

  const scheduledDrawRef = useRef(false);
  const requestDraw = useCallback(() => {
    if (scheduledDrawRef.current) return;

    window.requestAnimationFrame(() => {
      draw();
      scheduledDrawRef.current = false;
    });
  }, [scheduledDrawRef, draw]);

  // TODO: currently, my code doesn't handle large images well at all. This
  // might be from an inefficient render coordination mechanism. For now my
  // solution is simply to render to a smaller canvas :)
  /*
  const onResize = useCallback(() => {
    if (!canvas || !div) return;

    const width = div.offsetWidth;
    const height = div.offsetHeight;

    // Trim to a 1:1 aspect ratio
    canvas.width = Math.min(width, height);
    canvas.height = Math.min(width, height);

    const ctx = canvas.getContext("2d");
    if (!ctx || !renderer) return;

    void renderer
      .resize(ctx)
      .then(() => requestDraw())
      .catch((e) => {
        console.error("resize err", e);
        // Expected this might throw, suppress all errors
      });
  }, [div, canvas, renderer]);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]);
  */

  const inpX = inp[1];
  const inpY = inp[2];
  useEffect(() => {
    cursorX.current = inpX;
    cursorY.current = inpY;
    requestDraw();
  }, [inpX, inpY, cursorX, cursorY]);

  const inpZ = inp[0];
  useEffect(() => {
    if (!renderer) return;

    void renderer
      .setZ(inpZ)
      .then(() => requestDraw())
      .catch((e) => {
        console.error("inpZ changed err", e);
        // Expected this might throw, suppress all errors
      });
  }, [inpZ, renderer]);

  return (
    <div ref={setDiv} class="BigCanvas">
      <canvas ref={setCanvas} width={256} height={256}>
        Canvas is not supported by your browser
      </canvas>
    </div>
  );
};

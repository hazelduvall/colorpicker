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

  const abortControllerRef = useRef<AbortController | null>(null);
  const newController = useCallback((): AbortController => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    return abortController;
  }, [abortControllerRef]);

  const draw = useCallback(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const img = renderer?.getImageBitmap();
    if (img) {
      ctx.save();
      ctx.drawImage(img, 0, 0, width, height);
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

  const onResize = useCallback(() => {
    if (!canvas || !div) return;

    const width = div.offsetWidth;
    const height = div.offsetHeight;

    // Trim to a 1:1 aspect ratio
    canvas.width = Math.min(width, height);
    canvas.height = Math.min(width, height);

    const ctx = canvas.getContext("2d");
    if (!ctx || !renderer) return;

    const signal = newController().signal;
    void renderer
      .resize(ctx, signal)
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

    const signal = newController().signal;
    void renderer
      .setZ(inpZ, signal)
      .then(() => requestDraw())
      .catch((e) => {
        console.error("inpZ changed err", e);
        // Expected this might throw, suppress all errors
      });
  }, [inpZ, renderer]);

  return (
    <div ref={setDiv} class="BigCanvas">
      <canvas ref={setCanvas}>Canvas is not supported by your browser</canvas>
    </div>
  );
};

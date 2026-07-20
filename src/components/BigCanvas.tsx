import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { inpToLab, labToInp } from "../color/conversions";
import { Renderer } from "../color/Renderer";
import { useColorState } from "../hooks/useColorState";

export const BigCanvas = () => {
  const { state, dispatch } = useColorState();

  const inp = labToInp(state.lab.val);
  const inpZ = inp[0];
  const inpX = inp[1];
  const inpY = inp[2];

  const cursorZ = useRef(inpZ);
  const cursorX = useRef(inpX);
  const cursorY = useRef(inpY);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  // Worker pool to queue/cache rendered frames.
  const renderer = useMemo(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    return new Renderer(ctx, navigator.hardwareConcurrency || 2, inp[0]);
  }, [canvas]);

  // Main function to do a complete draw
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

  // Redraw only on animation frames
  const scheduledDrawRef = useRef(false);
  const requestDraw = useCallback(() => {
    if (scheduledDrawRef.current) return;

    window.requestAnimationFrame(() => {
      draw();
      scheduledDrawRef.current = false;
    });
  }, [scheduledDrawRef, draw]);

  // Redraw the canvas whenever any input changes.
  useEffect(() => {
    const oldZ = cursorZ.current;
    const oldX = cursorX.current;
    const oldY = cursorY.current;
    cursorZ.current = inpZ;
    cursorX.current = inpX;
    cursorY.current = inpY;

    if (oldZ !== inpZ) {
      void renderer
        ?.setZ(inpZ)
        .then(() => requestDraw())
        .catch((e) => {
          console.error("inpZ changed err", e);
          // Expected this might throw, suppress all errors
        });
    }
    if (oldX !== inpX || oldY !== inpY) {
      requestDraw();
    }
  }, [inpZ, inpX, inpY, renderer, requestDraw]);

  // Listener so touching the canvas will move the cursor
  useEffect(() => {
    if (!canvas) return;

    const listener = (e: MouseEvent) => {
      e.preventDefault();
      if (e.buttons & 1) {
        const newX = e.offsetX / canvas.offsetWidth;
        const newY = 1.0 - e.offsetY / canvas.offsetHeight;
        const newLab = inpToLab([cursorZ.current, newX, newY]);
        dispatch({
          type: "SetLabAction",
          lab: { space: "lab", inGamut: true, val: newLab },
        });
      }
    };
    canvas.addEventListener("pointerdown", listener);
    canvas.addEventListener("pointermove", listener);
    return () => {
      canvas.removeEventListener("pointerdown", listener);
      canvas.removeEventListener("pointermove", listener);
    };
  }, [canvas, dispatch]);

  // Prevent held touches from causing highlight on safari
  useEffect(() => {
    if (!canvas) return;

    const listener = (e: TouchEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("touchstart", listener);
    return () => canvas.removeEventListener("touchstart", listener);
  }, [canvas]);

  // When first loading, request a render
  useEffect(() => {
    if (!canvas || !renderer) return;

    void renderer
      .setZ(cursorZ.current)
      .then(() => requestDraw())
      .catch((e) => {
        console.error("first draw err", e);
      });
  }, [canvas, renderer]);

  return (
    <div class="BigCanvas">
      <canvas ref={setCanvas} width={256} height={256}>
        Canvas is not supported by your browser
      </canvas>
    </div>
  );
};

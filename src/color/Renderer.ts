import type { WorkerRequest, WorkerResponse } from "./WorkerState";

export class Renderer {
  private workers: Worker[];
  private imageData: ImageData;
  private z: number;

  private cache = new Map<string, Uint8ClampedArray>();
  private nextFrame = 0;
  private lastSeenFrame = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    numWorkers: number,
    initialZ: number,
  ) {
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

    this.workers = Array.from({ length: numWorkers }).map(
      () =>
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    );

    this.z = initialZ;
  }

  public getImageBitmap(): ImageData {
    return this.imageData;
  }

  public async setZ(newZ: number) {
    this.z = newZ;
    return await this.redraw();
  }

  private async redraw() {
    const key = this.z.toFixed(3);
    const cachedFrame = this.cache.get(key);
    if (cachedFrame) {
      this.imageData.data.set(cachedFrame);
      return;
    }

    const label = `redraw ${this.nextFrame}`;
    console.time(label);

    const worker = this.workers[this.nextFrame % this.workers.length];
    this.nextFrame += 1;

    await new Promise((resolve) => {
      // All of this reads a bit backwards, but that's just how it has to be set up ig...
      const listener = (e: MessageEvent) => {
        const { data, z, frame }: WorkerResponse = e.data;
        const newKey = z.toFixed(3);
        this.cache.set(newKey, data);

        if (frame < this.lastSeenFrame) return;
        this.lastSeenFrame = frame;

        this.imageData.data.set(data);

        worker.removeEventListener("message", listener);
        resolve(undefined);
      };
      worker.addEventListener("message", listener);

      const request: WorkerRequest = {
        width: this.imageData.width,
        height: this.imageData.height,
        z: this.z,
        frame: this.nextFrame,
      };
      worker.postMessage(request);
    });

    console.timeEnd(label);
  }
}

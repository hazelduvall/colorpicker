import type { WorkerRequest, WorkerResponse } from "./WorkerState";

export class Renderer {
  private workers: Worker[];
  private imageData: ImageData;
  private imageBitmap: ImageBitmap | undefined;
  private z: number;
  private nonce: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    numWorkers: number,
    initialZ: number,
  ) {
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

    const workerFile = new URL("./worker.ts", import.meta.url);
    this.workers = Array.from({ length: numWorkers }).map(
      () => new Worker(workerFile, { type: "module" }),
    );

    this.z = initialZ;
    this.nonce = 0;
  }

  public getImageBitmap(): ImageBitmap | undefined {
    return this.imageBitmap;
  }

  public async resize(ctx: CanvasRenderingContext2D, signal: AbortSignal) {
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    return await this.redraw(signal);
  }

  public async setZ(newZ: number, signal: AbortSignal) {
    this.z = newZ;
    return await this.redraw(signal);
  }

  private async redraw(signal: AbortSignal) {
    console.time("redraw");
    this.nonce += 1;

    const promises: Array<Promise<void>> = [];

    const blockHeight = Math.ceil(this.imageData.height / this.workers.length);
    let i = 0;
    for (
      let yBegin = 0;
      yBegin < this.imageData.height;
      yBegin += blockHeight
    ) {
      const yEnd = Math.min(yBegin + blockHeight, this.imageData.height);
      const worker = this.workers[i];
      i += 1;
      if (!worker) {
        throw new Error("more blocks than workers??");
      }

      promises.push(
        new Promise((resolve, reject) => {
          if (signal.aborted) {
            reject(new Error("aborted first"));
            return;
          }

          // All of this reads a bit backwards, but that's just how it has to be set up ig...
          const listener = (e: MessageEvent) => {
            const { data, nonce }: WorkerResponse = e.data;
            if (nonce !== this.nonce) return;
            this.imageData.data.set(data, 4 * this.imageData.width * yBegin);

            worker.removeEventListener("message", listener);
            resolve(undefined);
          };
          signal.addEventListener("abort", () => {
            worker.removeEventListener("message", listener);
            reject(new Error("aborted signal"));
          });
          worker.addEventListener("message", listener);

          const request: WorkerRequest = {
            width: this.imageData.width,
            height: this.imageData.height,
            yBegin,
            yEnd,
            z: this.z,
            nonce: this.nonce,
          };
          worker.postMessage(request);
        }),
      );
    }

    await Promise.all(promises);
    signal.throwIfAborted();

    this.imageBitmap = await createImageBitmap(this.imageData);
    signal.throwIfAborted();

    console.timeEnd("redraw");
  }
}

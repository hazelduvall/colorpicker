import type { WorkerRequest, WorkerResponse } from "./WorkerState";

export class Renderer {
  private workers: Worker[];
  private imageData: ImageData;
  private z: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    numWorkers: number,
    initialZ: number,
  ) {
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

    const workerFile = new URL("./worker.ts", import.meta.url);
    this.workers = Array(numWorkers).map(
      () => new Worker(workerFile, { type: "module" }),
    );

    this.z = initialZ;
  }

  public resize(ctx: CanvasRenderingContext2D) {
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    this.redraw();
  }

  public setZ(newZ: number) {
    this.z = newZ;
  }

  public async redraw() {
    console.time("redraw");

    const promises: Array<Promise<void>> = [];

    const blockHeight = Math.ceil(this.imageData.height / this.workers.length);
    let i = 0;
    for (
      let yBegin = 0;
      yBegin < this.imageData.height;
      yBegin += blockHeight
    ) {
      const yEnd = Math.min(yBegin + blockHeight, this.imageData.height);
      const worker = this.workers[i++];
      if (!worker) {
        throw new Error("more blocks than workers??");
      }

      promises.push(
        new Promise((resolve) => {
          // All of this reads a bit backwards, but that's just how it has to be set up ig...
          const listener = (e: MessageEvent) => {
            const data: WorkerResponse = e.data;
            this.imageData.data.set(data, 4 * this.imageData.width * yBegin);

            worker.removeEventListener("message", listener);
            resolve(undefined);
          };
          worker.addEventListener("message", listener);

          const request: WorkerRequest = {
            width: this.imageData.width,
            height: this.imageData.height,
            yBegin,
            yEnd,
            z: this.z,
          };
          worker.postMessage(request);
        }),
      );
    }

    await Promise.all(promises);
    console.timeEnd("redraw");
  }
}

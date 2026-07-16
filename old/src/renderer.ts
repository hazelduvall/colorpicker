import { spawn, Worker, Pool, FunctionThread } from "threads";
import { State, IDrawable, IStateUpdater } from "./types";
import { StateManager } from "./controls";
import { VIEWS } from "./display";
// @ts-expect-error it don't want .ts
// eslint-disable-next-line import/no-webpack-loader-syntax
import workerUrl from 'threads-plugin/dist/loader?name=worker!./renderer_worker.ts';

export class Renderer implements IDrawable, IStateUpdater {
    private pool: Pool<FunctionThread>;
    private numWorkers: number;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private img: ImageData;

    private inpZ: number;
    private cursorX: number;
    private cursorY: number;

    private width: number;
    private height: number;

    private drawScheduled: boolean;
    private drawFull: boolean;

    private stateManager: StateManager;

    constructor(canvas: HTMLCanvasElement, numWorkers: number, stateManager: StateManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.pool = Pool(
            () => spawn(new Worker(workerUrl)),
            { size: numWorkers }
        ) as Pool<FunctionThread>;
        this.numWorkers = numWorkers;
        this.stateManager = stateManager;
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.img = this.ctx.createImageData(width, height);
        this.notifyDrawFull();
    }

    public draw(ctx: CanvasRenderingContext2D, _wFactor: number, _hFactor: number) {
        this.ctx = ctx;
        this.redraw();
    }

    render() {
        createImageBitmap(this.img).then((img) => {
            const ctx = this.ctx;

            ctx.clearRect(0, 0, this.width, this.height);
            ctx.save();
            ctx.drawImage(img, 0, 0);
            ctx.restore();

            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.arc(this.cursorX, this.height - this.cursorY, 4, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(this.cursorX, this.height - this.cursorY, 5, 0, 2 * Math.PI);
            ctx.stroke();
        });

        this.drawScheduled = false;
        this.drawFull = false;
    }

    async redraw() {
        if (this.drawScheduled) {
            return;
        }
        this.drawScheduled = true;

        // Synchronise with repaints
        await (new Promise(window.requestAnimationFrame));

        if (this.drawFull) {
            console.time("redraw");
            const blockHeight = Math.ceil(this.height / this.numWorkers);
            const promises: Promise<void>[] = [];
            for (let yBegin = 0; yBegin < this.height; yBegin += blockHeight) {
                var yEnd = yBegin + blockHeight;
                if (yEnd > this.height) {
                    yEnd = this.height;
                }
                const promise: Promise<void> = (async (yBegin, yEnd) => {
                    return this.pool.queue(async renderPortion => {
                        return renderPortion(
                            this.width, this.height, yBegin, yEnd,
                            this.stateManager.state.maxChroma, this.inpZ,
                            this.stateManager.state.view,
                        );
                    }).then((result: unknown) => {
                        const data = result as Uint8ClampedArray;
                        this.img.data.set(data, 4 * this.width * yBegin);
                    });
                })(yBegin, yEnd);
                promises.push(promise);
            }

            await Promise.all(promises);
            console.timeEnd("redraw");
        }

        this.render();
    }

    public notifyDrawFull() {
        this.drawFull = true;
    }

    register(callback: (u: IStateUpdater) => void): void {
        var mouseDown = false;
        const fullCallback = ((s: Renderer) => {
            return (e: MouseEvent) => {
                s.cursorX = e.offsetX;
                s.cursorY = e.offsetY;
                callback(s);
            }
        })(this);

        this.canvas.addEventListener("mousedown", (e: MouseEvent) => {
            if (e.buttons & 1) {
                e.preventDefault();
                mouseDown = true;
                fullCallback(e);
            }
        });
        this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
            if (mouseDown) {
                e.preventDefault();
                fullCallback(e);
            }
        });
        this.canvas.addEventListener("mouseup", (e: MouseEvent) => {
            e.preventDefault();
            mouseDown = false;
        });
    }
    
    sendUpdate(oldState: State): void {
        const view = VIEWS[oldState.view];
        let inp = view.untransform(oldState.rep, oldState.maxChroma);
        this.inpZ = inp[0];
        inp[1] = this.cursorX / this.width;
        inp[2] = 1.0 - this.cursorY / this.height;
        oldState.rep = view.transform(inp, oldState.maxChroma);
    }

    getUpdate(newState: State): void {
        const view = VIEWS[newState.view];
        const inp = view.untransform(
            newState.rep,
            newState.maxChroma
        );

        if (this.inpZ !== inp[0]) {
            this.notifyDrawFull();
            this.inpZ = inp[0];
        }
        
        this.cursorX = inp[1] * this.width;
        this.cursorY = inp[2] * this.height;

        this.redraw();
    }
}

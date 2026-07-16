import { IDrawable } from "./types";

export class RCanvas {
    private container: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rHeight: number;
    private rWidth: number;
    private hFactor: number;
    private wFactor: number;

    public drawables: IDrawable[];

    constructor(canvas: HTMLCanvasElement, rHeight: number, rWidth: number) {
        this.container = canvas.parentElement as HTMLDivElement;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.rHeight = rHeight;
        this.rWidth = rWidth;

        this.drawables = [];
        this.resize();
    }

    public resize() {
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        this.canvas.height = Math.min(
            height,
            width * this.rHeight / this.rWidth,
        );
        this.canvas.width = Math.min(
            width,
            height * this.rWidth / this.rHeight,
        );
        this.hFactor = this.canvas.height / this.rHeight;
        this.wFactor = this.canvas.width / this.rWidth;

        for (const obj of this.drawables) {
            obj.resize(this.canvas.width, this.canvas.height);
        }

        this.draw();
    }

    public draw() {
        this.ctx.fillStyle = "#001121";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const obj of this.drawables) {
            obj.draw(this.ctx, this.wFactor, this.hFactor);
        }
    }
}

export class RRect implements IDrawable {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: string;
    private alpha: number;

    constructor(x: number, y: number, width: number, height: number, color: string, alpha: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.alpha = alpha;
    }

    public resize(_width: number, _height: number) {}

    public draw(ctx: CanvasRenderingContext2D, wFactor: number, hFactor: number) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fillRect(this.x * wFactor, this.y * hFactor, this.width * wFactor, this.height * hFactor);
        ctx.globalAlpha = 1.0;
    }
}

export class RImg implements IDrawable {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    public image: CanvasImageSource;

    constructor(x: number, y: number, width: number, height: number, image: CanvasImageSource) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
    }

    public resize(_width: number, _height: number) {}

    public draw(ctx: CanvasRenderingContext2D, wFactor: number, hFactor: number) {
        if (this.image !== undefined) {
            ctx.save();
            ctx.drawImage(this.image, this.x * wFactor, this.y * hFactor, this.width * wFactor, this.height * hFactor);
            ctx.restore();
        }
    }
}


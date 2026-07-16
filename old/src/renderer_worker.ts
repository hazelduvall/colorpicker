import { expose } from "threads/worker";
import { VIEWS } from "./display";
import { ColorSpace } from "./types";
import { Vector3D } from "ciebase-ts";


expose(function renderPortion(width: number, height: number, yBegin: number, yEnd: number, maxChroma: number, inpZ: number, view: ColorSpace): Uint8ClampedArray {
    const transform = VIEWS[view].transform;
    const toSrgb = VIEWS[view].toSrgb;
    let inp: Vector3D = [inpZ, 0.0, 0.0];
    let data = new Uint8ClampedArray(4 * width * (yEnd - yBegin));
    for (let y = yBegin; y < yEnd; ++y) {
        inp[2] = 1.0 - y / height;
        for (let x = 0; x < width; ++x) {
            inp[1] = x / width;
            const r = toSrgb(transform(inp, maxChroma));
            let rgb = r.val;
            if (!r.inGamut) {
                const desat = 0.5;
                const dim = 0.1;
                const avg = (rgb[0] + rgb[1] + rgb[2]) / 3.0;
                rgb[0] = (rgb[0]) * (1.0 - desat) + avg * desat - dim;
                rgb[1] = (rgb[1]) * (1.0 - desat) + avg * desat - dim;
                rgb[2] = (rgb[2]) * (1.0 - desat) + avg * desat - dim;
            }
            const offset = 4 * (x + width * (y - yBegin));
            data[offset + 0] = 255.0 * rgb[0];
            data[offset + 1] = 255.0 * rgb[1];
            data[offset + 2] = 255.0 * rgb[2];
            data[offset + 3] = 255.0;
        }
    }
    return data;
});

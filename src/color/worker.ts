import type { Vector3D } from "ciebase-ts";
import { cielabToSrgb, inpToLab } from "./conversions";
import type { WorkerRequest, WorkerResponse } from "./WorkerState";

onmessage = (e) => {
  const { width, height, z, frame }: WorkerRequest = e.data;
  let inp: Vector3D = [z, 0.0, 0.0];
  let data = new Uint8ClampedArray(4 * width * height);
  for (let y = 0; y < height; ++y) {
    inp[2] = 1.0 - y / height;
    for (let x = 0; x < width; ++x) {
      inp[1] = x / width;
      const r = cielabToSrgb({
        space: "lab",
        inGamut: true,
        val: inpToLab(inp),
      });
      let rgb = r.val;
      if (!r.inGamut) {
        const desat = 0.5;
        const dim = 0.1;
        const avg = (rgb[0] + rgb[1] + rgb[2]) / 3.0;
        rgb[0] = rgb[0] * (1.0 - desat) + avg * desat - dim;
        rgb[1] = rgb[1] * (1.0 - desat) + avg * desat - dim;
        rgb[2] = rgb[2] * (1.0 - desat) + avg * desat - dim;
      }
      const offset = 4 * (x + width * y);
      data[offset + 0] = 255.0 * rgb[0];
      data[offset + 1] = 255.0 * rgb[1];
      data[offset + 2] = 255.0 * rgb[2];
      data[offset + 3] = 255.0;
    }
  }

  const response: WorkerResponse = {
    data,
    z,
    frame,
  };
  postMessage(response);
};

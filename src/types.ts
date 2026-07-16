import { Vector3D } from "ciebase-ts";

export class ColorResult<T>{
  inGamut: boolean;
  val: T;
}

export interface IDrawable {
  resize(width: number, height: number): void;
  draw(ctx: CanvasRenderingContext2D, wFactor: number, hFactor: number): void;
}

export const enum ColorSpace {
  LAB = "LAB",
  CAM02 = "CAM02",
}

export interface DisplayConfig {
  transform(inp: Vector3D, maxChroma: number): Vector3D;
  untransform(rep: Vector3D, maxChroma: number): Vector3D;
  toSrgb(rep: Vector3D): ColorResult<Vector3D>;
  fromSrgb(rgb: Vector3D): ColorResult<Vector3D>;
  
  fieldNames: [string, string, string];
}

export interface DisplayMap {
  [key: string]: DisplayConfig;
}

export class State {
  view: ColorSpace;
  rep: Vector3D;
  maxChroma: number;
}

export interface IStateUpdater {
  register(callback: (u: IStateUpdater) => void): void;
  sendUpdate(oldState: State): void;
  getUpdate(newState: State): void;
}

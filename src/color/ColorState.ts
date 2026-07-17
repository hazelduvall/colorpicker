import { Vector3D } from "ciebase-ts";

export interface Color<T> {
  space: T;
  inGamut: boolean;
  val: Vector3D;
}

export interface ColorState {
  rgb: Color<"RGB">;
  lab: Color<"LAB">;
  chroma: number;
}

export interface SetRgbAction {
  type: "SetRgbAction";
  rgb: Color<"RGB">;
}

export interface SetLabAction {
  type: "SetLabAction";
  lab: Color<"LAB">;
}

export interface SetChromaAction {
  type: "SetChromaAction";
  chroma: number;
}

export type Action = SetRgbAction | SetLabAction | SetChromaAction;

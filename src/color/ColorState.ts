import { Vector3D } from "ciebase-ts";

export interface Color<T> {
  space: T;
  inGamut: boolean;
  val: Vector3D;
}

export interface ColorState {
  rgb: Color<"rgb">;
  lab: Color<"lab">;
  chroma: number;
}

export interface SetRgbAction {
  type: "SetRgbAction";
  rgb: Color<"rgb">;
}

export interface SetLabAction {
  type: "SetLabAction";
  lab: Color<"lab">;
}

export interface SetChromaAction {
  type: "SetChromaAction";
  chroma: number;
}

export type Action = SetRgbAction | SetLabAction | SetChromaAction;
export type ActionType = Action["type"];

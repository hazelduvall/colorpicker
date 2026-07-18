export interface WorkerRequest {
  width: number;
  height: number;
  z: number;
  frame: number;
}

export type WorkerResponse = {
  data: Uint8ClampedArray;
  frame: number;
};

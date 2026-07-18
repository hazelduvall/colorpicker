export interface WorkerRequest {
  width: number;
  height: number;
  yBegin: number;
  yEnd: number;
  z: number;
}

export type WorkerResponse = Uint8ClampedArray;

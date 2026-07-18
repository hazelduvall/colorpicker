export interface WorkerRequest {
  width: number;
  height: number;
  yBegin: number;
  yEnd: number;
  z: number;
  nonce: number;
}

export type WorkerResponse = {
  data: Uint8ClampedArray;
  nonce: number;
};

export interface Pointer {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  centerX: number;
  centerY: number;
  from: number;
  to: number;
}

export interface Config {
  model: string;
  algorithm: string;
  confidence: number;
  iou: number;
  invoke: number;
  rotate: number;
  pointer: Pointer;
}

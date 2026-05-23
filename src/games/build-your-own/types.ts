export interface Element {
  id: string;
  name: string;
  emoji: string;
  tier: number; // 0=primordial … 6=cosmic
}

export interface CanvasItem {
  instanceId: string;
  elementId: string;
  x: number; // top-left x within canvas
  y: number; // top-left y within canvas
  anim: "idle" | "appearing" | "shaking";
}

export interface DragState {
  instanceId: string;
  ox: number; // pointer offset from item top-left X at drag start
  oy: number; // pointer offset from item top-left Y at drag start
}
import { type ReactFlowState, useStore } from '@xyflow/react';

const zoomSelector = (s: ReactFlowState) => s.panZoom?.getViewport().zoom;

export function useTextScale(maxScale: number) {
  const scale = 1 / (useStore(zoomSelector) || 1);

  return Math.max(Math.min(scale, maxScale), 1);
}

import { useStore } from '@/store';
import {
  Background,
  Controls,
  type Edge,
  type Node,
  type OnNodesChange,
  ReactFlow,
  type ReactFlowInstance,
  ReactFlowProvider,
  applyNodeChanges,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
// import Dagre from 'dagre-cluster-fix';
import { useCallback, useMemo, useState } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import ELK, {
  type LayoutOptions,
  type ElkExtendedEdge,
  type ElkNode,
} from 'elkjs/lib/elk.bundled.js';
import { ScheduleGraph } from './ScheduleGraph';

export function SchedulePage() {
  const nodes = useStore((s) => s.nodes);
  if (nodes.length === 0) {
    return 'no nodes';
  }

  return (
    <div style={{ height: '100%' }}>
      <ReactFlowProvider>
        <ScheduleGraph />
      </ReactFlowProvider>
    </div>
  );
}

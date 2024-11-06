import { useStore } from '@/store';
import {
  Background,
  Controls,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import { ScheduleNode } from './ScheduleNode';
import { SetNode } from './SetNode';
import { SystemNode } from './SystemNode';
import { useLayoutedElements } from './layout';

const NODE_TYPES = {
  schedule: ScheduleNode,
  set: SetNode,
  system: SystemNode,
};

export function ScheduleGraph() {
  const storeNodes = useStore((s) => s.nodes);
  const storeEdges = useStore((s) => s.edges);

  const [nodes, _setNodes, onNodesChange] = useNodesState(storeNodes);

  const [edges, _setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const { getLayoutedElements } = useLayoutedElements();
  return (
    <ReactFlow
      nodeTypes={NODE_TYPES}
      nodes={nodes}
      edges={edges}
      onInit={useCallback(
        (_: ReactFlowInstance<TScheduleNode, TScheduleEdge>) => {
          getLayoutedElements({
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
          });
        },
        [getLayoutedElements],
      )}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      colorMode="dark"
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

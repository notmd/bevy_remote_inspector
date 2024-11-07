import { useStore } from '@/store';
import {
  Background,
  Controls,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import { ScheduleNode } from './ScheduleNode';
import { SetNode } from './SetNode';
import { SystemNode } from './SystemNode';
import { useLayoutedElements } from './layout';
import { ScheduleFilterPanel } from './ScheduleFilterPanel';

const NODE_TYPES = {
  schedule: ScheduleNode,
  set: SetNode,
  system: SystemNode,
};

export function ScheduleGraph() {
  const storeNodes = useStore((s) => s.nodes);
  const storeEdges = useStore((s) => s.edges);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);

  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const { getLayoutedElements } = useLayoutedElements();
  const timeoutRef = useRef<any>(null);
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setNodes(storeNodes);
    setEdges(storeEdges);
    // wait the graph render to calculate node size before layouting
    timeoutRef.current = setTimeout(async () => {
      await getLayoutedElements({
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
      });
      clearTimeout(timeoutRef.current);
    }, 500);
    setTimeout(() => {
      fitView();
    }, 1000);
  }, [storeNodes, storeEdges, getLayoutedElements, fitView]);
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
      minZoom={0.1}
      fitView
      nodesConnectable={false}
    >
      <ScheduleFilterPanel />
      <Background />
      <Controls />
    </ReactFlow>
  );
}

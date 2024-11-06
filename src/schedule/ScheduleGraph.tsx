import { useStore } from '@/store';
import {
  Background,
  Controls,
  type Edge,
  type OnNodesChange,
  ReactFlow,
  type ReactFlowInstance,
  applyNodeChanges,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import ELK, { type LayoutOptions, type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ScheduleNode } from './ScheduleNode';
import { SetNode } from './SetNode';
import { SystemNode } from './SystemNode';

const NODE_TYPES = {
  schedule: ScheduleNode,
  set: SetNode,
  system: SystemNode,
};

export function ScheduleGraph() {
  const storeNodes = useStore((s) => s.nodes);
  const storeEdges = useStore((s) => s.edges);
  const [nodes, setNodes] = useState<TScheduleNode[]>(() => {
    return storeNodes;
  });
  const { fitView } = useReactFlow();
  const onNodesChange: OnNodesChange<TScheduleNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const { getLayoutedElements: getLayout2 } = useLayoutedElements();
  return (
    <ReactFlow
      nodeTypes={NODE_TYPES}
      nodes={nodes}
      edges={edges}
      onInit={useCallback(
        (r: ReactFlowInstance<TScheduleNode, TScheduleEdge>) => {
          getLayout2({
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
          });

          window.requestAnimationFrame(() => fitView());
        },
        [getLayout2],
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

const elk = new ELK();

const toElkNodes = (nodes: TScheduleNode[], options: LayoutOptions) => {
  const roots = nodes.filter((n) => !n.parentId);
  const map = new Map(nodes.map((n) => [n.id, n]));

  function recur(node: TScheduleNode): ElkNode {
    return {
      ...node,
      layoutOptions: options,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
      children: node.data.children.map((id) => {
        const child = map.get(id)!;
        return recur(child);
      }),
    };
  }

  return roots.map(recur);
};

const defaultOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow<TScheduleNode, Edge>();

  const getLayoutedElements = useCallback((options: LayoutOptions) => {
    const layoutOptions = { ...defaultOptions, ...options };
    const graph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: toElkNodes(getNodes(), options),
      edges: getEdges().map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    elk.layout(graph).then(({ children }) => {
      if (!children) {
        return;
      }

      const nodes: TScheduleNode[] = [];

      function recur(child: ElkNode) {
        nodes.push({
          ...(child as TScheduleNode),
          position: { x: child.x ?? 0, y: child.y ?? 0 },
        });
        if (!child.children) {
          return;
        }
        child.children.forEach(recur);
      }

      children.forEach(recur);
      setNodes(nodes);

      window.requestAnimationFrame(() => {
        fitView();
      });
    });
  }, []);

  return { getLayoutedElements };
};

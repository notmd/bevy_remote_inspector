import { useStore } from '@/store';
import {
  Background,
  Controls,
  type Edge,
  type Node,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { useCallback, useMemo, useState } from 'react';
import type { ScheduleNode } from './createSchedulesSlice';

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

function ScheduleGraph() {
  const storeNodes = useStore((s) => s.nodes);
  const storeEdges = useStore((s) => s.edges);
  // const
  const [nodes, setNodes] = useState<ScheduleNode[]>(() => {
    return storeNodes;
  });
  const { fitView } = useReactFlow();
  const onNodesChange: OnNodesChange<ScheduleNode> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onInit={(r) => {
        console.log('init', r.getNodes());
        const { edges, nodes } = getLayoutedElements(r.getNodes(), r.getEdges(), {
          direction: 'TB',
        });
        setNodes(nodes);
        // setEdges(edges);
        window.requestAnimationFrame(() => fitView());
      }}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      colorMode="dark"
      fitView
    >
      <Background />
      <Controls className="text-primary-foreground" />
    </ReactFlow>
  );
}

const getLayoutedElements = (nodes: ScheduleNode[], edges: Edge[], options: any) => {
  const g = new Dagre.graphlib.Graph({
    compound: true,
    directed: false,
    multigraph: true,
  }).setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', compound: true, nodesep: 10, ranksep: 10, edgesep: 10 });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.width ?? 0,
    });
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  });

  console.log('edges', edges);
  edges.forEach((edge) => g.setEdge(edge.source, edge.target, ''));

  console.log('g', g);

  Dagre.layout(g);

  const positionedNodes = nodes.map((node) => {
    const position = g.node(node.id);
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    if (node.parentId) {
      const parentNode = g.node(node.parentId);
      node.position = {
        // x: position.x - (parentNode.x - parentNode.width / 2) - (node.width ?? 0) / 2,
        // y: position.y - (parentNode.y - parentNode.height / 2) - (node.height ?? 0) / 2,
        x: position.x - position.width / 2,
        y: position.y - position.height / 2,
      };
    } else {
      node.position = {
        x: position.x - position.width / 2,
        y: position.y - position.width / 2,
      };
    }

    if (node.data.children.length > 0) {
      node.style = {
        width: position.width,
        height: position.height,
      };
    }

    return {
      ...node,
      className: 'break-all',
      data: {
        ...node.data,
        label: `${node.data.label} ${node.position.x} ${node.position.y}`,
      },
    };
  });

  console.log('positionedNodes', positionedNodes);

  return {
    nodes: positionedNodes,
    edges,
  };
};

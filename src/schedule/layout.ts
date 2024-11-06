import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import ELK, { type LayoutOptions, type ElkNode } from 'elkjs/lib/elk.bundled.js';

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

export const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow<TScheduleNode, TScheduleEdge>();

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

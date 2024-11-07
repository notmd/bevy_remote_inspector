import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import type { TScheduleEdge, TScheduleNode } from './createSchedulesSlice';
import ELK, { type LayoutOptions, type ElkNode } from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const toElkNodes = (nodes: TScheduleNode[], edges: TScheduleEdge[], options: LayoutOptions) => {
  const roots = nodes.filter((n) => !n.parentId);
  const map = new Map(nodes.map((n) => [n.id, n]));

  function recur(node: TScheduleNode): ElkNode {
    const children = node.data.children.map((id) => {
      const child = map.get(id)!;
      return recur(child);
    });

    return {
      ...node,
      layoutOptions: options,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
      edges: edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          return {
            id: e.id,
            sources: [e.source],
            targets: [e.target],
          };
        }),
      children: children.length > 0 ? children : undefined,
    };
  }

  return roots.map(recur);
};

const defaultOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '50',
  'elk.spacing.nodeNode': '20',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
};

export const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges } = useReactFlow<TScheduleNode, TScheduleEdge>();

  const calculateLayoutedElements = useCallback(async (options: LayoutOptions) => {
    const layoutOptions = { ...defaultOptions, ...options };
    const edges = getEdges();
    const graph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: toElkNodes(getNodes(), edges, layoutOptions),
      edges: edges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    const node = await elk.layout(graph);
    const { children } = node;
    if (!children) {
      return;
    }

    const nodes: TScheduleNode[] = [];

    function recur(child: ElkNode) {
      nodes.push({
        ...(child as TScheduleNode),
        height: (child.height ?? 0) + ((child.children?.length ?? 0) > 0 ? 20 : 0),
        position: { x: child.x ?? 0, y: (child.y ?? 0) + 20 },
      });
      if (!child.children) {
        return;
      }
      child.children.forEach(recur);
    }

    children.forEach(recur);
    setNodes(nodes);

    // window.requestAnimationFrame(async () => {
    //   await fitView({});
    // });
  }, []);

  return { getLayoutedElements: calculateLayoutedElements };
};

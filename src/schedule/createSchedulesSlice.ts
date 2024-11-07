import { prettyTypeName } from '@/type-registry/prettyTypeName';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { persist } from 'zustand/middleware';

export type ScheduleSlice = {
  schedules: Map<string, ScheduleInfo>;
  nodes: TScheduleNode[];
  edges: Edge[];
  selectedSchedules: string[] | null;
  setSchedules: (schedules: any[]) => void;
  computeGraph: () => void;
};

export type TScheduleNode = Node<{
  children: string[];
  label: string;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
}>;

export type TScheduleEdge = Edge;

export const createScheduleSlice = persist<
  ScheduleSlice,
  [],
  [],
  Pick<ScheduleSlice, 'selectedSchedules'>
>(
  (set, get) => ({
    schedules: new Map(),
    nodes: [],
    edges: [],
    selectedSchedules: null,
    setSchedules: (schedules: ScheduleInfo[]) => {
      set({ schedules: new Map(schedules.map((s, i) => [`${s.name}-${i}`, s])) });
      get().computeGraph();
    },

    computeGraph() {
      const nodes = new Map<string, TScheduleNode>();
      const nodeSet = new Set<string>();
      const edges: TScheduleEdge[] = [];
      const selectedSchedules = get().selectedSchedules;
      let previousScheduleId = null;
      for (const [idx, schedule] of Array.from(get().schedules.values()).entries()) {
        // if (
        //   // schedule.name !== 'PreStartup' &&
        //   // schedule.name !== 'Startup' &&
        //   // schedule.name !== 'PreUpdate'
        //   schedule.name !== 'StateTransition'
        //   // schedule.name !== 'PostUpdate'
        // )
        //   continue;
        const scheduleId = `${schedule.name}-${idx}`;

        if (selectedSchedules && !selectedSchedules.includes(scheduleId)) {
          continue;
        }

        if (previousScheduleId) {
          edges.push({
            id: `${previousScheduleId}-${schedule.name}`,
            source: previousScheduleId,
            target: `${schedule.name}-${idx}`,
          });
        }
        previousScheduleId = scheduleId;

        nodes.set(scheduleId, {
          id: scheduleId,
          data: {
            children: schedule.hierarchies
              // only direct children (systems and sets that has no parent)
              .filter((n) => n[2].length === 0)
              .map((n) => getNodeId(n[0])),
            label: schedule.name,
          },
          type: 'schedule',
          position: { x: 0, y: 0 },
        });

        const hierarchyMap = new Map<
          string,
          {
            children: string[];
            parents: string[];
          }
        >(
          schedule.hierarchies.map((n, _) => {
            return [
              n[0],
              {
                children: n[1],
                parents: n[2],
              },
            ];
          }),
        );

        function getNodeId(id: string) {
          return `${scheduleId}-${id}`;
        }

        function collectNode(id: string) {
          const nodeId = getNodeId(id);
          if (nodeSet.has(nodeId)) {
            return;
          }
          nodeSet.add(nodeId);
          const hierarchy = hierarchyMap.get(id) ?? { parents: [], children: [] };

          const parent = hierarchy.parents[0]; // TODO handle multiple parents (need to find lowest common ancestor)
          if (hierarchy.parents.length > 1) {
            console.warn(`Multiple parents`, hierarchy.parents, scheduleId, id);
          }
          const name = id.startsWith('Set')
            ? schedule.sets.find((s) => s.id === id)?.name!
            : schedule.systems.find((s) => s.id === id)?.name!;

          const node: TScheduleNode = {
            id: getNodeId(id),
            position: { x: 0, y: 0 },
            data: {
              label: prettyTypeName(name),
              children: hierarchy.children.map((n) => `${scheduleId}-${n}`),
            },
            type: id.startsWith('Set') ? 'set' : 'system',
            parentId: parent ? `${scheduleId}-${parent}` : scheduleId,
            draggable: !parent, // only drag root nodes
            extent: 'parent',
          };

          nodes.set(node.id, node);
        }

        // collect in hierarchy first, so parent nodes are created first
        for (const id of hierarchyMap.keys()) {
          collectNode(id);
        }

        // some node might not be in hierarchy
        for (const system of schedule.systems) {
          collectNode(system.id);
        }

        for (const set of schedule.sets) {
          collectNode(set.id);
        }

        for (const [source, target] of schedule.dependencies) {
          const sourceId = getNodeId(source);
          const targetId = getNodeId(target);
          if (!nodeSet.has(sourceId) || !nodeSet.has(targetId)) {
            continue;
          }
          const sourceNode = nodes.get(sourceId)!;
          sourceNode.data.showSourceHandle = true;
          const targetNode = nodes.get(targetId)!;
          targetNode.data.showTargetHandle = true;
          edges.push({
            id: `${scheduleId}-${source}-${target}`,
            source: sourceId,
            target: targetId,
            markerEnd: {
              type: MarkerType.Arrow,
            },
            style: {
              strokeWidth: 2,
              // stroke: '#FF0072',
            },
          });
        }
      }

      // console.log('nodes', nodes);
      // console.log('edges', edges);

      set({ nodes: Array.from(nodes.values()), edges });
    },
  }),
  {
    name: 'schedule',
    partialize: (state) => ({ selectedSchedules: state.selectedSchedules }),
  },
);

export type ScheduleInfo = {
  name: string;
  systems: Array<SystemInfo>;
  sets: Array<SetInfo>;
  hierarchies: Array<[string, string[], string[]]>;
  dependencies: Array<[string, string]>;
};

export type SystemInfo = {
  id: string;
  name: string;
};

export type SetInfo = {
  id: string;
  name: string;
};

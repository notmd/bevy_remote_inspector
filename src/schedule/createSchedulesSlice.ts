import type { CreateSlice } from '@/store';
import type { Edge, Node } from '@xyflow/react';

export type ScheduleSlice = {
  schedules: any[];
  nodes: TScheduleNode[];
  edges: Edge[];
  setSchedules: (schedules: any[]) => void;
};

export type TScheduleNode = Node<{
  children: string[];
  label: string;
}>;

export type TScheduleEdge = Edge;

export const createScheduleSlice: CreateSlice<ScheduleSlice> = (set) => ({
  schedules: [],
  nodes: [],
  edges: [],
  setSchedules: (schedules: ScheduleInfo[]) => {
    const nodes: TScheduleNode[] = [];
    const nodeSet = new Set<string>();
    const edges: TScheduleEdge[] = [];
    let previousScheduleId = null;
    for (const [idx, schedule] of schedules.entries()) {
      console.log(schedule.name);
      if (
        // schedule.name !== 'PreStartup' &&
        // schedule.name !== 'Startup' &&
        schedule.name !== 'PreUpdate'
      )
        continue;
      console.log(schedule);
      const scheduleId = `${schedule.name}-${idx}`;
      if (previousScheduleId) {
        edges.push({
          id: `${previousScheduleId}-${schedule.name}`,
          source: previousScheduleId,
          target: `${schedule.name}-${idx}`,
        });
      }
      previousScheduleId = scheduleId;

      nodes.push({
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

        // TODO port pretty-type-name and use it here
        const split = name.split('::');
        const node: TScheduleNode = {
          id: getNodeId(id),
          position: { x: 0, y: 0 },
          data: {
            label: `${split[split.length - 1]}`,
            children: hierarchy.children.map((n) => `${scheduleId}-${n}`),
          },
          type: id.startsWith('Set') ? 'set' : 'system',
          parentId: parent ? `${scheduleId}-${parent}` : scheduleId,
          extent: 'parent',
        };

        nodes.push(node);
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
        edges.push({
          id: `${scheduleId}-${source}-${target}`,
          source: sourceId,
          target: targetId,
        });
      }
    }

    // console.log('nodes', nodes);
    // console.log('edges', edges);

    set({ schedules, nodes, edges });
  },
});

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

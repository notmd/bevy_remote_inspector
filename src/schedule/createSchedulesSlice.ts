import type { CreateSlice } from '@/store';
import type { Edge, Node } from '@xyflow/react';

export type ScheduleSlice = {
  schedules: any[];
  nodes: ScheduleNode[];
  edges: Edge[];
  setSchedules: (schedules: any[]) => void;
};

export type ScheduleNode = Node<{
  children: string[];
  label: string;
}>;

export const createScheduleSlice: CreateSlice<ScheduleSlice> = (set) => ({
  schedules: [],
  nodes: [],
  edges: [],
  setSchedules: (schedules: ScheduleInfo[]) => {
    const nodes: ScheduleNode[] = [];
    const edges: Edge[] = [];
    for (const [idx, schedule] of schedules.entries()) {
      if (schedule.name !== 'Update') {
        continue;
      }
      console.log(schedule);
      const scheduleId = `${schedule.name}-${idx}`;
      nodes.push({
        id: scheduleId,
        data: {
          children: schedule.hierarchy_nodes.map((n) => n[0]),
          label: schedule.name,
        },
        type: 'group',
        position: { x: 0, y: 0 },
      });

      const hierarchyMap = new Map<string, [string[], string[]]>(
        schedule.hierarchy_nodes.map((n, i) => {
          return [n[0], [n[1], n[2]]];
        }),
      );

      for (const [id, v] of hierarchyMap.entries()) {
        const parent = v[1][0];
        const name = id.startsWith('Set')
          ? schedule.sets.find((s) => s.id === id)?.name!
          : schedule.systems.find((s) => s.id === id)?.name!;
        const split = name.split('::');

        const node: ScheduleNode = {
          id: `${scheduleId}-${id}`,
          position: { x: 0, y: 0 },
          data: {
            label: split[split.length - 1],
            children: v[0],
          },
          type: id.startsWith('Set') ? 'group' : 'default',
          parentId: parent ? `${scheduleId}-${parent}` : scheduleId,
          extent: 'parent',
        };
        nodes.push(node);
      }

      const dependencyMap = new Map<string, [string[], string[]]>(
        schedule.dependancy_nodes.map((n, i) => [n[0], [n[1], n[2]]]),
      );

      for (const [source, v] of dependencyMap.entries()) {
        for (const target of v[0]) {
          // target actually depends on source, but we want to draw the arrow from source to target
          edges.push({
            id: `${scheduleId}-${source}-${target}`,
            source: `${scheduleId}-${source}`,
            target: `${scheduleId}-${target}`,
            data: {
              label: 'qweqw',
            },
          });
        }
      }
    }

    console.log(
      edges.map((e) => `${e.source}__${e.target}`),
      nodes.map((n) => n.id),
    );
    set({ schedules, nodes, edges });
  },
});

export type ScheduleInfo = {
  name: string;
  systems: Array<SystemInfo>;
  sets: Array<SetInfo>;
  hierarchy_nodes: Array<[string, string[], string[]]>;
  hierarchy_edges: Array<[string, string]>;
  dependancy_nodes: Array<[string, string[], string[]]>;
  dependancy_edges: Array<[string, string]>;
};

export type SystemInfo = {
  id: string;
  name: string;
};

export type SetInfo = {
  id: string;
  name: string;
};

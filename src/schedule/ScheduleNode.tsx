import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';

export function ScheduleNode({ data, width, height }: NodeProps<TScheduleNode>) {
  return (
    <BaseNode
      //   className="bg-red-500"
      style={{
        width,
        height,
      }}
    >
      <>
        {data.label}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </>
    </BaseNode>
  );
}

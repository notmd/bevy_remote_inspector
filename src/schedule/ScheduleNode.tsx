import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';
import { useTextScale } from './useTextScale';

export function ScheduleNode({ data, width, height }: NodeProps<TScheduleNode>) {
  const scale = useTextScale(4);
  return (
    <BaseNode
      className="border-2 border-red-500 p-0"
      style={{
        minWidth: width,
        minHeight: height,
      }}
    >
      <>
        <span
          className="block text-center text-lg"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {data.label}
        </span>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </>
    </BaseNode>
  );
}

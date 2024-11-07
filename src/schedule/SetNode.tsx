import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';
import { useTextScale } from './useTextScale';

export function SetNode({ data, width, height }: NodeProps<TScheduleNode>) {
  const scale = useTextScale(2);
  return (
    <BaseNode
      className="border-2 border-green-500 p-2"
      style={{
        minWidth: width,
        minHeight: height,
      }}
    >
      <>
        <span
          className="block text-center"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {data.label}
        </span>
        {data.showTargetHandle && <Handle type="target" position={Position.Top} />}
        {data.showSourceHandle && <Handle type="source" position={Position.Bottom} />}
      </>
    </BaseNode>
  );
}

import { cn } from '@/utils';
import { SelectHTMLAttributes } from 'react';

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function NativeSelect(props: NativeSelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'bg-background flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        props.className
      )}
    ></select>
  );
}

import { Button } from '@/shared/ui/button';
import { Popover, PopoverDialog, PopoverTrigger } from '@/shared/ui/popover';
import { SelectItem, SelectListBox } from '@/shared/ui/select';
import { useStore } from '@/store';
import { Panel } from '@xyflow/react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import type { ListBoxProps } from 'react-aria-components';
import { useShallow } from 'zustand/react/shallow';

export const ScheduleFilterPanel = memo(function ScheduleFilterPanel() {
  const schedules = useStore((s) => s.schedules);
  const items = useMemo(() => {
    return Array.from(schedules.entries()).map(([id, schedule]) => ({
      id,
      label: schedule.name,
    }));
  }, [schedules]);
  const selectedSchedules = useStore(
    useShallow((s) => new Set(s.selectedSchedules ?? Array.from(s.schedules.keys()))),
  );
  const onSelectionChange: ListBoxProps<{ id: string; item: string }>['onSelectionChange'] =
    useCallback((value: any) => {
      console.log('onSelectionChange');
      const selectedSchedules = value === 'all' ? null : (Array.from(value.keys()) as string[]);
      useStore.setState({ selectedSchedules: selectedSchedules });
      useStore.getState().computeGraph();
    }, []);
  return (
    <Panel className="flex items-center gap-x-2">
      {/* <Select onSelectionChange={onSelectionChange}> */}
      <PopoverTrigger>
        <Button
          variant="outline"
          className={clsx(
            'flex h-10 w-full items-center justify-between gap-x-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            /* Disabled */
            'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
            /* Focused */
            'data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2',
            /* Resets */
            'focus-visible:outline-none',
          )}
        >
          Schedules
          <ChevronDown aria-hidden="true" className="size-4 opacity-50" />
        </Button>
        <Popover>
          <PopoverDialog className="w-auto">
            <SelectListBox
              selectedKeys={selectedSchedules}
              onSelectionChange={onSelectionChange}
              items={items}
              selectionMode="multiple"
            >
              {renderItem}
            </SelectListBox>
          </PopoverDialog>
        </Popover>
      </PopoverTrigger>
    </Panel>
  );
});

function renderItem(item: { id: string; label: string }) {
  return <SelectItem id={item.id}>{item.label}</SelectItem>;
}

import type { ElementType } from 'react';
import { Tooltip, TooltipTrigger } from '../shared/ui/tooltip';
import { CalendarRange, TableProperties } from 'lucide-react';
import clsx from 'clsx';
import { Button } from 'react-aria-components';
import type { Page } from '@/page/createPageSlice';
import { useStore } from '@/store';

export function SideBar() {
  return (
    <div className="flex w-14 flex-col items-center gap-y-1 border-muted border-r bg-background">
      <SideBarItem icon={TableProperties} label="Inspector" name="inspector" />
      {/* <SideBarItem icon={ComponentIcon} label="Components" name="component" /> */}
      <SideBarItem icon={CalendarRange} label="Schedules" name="schedule" />
      {/* <SideBarItem icon={Inspect} label="UI" name="ui" /> */}
    </div>
  );
}

function SideBarItem({
  icon: Icon,
  label,
  name,
}: {
  icon: ElementType<any>;
  label: string;
  name: Page;
}) {
  const currentPage = useStore((state) => state.currentPage);

  const isActive = currentPage === name;
  const handleClick = () => {
    useStore.setState({ currentPage: name });
  };
  return (
    <TooltipTrigger>
      <Button
        onPress={handleClick}
        className={clsx(
          'flex w-full items-center justify-center py-3 transition-colors hover:text-foreground',
          {
            'bg-muted text-accent-foreground': isActive,
            'text-muted-foreground hover:bg-muted': !isActive,
          },
        )}
      >
        <Icon className="h-5 w-5" />
      </Button>
      <Tooltip placement="right">{label}</Tooltip>
    </TooltipTrigger>
  );
}

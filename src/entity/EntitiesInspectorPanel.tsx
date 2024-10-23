import { ComponentId, useComponentInfo } from '@/component/useComponents';
import {
  EntityId,
  useEntityComponentIds,
  useEntityComponentValue,
} from '@/entity/useEntity';
import { DynamicForm } from '@/inputs/DynamicForm';
import { Button, IconButton } from '@/shared/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { useStore } from '@/store';
import clsx from 'clsx';
import { ChevronRight, Copy, Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useUpdateEntityComponent } from './useUpdateEntityComponent';
import { memo } from 'react';
import { useTypeRegistry } from '@/type-registry/useTypeRegistry';
import { toast } from '@/hooks/use-toast';
import { bevyTypes } from '@/type-registry/types';

export const EntitiesInspectorPanel = memo(function EntitiesInspectorPanel() {
  const inspectingEntity = useStore((state) => state.inspectingEntity);

  return (
    <div className="flex h-full w-full flex-col pt-4">
      <div className="px-4 text-lg font-bold">Inspector</div>
      {inspectingEntity ? (
        <InspectorComponentList entity={inspectingEntity} />
      ) : (
        <div className="px-4 py-2">Select an entity to inspect</div>
      )}
    </div>
  );
});

function InspectorComponentList({ entity }: { entity: EntityId }) {
  const componentIds = useEntityComponentIds(entity);

  if (!componentIds) {
    return `No components`;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden items-center">
      <ScrollArea style={{ height: 'auto', width: '100%' }} className="gap-y-4">
        {componentIds.map((id) => (
          <InspectorComponent entityId={entity} key={id} componentId={id} />
        ))}
      </ScrollArea>
      <div className="py-2">
        <Button size="sm" className="max-w-48">
          <Plus></Plus>
          <span>Add new components</span>
        </Button>
      </div>
    </div>
  );
}

const DEFAULT_HIDDEN_COMPONENTS = [bevyTypes.TEXT_LAYOUT_INFO];
const READ_ONLY_COMPONENTS = [
  bevyTypes.TEXT_LAYOUT_INFO,
  bevyTypes.COMPUTED_NODE,
  bevyTypes.GLOBAL_TRANSFORM,
];

function InspectorComponent({
  componentId,
  entityId,
}: {
  componentId: ComponentId;
  entityId: EntityId;
}) {
  const value = useEntityComponentValue(entityId, componentId);
  const { name, short_name } = useStore((state) => state.getComponentName)(
    componentId
  );
  const [open, setOpen] = useState(
    !DEFAULT_HIDDEN_COMPONENTS.includes(name || '')
  );
  const info = useComponentInfo(componentId)!;
  const updateEntityComponent = useUpdateEntityComponent(entityId, componentId);

  const registry = useTypeRegistry();

  let children: ReactNode = null;
  if (value === undefined) {
    const typeInfo = registry.get(info.name);
    const message =
      typeInfo === undefined
        ? 'is not registered in type registry'
        : 'is not serializable';
    children = (
      <div>
        Component {name} is {message}
      </div>
    );
  } else {
    children = (
      <DynamicForm
        typeName={info.name}
        value={value}
        readOnly={READ_ONLY_COMPONENTS.includes(name || '')}
        onChange={updateEntityComponent}
      ></DynamicForm>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <CollapsibleTrigger
          asChild
          className="px-4 py-2 w-full flex flex-wrap justify-start"
        >
          <Button
            size="default"
            variant="ghost"
            className="w-full flex-wrap justify-start py-1 gap-x-2 px-2 text-base rounded-none bg-transparent"
          >
            <ChevronRight
              className={clsx('size-5', {
                'transform rotate-90': open,
              })}
            />
            <div className="text-wrap overflow-hidden break-all">
              {short_name}
            </div>
          </Button>
        </CollapsibleTrigger>
        <IconButton
          icon={<Copy className="size-4" />}
          className="px-2"
          onClick={() => {
            navigator.clipboard.writeText(name || '');
            toast({
              description: `Copied component name to clipboard`,
            });
          }}
        ></IconButton>
      </div>
      <CollapsibleContent className="px-4 bg-muted py-2 overflow-hidden w-full">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
mod command;
mod component;
mod entity;
mod schedule;
mod type_registry;

use bevy::{
    app::PluginGroupBuilder,
    ecs::{component::ComponentId, entity::EntityHashMap},
    prelude::*,
    remote::{error_codes, BrpError, BrpResult},
    utils::{HashMap, HashSet},
};
use bevy_remote_stream::{
    websocket::RemoteStreamWebSocketPlugin, OnDataHandlerInput, RemoteStreamHandlers,
    RemoteStreamPlugin, StreamClientId, StreamHandlerInputRef, StreamMethods,
};
use command::Command;
use component::InspectorComponentInfo;
use entity::EntityMutation;
use schedule::{ScheduleInfo, SchedulesPlugin};
use serde::Serialize;
use serde_json::Value;
use type_registry::ZeroSizedTypes;
pub mod stream {
    pub use bevy_remote_stream::*;
}

pub struct RemoteInspectorPlugin;

impl Plugin for RemoteInspectorPlugin {
    fn build(&self, app: &mut App) {
        let update = app.main_mut().world_mut().register_system(stream);
        let on_connect = app.main_mut().world_mut().register_system(on_connect);
        let on_disconnect = app.main_mut().world_mut().register_system(on_disconnect);
        let on_data = app.main_mut().world_mut().register_system(on_data);
        app.world_mut().resource_mut::<StreamMethods>().insert(
            "inspector/stream",
            RemoteStreamHandlers {
                update,
                on_disconnect: Some(on_disconnect),
                on_connect: Some(on_connect),
                on_data: Some(on_data),
            },
        );
        let mut deep_compare_components = DeepCompareComponents::default();

        #[cfg(feature = "bevy_render")]
        {
            let id = app
                .world_mut()
                .register_component::<bevy::render::view::ViewVisibility>(); // this component changed every frame and very cheep to compare
            deep_compare_components.ids.insert(id);
        }

        app.add_plugins(SchedulesPlugin)
            .init_resource::<TrackedDatas>()
            .init_resource::<DisabledComponents>()
            .init_resource::<EntityVisibilities>()
            .insert_resource(deep_compare_components);
    }
}

pub struct RemoteInspectorPlugins;

impl PluginGroup for RemoteInspectorPlugins {
    fn build(self) -> PluginGroupBuilder {
        PluginGroupBuilder::start::<Self>()
            .add(RemoteStreamPlugin::default())
            .add(RemoteStreamWebSocketPlugin::default())
            .add(RemoteInspectorPlugin)
    }
}

fn stream(
    InRef(input): StreamHandlerInputRef,
    world: &mut World,
    mut events: Local<Vec<InspectorEvent>>,
    mut zsts: Local<ZeroSizedTypes>,
) -> Option<BrpResult> {
    world.resource_scope(|world, mut tracked: Mut<TrackedDatas>| {
        InspectorContext::run(world, |ctx, world| {
            world.resource_scope(|world, type_registry: Mut<AppTypeRegistry>| {
                let type_registry = type_registry.read();
                let tracked = tracked.entry(input.client_id).or_default();
                tracked.track_type_registry(&mut events, &mut zsts, &type_registry);
                tracked.track_schedules(&mut events, world, &type_registry);
                // let new_tables = world
                //     .archetypes()
                //     .iter()
                //     .filter(|archetype| !tracked.tables.contains(&archetype.table_id().as_usize()))
                //     .map(|archetype| archetype.table_id().as_usize())
                //     .collect::<Vec<_>>();

                // if !new_tables.is_empty() {
                //     tracked.tables.extend_from_slice(new_tables.as_slice());
                //     events.push(StreamEvent::NewTables { tables: new_tables });
                // }

                tracked.track_components(&mut events, world, &type_registry);
                tracked.track_entities(&mut events, world, &type_registry, ctx, &zsts);
            });
        });
    });

    if events.is_empty() {
        return None;
    }

    let serialized = serde_json::to_value(&*events).unwrap();

    events.clear();

    Some(BrpResult::Ok(serialized))
}

fn on_data(In((_, req)): OnDataHandlerInput, world: &mut World) -> Option<BrpResult> {
    let command = match Command::try_from_brp(req) {
        Ok(r) => r,
        Err(e) => {
            return Some(BrpResult::Err(BrpError {
                code: error_codes::INVALID_REQUEST,
                message: e.to_string(),
                data: None,
            }))
        }
    };

    trace!("New request: {:?}", command);

    InspectorContext::run(world, |ctx, world| {
        let result = command.execute(ctx, world);

        let result: Option<BrpResult> = match result {
            Ok(val) => Some(BrpResult::Ok(val)),
            Err(e) => Some(BrpResult::Err(BrpError {
                code: error_codes::INTERNAL_ERROR,
                message: e.to_string(),
                data: None,
            })),
        };

        result
    })
}

fn on_disconnect(InRef(input): StreamHandlerInputRef, mut tracked: ResMut<TrackedDatas>) {
    tracked.remove(&input.client_id);
    debug!("Client {:?} disconnected", input.client_id);
}

fn on_connect(InRef(input): StreamHandlerInputRef) -> Option<BrpResult> {
    debug!("Client {:?} connected", input.client_id);
    None
}

#[derive(Default)]
struct TrackedData {
    type_registry: bool,
    components: HashSet<ComponentId>,
    entities: EntityHashMap<HashSet<ComponentId>>,
    schedules: bool,
    // resources: HashSet<ComponentId>,
    // tables: Vec<usize>,
}

#[derive(Resource, Default, Deref, DerefMut)]
struct TrackedDatas(HashMap<StreamClientId, TrackedData>);

#[derive(Serialize)]
#[serde(rename_all(serialize = "snake_case"))]
#[serde(tag = "kind")]
enum InspectorEvent {
    TypeRegistry {
        types: Vec<Value>,
    },
    Component {
        components: Vec<InspectorComponentInfo>,
    },
    Entity {
        entity: Entity,
        mutation: EntityMutation,
    },
    Schedules {
        schedules: Vec<ScheduleInfo>,
    },
    // NewTables {
    //     tables: Vec<usize>,
    // },
}

#[derive(Resource, Default, DerefMut, Deref)]
struct DisabledComponents(EntityHashMap<HashMap<ComponentId, Box<dyn PartialReflect>>>);
#[derive(Resource, Default, Deref, DerefMut)]
struct EntityVisibilities(EntityHashMap<Visibility>);

#[derive(Resource, Default)]
struct DeepCompareComponents {
    ids: HashSet<ComponentId>,
    values: HashMap<Entity, HashMap<ComponentId, Value>>,
}

impl DeepCompareComponents {
    /// Compare the component with the previous value and return None if the component should not be deep compared
    fn is_eq(
        &mut self,
        entity: Entity,
        component_id: ComponentId,
        new_value: &Value,
    ) -> Option<bool> {
        if !self.ids.contains(&component_id) {
            return None;
        }
        let entry = self.values.entry(entity).or_default();

        let old_value = entry.get(&component_id);
        if let Some(old_value) = old_value {
            if old_value == new_value {
                return Some(true);
            }
        }

        entry.insert(component_id, new_value.clone());

        return Some(false);
    }
}

struct InspectorContext<'a> {
    disabled_components: &'a mut DisabledComponents,
    entity_visibilities: &'a mut EntityVisibilities,
    deep_compare_components: &'a mut DeepCompareComponents,
}

impl<'a> InspectorContext<'a> {
    fn run<T>(world: &mut World, f: impl FnOnce(&mut InspectorContext, &mut World) -> T) -> T {
        world.resource_scope(|world, mut disabled_components: Mut<DisabledComponents>| {
            world.resource_scope(|world, mut entity_visibilities: Mut<EntityVisibilities>| {
                world.resource_scope(
                    |mut world, mut deep_compare_components: Mut<DeepCompareComponents>| {
                        let mut ctx = InspectorContext {
                            disabled_components: &mut disabled_components,
                            entity_visibilities: &mut entity_visibilities,
                            deep_compare_components: &mut deep_compare_components,
                        };

                        f(&mut ctx, &mut world)
                    },
                )
            })
        })
    }

    fn on_entity_removed(&mut self, entity: Entity) {
        self.disabled_components.remove(&entity);
        self.entity_visibilities.remove(&entity);
        self.deep_compare_components.values.remove(&entity);
    }
}

use std::any::{type_name_of_val, Any, TypeId};

use bevy::{
    animation::graph,
    app::{DynEq, FixedMainScheduleOrder, MainScheduleOrder},
    ecs::{
        intern::Interned,
        schedule::{InternedScheduleLabel, NodeId, ScheduleLabel},
        system,
    },
    prelude::*,
    reflect::TypeRegistry,
    ui::update,
    utils::{dbg, HashSet},
};
use indexmap::IndexMap;
use serde::Serialize;

use crate::{InspectorEvent, TrackedData};

pub struct SchedulesPlugin;

impl Plugin for SchedulesPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<UpdateSchedule>()
            .add_systems(PostUpdate, collect_update_schedule);
    }

    fn finish(&self, app: &mut App) {
        // `MainScheduleOrder` is not present in the world during run, so we have to clone it
        clone_main_schedule_order(&mut app.world_mut());
    }
}

#[derive(Resource, Default)]
struct UpdateSchedule {
    initialized: bool,
    info: ScheduleInfo,
}

#[derive(Resource)]
struct ClonedMainScheduleOrder {
    startup_labels: Vec<InternedScheduleLabel>,
    labels: Vec<InternedScheduleLabel>,
}

fn collect_update_schedule(mut update_schedule: ResMut<UpdateSchedule>, schedules: Res<Schedules>) {
    if update_schedule.initialized {
        return;
    }

    update_schedule.initialized = true;

    let schedule = schedules.get(Update);

    if let Some(sche) = schedule {
        update_schedule.info = ScheduleInfo::from_schedule(sche);
    }
}

fn clone_main_schedule_order(world: &mut World) {
    let main_schedule_order = world.resource::<MainScheduleOrder>();
    let my_main_schedule_order = ClonedMainScheduleOrder {
        startup_labels: main_schedule_order.startup_labels.clone(),
        labels: main_schedule_order.labels.clone(),
    };

    world.insert_resource(my_main_schedule_order);
}

#[derive(Serialize, Clone)]
pub struct SystemInfo {
    id: String,
    name: String,
}

#[derive(Serialize, Clone)]
pub struct SetInfo {
    id: String,
    name: String,
}

#[derive(Serialize, Default, Clone)]
pub struct ScheduleInfo {
    name: String,
    systems: Vec<SystemInfo>,
    sets: Vec<SetInfo>,
    hierarchy_nodes: Vec<(String, Vec<String>, Vec<String>)>,
    hierarchy_edges: Vec<(String, String)>,
    dependancy_nodes: Vec<(String, Vec<String>, Vec<String>)>,
    dependancy_edges: Vec<(String, String)>,
}

impl ScheduleInfo {
    pub fn from_schedule(schedule: &Schedule) -> Self {
        let systems = schedule
            .systems()
            .unwrap()
            .map(|(id, sys)| SystemInfo {
                id: get_node_id(&id),
                name: sys.name().to_string(),
            })
            .collect();
        let g = schedule.graph();
        let sets = g
            .system_sets()
            .filter_map(|(id, name, _)| {
                if name.system_type().is_some() {
                    return None;
                }

                Some(SetInfo {
                    id: get_node_id(&id),
                    name: format!("{:?}", name),
                })
            })
            .collect();

        let hierarchy_nodes = g
            .hierarchy()
            .cached_topsort()
            .iter()
            .filter_map(|n| {
                if let Some(set) = g.get_set_at(*n) {
                    if set.system_type().is_some() {
                        return None;
                    }
                }

                let outgoing_neighbors = g
                    .hierarchy()
                    .graph()
                    .neighbors_directed(*n, petgraph::Direction::Outgoing)
                    .filter_map(|n| {
                        if let Some(set) = g.get_set_at(n) {
                            if set.system_type().is_some() {
                                return None;
                            }
                        }

                        Some(get_node_id(&n))
                    })
                    .collect::<Vec<_>>();

                let incoming_neighbors = g
                    .hierarchy()
                    .graph()
                    .neighbors_directed(*n, petgraph::Direction::Incoming)
                    .filter_map(|n| {
                        if let Some(set) = g.get_set_at(n) {
                            if set.system_type().is_some() {
                                return None;
                            }
                        }

                        Some(get_node_id(&n))
                    })
                    .collect::<Vec<_>>();

                Some((get_node_id(&n), outgoing_neighbors, incoming_neighbors))
            })
            .collect();

        let hierarchy_edges = g
            .hierarchy()
            .graph()
            .all_edges()
            .filter_map(|(a, b, _)| {
                if g.set_at(a).system_type().is_some() {
                    return None;
                }

                Some((get_node_id(&a), get_node_id(&b)))
            })
            .collect();

        let dependancy_nodes = g
            .dependency()
            .graph()
            .nodes()
            .map(|n| {
                let outgoing_neighbors = g
                    .dependency()
                    .graph()
                    .neighbors_directed(n, petgraph::Direction::Outgoing)
                    .filter_map(|n| {
                        if let Some(set) = g.get_set_at(n) {
                            if set.system_type().is_some() {
                                return None;
                            }
                        }

                        Some(get_node_id(&n))
                    })
                    .collect::<Vec<_>>();

                let incoming_neighbors = g
                    .dependency()
                    .graph()
                    .neighbors_directed(n, petgraph::Direction::Incoming)
                    .filter_map(|n| {
                        if let Some(set) = g.get_set_at(n) {
                            if set.system_type().is_some() {
                                return None;
                            }
                        }

                        Some(get_node_id(&n))
                    })
                    .collect::<Vec<_>>();

                (get_node_id(&n), outgoing_neighbors, incoming_neighbors)
            })
            .collect();

        let dependancy_edges = g
            .dependency()
            .graph()
            .all_edges()
            .map(|(a, b, _)| (get_node_id(&a), get_node_id(&b)))
            .collect();

        Self {
            name: format!("{:?}", schedule.label()),
            systems,
            sets,
            hierarchy_nodes,
            hierarchy_edges,
            dependancy_nodes,
            dependancy_edges,
        }
    }
}

impl TrackedData {
    pub fn track_schedules(
        &mut self,
        events: &mut Vec<InspectorEvent>,
        world: &mut World,
        _type_registry: &TypeRegistry,
    ) {
        let update_schedule = world.resource::<UpdateSchedule>();

        if !update_schedule.initialized || self.schedules {
            return;
        }

        self.schedules = true;

        let main_order = world.resource::<ClonedMainScheduleOrder>();
        let fixed_main_order = world.resource::<FixedMainScheduleOrder>();
        let schedules = world.resource::<Schedules>();
        let mut schedule_infos = Vec::new();

        for label in main_order
            .startup_labels
            .iter()
            .chain(main_order.labels.iter())
        {
            if label.0.as_dyn_eq().dyn_eq(RunFixedMainLoop.as_dyn_eq()) {
                for schedule in fixed_main_order.labels.iter() {
                    let schedule = schedules.get(*schedule);
                    if let Some(schedule) = schedule {
                        schedule_infos.push(ScheduleInfo::from_schedule(schedule));
                    }
                }
            } else {
                let schedule = schedules.get(*label);
                if let Some(schedule) = schedule {
                    schedule_infos.push(ScheduleInfo::from_schedule(schedule));
                } else if label.0.as_dyn_eq().dyn_eq(Update.as_dyn_eq()) {
                    schedule_infos.push(update_schedule.info.clone());
                }
            }
        }

        events.push(InspectorEvent::Schedules {
            schedules: schedule_infos,
        });
    }
}

// Dirty hack to get the node id
fn get_node_id(id: &NodeId) -> String {
    let s = format!("{:?}", id);

    // s.split(|c| c == '(' || c == ')')
    //     .nth(1)
    //     .unwrap_or_else(|| s.as_str())
    //     .to_string()

    return s;
}

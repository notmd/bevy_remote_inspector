//! A Bevy app that you can connect to with the BRP and edit.

use std::fmt::Debug;

use bevy::{
    color::palettes::tailwind,
    input::common_conditions::input_just_pressed,
    prelude::*,
    utils::{HashMap, HashSet},
};
use bevy_remote_inspector::RemoteInspectorPlugins;
use serde::{Deserialize, Serialize};

fn main() {
    let mut app = App::new();

    app.add_plugins(DefaultPlugins)
        .add_plugins(RemoteInspectorPlugins)
        .add_systems(Startup, setup)
        .configure_sets(Update, TestSet2.before(TestSet))
        .configure_sets(Update, TestSet.after(TestSet2))
        .add_systems(
            Update,
            (
                rotate,
                add_cube_children.run_if(input_just_pressed(KeyCode::KeyA)),
                remove_cube_children.run_if(input_just_pressed(KeyCode::KeyS)),
                update_text,
            )
                .chain()
                .in_set(TestSet),
        )
        .register_type::<Cube>()
        .register_type::<CubeChild>()
        .register_type::<MyStruct>()
        .register_type::<WrapTrans>()
        .register_type::<TupleStruct>()
        .register_type::<TupleStruct2>()
        .register_type::<NestStruct>()
        .register_type::<NestStruct2>()
        .register_type::<NestStruct3>()
        .register_type::<MyEnum>()
        .register_type::<MyEnum2>()
        .register_type::<MyComponent>()
        .register_type::<OptionComponent>()
        .register_type::<SimpleStruct>()
        .register_type::<MyColor>()
        .register_type::<ShouldRotate>()
        .register_type::<MyEntityWrapper>();

    app.world_mut().register_component::<ShouldRotate>();

    app.run();
}

#[derive(SystemSet, Debug, Clone, PartialEq, Eq, Hash)]
struct TestSet;
#[derive(SystemSet, Debug, Clone, PartialEq, Eq, Hash)]
struct TestSet2;

#[derive(Component, Reflect, Debug)]
struct MyComponent {
    number: usize,
    string: String,
}

fn setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    commands.spawn(MyComponent {
        number: 42,
        string: "Hello, Bevy!".to_string(),
    });

    // circular base
    commands.spawn((
        Mesh3d(meshes.add(Circle::new(4.0))),
        MeshMaterial3d(materials.add(Color::WHITE)),
        Transform::from_rotation(Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2)),
    ));

    // cube
    commands
        .spawn((
            Mesh3d(meshes.add(Cuboid::new(1.0, 1.0, 1.0))),
            MeshMaterial3d(materials.add(Color::srgb_u8(124, 144, 255))),
            Transform::from_xyz(0.0, 0.5, 0.0),
            Cube(1.0),
        ))
        .with_children(|parent| {
            parent.spawn(CubeChild(0));
            parent.spawn((CubeChild(1), Name::new("CubeChild2")));
        });

    // light
    commands.spawn((
        PointLight {
            shadows_enabled: true,
            ..default()
        },
        Transform::from_xyz(4.0, 8.0, 4.0),
    ));

    // camera
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(-2.5, 4.5, 9.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    commands.spawn((
        // Transform::from_xyz(1.0, 1.0, 1.),
        MyStruct {
            vec2: Vec2::new(1.0, 2.0),
            vec3: Vec3::new(3.0, 4.0, 5.0),
            wrap_trans: WrapTrans(Transform::from_xyz(6.0, 7.0, 8.0)),
            vec: vec![1, 2, 3],
            map: {
                let mut map = HashMap::new();
                map.insert("key1".to_string(), 1);
                map.insert("key2".to_string(), 2);
                map.insert("key3".to_string(), 3);
                map
            },
            set: {
                let mut set = HashSet::new();
                set.insert(1);
                set.insert(2);
                set.insert(3);
                set
            },
            nest_struct: NestStruct {
                my_enum: MyEnum::UnitA,
                nest_struct2: NestStruct2 {
                    my_enum2: MyEnum2::TupleVariant(Vec2::new(1.0, 2.0)),
                    nest_struct3: NestStruct3(MyEnum2::StructVariant {
                        a: Vec3::new(3.0, 4.0, 5.0),
                    }),
                    string: "Hello, world!".to_string(),
                },
                my_enum2: MyEnum2::TupleVariant2(2),
            },
            checked: true,
        },
        NestStruct {
            my_enum: MyEnum::UnitA,
            nest_struct2: NestStruct2 {
                my_enum2: MyEnum2::TupleVariant(Vec2::new(1.0, 2.0)),
                nest_struct3: NestStruct3(MyEnum2::StructVariant {
                    a: Vec3::new(3.0, 4.0, 5.0),
                }),
                string: "Hello, world!".to_string(),
            },
            my_enum2: MyEnum2::TupleVariant2(2),
        },
        NestStruct2 {
            my_enum2: MyEnum2::TupleVariant(Vec2::new(1.0, 2.0)),
            nest_struct3: NestStruct3(MyEnum2::StructVariant {
                a: Vec3::new(3.0, 4.0, 5.0),
            }),
            string: "Hello, world!".to_string(),
        },
        NestStruct3(MyEnum2::StructVariant {
            a: Vec3::new(3.0, 4.0, 5.0),
        }),
        TupleStruct(42),
        TupleStruct2(Vec3::new(6.0, 7.0, 8.0)),
    ));

    commands.spawn((MyEnum2::TupleVariant(Vec2::new(10.0, 20.0)), MyEnum::UnitA));
    commands.spawn((
        OptionComponent({
            let mut hashmap = HashMap::new();
            hashmap.insert("my_key".to_string(), 1);
            hashmap
        }),
        SimpleStruct {
            a: 123,
            b: "Example String".to_string(),
        },
    ));
    commands.spawn((
        Text::default(),
        MyText,
        Node {
            position_type: PositionType::Absolute,
            bottom: Val::Px(0.),
            left: Val::Px(0.),
            ..default()
        },
    ));

    let id = commands.spawn(MyColor(Color::srgb(1., 0., 0.))).id();
    commands.spawn(MyEntityWrapper(id));

    commands
        .spawn(Node {
            width: Val::Percent(100.),
            ..default()
        })
        .with_children(|parent| {
            parent
                .spawn((
                    Node {
                        display: Display::Grid,

                        // tailwind equivalent: grid-cols-3
                        grid_template_columns: RepeatedGridTrack::minmax(
                            3,
                            MinTrackSizingFunction::Px(0.),
                            MaxTrackSizingFunction::Fraction(1.),
                        ),
                        width: Val::Percent(100.),
                        row_gap: Val::Px(10.),
                        column_gap: Val::Px(10.),
                        padding: UiRect::all(Val::Px(10.)),
                        ..default()
                    },
                    BackgroundColor(tailwind::BLUE_500.into()),
                ))
                .with_children(|parent| {
                    for i in 0..4 {
                        let mut parent_command = parent.spawn((
                            Node {
                                height: Val::Px(50.),
                                width: Val::Percent(100.),
                                ..default()
                            },
                            BackgroundColor(tailwind::GREEN_500.into()),
                        ));

                        if i == 3 {
                            parent_command.with_children(|parent| {
                                parent.spawn(Text::new("Some text here!"));
                            });
                        }
                    }
                });
        });
}

fn update_text(
    mut query: Query<&mut Text, With<MyText>>,
    my_enum2_query: Query<&MyEnum2, (Without<Text>, Changed<MyEnum2>)>,
) {
    let mut text = query.single_mut();
    let Ok(my_enum2) = my_enum2_query.get_single() else {
        return;
    };
    text.0 = format!("{:?}", my_enum2);
}

fn rotate(mut query: Query<&mut Transform, (With<Cube>, With<ShouldRotate>)>, time: Res<Time>) {
    for mut transform in &mut query {
        transform.rotate_y(time.delta_secs() / 2.);
    }
}

fn add_cube_children(
    mut commands: Commands,
    query: Query<Entity, With<Cube>>,
    children_query: Query<(Entity, &CubeChild)>,
) {
    let child = children_query.iter().max_by_key(|(_, child)| child.0);
    if let Some((entity, cube_child)) = child {
        commands
            .entity(entity)
            .with_child(CubeChild(cube_child.0 + 1));
    } else {
        commands.entity(query.single()).with_child(CubeChild(0));
    }
}

fn remove_cube_children(mut commands: Commands, query: Query<Entity, With<Cube>>) {
    for entity in query.iter() {
        commands.entity(entity).despawn_descendants();
    }
}

#[derive(Component, Reflect, Serialize, Deserialize)]
#[reflect(Component, Serialize, Deserialize)]
struct Cube(f32);

#[derive(Component, Reflect, Serialize, Deserialize)]
#[reflect(Component, Serialize, Deserialize)]
#[require(Name(|| Name::new("CubeChild")))]
struct CubeChild(usize);

#[derive(Component, Reflect)]
struct WrapTrans(Transform);

#[derive(Component, Reflect)]
struct MyStruct {
    vec2: Vec2,
    vec3: Vec3,
    wrap_trans: WrapTrans,
    vec: Vec<usize>,
    map: HashMap<String, usize>,
    set: HashSet<usize>,
    nest_struct: NestStruct,
    checked: bool,
}

#[derive(Component, Reflect)]
struct NestStruct {
    my_enum: MyEnum,
    my_enum2: MyEnum2,
    nest_struct2: NestStruct2,
}

#[derive(Component, Reflect)]
#[reflect(Component)]
struct NestStruct2 {
    my_enum2: MyEnum2,
    nest_struct3: NestStruct3,
    string: String,
}

#[derive(Component, Reflect)]
#[reflect(Component)]
struct NestStruct3(MyEnum2);

#[derive(Component, Reflect)]
enum MyEnum {
    UnitA,
    UnitB,
}

#[derive(Component, Reflect, Debug)]
enum MyEnum2 {
    TupleVariant(Vec2),
    TupleVariant2(usize),
    StructVariant { a: Vec3 },
    Unit,
    StringVariant(String),
}

#[derive(Component, Reflect)]
struct TupleStruct(usize);

#[derive(Component, Reflect)]
struct TupleStruct2(Vec3);

#[derive(Component, Reflect)]
struct OptionComponent(HashMap<String, usize>);

#[derive(Reflect, Component)]
struct SimpleStruct {
    a: usize,
    b: String,
}

#[derive(Component, Reflect, Debug)]
struct MyColor(Color);

#[derive(Component, Reflect)]
#[reflect(Component)]
struct ShouldRotate;

#[derive(Debug, Reflect, Component)]
struct MyEntityWrapper(Entity);

#[derive(Component)]
struct MyText;

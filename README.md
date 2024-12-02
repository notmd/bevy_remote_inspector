<img alt="Crates.io Version" src="https://img.shields.io/crates/v/bevy_remote_inspector">
<img alt="docs.rs" src="https://img.shields.io/docsrs/bevy_remote_inspector">

# Bevy Remote Inspector

A remote inspector for Bevy game engine, allowing you to inspect and modify entities in real-time. Alternative to [bevy-inspector-egui](https://github.com/jakobhellermann/bevy-inspector-egui).

## Features

- Entity hierarchy tree view, including drag and drop to update parent-child relationships.
- Inspector showing entity's components and their properties, including adding/removing components. Capable of rendering and editing deeply nested Rust types (custom serialization/deserialization types may not work as expected).
- Allow to toggle components on/off (work by temporarily removing the component from the entity).
- Automatically reconnect when your Bevy app restarts.

https://github.com/user-attachments/assets/adf9c68c-ddbf-40a9-aedc-06006e574a15

## Installation

- `bevy_remote_inspector` currently require Bevy version `0.15.0`.

```bash
cargo add bevy_remote_inspector
```

## Usage

- Add `RemoteInspectorPlugins` to your Bevy app.

```rust
use bevy_remote_inspector::RemoteInspectorPlugins;

fn main() {
    App::build()
        .add_plugins(DefaultPlugins)
        .add_plugins(RemoteInspectorPlugins)
        .run();
}
```

- Then open [https://bevy-remote-inspector.pages.dev/](https://bevy-remote-inspector.pages.dev/) in your browser and enter the default WebSocket URL `ws://localhost:3000`.
- If you need to change the port you can import individual plugins and configure them.

```rust
use bevy_remote_inspector::{
    stream::{websocket::RemoteStreamWebSocketPlugin, RemoteStreamPlugin},
    RemoteInspectorPlugin,
};

fn main() {
    App::build()
        .add_plugins(DefaultPlugins)
        .add_plugins((
            RemoteStreamPlugin::default(),
            RemoteStreamWebSocketPlugin::default().with_port(1234),
            RemoteInspectorPlugin,
        ))
        .run();
}
```

## Development

- Run the example

```bash
cargo run --p example_simple
```

- Run the web client

```bash
pnpm run dev
```

- Then open [http://localhost:1420](http://localhost:1420) in your browser.

## Bevy compatibility

| `bevy_remote_inspector` | `bevy` |
| ----------------------- | ------ |
| 0.1.0                   | 0.15.0 |

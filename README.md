# Mik Mik - Ember & Crumb · Three.js Edition
An independent Three.js implementation of Mik Mik, a single-player 3D restaurant-management and swarm-survival roguelike starring a mouse chef. This edition was created to explore and compare the gameplay and visual presentation of the Godot edition in a browser-based 3D engine.

Project owners and co-developers: Merve Sena Çınar & Ali Erdem Cerrah
Technologies: Three.js · JavaScript · Vite · Node.js
Availability: Public source code, licensed for noncommercial use.

![Start and Character](docs/menu.png)

![Three.js Gameplay](docs/gameplay.png)

## Getting Started
Requirements: Node.js 22.12 or later and npm.

On macOS, double-click Oyna.command to start the game. On the first launch, the launcher installs dependencies if needed; later launches can work offline when the required dependencies are already installed. If the local development server is already running, the launcher opens the existing game.

Alternatively, start the development server manually:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5178/ in your browser. The development server binds to the local machine only.
To create and preview a production build, stop the development server and run:

```sh
npm run build
npm run preview
```

## How to Play
- WASD / Arrow keys: Move. Space: Dash. Escape: Pause or resume.
- Approach a table marked with an order icon. The order is taken automatically, and the kitchen starts preparing the food.
- Go to the counter to pick up prepared dishes, then return to the customer's table. Serving and cleaning occur automatically when you are nearby.
- Weapons fire automatically. When you level up, the game pauses and presents three upgrades to choose from.
- A ring around each customer indicates their remaining patience; a small badge identifies the meal. Off-screen customers are indicated by mouse portraits and directional arrows along the screen edge.
- The Visual Tour option in the menu opens a playable showcase with dining customers and different enemy types. It does not change achievements or persistent progression.
  
## Implemented Gameplay Systems

| System | Three.js edition |
| --- | --- |
| Map and camera | 64 × 52 m courtyard with 10 tables; a 23.5-unit orthographic camera smoothly follows the player. |
| Restaurant service | Burgers, pizza, soup, and cheese platters; automatic ordering, cooking, carrying, serving, eating, payment, and cleaning. |
| Combat | Surrounding waves of cats, dogs, black cats, bulldogs, foxes, and club-wielding humans, followed by a boss in wave six. |
| Human enemies | Appear from wave three at approximately 10–11%; withstand five standard soda hits or three hits from the starting knife/pan; any single hit deals at most 34% of their health. |
| Progression | Separate kitchen and combat XP; 6 + 6 equipment slots; upgrades up to level IV; new equipment is offered while slots remain available. |
| Evolutions | Cleaning IV unlocks automatic cleaning every seven seconds; Capacity IV unlocks remote plate pickup. Each evolution is offered once after its prerequisites are met and replaces the original slot. |
| Environment and customers | Open boulevard, speed lane, tunnels, flowers, and gourmet, student, and regular customers. |
| Characters | Mik, Zıp, Tok, and Nane, with distinct silhouettes and accessories, achievement-based unlocks, four fur-color choices, four outfit-color choices, and four eye shapes. |
| Persistent progression | Six achievements, five training categories, three difficulty levels, persistent tips, and browser-based saves. |
| Animations | Walking, dashing, order-taking, flying dishes, gradually consumed meals, spoon/chewing actions, boredom/yawning, payments, cleanup, attacks, hits, deaths, and power-ups. |
| Pausing | Escape, loss of window focus, and hiding the browser tab pause the simulation. |


Bu karşılaştırma **mevcut tek oyunculu otomatik roguelike sürümünü** temel alır. Eski Ember & Crumb prototipinin ENet kooperatifi, manuel tarif zinciri, ruh/diriltme ve lobi sistemi bu sürümde yoktur.

## Comparison with the Godot Edition
The Godot game and this browser implementation are maintained as separate projects. Neither the Godot source files nor its save data are modified by the Three.js edition.
- Godot edition: mik-mik-restaurant
- Three.js edition: mik-mik-threejs
Three.js progression is stored in the browser under the mik-mik-threejs-profile-v1 key for the current origin. It is not imported from Godot saves. Clearing the browser's site data also removes this saved progression.

Camera scale, map layout, and core balancing are designed to be comparable, but the Three.js models are rebuilt using Three.js geometry. This is not a pixel-for-pixel rendering comparison using identical assets. FPS comparisons are meaningful only under comparable resolution, quality, crowd size, and hardware conditions; one measurement cannot establish that either engine is universally faster.

The visual pipeline includes soft shadows, sRGB color management, ACES tone mapping, and detailed original procedural models. Balanced mode caps the device pixel ratio at 1.5×, and High mode at 2×; these settings are available from the Escape menu. Optional lightweight synthesized sound effects are provided instead of background music. No external image, font, or audio assets are downloaded at runtime.

Testing and Validation
Run the simulation tests and verify the production build:

```sh
npm test
npm run build
```

The simulation tests cover the full service/payment loop, customer patience, pausing, human-enemy health and spawn distribution, equipment slots, evolutions, XP, navigation, dashing, save/load and unlocks, waves and bosses, and crowd behavior.
Browser checks use an in-memory profile in development mode with /?test=1. The test API is not included in the production build.

```sh
agent-browser --session mik-three open 'http://127.0.0.1:5178/?test=1'
agent-browser --session mik-three eval --stdin < tests/browser-check.browser.js
```
## Code Structure
- game.js - Fixed-step game simulation, independent of rendering.
- navigation.js - Obstacles, sliding collision, and cached pathfinding.
- art.js / view.js - Shared geometry, static mesh merging, the 3D scene, and animations.
- profile.js - Browser saves, training, and achievements.
- ui.js - In-game menus, equipment slots, and off-screen indicators (current UI language: Turkish).

## License & Copyright
Project owners: Merve Sena Çınar & Ali Erdem Cerrah
Copyright © 2026 Merve Sena Çınar and Ali Erdem Cerrah.

The source code is publicly available under the PolyForm Noncommercial License 1.0.0. The license permits qualifying noncommercial uses under its terms. Commercial use requires separate permission from the copyright holders.

# 🌆 COOL CODING GAME — v8 "DLNA EDITION"

An open-world **Deep Learning & Neural Architectures (`26 UBAI 601`)** adventure with a **living city**: drive stabilized cars at slow or fast speeds, smash trees and street lights (while homes remain solid), listen to the radio, watch day turn to night — and master all 5 units of the DLNA syllabus (26 sites, 130 quiz questions, 5 bosses) along the way.

Built on the same zero-build multi-file architecture: **the world, the course content, and the engine live in different files.**

## ▶ How to run
No build, no server needed — open `index.html` directly, or serve locally with:
`python3 -m http.server`

## 🎮 Controls

| Action | Keys |
| --- | --- |
| Walk | WASD / arrows · **SHIFT** to sprint |
| Interact / advance dialogue | E / ENTER / SPACE · 1-4 to answer · ESC to skip |
| **Drive a car** | **F** enter/exit · W/S gas & reverse · A/D steer |
| **Speed & Brake** | **SHIFT** fast boost · **G** toggle slow gear (or hold **C**) · **SPACE** handbrake |
| Horn | **H** (citizens hop aside!) |
| Radio | **R** cycles 3 synthesized stations |
| City map | **M** — click anywhere to set a waypoint |
| Panel | 💤 LAZY auto-play · 🔊 sound · ❓ help · 🗑️ reset |

## 🌆 Features

- **Stabilized Slow & Fast Driving** — Speed-attenuated steering, angular velocity damping, road-lane alignment assist, and sub-stepped OBB collision checks keep cars steady at both slow cruise and fast highway speeds.
- **Full Collisions & Destructible Objects** — Cars collide cleanly with other cars, citizens, and the hero on foot. Ramming **trees** turns them into stumps and smashing **road lights** extinguishes their night-time light glow with debris particles, while **homes** and the **river** remain solid obstacles.
- **Complete `26 UBAI 601` DLNA Course** — Units I–V (Deep Learning Fundamentals, CNNs, RNNs, Advanced Neural Architectures, and Model Optimization & Deployment), 26 sites, 130 randomized MCQs, 5 unit boss duels, and rare milestone Python/PyTorch snippets.
- **Living City** — AI traffic on aligned north/south roads, wandering citizens with DLNA tips, 24h day/night clock with headlights & street lamps, rain/lightning/thunder, synthesized radio, full pause map (`M`), and autosave v4.

## 📁 File architecture

```
index.html            ← shell + load order
css/style.css         ← HUD, radar, map, letterbox, rain, mission splash

data/                 ══════ THE WORLD & COURSE CONTENT ══════
  world-map.js        ← 26 DLNA sites, 5 bosses, roads, traffic routes, parked cars
  unit1.js … unit5.js ← Units I–V lessons, rare Python snippets, 130 MCQs

engine/               ══════ THE MACHINERY ══════
  main.js             game loop, rendering, cinematics, mission flow
  world.js            tile map builder, destructible trees/lamps, road detection
  sprites.js          pre-rendered tiles, stumps, broken lamps, cars, citizens
  player.js           walking, sprint, car-hull collision, smooth driving camera
  input.js            keyboard + touch + driving speed/brake controls
  vehicles.js         stabilized car physics, OBB collisions, debris, AI traffic
  npc.js              wandering citizens with DLNA tips & safe car bump scatter
  daynight.js         24h clock, dusk/dawn tints, night darkness
  weather.js          rain events, lightning, thunder
  radio.js            3 synthesized DLNA radio stations
  minimap.js          radar + full pause map + waypoints
  audio.js            Web Audio SFX, engine hum, thunder, stings
  hud.js  dialogue.js  quiz.js  boss.js  save.js
```

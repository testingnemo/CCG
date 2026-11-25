/* ============================================================
   COOL CODING GAME — WORLD MAP DATA  (26 UBAI 601 · DLNA EDITION)
   ------------------------------------------------------------
   THIS FILE = THE WORLD (where things are): layout, roads,
   traffic routes, parked cars, lamps, city config.
   Course lessons & quiz banks live in data/unit1.js … unit5.js
   Game machinery lives in engine/*.js

   WANT TO MOVE A LOCATION? Just change its x / y (tile coords).
   WANT MORE TRAFFIC? add routes or lower `gap` in trafficRoutes.
   ============================================================ */

window.WORLD_MAP = {

  /* ---- global world config ---- */
  tileSize: 32,          // pixels per tile
  cols: 160,             // world width  in tiles  (5120 px)
  rows: 110,             // world height in tiles  (3520 px)

  /* ---- the great river (water rows, inclusive) ---- */
  river: { top: 52, bottom: 58 },

  /* ---- the wooden bridge (walkable + drivable) ---- */
  bridge: { left: 76, right: 81 },

  /* ---- player spawn (south bank, south of the bridge) ---- */
  spawn: { x: 76, y: 100 },
  startCar: { x: 79, y: 104 },          // your first ride, parked at spawn

  /* ---- roads: road rows / columns (tile coords) ---- */
  roads: {
    h: [ 12, 30, 46, 68, 84, 92, 104 ], // north & south grids
    v: [ 8, 36, 50, 64, 78, 94, 114, 128, 142, 156 ]
  },

  /* ---- decoration config (procedural, deterministic seed) ---- */
  decor: {
    seed: 20241023,       // same seed = same forest every load
    treeDensity: 0.045,   // fraction of grass tiles that grow a tree
    flowerDensity: 0.05,  // fraction of grass tiles that grow a flower
    lampDensity: 0.012,   // street lamps along roads (sparse, city feel)
    houseDensity: 0.012   // small houses scattered in blocks
  },

  /* ---- city lighting: lamps light the world at night ---- */
  city: {
    lampReach: 3.6,        // tiles of light radius around a lamp
    carHeadlightReach: 9,  // tiles
    nightOverlay: 0.60     // darkness strength at midnight
  },

  /* ---- regions ---- */
  regions: {
    south: { name: 'PERCEPTRON MEADOWS', desc: 'Home of Unit I — Deep Learning Fundamentals' },
    north: { name: 'TENSOR METROPOLIS',  desc: 'Home of Units II–V — CNNs, RNNs, Transformers & Deployment' }
  },

  /* ---- traffic: AI cars patrol these loops strictly along roads.h & roads.v.
     Routes only cross the river through the bridge corridor (cols 76–81). ---- */
  trafficRoutes: [
    { color: '#e63946', gap: 26, route: [ [ 8, 104 ], [ 142, 104 ], [ 142, 68 ], [ 8, 68 ], [ 8, 104 ] ] },
    { color: '#457b9d', gap: 34, route: [ [ 78, 68 ], [ 78, 12 ], [ 156, 12 ], [ 156, 30 ], [ 78, 30 ], [ 78, 68 ] ] },
    { color: '#f4a261', gap: 30, route: [ [ 64, 92 ], [ 142, 92 ], [ 142, 68 ], [ 64, 68 ], [ 64, 92 ] ] },
    { color: '#2a9d8f', gap: 34, route: [ [ 8, 46 ], [ 64, 46 ], [ 64, 12 ], [ 8, 12 ], [ 8, 46 ] ] }
  ],

  /* ---- parked cars (persistent, can be stolen) ---- */
  parkedCars: [
    { x: 73, y: 104, color: '#e07be0' },
    { x: 82, y: 106, color: '#6d5ae0' },
    { x: 70, y: 92,  color: '#f4a261' }
  ],

  /* ---- the 5 units of 26 UBAI 601 (one boss arena each) ---- */
  units: [
    {
      id: 1, name: 'Deep Learning Fundamentals', hours: 12, region: 'south',
      color: '#7ac74f',
      boss: { id: 'boss1', name: 'PERCEPTRON GOLEM', icon: '🗿', x: 96, y: 64,
              intro: 'THRESHOLD BREACHED! NO LINEARLY INSEPARABLE INPUT SHALL PASS!' }
    },
    {
      id: 2, name: 'Convolutional Neural Networks', hours: 12, region: 'north',
      color: '#f4a261',
      boss: { id: 'boss2', name: 'KERNEL KRAKEN', icon: '🐙', x: 34, y: 24,
              intro: 'My 3x3 filters scan every pixel… your features cannot hide!' }
    },
    {
      id: 3, name: 'Recurrent Neural Networks', hours: 12, region: 'north',
      color: '#2a9d8f',
      boss: { id: 'boss3', name: 'GRADIENT WRAITH', icon: '👻', x: 68, y: 26,
              intro: 'Across a hundred timesteps my gradients vanish into mist!' }
    },
    {
      id: 4, name: 'Advanced Neural Architectures', hours: 12, region: 'north',
      color: '#e76f51',
      boss: { id: 'boss4', name: 'LATENT OGRE', icon: '👹', x: 112, y: 28,
              intro: 'I forge fake samples so real my own Discriminator weeps!' }
    },
    {
      id: 5, name: 'Model Optimization & Deployment', hours: 12, region: 'north',
      color: '#9b5de5',
      boss: { id: 'boss5', name: 'OVERFIT DRAGON', icon: '🐉', x: 150, y: 18,
              intro: '100% ON TRAINING, 12% IN PRODUCTION! TREMBLE BEFORE MY VARIANCE!' }
    }
  ],

  /* ---- 26 topic locations (id links to content in data/unitN.js) ---- */
  locations: [
    /* UNIT I — south bank (PERCEPTRON MEADOWS) */
    { id: 'u1l1', unit: 1, name: 'ML to DL Evolution',       icon: '🌱', x: 74,  y: 90 },
    { id: 'u1l2', unit: 1, name: 'Perceptron & MLP',         icon: '🧠', x: 58,  y: 90 },
    { id: 'u1l3', unit: 1, name: 'Activation Functions',     icon: '⚡', x: 96,  y: 90 },
    { id: 'u1l4', unit: 1, name: 'Loss Functions',           icon: '📉', x: 66,  y: 78 },
    { id: 'u1l5', unit: 1, name: 'Backprop & Training',      icon: '🔁', x: 88,  y: 76 },

    /* UNIT II — north-west zone (CONVOLUTION VALLEY) */
    { id: 'u2l1', unit: 2, name: 'Conv & Pooling Layers',    icon: '🔲', x: 14,  y: 42 },
    { id: 'u2l2', unit: 2, name: 'Filters & Feature Maps',   icon: '🔍', x: 30,  y: 36 },
    { id: 'u2l3', unit: 2, name: 'LeNet & AlexNet',          icon: '🏛️', x: 10,  y: 24 },
    { id: 'u2l4', unit: 2, name: 'VGG Architecture',         icon: '🧱', x: 28,  y: 16 },
    { id: 'u2l5', unit: 2, name: 'Transfer Learning',        icon: '🎓', x: 16,  y: 8  },

    /* UNIT III — north centre-west zone (SEQUENCE RIDGE) */
    { id: 'u3l1', unit: 3, name: 'Sequence Modeling',        icon: '🎞️', x: 48,  y: 42 },
    { id: 'u3l2', unit: 3, name: 'Vanilla RNN & Limits',     icon: '🌀', x: 62,  y: 38 },
    { id: 'u3l3', unit: 3, name: 'LSTM Networks',            icon: '🔐', x: 48,  y: 24 },
    { id: 'u3l4', unit: 3, name: 'GRU Architecture',         icon: '⚙️', x: 62,  y: 16 },
    { id: 'u3l5', unit: 3, name: 'Time-Series & NLP',        icon: '📈', x: 74,  y: 8  },

    /* UNIT IV — north centre-east zone (ATTENTION PEAKS) */
    { id: 'u4l1', unit: 4, name: 'Attention Mechanism',      icon: '🎯', x: 90,  y: 42 },
    { id: 'u4l2', unit: 4, name: 'Transformers & Self-Attn', icon: '🤖', x: 104, y: 36 },
    { id: 'u4l3', unit: 4, name: 'Autoencoders',             icon: '🗜️', x: 88,  y: 22 },
    { id: 'u4l4', unit: 4, name: 'GANs: Gen & Disc',         icon: '🎭', x: 102, y: 14 },
    { id: 'u4l5', unit: 4, name: 'Generative Synthesis',     icon: '✨', x: 116, y: 8  },

    /* UNIT V — east zone (DEPLOYMENT CITADEL · 6 locations) */
    { id: 'u5l1', unit: 5, name: 'Dropout & Regularization', icon: '🛡️', x: 126, y: 42 },
    { id: 'u5l2', unit: 5, name: 'Batch Normalization',      icon: '⚖️', x: 140, y: 36 },
    { id: 'u5l3', unit: 5, name: 'Adam & RMSProp',           icon: '🚀', x: 154, y: 32 },
    { id: 'u5l4', unit: 5, name: 'Hyperparameter Tuning',    icon: '🎛️', x: 126, y: 16 },
    { id: 'u5l5', unit: 5, name: 'Model Saving & Eval',      icon: '💾', x: 144, y: 14 },
    { id: 'u5l6', unit: 5, name: 'Inference Pipelines',      icon: '🏆', x: 154, y: 6  }
  ]
};

/* quick integrity check the engine relies on (runs in console) */
(function validate() {
  var WM = window.WORLD_MAP;
  var ids = {};
  WM.locations.forEach(function (loc) {
    if (ids[loc.id]) { console.error('[world-map] duplicate id: ' + loc.id); }
    ids[loc.id] = true;
    if (loc.x < 2 || loc.x > WM.cols - 3 || loc.y < 2 || loc.y > WM.rows - 3) {
      console.error('[world-map] out of bounds: ' + loc.id);
    }
    if (loc.y >= WM.river.top && loc.y <= WM.river.bottom) {
      console.error('[world-map] in river: ' + loc.id);
    }
  });
  var expected = { 1: 5, 2: 5, 3: 5, 4: 5, 5: 6 };
  var count = {};
  WM.locations.forEach(function (loc) { count[loc.unit] = (count[loc.unit] || 0) + 1; });
  WM.units.forEach(function (u) {
    if (count[u.id] !== expected[u.id]) {
      console.error('[world-map] unit ' + u.id + ' has ' + count[u.id] + ' locations, expected ' + expected[u.id]);
    }
  });
})();

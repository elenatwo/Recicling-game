/**
 * YERMO LIMPIO — Lógica del juego
 * Juego educativo 2D pixel art sobre reciclaje, ecología y ahorro.
 *
 * Índice:
 *   1. CONFIGURACIÓN DEL CANVAS Y ESTADO GLOBAL
 *   2. DATOS DEL JUEGO (residuos, misiones, tienda y animales)
 *   3. GENERACIÓN DEL MAPA
 *   4. COLISIONES Y CREACIÓN DE ENTIDADES
 *   5. UTILIDADES, AVISOS Y DIÁLOGOS
 *   6. LÓGICA DE JUEGO (actualización por fotograma)
 *   7. MISIONES, INTERACCIONES Y TIENDA
 *   8. ENTRADA (teclado, controles táctiles y puntero)
 *   9. RENDERIZADO (canvas pixelado + capa de texto nítida)
 *   10. BUCLE PRINCIPAL Y ARRANQUE
 *
 * Convenciones: las constantes en MAYÚSCULAS son datos fijos; el mapa usa
 * casillas de TILE px y las entidades guardan su posición en píxeles.
 */

// ==========================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y ESTADO GLOBAL
// ==========================================================================

// Dimensiones lógicas: pantalla 256x176 px, casillas de 16 px, mapa de 48x32 casillas.
const VIEW_W = 256;

const VIEW_H = 176;

const TILE = 16;

const MAP_W = 48;

const MAP_H = 32;

// Canvas principal y su contexto 2D.
const canvas = document.getElementById('c');

const ctx = canvas.getContext('2d');

// Pantalla actual: title | play | dlg | shop | quests | end.
let scene = 'title';

// Relojes: tiempo total y tiempo transcurrido en la pantalla final.
let elapsed = 0;

let endTime = 0;

// Teclas pulsadas, indexadas por nombre en minúsculas.
let keys = {};

// Efectos y entidades activas: avisos, diálogos, partículas, proyectiles, residuos y enemigos.
let toasts = [];

let dialogPages = [];

let particles = [];

let waterShots = [];

let litter = [];

let enemies = [];

// Progreso: misión principal actual, secundarias completadas y página del registro.
let mainQuestIndex = 0;

let sideQuestsDone = {};

let questPage = 0;

// Compuertas abiertas y temporizadores (disparo, aparición); estado de la aspiración.
let gatesOpen = [0, 0];

let shotCooldown = 0;

let spawnTimer = 8;

let seenWasteTypes = [0, 0, 0, 0];

let isSucking = 0;

// Estadísticas acumuladas; las misiones comprueban estos contadores.
const stats = {
  pl: 0,
  me: 0,
  vi: 0,
  or: 0,
  clean: 0,
  kill: 0,
  rec: 0,
  earn: 0,
  resc: 0,
  dep: 0,
  int: 0,
  buy: 0,
  gate: 0,
  boss: 0
};

// Jugador: posición (pies), dirección, vida, bolsa [plástico, metal, vidrio, orgánico], monedas, chatarra y mejoras.
const player = {
  x: 64,
  y: 240,
  d: 2,
  hp: 10,
  mx: 10,
  bag: [0, 0, 0, 0],
  coins: 0,
  scrap: 0,
  inv: 0,
  wk: 0,
  lv: {
    w: 0,
    a: 0,
    t: 0,
    b: 0
  }
};

// ==========================================================================
// 2. DATOS DEL JUEGO (residuos, misiones, tienda y animales)
// ==========================================================================

// Tipos de residuo: nombres, claves de estadística y colores.
const WASTE_NAMES = ['Plástico', 'Metal', 'Vidrio', 'Orgánico'];

const WASTE_KEYS = ['pl', 'me', 'vi', 'or'];

const WASTE_COLORS = ['#4ac8e8', '#b4b4bc', '#6ef0a0', '#a0702a'];

// Consejo educativo al recoger por primera vez cada tipo de residuo.
const WASTE_TIPS = [
  'El plástico tarda siglos en degradarse y acaba en el mar.',
  'El metal se recicla una y otra vez ahorrando mucha energía.',
  'El vidrio se recicla infinitas veces sin perder calidad.',
  'Lo orgánico se convierte en abono si se composta.'
];

// Datos curiosos que muestra la estación de reciclaje.
const RECYCLING_FACTS = [
  'Reducir, reutilizar y reciclar: en ese orden. Lo mejor es generar menos residuos.',
  'Separar en origen hace que el reciclaje sea mucho más eficaz.',
  'Reciclar una lata de aluminio ahorra casi toda la energía de fabricar una nueva.',
  'Los microplásticos entran en la cadena alimentaria... y llegan a nuestro plato.',
  'Reparar y reutilizar es más barato que comprar nuevo: ahorra dinero y planeta.',
  'Una botella reciclada puede convertirse en ropa, bolsas o más envases.'
];

// Misiones principales (secuenciales y cortas).
const MAIN_QUESTS = [
  {
    t: 'PRINCIPAL: Limpia 10 de pringue',
    k: 'clean',
    g: 10
  },
  {
    t: 'PRINCIPAL: Recicla 15 residuos',
    k: 'rec',
    g: 15
  },
  {
    t: 'PRINCIPAL: Abre las 2 compuertas',
    k: 'gate',
    g: 2
  },
  {
    t: 'PRINCIPAL: Derrota al Rey Mugrón',
    k: 'boss',
    g: 1
  }
];

// Misiones secundarias: [nombre, estadística, objetivo, recompensa, consejo educativo].
const SIDE_QUESTS = [
  [
    'Novato: aspira 10 plásticos',
    'pl',
    10,
    15,
    'Un plástico puede tardar hasta 450 años en degradarse.'
  ],
  [
    'Chatarrero: 8 metales',
    'me',
    8,
    15,
    'Reciclar metal gasta mucha menos energía que extraerlo.'
  ],
  [
    'Vidriero: 6 vidrios',
    'vi',
    6,
    12,
    'El vidrio se recicla sin perder calidad.'
  ],
  [
    'Compostador: 6 orgánicos',
    'or',
    6,
    10,
    'Los restos orgánicos son abono para plantar de nuevo.'
  ],
  [
    'Barrendero: limpia 30 casillas',
    'clean',
    30,
    20,
    'Un entorno limpio protege el agua y a los animales.'
  ],
  [
    'Maestro del agua: 80 casillas',
    'clean',
    80,
    40,
    'El agua limpia es el recurso más valioso. Cuídala.'
  ],
  [
    'Limpiador total: 150 casillas',
    'clean',
    150,
    80,
    'Prevenir la basura es mejor que limpiarla.'
  ],
  [
    'Cazamugrones: derrota 5',
    'kill',
    5,
    20,
    'La basura en el suelo atrae plagas.'
  ],
  [
    'Exterminador: derrota 15',
    'kill',
    15,
    35,
    'Mantener limpio evita que vuelvan las plagas.'
  ],
  [
    'Azote de mugrones: derrota 30',
    'kill',
    30,
    60,
    'Las plagas crecen donde hay residuos mal gestionados.'
  ],
  [
    'Reciclador: recicla 30',
    'rec',
    30,
    20,
    'Cada residuo reciclado es un recurso que no hay que extraer.'
  ],
  [
    'Gran reciclador: recicla 100',
    'rec',
    100,
    60,
    'Una economía circular reutiliza los materiales una y otra vez.'
  ],
  [
    'Plástico a raudales: 30',
    'pl',
    30,
    35,
    'Lleva tu bolsa reutilizable: una bolsa menos es plástico menos.'
  ],
  [
    'Montaña de metal: 25 metales',
    'me',
    25,
    35,
    'El metal de las latas puede ser una lata nueva en pocas semanas.'
  ],
  [
    'Cristalero: 20 vidrios',
    'vi',
    20,
    30,
    'Un frasco de vidrio se puede reutilizar mil veces antes de reciclar.'
  ],
  [
    'Abono total: 20 orgánicos',
    'or',
    20,
    25,
    'El compost devuelve nutrientes al suelo.'
  ],
  [
    'Primer rescate',
    'resc',
    1,
    15,
    'Los animales son indicadores de la salud del ecosistema.'
  ],
  [
    'Amigo de las bestias: 4 rescates',
    'resc',
    4,
    30,
    'Proteger hábitats es proteger la biodiversidad.'
  ],
  [
    'Zoológico yermo: 8 rescates',
    'resc',
    8,
    60,
    '¡Los has salvado a todos!'
  ],
  [
    'Primer ahorro: ingresa 10',
    'dep',
    10,
    10,
    'Ahorrar es apartar una parte de lo que ganas ANTES de gastar.'
  ],
  [
    'Ahorrador: ingresa 100',
    'dep',
    100,
    40,
    'Regla 50/30/20: necesidades, gustos y ahorro.'
  ],
  [
    'Inversor: ingresa 300',
    'dep',
    300,
    80,
    'Un fondo de emergencia te protege de imprevistos.'
  ],
  [
    'Interés: gana 5 intereses',
    'int',
    5,
    20,
    'El interés compuesto: ganas intereses sobre tus intereses.'
  ],
  [
    'Rentista: gana 20 intereses',
    'int',
    20,
    50,
    'Cuanto antes empieces a ahorrar, más trabaja el tiempo para ti.'
  ],
  [
    'Primera compra',
    'buy',
    1,
    10,
    'Antes de comprar, distingue entre necesidad y capricho.'
  ],
  [
    'Equipado: 5 mejoras',
    'buy',
    5,
    40,
    'Invertir en buenas herramientas rinde a largo plazo.'
  ],
  [
    'Ingresos: gana 150 monedas',
    'earn',
    150,
    25,
    'Todo ingreso viene de un trabajo útil. Aquí, reciclar.'
  ],
  [
    'Magnate verde: gana 400',
    'earn',
    400,
    60,
    'Una economía verde crea empleo y cuida el planeta.'
  ]
];

// Tienda del taller: [nombre, mejora, nivel, coste en chatarra, descripción].
const SHOP_ITEMS = [
  ['Rociador de Tubo', 'w', 1, 8, 'Daño 2'],
  ['Hidrolanza Oxidada', 'w', 2, 22, 'Daño 3'],
  ['Cañón de Bidón', 'w', 3, 45, 'Daño 4'],
  ['Peto de Tapas', 'a', 1, 10, 'Def 1'],
  ['Coraza de Neumático', 'a', 2, 28, 'Def 2'],
  ['Exo-Chatarra', 'a', 3, 55, 'Def 3'],
  ['Turbina de Ventilador', 't', 1, 15, 'Rango+'],
  ['Turbina Reforzada', 't', 2, 30, 'Rango++'],
  ['Mochila de Retales', 'b', 1, 12, 'Bolsa 20'],
  ['Mochila Reforzada', 'b', 2, 28, 'Bolsa 30']
];

// Ahorrilos (animales hucha): casilla, nombre, color, rescatado, ahorro y temporizador de interés.
const SAVER_ANIMALS = [
  [12, 6, 'Cerdito', '#f0a0b8'],
  [13, 24, 'Zorro', '#e87820'],
  [9, 9, 'Rana', '#50c040'],
  [20, 5, 'Pato', '#f0d030'],
  [25, 27, 'Oso', '#7a4a20'],
  [29, 12, 'Conejo', '#e8e8e8'],
  [37, 6, 'Tortuga', '#3a8a6a'],
  [40, 26, 'Búho', '#9a8a7a']
].map(a => ({
  tx: a[0],
  ty: a[1],
  n: a[2],
  c: a[3],
  res: 0,
  sv: 0,
  t: 0
}));

// Coste en monedas de cada compuerta.
const GATE_COSTS = [30, 70];

// ==========================================================================
// 3. GENERACIÓN DEL MAPA
// ==========================================================================

// Generador pseudoaleatorio con semilla fija: el mapa es siempre el mismo.
let rngSeed = 11;

const random = () => (rngSeed = rngSeed * 16807 % 2147483647) / 2147483647;

// Mapa: 0 suelo, 1 escombro, 2 pringue, 3 hierba, 5 compuerta, 6 búnker, 7 estación, 8 taller.
const tileMap = [];

for (let y = 0; y < MAP_H; y++) {
  tileMap[y] = [];
  for (let x = 0; x < MAP_W; x++)
    tileMap[y][x] = x == 0 || y == 0 || x == MAP_W - 1 || y == MAP_H - 1 ? 1 : random() < 0.04 ? 1 : 0;
}

// Manchas de pringue: círculos aleatorios sobre suelo libre.
for (let i = 0; i < 46; i++) {
  const cx = 2 + random() * (MAP_W - 4), cy = 2 + random() * (MAP_H - 4), r = 1.2 + random() * 2.6;
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      if (tileMap[y][x] == 0 && Math.hypot(x - cx, y - cy) < r)
        tileMap[y][x] = 2;
}

// Despeja (deja como suelo) un rectángulo de casillas.
const clearArea = (a, b, c, d) => {
  for (let y = b; y <= d; y++)
    for (let x = a; x <= c; x++)
      tileMap[y][x] = 0;
};

// Zonas despejadas: entrada del búnker, compuertas y arena del jefe.
clearArea(1, 11, 10, 20);

clearArea(15, 12, 17, 19);

clearArea(31, 12, 33, 19);

clearArea(40, 12, 46, 20);

// Cada animal empieza atrapado en un cuadrado 3x3 de pringue.
SAVER_ANIMALS.forEach(a => {
  for (let j = -1; j < 2; j++)
    for (let i = -1; i < 2; i++)
      tileMap[a.ty + j][a.tx + i] = 2;
});

// Muros divisorios con compuerta de 4 casillas (tipo 5).
[16, 32].forEach(x => {
  for (let y = 1; y < MAP_H - 1; y++)
    tileMap[y][x] = y >= 14 && y <= 17 ? 5 : 1;
});

// Edificios: búnker (6), estación de reciclaje (7) y taller (8).
[
  [1, 14],
  [2, 14],
  [1, 15],
  [2, 15]
].forEach(p => tileMap[p[1]][p[0]] = 6);

tileMap[13][6] = tileMap[13][7] = 7;

tileMap[17][6] = tileMap[17][7] = 8;

// ==========================================================================
// 4. COLISIONES Y CREACIÓN DE ENTIDADES
// ==========================================================================

// Indica si una casilla bloquea el paso.
const isSolid = (x, y) => {
  const a = tileMap[y] && tileMap[y][x];
  return a === undefined || a == 1 || a == 5 || a >= 6;
};

// Comprueba si la caja de colisión de una entidad cabe en (x, y).
const canStand = (x, y) => [
  [-4, -5],
  [4, -5],
  [-4, 0],
  [4, 0]
].every(([a, b]) => !isSolid((x + a) / TILE | 0, (y + b) / TILE | 0));

// Añade un residuo recogible al mundo.
const addLitter = (x, y, t) => litter.push({
  x,
  y,
  t
});

// Crea un mugrón (o el jefe si boss es verdadero) en una casilla.
const spawnEnemy = (tx, ty, b) => enemies.push({
  x: tx * TILE + 8,
  y: ty * TILE + 12,
  hp: b ? 40 : 3,
  mx: b ? 40 : 3,
  boss: b,
  t: random() * 5,
  wt: 0,
  ax: 0,
  ay: 0,
  fl: 0
});

// Residuos iniciales cerca del búnker.
for (let i = 0; i < 8; i++)
  addLitter((11 + random() * 4 | 0) * TILE + 8, (1 + random() * 30 | 0) * TILE + 8, random() * 4 | 0);

// Residuos repartidos por todo el mapa.
for (let i = 0; i < 150; i++) {
  const tx = 11 + random() * 36 | 0, ty = 1 + random() * 30 | 0;
  if (!isSolid(tx, ty))
    addLitter(tx * TILE + 3 + random() * 10, ty * TILE + 3 + random() * 10, random() * 4 | 0);
}

// Mugrones iniciales: [casilla inicial, final, cantidad] por zona.
[
  [11, 15, 4],
  [18, 30, 4],
  [34, 46, 3]
].forEach(r => {
  for (let i = 0; i < r[2]; i++) {
    let tx, ty;
    do {
      tx = r[0] + random() * (r[1] - r[0]) | 0;
      ty = 1 + random() * 30 | 0;
    } while (isSolid(tx, ty));
    spawnEnemy(tx, ty, 0);
  }
});

// ==========================================================================
// 5. UTILIDADES, AVISOS Y DIÁLOGOS
// ==========================================================================

// Atajos: capacidad de la bolsa, residuos que lleva y cercanía al jugador.
const bagCapacity = () => 10 + 10 * player.lv.b;

const bagTotal = () => player.bag.reduce((a, b) => a + b);

const isNear = (x, y, r) => Math.hypot(player.x - x, player.y - 6 - y) < r;

/** Muestra un aviso breve sin repetirlo si ya está en pantalla. */
function showToast(t) {
  if (!toasts.some(a => a.t == t)) {
    toasts.push({
      t,
      l: 2.4
    });
    if (toasts.length > 3)
      toasts.shift();
  }
}

/** Parte un texto en líneas de un máximo de n caracteres. */
function wrapText(t, n) {
  const o = [];
  let l = '';
  t.split(' ').forEach(w => {
    if ((l + ' ' + w).trim().length > n) {
      o.push(l);
      l = w;
    } else
      l = (l + ' ' + w).trim();
  });
  o.push(l);
  return o;
}

/** Encola un diálogo (páginas de 4 líneas) y pausa el juego. */
function showDialog(t) {
  const L = wrapText(t, 36);
  for (let i = 0; i < L.length; i += 4)
    dialogPages.push(L.slice(i, i + 4));
  scene = 'dlg';
}

// ==========================================================================
// 6. LÓGICA DE JUEGO (actualización por fotograma)
// ==========================================================================

/** Inicia la partida con la introducción de la historia. */
function startGame() {
  scene = 'play';
  showDialog('Año 2091. El mundo cayó bajo una nube de basura tóxica. Tú te encerraste en el Búnker 13 y sobreviviste.');
  showDialog('Hoy se abre la escotilla. Fuera: pringue, plástico por todas partes y bichos que lo ensucian todo.');
  showDialog('Tu CHATARRATOR aspira residuos (ESPACIO) y dispara agua a presión (K) que limpia la pringue. ¡Cuidado con los MUGRONES!');
  showDialog('Lleva los residuos a la ESTACIÓN verde con E: te dan monedas y chatarra. Con chatarra fabricas armas y armaduras en el TALLER. ¡Salva al mundo!');
}

/** Derrota del jugador: vuelve al búnker y pierde la mitad de la bolsa. */
function playerDies() {
  player.hp = player.mx;
  player.x = 64;
  player.y = 240;
  player.bag = player.bag.map(n => n >> 1);
  showDialog('Has caído... Despiertas en el búnker. Perdiste la mitad de lo que llevabas en la bolsa.');
}

/** Limpia una casilla de pringue; puede soltar un residuo. */
function cleanTile(tx, ty) {
  tileMap[ty][tx] = 3;
  stats.clean++;
  if (random() < 0.3)
    addLitter(tx * TILE + 8, ty * TILE + 8, random() * 4 | 0);
  splash(tx * TILE + 8, ty * TILE + 8);
}

/** Partículas de salpicadura de agua. */
function splash(x, y) {
  for (let i = 0; i < 4; i++)
    particles.push({
      x,
      y,
      vx: random() * 60 - 30,
      vy: random() * 60 - 30,
      l: 0.35,
      c: '#8fe0ff'
    });
}

/** Aplica daño a un enemigo, con retroceso y recompensas al morir. */
function damageEnemy(e, d, vx, vy) {
  e.hp -= d;
  e.fl = 0.15;
  const l = Math.hypot(vx, vy) || 1;
  if (canStand(e.x + vx / l * 4, e.y))
    e.x += vx / l * 4;
  if (canStand(e.x, e.y + vy / l * 4))
    e.y += vy / l * 4;
  if (e.hp <= 0) {
    enemies.splice(enemies.indexOf(e), 1);
    if (e.boss)
      stats.boss++;
    else {
      stats.kill++;
      player.scrap++;
      showToast('+1 chatarra');
    }
    for (let i = 0; i < (e.boss ? 6 : 1 + (random() * 2 | 0)); i++)
      addLitter(e.x + random() * 14 - 7, e.y + random() * 10 - 8, random() * 4 | 0);
  }
}

/** Jugador: movimiento, aspiración del Chatarrator y disparo de agua. */
function updatePlayer(dt) {
  const dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
  if (dx || dy) {
    player.d = dx ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0;
    player.wk += dt * 8;
    const sp = 52 * (tileMap[(player.y - 2) / TILE | 0][player.x / TILE | 0] == 2 ? 0.55 : 1), l = Math.hypot(dx, dy), nx = player.x + dx / l * sp * dt, ny = player.y + dy / l * sp * dt;
    if (canStand(nx, player.y))
      player.x = nx;
    if (canStand(player.x, ny))
      player.y = ny;
  }
  player.inv -= dt;
  isSucking = 0;
  const D = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ][player.d];
  if (keys[' '] || keys.j) {
    isSucking = 1;
    const Rg = 36 + 10 * player.lv.t;
    for (let i = litter.length - 1; i >= 0; i--) {
      const it = litter[i], vx = it.x - player.x, vy = it.y - (player.y - 6), f = vx * D[0] + vy * D[1], pr = Math.abs(vx * D[1] - vy * D[0]);
      if (f > -5 && f < Rg && pr < 8 + f * 0.45) {
        const dd = Math.hypot(vx, vy) || 1;
        if (dd < 7) {
          if (bagTotal() >= bagCapacity()) {
            showToast('¡Mochila llena! Ve a reciclar');
            break;
          }
          player.bag[it.t]++;
          stats[WASTE_KEYS[it.t]]++;
          litter.splice(i, 1);
          if (!seenWasteTypes[it.t]) {
            seenWasteTypes[it.t] = 1;
            showToast(WASTE_TIPS[it.t]);
          }
        } else {
          const v = Math.min(dd, (70 + (Rg - f) * 1.5) * dt);
          it.x -= vx / dd * v;
          it.y -= vy / dd * v;
        }
      }
    }
  }
  shotCooldown -= dt;
  if ((keys.k || keys.x || keys.z) && shotCooldown <= 0) {
    shotCooldown = [0.45, 0.38, 0.32, 0.26][player.lv.w];
    waterShots.push({
      x: player.x + D[0] * 8,
      y: player.y - 7 + D[1] * 8,
      vx: D[0] * 140,
      vy: D[1] * 140,
      l: 0.55 + 0.08 * player.lv.w
    });
  }
}

/** Proyectiles de agua (limpian pringue, dañan enemigos) y partículas. */
function updateShots(dt) {
  for (let i = waterShots.length - 1; i >= 0; i--) {
    const b = waterShots[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.l -= dt;
    let dead = b.l <= 0;
    const tx = b.x / TILE | 0, ty = b.y / TILE | 0;
    if (!dead) {
      if (tileMap[ty] && tileMap[ty][tx] == 2) {
        cleanTile(tx, ty);
        dead = 1;
      } else if (isSolid(tx, ty))
        dead = 1;
    }
    if (!dead)
      for (const e of enemies)
        if (Math.hypot(e.x - b.x, e.y - 6 - b.y) < (e.boss ? 13 : 8)) {
          damageEnemy(e, [1, 2, 3, 4][player.lv.w], b.vx, b.vy);
          dead = 1;
          break;
        }
    if (dead) {
      splash(b.x, b.y);
      waterShots.splice(i, 1);
    }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if ((p.l -= dt) <= 0)
      particles.splice(i, 1);
  }
}

/** Mugrones y jefe: persecución, ensuciado del mapa, daño y reaparición. */
function updateEnemies(dt) {
  for (const e of enemies) {
    const ex = player.x - e.x, ey = player.y - e.y, d = Math.hypot(ex, ey) || 1, ch = d < (e.boss ? 170 : 64);
    e.fl -= dt;
    let vx, vy;
    if (ch) {
      vx = ex / d;
      vy = ey / d;
    } else {
      if ((e.wt -= dt) < 0) {
        e.wt = 1 + random() * 2;
        e.ax = random() * 2 - 1;
        e.ay = random() * 2 - 1;
      }
      vx = e.ax * 0.6;
      vy = e.ay * 0.6;
    }
    const sp = (e.boss ? 24 : 27) * dt, nx = e.x + vx * sp, ny = e.y + vy * sp;
    if (canStand(nx, e.y))
      e.x = nx;
    else
      e.wt = 0;
    if (canStand(e.x, ny))
      e.y = ny;
    else
      e.wt = 0;
    if ((e.t -= dt) < 0) {
      e.t = e.boss ? 2.2 : 6 + random() * 3;
      const bx = e.boss ? (e.x + (random() * 5 - 2) * TILE) / TILE | 0 : e.x / TILE | 0, by = e.boss ? (e.y + (random() * 5 - 2) * TILE) / TILE | 0 : (e.y - 2) / TILE | 0;
      if (tileMap[by] && (tileMap[by][bx] == 0 || tileMap[by][bx] == 3))
        tileMap[by][bx] = 2;
      if (random() < 0.4)
        addLitter(e.x, e.y, random() * 4 | 0);
    }
    if (d < (e.boss ? 13 : 9) && player.inv <= 0) {
      const dm = Math.max(1, (e.boss ? 4 : 2) - player.lv.a);
      player.hp -= dm;
      player.inv = 1;
      if (canStand(player.x - ex / d * 7, player.y))
        player.x -= ex / d * 7;
      if (canStand(player.x, player.y - ey / d * 7))
        player.y -= ey / d * 7;
      showToast('-' + dm + ' PV');
      if (player.hp <= 0)
        playerDies();
    }
  }
  if ((spawnTimer -= dt) <= 0) {
    spawnTimer = 9;
    if (enemies.filter(e => !e.boss).length < 10) {
      const zm = gatesOpen[0] ? gatesOpen[1] ? MAP_W * TILE : 32 * TILE : 16 * TILE;
      for (let n = 0; n < 20; n++) {
        const tx = 11 + random() * (zm / TILE - 12) | 0, ty = 1 + random() * 30 | 0;
        if (!isSolid(tx, ty) && Math.hypot(tx * TILE - player.x, ty * TILE - player.y) > 110) {
          spawnEnemy(tx, ty, 0);
          break;
        }
      }
    }
  }
}

/** Ahorrilos: liberación al limpiar a su alrededor e interés periódico. */
function updateAnimals(dt) {
  for (const a of SAVER_ANIMALS) {
    if (!a.res) {
      let ok = 1;
      for (let j = -1; j < 2; j++)
        for (let i = -1; i < 2; i++)
          if (tileMap[a.ty + j][a.tx + i] == 2)
            ok = 0;
      if (ok) {
        a.res = 1;
        stats.resc++;
        showDialog(`¡${ a.n } liberado! "Mi barriga es una hucha: guarda tus monedas y yo las hago crecer con interés." E: ingresar 10 monedas · R: retirar todo.`);
      }
    } else if (a.sv > 0 && (a.t += dt) > 12) {
      a.t = 0;
      const p = Math.max(1, Math.floor(a.sv * 0.1));
      a.sv += p;
      stats.int++;
      showToast(`${ a.n }: +${ p } de interés`);
    }
  }
}

// ==========================================================================
// 7. MISIONES, INTERACCIONES Y TIENDA
// ==========================================================================

/** Comprueba el progreso de misiones principales y secundarias. */
function checkQuests() {
  const m = MAIN_QUESTS[mainQuestIndex];
  if (m && stats[m.k] >= m.g) {
    mainQuestIndex++;
    player.coins += 20;
    showToast('¡Misión principal cumplida! +20$');
    if (mainQuestIndex == 1)
      showDialog('La pringue vuelve si no reciclas. Lleva basura a la ESTACIÓN verde y pulsa E.');
    if (mainQuestIndex == 2)
      showDialog('Las compuertas se abren con monedas: acércate y pulsa E. Más allá hay zonas peores... y alguien muy sucio.');
    if (mainQuestIndex == 3) {
      spawnEnemy(42, 16, 1);
      showDialog('¡La última compuerta cae! El suelo tiembla: el REY MUGRÓN, la plaga madre, emerge de la pringue. ¡Derrótalo!');
    }
    if (mainQuestIndex == 4) {
      scene = 'end';
      endTime = 0;
    }
  }
  SIDE_QUESTS.forEach((q, i) => {
    if (!sideQuestsDone[i] && stats[q[1]] >= q[2]) {
      sideQuestsDone[i] = 1;
      player.coins += q[3];
      showDialog(`MISIÓN COMPLETADA: ${ q[0] }. +${ q[3] } monedas. ${ q[4] }`);
    }
  });
}

/** Acción con E o R: estación, taller, búnker, ahorrilos y compuertas. */
function interact(w) {
  if (isNear(7 * TILE, 13.5 * TILE, 28) && w != 'r') {
    const t = bagTotal(), f = RECYCLING_FACTS[random() * RECYCLING_FACTS.length | 0];
    if (!t)
      return showDialog('Estación de reciclaje. Aún no traes residuos. ' + f);
    const c = player.bag[0] * 2 + player.bag[1] * 3 + player.bag[2] * 2 + player.bag[3], ch = player.bag[1] * 2 + player.bag[0];
    player.coins += c;
    player.scrap += ch;
    stats.rec += t;
    stats.earn += c;
    player.bag = [0, 0, 0, 0];
    return showDialog(`Reciclaste ${ t } residuos: +${ c } monedas y +${ ch } chatarra. ${ f }`);
  }
  if (isNear(7 * TILE, 17.5 * TILE, 28) && w != 'r') {
    scene = 'shop';
    return;
  }
  if (isNear(2 * TILE, 15 * TILE, 30) && w != 'r') {
    player.hp = player.mx;
    return showToast('Descansas en el búnker: PV al máximo');
  }
  for (const a of SAVER_ANIMALS)
    if (isNear(a.tx * TILE + 8, a.ty * TILE + 8, 24)) {
      if (!a.res)
        return showDialog('Está atrapado en la pringue. Límpiala con agua (K) alrededor de él.');
      if (w == 'r' || player.coins < 10) {
        if (!a.sv)
          return showDialog(`${ a.n }: no hay nada guardado. Con 10 monedas, pulsa E para ingresar.`);
        player.coins += a.sv;
        showToast(`${ a.n } te devuelve ${ a.sv }$`);
        return void (a.sv = 0);
      }
      player.coins -= 10;
      a.sv += 10;
      stats.dep += 10;
      return showDialog(`${ a.n } guarda 10 monedas. Total: ${ a.sv }. Cada 12 s sube un 10% (interés). Si no hay monedas, E retira.`);
    }
  for (let i = 0; i < 2; i++)
    if (!gatesOpen[i] && isNear((16 + 16 * i + 0.5) * TILE, 16 * TILE, 44)) {
      if (player.coins >= GATE_COSTS[i]) {
        player.coins -= GATE_COSTS[i];
        gatesOpen[i] = 1;
        stats.gate++;
        for (let y = 14; y < 18; y++)
          tileMap[y][16 + 16 * i] = 0;
        return showToast('¡Compuerta abierta!');
      }
      return showDialog(`La compuerta ${ i + 1 } cuesta ${ GATE_COSTS[i] } monedas. Te faltan ${ GATE_COSTS[i] - player.coins }. ¡Recicla!`);
    }
}

/** Compra una mejora del taller si hay chatarra y requisitos. */
function buyUpgrade(i) {
  const it = SHOP_ITEMS[i];
  if (!it)
    return;
  const [n, k, v, c] = it;
  if (player.lv[k] >= v)
    return showToast('Ya lo tienes');
  if (player.lv[k] != v - 1)
    return showToast('Necesitas la mejora anterior');
  if (player.scrap < c)
    return showToast('Faltan ' + (c - player.scrap) + ' de chatarra');
  player.scrap -= c;
  player.lv[k] = v;
  stats.buy++;
  showToast('¡Fabricado: ' + n + '!');
}

// ==========================================================================
// 8. ENTRADA (teclado, controles táctiles y puntero)
// ==========================================================================

/** Gestiona las pulsaciones puntuales según la pantalla actual. */
function handlePress(k) {
  if (scene == 'title') {
    if (k == 'enter' || k == ' ' || k == 'e')
      startGame();
    return;
  }
  if (scene == 'end') {
    if (endTime > 12 && (k == 'enter' || k == 'e' || k == ' '))
      scene = 'play';
    return;
  }
  if (scene == 'dlg') {
    if (k == ' ' || k == 'e' || k == 'enter') {
      dialogPages.shift();
      if (!dialogPages.length)
        scene = 'play';
    }
    return;
  }
  if (scene == 'shop') {
    if (k == 'q' || k == 'e' || k == 'escape')
      scene = 'play';
    else if (/^[0-9]$/.test(k))
      buyUpgrade((+k + 9) % 10);
    return;
  }
  if (scene == 'quests') {
    if (k == 'q' || k == 'e' || k == 'escape')
      scene = 'play';
    if (k == 'arrowright' || k == 'd')
      questPage = (questPage + 1) % 4;
    if (k == 'arrowleft' || k == 'a')
      questPage = (questPage + 3) % 4;
    return;
  }
  if (k == 'e' || k == 'r')
    interact(k);
  if (k == 'q' || k == 'escape')
    scene = 'quests';
}

// Teclado.
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow') || k == ' ')
    e.preventDefault();
  if (!e.repeat)
    handlePress(k);
  keys[k] = 1;
});

addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);

// Controles táctiles (botones con data-k).
document.querySelectorAll('#pad [data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    keys[k] = 1;
    handlePress(k);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(v => b.addEventListener(v, () => keys[k] = 0));
});

// Toque sobre el canvas: avanzar diálogos y comprar en el taller.
canvas.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * VIEW_H;
  if (scene == 'shop') {
    const i = Math.floor((y - 30) / 12);
    if (i >= 0 && i < 10)
      buyUpgrade(i);
    else
      handlePress('q');
  } else
    handlePress('e');
});

// ==========================================================================
// 9. RENDERIZADO (canvas pixelado + capa de texto nítida)
// ==========================================================================

// Rectángulo de color (en píxeles enteros) sobre el canvas del juego.
const rect = (c, x, y, w, h) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

// Capa de texto a resolución real de pantalla, sobre el canvas pixelado.
const textCanvas = document.getElementById('o');

const textCtx = textCanvas.getContext('2d');

let textScale = 1;

let textAlpha = 1;

/** Ajusta la resolución de la capa de texto al tamaño en pantalla. */
function fitTextCanvas() {
  const w = Math.max(256, Math.round(canvas.clientWidth * (window.devicePixelRatio || 1)));
  if (textCanvas.width != w) {
    textCanvas.width = w;
    textCanvas.height = Math.round(w * VIEW_H / VIEW_W);
  }
  textScale = textCanvas.width / VIEW_W;
}

function setTextFont(f) {
  const z = +(/(\d+)px/.exec(f) || [0, 8])[1], b = /bold/.test(f);
  textCtx.font = `${ b ? 'bold' : '600' } ${ z * (z <= 9 ? 1.25 : 1) * textScale }px "Trebuchet MS",Verdana,sans-serif`;
}

const textWidth = (t, f = '8px') => {
  setTextFont(f);
  return textCtx.measureText(t).width / textScale;
};

/** Dibuja texto nítido con contorno en coordenadas lógicas. */
function drawText(t, x, y, c = '#fff', al = 'left', f = '8px', sh = '#000') {
  setTextFont(f);
  textCtx.textAlign = al;
  textCtx.globalAlpha = textAlpha;
  textCtx.lineJoin = 'round';
  textCtx.lineWidth = Math.max(2, 1.6 * textScale);
  textCtx.strokeStyle = sh;
  textCtx.strokeText(t, x * textScale, y * textScale);
  textCtx.fillStyle = c;
  textCtx.fillText(t, x * textScale, y * textScale);
  textCtx.globalAlpha = 1;
}

/** Dibuja una casilla del mapa. */
function drawTile(t, X, Y, a, b) {
  const h = (a * 73856093 ^ b * 19349663) >>> 0;
  if (t == 2) {
    rect('#2e3d16', X, Y, TILE, TILE);
    const o = Math.floor(elapsed * 2 + h % 7) % 3;
    rect('#6fc82a', X + 2 + h % 9, Y + 3 + o, 3, 2);
    rect('#9be04a', X + 9 - (h >> 3) % 5, Y + 9 - o, 2, 2);
    rect('#1f2a0e', X + (h >> 5) % 10, Y + 11, 5, 3);
    return;
  }
  if (t == 3) {
    rect('#52a83c', X, Y, TILE, TILE);
    rect('#3f8a2c', X + h % 12, Y + (h >> 4) % 12, 2, 3);
    if (h % 7 == 0) {
      rect('#fff', X + (h >> 3) % 12, Y + (h >> 6) % 12, 2, 2);
    }
    return;
  }
  if (t == 5) {
    rect('#4a4a56', X, Y, TILE, TILE);
    for (let i = 0; i < TILE; i += 4)
      rect(i % 8 ? '#222' : '#d8b020', X + i, Y, 4, TILE);
    rect('#ccc', X, Y + 7, TILE, 2);
    return;
  }
  if (t == 6) {
    rect('#3c4046', X, Y, TILE, TILE);
    rect('#2a2d31', X + 2, Y + 2, 12, 12);
    if (b == 14)
      rect('#d8b020', X, Y, TILE, 3);
    if (a == 2 && b == 15)
      rect('#111', X + 2, Y + 3, 12, 13);
    return;
  }
  if (t == 7) {
    rect('#2f8a4a', X, Y, TILE, TILE);
    rect('#1c5a2e', X, Y + 12, TILE, 4);
    rect('#bff0c8', X + 4, Y + 3, 8, 6);
    return;
  }
  if (t == 8) {
    rect('#b0662a', X, Y, TILE, TILE);
    rect('#6a3a14', X, Y + 12, TILE, 4);
    rect('#e8c040', X + 2, Y + 3, 12, 3);
    return;
  }
  rect('#8c7c5e', X, Y, TILE, TILE);
  rect('#7a6a4e', X + h % 12, Y + (h >> 4) % 12, 2, 1);
  rect('#9a8a6c', X + (h >> 8) % 13, Y + (h >> 12) % 13, 1, 1);
  if (t == 1) {
    rect('#5a5a60', X + 1, Y + 4, 14, 11);
    rect('#7c7c84', X + 1, Y + 4, 14, 3);
    rect('#8a4b2a', X + 3 + h % 5, Y + 8, 4, 2);
    rect('#3a3a40', X + 9, Y + 7, 5, 6);
  }
}

/** Dibuja un mugrón (o el Rey Mugrón, escalado y con corona). */
function drawMugron(X, Y, sc, fl, boss) {
  ctx.save();
  ctx.translate(Math.round(X), Math.round(Y));
  ctx.scale(sc, sc);
  const c = fl > 0 ? '#fff' : '#4a6a1a';
  rect('rgba(0,0,0,.3)', -6, -1, 12, 3);
  rect(c, -6, -9, 12, 9);
  rect(fl > 0 ? '#fff' : '#6fa028', -5, -11, 10, 3);
  rect(c, -7, -3, 3, 3);
  rect(c, 4, -3, 3, 3);
  rect('#f22', -3, -7, 2, 2);
  rect('#f22', 1, -7, 2, 2);
  rect('#1a2a0a', -2, -3, 4, 1);
  if (boss) {
    rect('#d8b020', -5, -14, 2, 4);
    rect('#d8b020', -1, -15, 2, 5);
    rect('#d8b020', 3, -14, 2, 4);
  }
  ctx.restore();
}

/** Dibuja al superviviente según dirección, armadura y arma. */
function drawPlayer(X, Y, d, wk, a, w) {
  const b = Math.floor(wk) % 2, D = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ][d], J = ['#5e6b3a', '#8a8a8a', '#7a5230', '#6a86a0'][a], wc = ['#9a9a9a', '#7a9ab0', '#c08040', '#d84a2a'][w];
  rect('rgba(0,0,0,.3)', X - 5, Y - 1, 10, 3);
  rect('#3a3a44', X - 4, Y - 5, 3, 5 - (b && d % 2 == 0 ? 1 : 0));
  rect('#3a3a44', X + 1, Y - 5, 3, 5 - (!b && d % 2 == 0 ? 1 : 0));
  const gun = () => {
    rect(wc, X + D[0] * 6 - 2, Y - 8 + D[1] * 6 - 2, 4, 4);
    rect('#444', X + D[0] * 9 - 1, Y - 8 + D[1] * 9 - 1, 3, 3);
  };
  if (d == 0)
    gun();
  rect(J, X - 5, Y - 13, 10, 9);
  rect('#3a3a30', X - 5, Y - 6, 10, 2);
  rect(J, X - 7, Y - 12, 2, 6);
  rect(J, X + 5, Y - 12, 2, 6);
  rect('#e0b484', X - 4, Y - 19, 8, 7);
  if (d != 0) {
    rect('#2a2a2a', X - 4, Y - 15, 8, 3);
    rect('#8ad', X - 3, Y - 15, 2, 2);
    rect('#8ad', X + 1, Y - 15, 2, 2);
  }
  rect('#555', X - 5, Y - 21, 10, 4);
  if (d == 0)
    rect('#4a5a2a', X - 4, Y - 13, 8, 8);
  if (a > 0) {
    rect('#bbb', X - 7, Y - 14, 3, 3);
    rect('#bbb', X + 4, Y - 14, 3, 3);
  }
  if (d != 0)
    gun();
}

/** Dibuja el mundo completo y el HUD. */
function drawWorld() {
  const cx = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, Math.round(player.x - VIEW_W / 2))), cy = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, Math.round(player.y - VIEW_H / 2)));
  for (let b = cy / TILE | 0; b <= (cy + VIEW_H) / TILE; b++)
    for (let a = cx / TILE | 0; a <= (cx + VIEW_W) / TILE; a++)
      if (tileMap[b] && tileMap[b][a] !== undefined)
        drawTile(tileMap[b][a], a * TILE - cx, b * TILE - cy, a, b);
  drawText('BÚNKER 13', 2 * TILE - cx, 14 * TILE - cy - 3, '#d8b020', 'center');
  drawText('RECICLAR', 7 * TILE - cx, 13 * TILE - cy - 3, '#bff0c8', 'center');
  drawText('TALLER', 7 * TILE - cx, 17 * TILE - cy - 3, '#ffd890', 'center');
  [0, 1].forEach(i => {
    if (!gatesOpen[i])
      drawText(GATE_COSTS[i] + '$', (16.5 + 16 * i) * TILE - cx, 14 * TILE - cy - 3, '#ff8', 'center');
  });
  for (const it of litter) {
    const X = it.x - cx, Y = it.y - cy;
    if (X < -8 || X > VIEW_W + 8 || Y < -8 || Y > VIEW_H + 8)
      continue;
    rect('rgba(0,0,0,.3)', X - 2, Y + 1, 5, 2);
    rect(WASTE_COLORS[it.t], X - 2, Y - 4, 5, 5);
    rect('#fff', X - 1, Y - 3, 1, 1);
  }
  for (const a of SAVER_ANIMALS) {
    const X = a.tx * TILE + 8 - cx, Y = a.ty * TILE + 14 - cy;
    rect('rgba(0,0,0,.3)', X - 6, Y - 1, 12, 3);
    rect(a.c, X - 5, Y - 8, 10, 7);
    rect(a.c, X - 4, Y - 13, 8, 6);
    rect(a.c, X - 4, Y - 15, 2, 3);
    rect(a.c, X + 2, Y - 15, 2, 3);
    rect('#000', X - 2, Y - 11, 1, 1);
    rect('#000', X + 1, Y - 11, 1, 1);
    rect('#222', X - 2, Y - 8, 4, 1);
    if (!a.res)
      rect('#2e3d16', X - 7, Y - 4, 14, 4);
    else {
      rect('#e22', X - 1, Y - 19 - Math.round(Math.sin(elapsed * 4) * 1), 3, 2);
      if (isNear(a.tx * TILE + 8, a.ty * TILE + 8, 40))
        drawText(a.n + ' ' + a.sv + '$', X, Y - 22, '#ff8', 'center');
    }
  }
  for (const e of enemies)
    drawMugron(e.x - cx, e.y - cy, e.boss ? 2.2 : 1, e.fl, e.boss);
  for (const b of waterShots) {
    rect('#8fe0ff', b.x - cx - 1, b.y - cy - 1, 3, 3);
    rect('#fff', b.x - cx, b.y - cy, 1, 1);
  }
  const X = Math.round(player.x - cx), Y = Math.round(player.y - cy);
  if (isSucking) {
    const D = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
      ][player.d], Rg = 36 + 10 * player.lv.t;
    for (let i = 0; i < 7; i++) {
      const f = Rg - (elapsed * 70 + i * 11) % Rg, l = (i % 3 - 1) * (2 + f * 0.35);
      rect('#cff4ff', X - D[1] * l + D[0] * f - 1, Y - 7 + D[0] * l + D[1] * f - 1, 2, 2);
    }
  }
  if (player.inv <= 0 || Math.floor(elapsed * 20) % 2)
    drawPlayer(X, Y, player.d, player.wk, player.lv.a, player.lv.w);
  for (const p of particles)
    rect(p.c, p.x - cx, p.y - cy, 2, 2);
  rect('rgba(0,0,0,.8)', 0, 0, VIEW_W, 13);
  for (let i = 0; i < player.mx; i++)
    rect(i < player.hp ? '#e83030' : '#4a2020', 3 + i * 6, 3, 5, 6);
  drawText(`BOLSA ${ bagTotal() }/${ bagCapacity() } $${ player.coins } CHAT ${ player.scrap }`, 66, 10, '#fff');
  rect('rgba(0,0,0,.7)', 0, 13, VIEW_W, 12);
  const m = MAIN_QUESTS[mainQuestIndex];
  drawText(m ? `> ${ m.t } ${ Math.min(stats[m.k], m.g) }/${ m.g }` : '> Misiones secundarias: pulsa Q', 3, 22, '#ffd890');
  const bs = enemies.find(e => e.boss);
  if (bs) {
    rect('#300', 60, VIEW_H - 10, 136, 6);
    rect('#e22', 61, VIEW_H - 9, 134 * bs.hp / bs.mx, 4);
    drawText('REY MUGRÓN', 128, VIEW_H - 12, '#fff', 'center');
  }
  toasts.forEach((t, i) => {
    const w = textWidth(t.t) + 12;
    rect('rgba(0,0,0,.8)', 128 - w / 2, 28 + i * 14, w, 13);
    drawText(t.t, 128, 38 + i * 14, '#fff', 'center');
  });
}

/** Cuadro de diálogo estilo RPG clásico. */
function drawDialogBox(l) {
  rect('#202020', 4, VIEW_H - 60, VIEW_W - 8, 56);
  rect('#fffdf2', 6, VIEW_H - 58, VIEW_W - 12, 52);
  l.forEach((s, i) => drawText(s, 12, VIEW_H - 44 + i * 12, '#1a1a1a', 'left', '9px', '#fffdf2'));
  if (Math.floor(elapsed * 3) % 2)
    rect('#c03030', VIEW_W - 16, VIEW_H - 12, 6, 4);
}

/** Panel oscuro con título para menús. */
function drawPanel(t) {
  rect('rgba(0,0,0,.85)', 8, 8, VIEW_W - 16, VIEW_H - 16);
  rect('#d8b020', 8, 8, VIEW_W - 16, 1);
  rect('#d8b020', 8, VIEW_H - 9, VIEW_W - 16, 1);
  drawText(t, 128, 20, '#ffd890', 'center', 'bold 9px "Courier New",monospace');
}

/** Pantalla del taller de chatarra. */
function drawShop() {
  drawPanel('TALLER DE CHATARRA — tienes ' + player.scrap + ' chat.');
  SHOP_ITEMS.forEach((it, i) => {
    const o = player.lv[it[1]] >= it[2], y = 36 + i * 12, c = o ? '#6c6' : player.lv[it[1]] == it[2] - 1 && player.scrap >= it[3] ? '#fff' : '#999';
    drawText(`${ (i + 1) % 10 } ${ it[0] }`, 14, y, c);
    drawText(`${ it[4] }`, 170, y, c);
    drawText(o ? 'OK' : it[3] + 'ch', VIEW_W - 14, y, c, 'right');
  });
  drawText('Pulsa número o toca. E: salir', 128, VIEW_H - 14, '#aaa', 'center');
}

/** Registro de misiones paginado. */
function drawQuestLog() {
  drawPanel('MISIONES  pág ' + (questPage + 1) + '/4  (←/→)');
  const all = MAIN_QUESTS.map((m, i) => [
    m.t,
    m.k,
    m.g,
    i < mainQuestIndex
  ]).concat(SIDE_QUESTS.map((q, i) => [
    q[0],
    q[1],
    q[2],
    sideQuestsDone[i]
  ]));
  all.slice(questPage * 9, questPage * 9 + 9).forEach((q, i) => drawText(`${ q[3] ? '[X]' : '[ ]' } ${ q[0] } ${ Math.min(stats[q[1]], q[2]) }/${ q[2] }`, 14, 36 + i * 12, q[3] ? '#6c6' : '#fff', 'left', '7px'));
  drawText('Q: cerrar', 128, VIEW_H - 14, '#aaa', 'center');
}

/** Nube para el final. */
function drawCloud(x, y, r) {
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  [
    [0, 0, 1],
    [
      r * 0.8,
      3,
      0.8
    ],
    [
      -r * 0.8,
      4,
      0.7
    ],
    [
      r * 1.5,
      5,
      0.55
    ]
  ].forEach(c => {
    ctx.beginPath();
    ctx.arc(x + c[0], y + c[1], r * c[2], 0, 7);
    ctx.fill();
  });
}

/** Final: fundido a blanco y paisaje Frutiger Aero con el mensaje. */
function drawEnd() {
  if (endTime < 2.5) {
    textAlpha = 1 - endTime / 2.5;
    drawWorld();
    textAlpha = 1;
    rect('rgba(255,255,255,' + endTime / 2.5 + ')', 0, 0, VIEW_W, VIEW_H);
    return;
  }
  const gr = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gr.addColorStop(0, '#0a78e8');
  gr.addColorStop(0.5, '#7cd0ff');
  gr.addColorStop(0.65, '#d8f4ff');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const rg = ctx.createRadialGradient(205, 28, 2, 205, 28, 70);
  rg.addColorStop(0, '#fff');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(120, 0, 136, 110);
  drawCloud(50 + Math.sin(elapsed * 0.3) * 6, 34, 12);
  drawCloud(170 - Math.sin(elapsed * 0.25) * 8, 58, 9);
  ctx.fillStyle = '#5cc83a';
  ctx.beginPath();
  ctx.ellipse(70, 182, 160, 62, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#3fae2a';
  ctx.beginPath();
  ctx.ellipse(220, 190, 150, 58, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#2f9a20';
  ctx.fillRect(0, 150, VIEW_W, 26);
  for (let i = 0; i < 9; i++) {
    const x = (i * 47 + elapsed * (4 + i)) % VIEW_W, y = VIEW_H - (i * 31 + elapsed * (9 + i * 2)) % VIEW_H, r = 3 + i % 4 * 2;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    ctx.stroke();
    rect('#fff', x - r / 2, y - r / 2, 2, 2);
  }
  drawPlayer(128, 150, 2, 0, player.lv.a, player.lv.w);
  const a = Math.max(0, Math.min(1, (endTime - 5.5) / 2));
  ctx.globalAlpha = textAlpha = a;
  rect('rgba(255,255,255,.45)', 14, 46, 228, 62);
  rect('rgba(255,255,255,.9)', 14, 46, 228, 1);
  wrapText('¡Has salvado al mundo de la contaminación! Ahora te toca hacerlo en la vida real.', 33).forEach((l, i) => drawText(l, 128, 64 + i * 14, '#064a8c', 'center', 'bold 10px', '#fff'));
  ctx.globalAlpha = 1;
  textAlpha = 1;
  if (endTime > 12)
    drawText('ENTER: seguir con las misiones secundarias', 128, VIEW_H - 4, '#fff', 'center', '8px "Courier New",monospace', '#064a8c');
  rect('rgba(255,255,255,' + Math.max(0, 1 - (endTime - 2.5) / 4) + ')', 0, 0, VIEW_W, VIEW_H);
}

/** Pantalla de título. */
function drawTitle() {
  const gr = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gr.addColorStop(0, '#2a2018');
  gr.addColorStop(0.6, '#a8602a');
  gr.addColorStop(1, '#3a2a1a');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(255,200,120,.5)';
  ctx.beginPath();
  ctx.arc(190, 95, 24, 0, 7);
  ctx.fill();
  for (let i = 0; i < 16; i++) {
    const h = 20 + i * 37 % 50;
    rect('#1a1410', i * 16, 130 - h, 12, h + 46);
  }
  rect('#2f4a1a', 0, 150, VIEW_W, 26);
  for (let i = 0; i < 12; i++)
    rect('#6fc82a', (i * 23 + elapsed * 8) % VIEW_W, 152 + i % 3 * 6, 5, 2);
  drawText('YERMO LIMPIO', 128, 50, '#ffd890', 'center', 'bold 24px "Courier New",monospace');
  drawText('Salva al mundo de la basura', 128, 66, '#fff', 'center');
  if (Math.floor(elapsed * 2) % 2)
    drawText('ENTER / toca para empezar', 128, 95, '#fff', 'center');
  drawText('Inspirado en Island Saver', 128, VIEW_H - 5, '#cba', 'center', '7px "Courier New",monospace');
}

// ==========================================================================
// 10. BUCLE PRINCIPAL Y ARRANQUE
// ==========================================================================

let lastFrameTime = performance.now();

/** Bucle principal: actualiza, dibuja y se vuelve a programar. */
function gameLoop(n) {
  const dt = Math.min(0.05, (n - lastFrameTime) / 1000);
  lastFrameTime = n;
  elapsed += dt;
  if (scene == 'play') {
    updatePlayer(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateAnimals(dt);
    checkQuests();
  } else if (scene == 'end')
    endTime += dt;
  toasts.forEach(t => t.l -= dt);
  toasts = toasts.filter(t => t.l > 0);
  fitTextCanvas();
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  if (scene == 'title')
    drawTitle();
  else if (scene == 'end')
    drawEnd();
  else {
    // Con un menú a pantalla completa abierto, el texto del mundo se oculta
    // para que no se transparente sobre el panel.
    textAlpha = (scene == 'shop' || scene == 'quests') ? 0 : 1;
    drawWorld();
    textAlpha = 1;
    if (scene == 'dlg')
      drawDialogBox(dialogPages[0]);
    if (scene == 'shop')
      drawShop();
    if (scene == 'quests')
      drawQuestLog();
  }
  requestAnimationFrame(gameLoop);
}

// Arranque.
requestAnimationFrame(gameLoop);

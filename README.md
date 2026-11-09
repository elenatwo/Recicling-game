# SCRAPHEAP: Protocolo Vertedero

ARPG isométrico de botín, ambientado en un vertedero futurista donde toda la basura ha cobrado vida. Incluye el Acto 1 completo ("Sector Cero: Las Fauces de Chatarra") y la pantalla final.

## Plan técnico

1. **Stack:** HTML5 + JavaScript puro + Canvas 2D, sin dependencias: se abre en cualquier navegador y no requiere instalación.
2. **Mundo:** proyección isométrica 2:1 (rombos de 64×32), ordenación por profundidad, iluminación por capas y cámara con suavizado y temblor.
3. **Datos:** enemigos, objetos, afijos, únicos, conjuntos, gemas, habilidades, zonas, misiones y NPCs en JSON (`src/data`).
4. **Contenido procedural:** losetas, muros, personajes, iconos, efectos, música y sonido se generan por código. No hay archivos de arte ni audio.
5. **Entrega:** código modular en `src/` y un empaquetador (`build.js`) que genera un único HTML jugable (`dist/scrapheap.html`).

## Cómo jugar

- **Opción rápida:** abre `JUGAR.html` (o `dist/scrapheap.html`) con doble clic. Funciona sin servidor.
- **Desarrollo:** `index.html` también se abre con doble clic. Si lo sirves con un servidor (`npx serve .` o `python3 -m http.server`), lee los JSON directamente; abierto como archivo, usa la copia `src/data/bundle.js`, que se regenera con `node build.js` cada vez que cambias un JSON.
- **Reempaquetar tras cambiar código o datos:** `node build.js`.

En el título puedes activar el **modo demo** (zonas más pequeñas, más experiencia y más botín) para una partida de 30–45 minutos. La partida normal dura entre 2 y 4 horas.

## Controles

| Entrada | Acción |
|---|---|
| Clic izquierdo | Moverse, atacar al objetivo, recoger, hablar, usar. Mantén pulsado para seguir moviéndote o atacando. |
| Clic derecho | Lanzar la habilidad seleccionada |
| Q W E R D F | Elegir la habilidad del botón derecho (pasa el cursor sobre una habilidad y pulsa la tecla para asignarla) |
| 1–4 | Usar el cinturón (kits de reparación = vida, baterías = carga) |
| Mayús | Atacar sin moverte |
| Alt | Mostrar todos los nombres de los objetos del suelo |
| I / C / T / L | Inventario, personaje, árbol de habilidades, diario de misiones |
| M o Tab | Minimapa → mapa completo semitransparente → oculto |
| Espacio | Cerrar ventanas |
| Esc | Pausa (opciones, controles, guardar, salir) |

Inventario: clic para coger y soltar; clic derecho para equipar o usar; con una tienda abierta, clic derecho vende; con el Cofre-Dron abierto, clic derecho mueve entre cofre e inventario. Para engarzar, coge una gema y suéltala sobre un objeto con ranuras libres.

## Contenido

- **Clase:** el Reciclador. Cuatro atributos (Fuerza, Destreza, Vitalidad, Energía), niveles 1–20, +5 atributos y +1 habilidad por nivel.
- **Árbol de habilidades:** tres ramas (Soldadura, Electrónica, Reciclaje) con 15 habilidades, requisitos de nivel y prerrequisitos.
- **Combate:** precisión contra defensa, daño mínimo–máximo, críticos, bloqueo, armadura, cinco tipos de daño (físico, eléctrico, tóxico, fuego, magnético) y estados (aturdimiento, ralentización, veneno, quemadura, corrosión, sangrado, confusión). También hay números flotantes, retroceso, hit-stop y temblor de pantalla.
- **Enemigos:** 12 tipos de basura viviente con IA distinta, 8 variantes, rarezas (normal, mutante, campeón, único), 7 afijos de campeón, 3 minijefes y EL COMPACTADOR con 3 fases.
- **Botín:** 5 rarezas por color, afijos procedurales por iLvl con concordancia de género, 12 únicos, un conjunto de 4 piezas, engarces, 6 tipos de gema en 3 calidades, durabilidad y reparación, tiendas, cofre personal y comparación real de estadísticas en el tooltip.
- **Mundo:** campamento, 6 zonas y la arena del jefe. Los exteriores se generan con ruido fBm y caminos tallados; las mazmorras (Alcantarilla y Fábrica) con habitaciones y pasillos a partir de una semilla. Hay balizas de teletransporte, cofres sellados en rincones secretos y un evento ambiental por zona (vendaval de plástico, avalancha de neumáticos, goteras tóxicas, charcos de aceite que arden, paneles eléctricos y cintas transportadoras, prensas).
- **Misiones:** 6, con diálogos, diario y recompensas.
- **Guardado:** automático al cambiar de zona, cada 60 segundos y al cerrar la pestaña (LocalStorage).
- **Final:** al derrotar a EL COMPACTADOR, se desmorona, la pantalla funde a blanco y aparece un prado verde bajo un cielo azul con el texto *"Has limpiado mi mundo, ahora salva el tuyo"* y las estadísticas de la partida.

## Estructura

```
index.html            versión de desarrollo (carga los módulos en orden)
build.js              empaquetador -> dist/scrapheap.html
src/core              util, data (cargador JSON), iso (cámara), input, audio, sprites, save, debug, game (bucle y render)
src/systems           stats, items, combat, skills, effects (partículas, telegrafiado, luces), pathfind (A*), hazards, quests
src/entities          art (dibujo procedural), unit, player (+ dron), enemy (IA), bosses, objects
src/levels            map, mapgen (town/outdoor/dungeon/arena), world (población, botín, transiciones)
src/ui                style.css, ui (HUD y ventanas), minimap, title, endscreen
src/data              progression, skills, enemies, items, affixes, uniques, gems, zones, quests, npcs (JSON)
assets/PLACEHOLDERS.md  lista de placeholders por sustituir
```

## Ampliar por JSON

**Nuevo enemigo** (`src/data/enemies.json`, sección `enemies`):

```json
"tostadora": { "extends": "microondas", "name": "Tostadora Rabiosa", "life": 40, "projectile": { "art": "fireball", "speed": 10, "radius": 0.2, "spread": 2 } }
```

`ai` admite `melee`, `swarm`, `skittish`, `ranged`, `caster`, `elite`, `smart`, `charger`, `bomber`, `burrower`, `swarmcloud` y `regen`. `art` debe ser una función de `src/entities/art.js` (o reutilizar una existente). Para que aparezca, añádelo con un peso en `enemies` de una zona de `zones.json`.

**Nuevo objeto base** (`items.json` → `bases`): define `slot`, tamaño `w/h`, `ilvl`, y `dmg/speed` (armas) o `armor` (armaduras). El campo `icon` usa una función del objeto `ICON` en `sprites.js`. Los afijos van en `affixes.json` (prefijos con formas de género y sufijos "de …") y los únicos y conjuntos en `uniques.json`.

**Nueva habilidad** (`skills.json`): elige un `type` existente (`melee`, `meleeArc`, `whirl`, `warcry`, `buff`, `projectile`, `groundAoe`, `chain`, `summon`, `pull`, `heal`, `mine`, `single`). Los `params` se escalan con `base + perLevel × (nivel − 1)`, y `desc` admite `{param}`. Para un comportamiento nuevo, añade un `case` en `Skills.fire` (`src/systems/skills.js`).

## Sustituir placeholders

Cada generador está aislado y marcado con `TODO: asset final`:

- **Losetas y muros:** sustituye el canvas devuelto por `genFloor` o `genWall` (`sprites.js`) por un `Image` cargado. Conserva el ancla (`ax`, `ay`) en el centro del rombo base.
- **Personajes:** cada `ART.<nombre>(ctx, entidad, tiempo)` dibuja con el origen en los pies; cámbialo por un `drawImage` del fotograma que toque según `e.moving`, `e.walkT`, `e.atkAnim` y `e.face`.
- **Iconos:** `G.Sprites.itemIcon` y `G.Sprites.skillIcon` devuelven una URL; basta con devolver la ruta de un PNG.
- **Audio:** `G.Audio.play(nombre)` y `G.Audio.playMusic(tema)` son los únicos puntos de entrada. Puedes reproducir un `AudioBuffer` con el mismo nombre.

## Depuración

Desde la consola del navegador (añade `?debug` a la URL para ver los FPS):

```js
SCRAP.god()        // invulnerable y carga infinita
SCRAP.level(17)    // subir de nivel
SCRAP.goto('z6')   // town, z1 … z7
SCRAP.boss()       // arena de EL COMPACTADOR
SCRAP.killBoss()   // derrotar al jefe de la zona actual
SCRAP.win()        // pantalla final directa
SCRAP.item('unique'); SCRAP.gold(5000); SCRAP.reveal(); SCRAP.spawn('robot', 'champion')
```

## Fases del encargo

| Fase | Estado |
|---|---|
| 1. Núcleo | Bucle a 60 FPS, cámara isométrica, clic para moverse con A* y suavizado de ruta, colisiones círculo-rejilla |
| 2. Combate | Ataques cuerpo a cuerpo y a distancia, vida y carga, IA de enemigos, daño, estados y muerte |
| 3. RPG | XP con curva en JSON, niveles, atributos, árbol de habilidades y barra de habilidades |
| 4. Botín | Generación procedural, equipo, tiendas, gemas, cofre, durabilidad |
| 5. Mundo | Campamento, 7 zonas, generación procedural, NPCs, misiones, balizas y eventos |
| 6. Jefes | Tres minijefes y EL COMPACTADOR con 3 fases telegrafiadas |
| 7. Final | Prado animado con el texto exacto, estadísticas y botones |
| 8. Pulido | Interfaz completa, audio procedural, partículas, iluminación, guardado y opciones |

## Decisiones tomadas

- **Muerte:** se simplificó a la penalización de oro que permite el encargo. Pierdes el 15 % de los chips y reapareces en el Refugio; los jefes recuperan la vida.
- **Persistencia de zonas:** los mapas se guardan por semilla. Al cargar una partida, las zonas se regeneran iguales pero con los monstruos repoblados; los jefes derrotados no vuelven.
- **Primera misión:** está activa desde el principio para que las Bolsas Rabiosas cuenten aunque no hayas hablado aún con Cable.
- **Acto 1:** no hay más actos. La Montaña de Compactación lleva directamente a la arena final.

# CLAUDE.md

## Proyecto
Mónaco Onboard: simulador web en Three.js r128 (vendor/three.min.js, global THREE) de una vuelta contra reloj al circuito de Mónaco, con trazado oficial y edificios de OpenStreetMap. Sitio estático para GitHub Pages; sin build.

## Correr y probar
- `bash tools/qa/serve.sh` y abrir http://localhost:8000.
- `node tools/qa/lap.mjs` después de CADA cambio: la vuelta debe completarse, sin errores de consola.
- window.__debug solo existe en localhost (ver js/main.js).
- Otras herramientas (las capturas van a qa-out/):
  - `node tools/qa/shot.mjs <salida.png> <cp> [d] [cam] [offset] [ancho] [alto] [--mobile]`
  - `node tools/qa/frame.mjs <sim|real> <segundo> <salida.png>`
  - `node tools/qa/compare.mjs <ref.png> <render.png> <salida.png>`

## Arquitectura
- js/util.js: generador con semilla R()/rr()/pick(), hash2, ruido fbm, colores lin/COL, canvas(), fmt() de tiempos, la `scene`, Batch (geometría combinada), instTiled y CHUNKS para ocultar lo lejano.
- js/track.js: carga data/monaco.json con fetch (await de módulo); muestras de la pista, alturas, curvatura, velocidades seguras (ALLOW), zonas (TUN, PIT, CHI, SDZ, STR, EXA), cpIdx(), nearest(), P(), máscaras de mar y verde (incluye Mareterra) y la vía de escape de la chicana (ESC, escAt).
- js/textures.js: todas las texturas pintadas en canvas (asfalto, pianos, carteles BOARD, fachadas, público, follaje, agua, carbono).
- js/world.js: buildWorld(): terreno, ciudad OSM y edificios especiales, barreras y carteles, pista y pianos, túnel, tribunas, vegetación, puerto y yates, semáforo de largada (lampMats).
- js/car.js: estado del auto (`car`), modelo 3D con cockpit, halo, espejos (mirrorRT) y volante con pantalla (drawScreen).
- js/physics.js: placeCar, physics(): dirección, aceleración, frenos y ayudas, muros y vía de escape, pianos, caja de cambios; contador de toques de muro.
- js/race.js: estado de carrera (`race`), semáforo, cronometraje y sectores (SEC), límites de pista/vuelta anulada, pantalla final y ranking (loadLaps/saveLap en localStorage).
- js/audio.js: motor sintetizado con Web Audio, reverberación del túnel, viento, roce y pianos.
- js/main.js: punto de entrada: renderer, cielo y luces, cámaras (updateCamera), HUD y minimapa, menú y opciones, controles (teclado, joystick, táctil), calidad gráfica, bucle principal y window.__debug.

## Convenciones de la pista
- La pista está muestreada cada ~2 m en N puntos; arrays SX, SY, SZ (posición), PSI (rumbo), K (curvatura), RXa/RZa (vector derecha).
- P(i, d, h) devuelve la posición del punto i desplazada d metros a la derecha y h hacia arriba. Todo lo que va al costado de la pista se ubica con P.
- cpIdx(n) convierte un punto n del trazado GeoJSON (0–158) en índice de muestra. Curvas: 119 recta/largada, 129 Sainte Dévote, 133 Beau Rivage, 146 Massenet, 156 Casino, 7 Mirabeau Haute, 17 horquilla, 26 Mirabeau Bas, 32 Portier, 39–46 túnel, 52–57 Nouvelle Chicane, 62 Tabac, 72–81 Piscine, 95 La Rascasse, 104 Anthony Noghès.
- Sectores: S1 termina en cpIdx(3), S2 en cpIdx(66), S3 en la línea.
- Zonas: TUN (túnel), PIT (boxes), CHI (chicane), SDZ (Sainte Dévote), STR (recta), EXA[lado][i] (ancho extra de escape, 0 izquierda / 1 derecha), STANDSIDE (lado con tribuna).
- Izquierda = d negativo, derecha = d positivo, en sentido de marcha.

## Reglas críticas
- El generador aleatorio R() tiene semilla fija: NO cambiar el orden de construcción del mundo ni agregar llamadas a R() en medio de código existente; si un elemento nuevo necesita azar, usar hash2(x,z) o agregarlo al final de buildWorld.
- Nada de objetos individuales por elemento repetido: usar Batch (geometría combinada) o instTiled (instancias por zona) para que el celular rinda.
- Mantener el rendimiento: en calidad Baja, menos de 450.000 triángulos visibles en los 5 puntos de lap.mjs.
- Sin marcas registradas en textos de la escena (nada de Formula 1, Grand Prix, nombres de sponsors).

## Videos de referencia (carpeta _videos/, no se sube a GitHub)
- Usar siempre tools/qa/frame para sacar cuadros, que ya conoce los nombres de archivo.
- "sim" = video del simulador ("@citrix Virtual Lap_ Max Verstappen laps the Monaco Grand Prix.mp4"): 1280x720, la imagen del juego ocupa SOLO la franja superior (crop=1280:446:0:0). Intro hasta ~5 s; vuelta de ~5 s a ~82 s. Cámara cockpit (como la cámara 0). Es la referencia principal para el entorno.
- "real" = vuelta real ("Max Verstappen's Incredible Pole Lap _ 2023 Monaco Grand Prix _ Pirelli.mp4"): 1280x720, imagen completa, cámara sobre el casco (como la cámara 1), con gráficos de TV superpuestos. Referencia para el auto y los colores reales.
- Índice aproximado de "sim" (segundos): largada/recta 75–82 y 5–7; Sainte Dévote 7–10; Beau Rivage 10–14; Massenet/Casino 14–18; Mirabeau y horquilla 18–27; Portier 28–34; túnel 34–50; salida del túnel 49–53; Nouvelle Chicane 52–55; Tabac 55–57; Piscine 57–66; Rascasse 66–72; Anthony Noghès 72–75.
- El índice exacto de ambos videos vive en docs/referencias.md (lo mantiene el agente referencia-video; ese archivo sí se sube).

## Subagentes
- referencia-video: describe un tramo a partir de los videos. Solo lectura del juego.
- qa-render: prueba, captura y compara. Solo lectura del juego.
- exteriores: edita entorno (js/world.js, js/textures.js, zonas en js/track.js).
- auto-cockpit: edita el auto y las cámaras (js/car.js y la función de cámara en js/main.js).
- ui-hud: edita menú, HUD, pantalla final (index.html, css/style.css, partes de interfaz de js/main.js y js/race.js).
Flujo típico de un cambio de entorno: referencia-video → exteriores → qa-render.

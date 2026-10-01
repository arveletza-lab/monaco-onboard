# Mónaco Onboard

Una vuelta al circuito callejero de Mónaco vista desde el casco, en el navegador. El trazado es el real (GPS del circuito) y las calles, edificios, parques, piscinas y la costa salen de OpenStreetMap: la subida de Sainte Dévote al Casino, la bajada a la horquilla, el túnel junto al mar y el puerto con yates. Manejo sencillo, sin trompos, con frenado y dirección asistidos opcionales.

Todo se dibuja con [three.js](https://threejs.org/) (r128): no hay imágenes ni sonidos pregrabados. Las texturas se pintan en canvas al cargar y el motor se sintetiza con Web Audio.

## Controles

| Tecla | Acción |
|---|---|
| ↑ / W | Acelerar |
| ↓ / S / Espacio | Frenar (mantener detenido = reversa) |
| ← → / A D | Girar |
| C | Cambiar cámara (cockpit, onboard TV, T-cam, exterior) |
| R | Volver a la pista |
| M | Sonido del motor on/off |
| P / Esc | Pausa y menú |
| Backspace | Reiniciar la vuelta |

También funciona con joystick (stick izquierdo, gatillos) y en pantallas táctiles, con botones en pantalla.

Los tiempos se guardan en el navegador (`localStorage`). La tabla muestra tus 10 mejores vueltas con el nombre de piloto que escribiste. Los sectores y el tiempo final se pintan en violeta si son lo mejor guardado en este navegador, en verde si mejoran tu marca personal y en amarillo si son más lentos.

## Correrlo localmente

El juego usa módulos de JavaScript y carga los datos del mapa con `fetch`, así que **no funciona abriendo `index.html` con doble clic** (`file://`). Hace falta un servidor web local. Por ejemplo, con Python, desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después, abrí <http://localhost:8000> en el navegador.

## Publicarlo en GitHub Pages

1. Subí el repositorio a GitHub.
2. En el repositorio, entrá a **Settings → Pages**.
3. En **Build and deployment**, elegí **Deploy from a branch**, la rama **main** y la carpeta **/ (root)**, y guardá.
4. Al minuto, el juego queda publicado en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

No hace falta compilar nada: todas las rutas son relativas y three.js está incluido en `vendor/`.

## Estructura

```
index.html            página: menú, HUD y carga de los scripts
css/style.css         estilos del menú y del HUD
js/                   el juego, en módulos ES
data/monaco.json      datos del mapa (generados con tools/prep.py)
vendor/three.min.js   three.js r128
tools/prep.py         generador de data/monaco.json
```

`vendor/three.min.js` se carga con un `<script>` clásico antes de los módulos y queda disponible como la variable global `THREE`. El punto de entrada es `js/main.js`.

## Arquitectura

Los módulos comparten el estado con `import`/`export` explícitos (la escena, el auto, las opciones, los arrays de la pista). El mundo se construye una sola vez, siempre en el mismo orden, porque usa un generador pseudoaleatorio con semilla fija (`R()` en `util.js`): cambiar el orden de las llamadas cambia dónde aparecen árboles, yates y edificios de relleno.

### `js/util.js`
Utilidades comunes: el generador con semilla (`R`, `rr`, `pick`), ruido (`vnoise`, `fbm`), conversión de colores, creación de canvas, el formato de tiempos (`fmt`), la `scene` de three.js y `Batch`, que junta miles de cajas y quads en pocas mallas grandes (partidas en bloques para poder ocultar lo lejano).

### `js/track.js`
Carga `data/monaco.json` antes que nada (los demás módulos esperan a que termine) y arma la pista: la línea central suavizada con su altura, muestras cada 2 m (`SX`, `SY`, `SZ`, direcciones, curvatura `K`, velocidad segura `ALLOW`), las zonas especiales (túnel, boxes, Nouvelle Chicane, escape de Sainte Dévote, recta), `cpIdx()` para pasar de un punto del trazado original a una muestra, búsquedas espaciales (`nearest`) y las máscaras de mar y de verde.

### `js/textures.js`
Todas las texturas, pintadas en canvas: asfalto, pianos, guardarraíles, carteles, fachadas, piedra, público, follaje, agua, etc.

### `js/world.js`
El Principado: relieve del terreno ajustado a la altura de la pista, edificios extruidos desde OpenStreetMap (con balcones, comercios y cornisas), el Casino y el Fairmont sobre el túnel, barreras y carteles, tribunas, el túnel con su iluminación, pasarelas, grúas, faroles, árboles y palmeras, el puerto con yates, y el semáforo de largada. Todo arranca en `buildWorld()`.

### `js/car.js`
El auto: su estado de manejo (`car`), el modelo 3D con cockpit, halo, espejos con vista trasera en vivo y el volante con botones, luces de cambio y pantalla, que se redibuja con velocidad, marcha, tiempo y delta.

### `js/physics.js`
El manejo: dirección, aceleración y frenos, frenado y dirección asistidos, la reversa, los choques contra los muros, la vibración de los pianos y la caja de cambios automática.

### `js/race.js`
La carrera: el semáforo de largada, el cronometraje de vuelta y de los tres sectores, el delta contra tu mejor vuelta, el final de vuelta y el ranking. La lectura y escritura de tiempos está aislada en `loadLaps()` y `saveLap(row)`; para pasar a un ranking compartido alcanza con reemplazar esas dos funciones.

### `js/audio.js`
El sonido del motor, sintetizado con osciladores y distorsión, más la reverberación del túnel, el viento y los ruidos de roce y de pianos.

### `js/main.js`
El punto de entrada: renderer, cielo, luces, las cuatro cámaras, el HUD (tiempos, sectores, minimapa, velocímetro), el menú y las opciones, los controles (teclado, joystick y táctil), los niveles de calidad gráfica con resolución automática, y el bucle principal.

## Regenerar `data/monaco.json`

`tools/prep.py` produce los datos del mapa a partir de dos fuentes:

- el trazado del circuito: <https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mc-1929.geojson>
- el extracto de OpenStreetMap de Mónaco: <https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/test/data/monaco.osm.pbf>

Bajá los dos archivos a la carpeta `tools/`, instalá las dependencias y corré el script desde la raíz del proyecto:

```bash
pip install osmium numpy scipy matplotlib
```

```bash
python tools/prep.py
```

El script escribe `data/monaco.json` y una vista previa de las máscaras en `tools/mask.png`. El detalle de cada paso está en los comentarios del propio script.

Ojo: con estas entradas el resultado no es idéntico al `data/monaco.json` del repositorio. El trazado y el mar coinciden y los edificios casi, pero salen bastantes menos áreas verdes (y por lo tanto otros árboles). El extracto de OSRM es viejo y el paso original que pasaba de OpenStreetMap a los archivos intermedios `tools/osm.json` y `tools/osm2.json` no se conservó; `prep.py` trae una reconstrucción de ese paso. Si tenés esos dos archivos, el script los usa directamente.

## Créditos

- Datos del mapa © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright), bajo licencia ODbL.
- Trazado del circuito: [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT).
- [three.js](https://github.com/mrdoob/three.js) r128 (MIT).
- Tipografías Saira Extra Condensed y Saira Semi Condensed, de [Google Fonts](https://fonts.google.com/) (OFL).

Proyecto no oficial, sin relación con la Fórmula 1, la FIA ni el Automobile Club de Monaco.

## Licencia

El código está bajo licencia [MIT](LICENSE). Los datos de `data/monaco.json` derivan de OpenStreetMap y se rigen por la ODbL.

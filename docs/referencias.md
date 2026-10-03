# Referencias visuales (videos de _videos/)

Mantenido por el subagente `referencia-video`. Segundos = tiempo del archivo de video (no el cronómetro de la vuelta).
Cuadros extraídos en `_videos/frames/` (no se suben): `indice/` (1 cuadro/s, hojas 4x6) y una carpeta por tramo.

## Índice de tramos

Nota: el índice de "sim" que figura en CLAUDE.md está corrido (dice Portier 28–34 y túnel 34–50). El medido es este:

| Tramo | cp aprox. | sim (s) | real (s) |
|---|---|---|---|
| Largada / recta (inicio de vuelta) | 119 | 6,5–10 | 4,8–7 |
| Sainte Dévote | 129 | 10–12,5 | 7–9,5 |
| Subida Beau Rivage | 133 | 12,5–16 | 9,5–15 |
| Massenet | 146 | 16–19,5 | 15–18 |
| Casino | 156 | 19,5–22,5 | 18–21 |
| Bajada a Mirabeau / Mirabeau Haute | 7 | 22,5–26 | 21–25,5 |
| Horquilla (Grand Hotel) | 17 | 26–31 | 25,5–28,5 |
| Mirabeau Bas | 26 | 31–34 | 28,5–31,5 |
| Bajada a Portier | 26–30 | 34–37,5 | 31,5–34 |
| Portier (curva derecha) | 30–32 | 37,5–39,5 | 34–35,2 |
| Salida de Portier → puente → curva derecha → boca del túnel | 32–39 | 39,5–44,6 | 35,2–40,0 |
| Túnel (dentro) | 39–46 | 44,6–49,5 | 40,0–45,5 |
| Salida del túnel / bajada | 46–52 | 49,5–52 | 45,5–48 |
| Nouvelle Chicane | 52–57 | 52–55 | 48–51 |
| Tabac | 62 | 55–56,5 | 51–55 |
| Piscine (ambas) | 72–81 | 56,5–66 | 55–62 |
| Rascasse | 95 | 66–71,5 | 62–68 |
| Anthony Noghès | 104 | 71,5–75 | 68–71,5 |
| Recta final / meta | 119 | 75–82,5 | 71,5–76,2 |

Sim: intro hasta ~6,5 s, vuelta ~6,5–82,5 s, cierre después. Real: cronómetro de vuelta ≈ segundo de video − 5,3 (vuelta 1:11.365 termina ~76,7 s); a partir de ~77 s, gráficos finales.

## Tramo: salida de Portier → entrada del túnel (cp 32–39)
sim 39,5–44,6 s · real 35,2–40,0 s · cuadros en `_videos/frames/portier-tunel/` (cada 0,4 s; hojas `hoja_*.png`, recorte `puente_real_zoom.png`).

Geometría (de ambos videos y de data/monaco.json): Portier es una derecha lenta (2.ª marcha); sale a una recta corta (~50 m en el trazado del juego, cp32–36), pasa por debajo de un PUENTE vial a los ~20–30 m de la salida, y luego una derecha amplia (cp36–39, ~95° en total) desemboca en la boca del túnel.

### LADO IZQUIERDO
- Borde y piano: piano rojo/blanco a nivel en la salida de Portier (por fuera, lado izquierdo de la pista, ancho ~1 m); vuelve a aparecer a la izquierda en el vértice de la derecha final antes del túnel (real 38,6–39,8).
- Barrera: en "real", muro de hormigón ~1,1 m forrado con paneles blancos con logo/texto rojo y gris; en "sim", guardarraíl gris de 3 hileras (~1 m) con tramos pintados de naranja. Antes del túnel, en ambos, la barrera izquierda lleva carteles azul marino con texto blanco (real) / rojo con texto blanco (sim), continuos.
- Antes del puente: muro alto curvo de color arena/ocre (piedra revocada), ~8–10 m de alto, pegado a la barrera (es el estribo izquierdo del puente / esquina de edificio).
- Bajo el puente, detrás de la barrera: zona de servicio con camiones blancos y una camioneta blanca (en sim, camioneta blanca y gente).
- Después del puente: tribuna abierta con público (sim 40,4–41,6), detrás de reja; en "real", explanada con marcas viales y edificios modernos blancos de 6–10 pisos con balcones y árboles.
- Fondo: mar con un crucero/yates de frente (sim 40,4–42), montaña a lo lejos.

### LADO DERECHO
- Borde y piano: piano rojo/blanco en el vértice de Portier (real 34,2–35,2, con escapatoria de asfalto anaranjado detrás) junto a la esquina de un edificio blanco/crema.
- Barrera: muro bajo blanco con paneles blanco/rojo (real); guardarraíl gris (sim) con bloque amarillo de neumáticos/patrocinador.
- Reja: reja de contención ~4 m, levemente inclinada hacia la pista, sobre la barrera derecha después del puente (sim 41,6–42,8).
- Carteles: banners verdes con letras doradas bajos (~1 m) y blancos con número rojo; antes del túnel, carteles azul marino con texto blanco (real) / rojo con texto blanco (sim).
- Edificios: después del puente, edificio blanco bajo; antes del túnel, gran superficie blanca curva (fachada tipo casco de barco) a la derecha de la boca del túnel, alta (~15–20 m).
- Boca del túnel: portal de hormigón claro integrado en un edificio de varios pisos (gris/blanco con balcones); encima de la boca, cartel horizontal azul marino con texto blanco (real) / rojo con texto blanco (sim). Dentro, hileras de luces blancas continuas en el techo.

Segundos usados: sim 36,0–44,8 (cada 0,4); real 33,0–39,8 (cada 0,4) más 35,2/35,6/36,0/36,4.
Dudas: la oblicuidad exacta del puente (en "real" el auto todavía está girando al verlo); distancias en metros estimadas por tiempo y velocidad.

### PUENTE después de Portier (falta en el juego)
- Cuándo: real, visible desde 35,0 s, el auto pasa por debajo entre 36,0 y 36,6 s; sim, visible desde 39,6 s, por debajo entre 40,5 y 40,9 s.
- Dónde: 20–30 m después del vértice de Portier, en la recta cp32–36 (aprox. entre cp33 y cp34, ~1.345 m desde la línea en el trazado del juego), ANTES de la derecha final. Separado de la boca del túnel: ~3,6 s antes en real y ~4 s en sim, unos 80 m en las coordenadas del juego (90–130 m por tiempo × velocidad).
- Forma: puente vial (calle elevada), no una pasarela. Tablero recto de vigas, casi perpendicular a la pista (hasta ~20–30° oblicuo, con el extremo derecho más adelante). Pasa por encima de la pista y de la zona de servicio a la izquierda.
- Medidas: altura libre ~5,5–6 m; espesor del tablero ~1,2–1,5 m más una baranda de ~1 m; ancho en el sentido de marcha ~10–14 m; luz libre de lado a lado (sobre la pista y los bordes) ~25–30 m.
- Apoyos: a la izquierda, el muro curvo de color arena (~8–10 m de alto) a 2–4 m de la barrera hace de estribo; a la derecha, un pilar/estribo oscuro de hormigón a ~4–6 m detrás de la barrera. No hay columnas en la pista.
- Materiales y colores: hormigón color arena/ocre (sim: beige uniforme; real: caqui/oliva con sombra oscura abajo y borde superior más claro, amarillento); baranda metálica clara (verde claro/amarillenta) arriba. En sim, una fila de luces/reflectores blancos rectangulares en el frente del tablero y un banner blanco centrado sobre la pista (logo rojo + texto negro). En real, carteles viales azules con texto blanco colgados en la parte derecha.
- Antes: muro curvo color arena a la izquierda, barrera blanca a la derecha, edificios altos detrás. Después: espacio abierto (tribuna y mar en sim; explanada y edificios blancos en real) y la derecha amplia hasta la boca del túnel, que es otro edificio.

#!/usr/bin/env bash
# Levanta un servidor estático en la raíz del proyecto (puerto 8000) si no hay uno corriendo.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
up() { curl -s -o /dev/null --max-time 2 http://localhost:8000/index.html; }

if up; then echo "Servidor ya corriendo en http://localhost:8000"; exit 0; fi

PY=""
for c in python3 python py; do
  if "$c" -c "import sys" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then echo "No encontré Python (python3, python o py)." >&2; exit 1; fi

cd "$ROOT" && nohup "$PY" -m http.server 8000 >/dev/null 2>&1 &
for _ in $(seq 1 30); do
  if up; then echo "Servidor en http://localhost:8000 (con $PY)"; exit 0; fi
  sleep 0.5
done
echo "El servidor no respondió en el puerto 8000." >&2
exit 1

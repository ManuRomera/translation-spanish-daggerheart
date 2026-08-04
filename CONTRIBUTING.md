# Colaborar con la traducción

Gracias por ayudar a mejorar Daggerheart en Español.

## Informar de un problema

Abre una incidencia e incluye:

- el texto que aparece;
- la traducción que propones;
- una captura o el nombre de la pantalla;
- tus versiones de Foundry, Daggerheart y el módulo.

## Proponer cambios

1. Crea una rama desde `main`.
2. Modifica `lang/es.json` sin cambiar la estructura de las claves.
3. Conserva variables como `{actor}`, `{value}`, `{roll}` y fórmulas como `1d6`.
4. Ejecuta las validaciones indicadas abajo.
5. Abre un pull request explicando dónde aparece cada cadena modificada.

## Comprobaciones

Con una copia de Daggerheart 1.9.14 instalada, ejecuta:

```bash
STRICT=1 node tools/analyze-localization.mjs /ruta/a/daggerheart/lang/en.json lang/es.json
node --check scripts/patches.js
```

El informe debe mostrar cero claves ausentes, obsoletas, incompatibles y cero errores de variables.

## Criterios de estilo

- Español de España claro y natural.
- Botones y acciones en infinitivo: «Seleccionar», «Eliminar», «Enviar».
- Esperanza, Miedo, Estrés y Puntos de golpe como términos principales.
- «Carta de dominio», «Forma bestial», «Tirada en equipo» y «Dados de dualidad».
- Evita traducir nombres de módulos, identificadores técnicos o fórmulas.

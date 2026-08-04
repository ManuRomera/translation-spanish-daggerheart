# Colaborar con la traducción

Gracias por ayudar a mejorar Manu Romera — Traducción ES.

## Informar de un problema

Abre una incidencia e incluye:

- el texto que aparece;
- la traducción que propones;
- una captura o el nombre de la pantalla;
- tus versiones de Foundry, Daggerheart y el módulo.

## Proponer cambios

1. Crea una rama desde `main`.
2. Modifica `lang/es.json` o el archivo correspondiente de `compendium/` sin cambiar identificadores.
3. Conserva variables como `{actor}`, `{value}`, `{roll}` y fórmulas como `1d6`.
4. Ejecuta las validaciones indicadas abajo.
5. Abre un pull request explicando dónde aparece cada cadena modificada.

## Comprobaciones

Con una copia de Daggerheart 1.9.14 instalada, ejecuta:

```bash
STRICT=1 node tools/analyze-localization.mjs /ruta/a/daggerheart/lang/en.json lang/es.json
node --check scripts/patches.js
node --check scripts/compendiums.js
node tools/validate-release.mjs
```

El informe debe mostrar cero claves ausentes, obsoletas, incompatibles y cero errores de variables.

Para regenerar los compendios desde una instalación local de la versión 1.9.14, consulta las herramientas de `tools/`. La extracción original y las cachés de trabajo se ignoran deliberadamente; los archivos publicables y las correcciones editoriales sí se versionan.

## Criterios de estilo

- Español de España claro y natural.
- Botones y acciones en infinitivo: «Seleccionar», «Eliminar», «Enviar».
- Esperanza, Miedo, Estrés y Puntos de golpe como términos principales.
- «Carta de dominio», «Forma bestial», «Tirada en equipo» y «Dados de dualidad».
- Evita traducir nombres de módulos, identificadores técnicos o fórmulas.
- Conserva exactamente UUID, órdenes `[[...]]`, variables `@...` y los `_id` de documentos incrustados.

# Translation Spanish Daggerheart

Módulo de localización **externo** para el sistema **Daggerheart** en Foundry VTT.
- Añade el idioma **Español** (`lang/es.json`).
- Incluye parches sutiles (`scripts/patches.js`) para cubrir cadenas incrustadas sin i18n (Compendium Browser, Target, Fear, etc.).

## Instalación
1. Descomprime la carpeta `translation-spanish-daggerheart` dentro de `Data/modules/` de tu Foundry.
2. Activa el módulo en *Configuración → Módulos*.
3. Cambia el idioma de tu usuario a **Español** (icono de usuario → Idioma).

## Notas
- `es.json` parte del `en.json` del sistema para asegurar cobertura completa. La traducción literal se puede mejorar iterativamente.
- `patches.js` no añade CSS (evitando errores MIME).

## Recomendado (opcional)
Para traducir **compendios** (nombres y descripciones de contenido), usa **Babele** y diccionarios por pack.

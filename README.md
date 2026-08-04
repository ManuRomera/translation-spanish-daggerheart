<div align="center">

# Daggerheart en Español para Foundry VTT

**Disfruta de toda la interfaz de Daggerheart 1.9.14 en español desde Foundry VTT 13.**

[![Foundry VTT 13](https://img.shields.io/badge/Foundry_VTT-13.351-7a4b3a?style=for-the-badge)](https://foundryvtt.com/)
[![Daggerheart 1.9.14](https://img.shields.io/badge/Daggerheart-1.9.14-6f3f78?style=for-the-badge)](https://github.com/Foundryborne/daggerheart/releases/tag/1.9.14)
[![Versión 0.2.0](https://img.shields.io/github/v/release/ManuRomera/translation-spanish-daggerheart?style=for-the-badge&label=versi%C3%B3n)](https://github.com/ManuRomera/translation-spanish-daggerheart/releases/latest)

[Instalar](#instalación) · [Compatibilidad](#compatibilidad) · [Cómo se usa](#cómo-se-usa) · [Problemas](#solución-de-problemas) · [Colaborar](#colaborar)

</div>

---

Este módulo comunitario añade la localización española a la implementación de Daggerheart creada por [Foundryborne](https://github.com/Foundryborne/daggerheart). Traduce las hojas, diálogos, ajustes, tiradas, mensajes del chat y herramientas del DJ sin modificar los datos de tus mundos.

## Qué incluye

- Las **1.779 cadenas** de la interfaz de Daggerheart 1.9.14.
- Terminología coherente para Esperanza, Miedo, Estrés, Puntos de golpe, Dados de dualidad y Cartas de dominio.
- Hojas de personaje, compañero, adversario, entorno y grupo.
- Creación y subida de nivel de personajes.
- Tiradas de acción, reacción y equipo, daño, descanso y movimientos de muerte.
- Navegador de compendios, cuentas atrás, automatizaciones y reglas opcionales.
- Abreviaturas españolas: `PG`, `FUE`, `SUT`, `CON`, etc.
- Dos ajustes mínimos para textos que Daggerheart 1.9.14 todavía tiene incrustados en sus plantillas.

El módulo **no sobrescribe documentos ni compendios**, por lo que puede activarse o desactivarse sin alterar personajes, escenas o mundos.

## Compatibilidad

| Componente | Versión compatible |
|---|---:|
| Foundry Virtual Tabletop | 13.346–13.351 |
| Daggerheart | 1.9.14 |
| Módulo español | 0.2.0 |

> [!IMPORTANT]
> Esta edición está mantenida específicamente para **Foundry VTT 13 y Daggerheart 1.9.14**. Daggerheart 2.x requiere Foundry VTT 14 y no es compatible con esta publicación.

## Instalación

### Desde Foundry VTT

1. Abre Foundry VTT y entra en **Add-on Modules**.
2. Pulsa **Install Module**.
3. Pega esta dirección en **Manifest URL**:

```text
https://raw.githubusercontent.com/ManuRomera/translation-spanish-daggerheart/main/module.json
```

4. Pulsa **Install** y espera a que finalice la descarga.

### Instalación manual

1. Descarga el archivo ZIP de la [última versión](https://github.com/ManuRomera/translation-spanish-daggerheart/releases/latest).
2. Descomprímelo en `Data/modules/translation-spanish-daggerheart` dentro de tus datos de Foundry.
3. Reinicia Foundry VTT si estaba abierto.

La carpeta debe contener directamente `module.json`, `lang/` y `scripts/`; evita crear una carpeta duplicada dentro de otra.

## Cómo se usa

1. Abre tu mundo de Daggerheart.
2. Ve a **Manage Modules** y activa **Daggerheart en Español**.
3. Abre la configuración de tu usuario y selecciona **Español** como idioma.
4. Recarga la página cuando Foundry lo solicite.

El idioma se selecciona por usuario: cada participante puede utilizar español o inglés dentro del mismo mundo.

## Traducción de compendios

Esta versión traduce la **interfaz del sistema**. Los nombres y descripciones de clases, cartas, armas, adversarios y demás contenido de los compendios pertenecen a los paquetes de datos de Daggerheart y no se modifican desde este módulo.

Esta separación evita alterar el contenido original y hace que las actualizaciones sean seguras. La traducción de compendios puede abordarse más adelante como un paquete independiente y compatible con Babele.

## Solución de problemas

### Foundry indica que el módulo es incompatible

Comprueba que utilizas Foundry VTT 13.346–13.351 y Daggerheart 1.9.14. Esta publicación no está diseñada para Foundry 14 o Daggerheart 2.x.

### La interfaz continúa en inglés

- Confirma que el módulo está activo en el mundo.
- Selecciona Español en la configuración de tu usuario, no solo en la pantalla de administración.
- Recarga Foundry con `Ctrl+F5` en Windows/Linux o `Cmd+Shift+R` en macOS.

### Solo los compendios aparecen en inglés

Es el comportamiento esperado: esta publicación traduce la interfaz, no el contenido de los compendios.

### He encontrado una cadena incorrecta

Abre una [incidencia](https://github.com/ManuRomera/translation-spanish-daggerheart/issues) e incluye una captura, el texto esperado y la pantalla donde aparece.

## Colaborar

Las correcciones y sugerencias son bienvenidas. Antes de enviar un cambio:

1. Comprueba que la clave existe en `lang/en.json` de Daggerheart 1.9.14.
2. Conserva exactamente variables como `{actor}`, `{value}` o `{roll}`.
3. Evita traducir identificadores técnicos, UUID y fórmulas de dados.
4. Valida el JSON y describe dónde aparece el texto.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer el flujo completo.

## Créditos y aviso

Traducción mantenida por **Manu Romera**, de [Rune & Bones](https://runeandbones.com/), con asistencia de herramientas de traducción y revisión.

Daggerheart pertenece a sus respectivos titulares. Este proyecto es una traducción comunitaria no oficial, no está asociado con Darrington Press, Critical Role ni el equipo Foundryborne y no incluye el contenido de los compendios del juego.

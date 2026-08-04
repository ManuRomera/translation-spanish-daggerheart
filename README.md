<div align="center">

# Manu Romera — Traducción ES

### Compatible con Daggerheart™ 1.9.14 en Foundry VTT 13

**Interfaz, compendios y contenido de las fichas completamente en español.**

[![Foundry VTT 13](https://img.shields.io/badge/Foundry_VTT-13.351-7a4b3a?style=for-the-badge)](https://foundryvtt.com/)
[![Sistema 1.9.14](https://img.shields.io/badge/Compatible_con_Daggerheart%E2%84%A2-1.9.14-6f3f78?style=for-the-badge)](https://github.com/Foundryborne/daggerheart/releases/tag/1.9.14)
[![Versión](https://img.shields.io/github/v/release/ManuRomera/translation-spanish-daggerheart?style=for-the-badge&label=versi%C3%B3n)](https://github.com/ManuRomera/translation-spanish-daggerheart/releases/latest)

[Instalar](#instalación) · [Contenido](#qué-incluye) · [Uso](#cómo-se-usa) · [Ayuda](#solución-de-problemas)

</div>

---

Una localización comunitaria pensada para jugar sin saltos constantes al inglés. Traduce tanto la interfaz del sistema como el contenido que aparece dentro de personajes, adversarios, cartas, objetos y diarios.

## Qué incluye

- **1.779 textos de interfaz**: hojas, diálogos, tiradas, chat, creación y subida de nivel.
- **14 compendios completos**, con **976 documentos** y **201 carpetas** traducidos.
- Clases, subclases, dominios, linajes, comunidades, armas, armaduras, consumibles y botín.
- Adversarios, entornos, formas bestiales, tablas aleatorias y diarios del SRD.
- Nombres, descripciones, acciones, efectos y elementos incrustados de las fichas.
- Actualización automática del contenido que ya se había importado a un mundo.

La traducción se aplica como una capa segura: conserva identificadores, UUID, fórmulas de dados, rangos mecánicos y automatizaciones del sistema.

## Compatibilidad

| Componente | Versión |
|---|---:|
| Foundry Virtual Tabletop | 13.346–13.351 |
| Sistema compatible con Daggerheart™ | 1.9.14 |
| Babele | 2.7.5 o posterior |
| Manu Romera — Traducción ES | 0.3.0 |

> [!IMPORTANT]
> Esta edición se mantiene específicamente para **Foundry VTT 13 y la versión 1.9.14 del sistema**. Las versiones 2.x del sistema requieren Foundry VTT 14 y no son compatibles con esta publicación.

## Instalación

1. En Foundry, abre **Add-on Modules** y pulsa **Install Module**.
2. Pega esta dirección en **Manifest URL**:

```text
https://raw.githubusercontent.com/ManuRomera/translation-spanish-daggerheart/main/module.json
```

3. Pulsa **Install**. Foundry instalará también la dependencia Babele si todavía no la tienes.

También puedes descargar el ZIP de la [última versión](https://github.com/ManuRomera/translation-spanish-daggerheart/releases/latest) y descomprimirlo en `Data/modules/translation-spanish-daggerheart`.

## Cómo se usa

1. Abre tu mundo y entra en **Manage Modules**.
2. Activa **Manu Romera — Traducción ES** y **Babele**.
3. Selecciona **Español** como idioma de tu usuario y recarga la página.

Al entrar como DJ, el módulo revisa una sola vez los actores existentes y traduce sus clases, linajes, comunidades, rasgos, cartas, acciones y efectos. Los objetos que importes después se traducen automáticamente. No es necesario crear un mundo nuevo.

Cada usuario puede elegir su idioma de interfaz. La migración del contenido importado se ejecuta cuando el mundo está en español y hay un DJ conectado.

## Una actualización segura

- No modifica los compendios originales del sistema.
- No cambia claves, identificadores ni fórmulas.
- No incluye ilustraciones, logotipos ni otros recursos gráficos oficiales.
- Respeta nombres personalizados de adversarios y PNJ durante la migración.
- Puede desactivarse sin impedir que el sistema siga funcionando.

## Solución de problemas

### La interfaz sigue en inglés

Comprueba que el módulo y Babele estén activos, selecciona Español en la configuración de tu usuario y recarga Foundry.

### Una ficha importada conserva textos en inglés

Entra una vez como DJ con el idioma Español. La versión 0.3.0 ejecutará automáticamente la migración segura de los actores del mundo.

### Foundry indica incompatibilidad

Verifica que utilizas Foundry VTT 13 y la versión 1.9.14 del sistema. Esta publicación no debe activarse con Foundry 14 o con versiones 2.x del sistema.

### He encontrado una traducción mejorable

Abre una [incidencia](https://github.com/ManuRomera/translation-spanish-daggerheart/issues) con una captura, el texto esperado y la pantalla donde aparece.

## Créditos

Proyecto mantenido por **Manu Romera**, de [Rune & Bones](https://runeandbones.com/).

Parte de la memoria terminológica procede del proyecto MIT [fvtt-daggerheart-es](https://github.com/erizocosmico/fvtt-daggerheart-es), creado por **Miguel Molina**. Solo se reutilizaron traducciones compatibles con el texto de la versión objetivo; el resto se volvió a traducir y validar. Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Aviso legal

Este producto incluye materiales del *Daggerheart System Reference Document 1.0*, © Critical Role, LLC, bajo los términos de la [Darrington Press Community Gaming License (DPCGL)](https://darringtonpress.com/license/). Más información en [daggerheart.com](https://www.daggerheart.com/). El material se ha traducido y adaptado al español; existen modificaciones previas de Miguel Molina en las partes acreditadas.

Proyecto comunitario no oficial, sin afiliación, patrocinio ni aprobación de Darrington Press, Critical Role o Foundryborne. Daggerheart™ es una marca de Critical Role, LLC. Distribución no comercial para Foundry VTT, plataforma incluida en la lista autorizada por la DPCGL.

![](https://user-images.githubusercontent.com/12829262/122110050-6132ec00-ce1e-11eb-99f8-e0ce463c6cd6.png)

**\*\*\* En construcción \*\*\***

*   [¿Qué es eMayordormo?](#qu%C3%A9-es-emayordormo)
*   [¿Cómo funciona eMayordomo?](#c%C3%B3mo-funciona-emayordomo)
*   [La hoja de cálculo](#la-hoja-de-c%C3%A1lculo)
    *   [Pestaña 🔀 Reglas](#pesta%C3%B1a--reglas)
    *   [Pestaña 🗒️ Registro](#pesta%C3%B1a-%EF%B8%8F-registro)
*   [Implementación](#implementaci%C3%B3n)
    *   [Estructura del código](#estructura-del-c%C3%B3digo)
    *   [acercaDe.html](#acercadehtml)
    *   [Activador.gs](#activadorgs)
    *   [Código.gs](#c%C3%B3digogs)
*   \[acercaDe.html(#licencia)

# ¿Qué es eMayordormo?

**eMayordomo** es un script desarrollado con el objetivo de vigilar un buzón de Gmail para **responder automáticamente a ciertos mensajes con respuestas prediseñadas específicas**. Este documento recoge información técnica sobre su funcionamiento, limitaciones y algunos detalles de implementación que tal vez resulten de tu interés.

![](https://user-images.githubusercontent.com/12829262/122110114-7740ac80-ce1e-11eb-96b4-70304088d53b.gif)

Si simplemente deseas utilizarlo cuanto antes, puedes averiguar rápidamente cómo usarlo y obtener una copia de la plantilla de hoja de cálculo en la que se basa en este artículo en mi blog:

[👉 https://pablofelip.online/emayordomo 👈](https://pablofelip.online/emayordomo)

Si por el contrario prefieres conocer esos detalles técnicos que mencionaba, este es el lugar adecuado.

Lógicamente también puedes hacer ambas cosas, lo que por otra parte es lo más recomendable, en mi opinión.

# ¿Cómo funciona eMayordomo?

En el artículo mencionado anteriormente se facilitan las [especificaciones](https://pablofelip.online/emayordomo/#mcetoc_1f7masso32l) de eMayordomo para a continuación detallar [cómo se han llegado a satisfacer](https://pablofelip.online/emayordomo/#mcetoc_1f7m9lbio2h). No obstante, repasemos el funcionamiento general del script para centrar la discusión antes de abordar algunos de los aspectos técnicos de su implementación.

![Diagrama de eMayordomo](https://docs.google.com/drawings/d/e/2PACX-1vS6_mjaL-sZabk3piQYjGwOQWytUsRRnmE-Khrijj5hs_A8ivxCeO0tha1YKW4wGKnQXS0BXVTA8PIp/pub?w=1000&h=1000)

1.  Un usuario rellena un formulario web de contacto.
2.  El formulario envía una notificación por correo electrónico a un buzón de Gmail.
3.  El correo entrante es clasificando utilizado los filtros de Gmail. Se aplican etiquetas diferenciadoras y se marcan los mensajes como destacados ⭐ para indicar que aún no han sido respondidos.
4.  Cada una de las etiquetas anteriores llevará asociada una respuesta predefinida. Estas respuestas se construyen a partir de una serie de mensajes en borrador, en cuyo asunto se utilizan prefijos distintivos, siempre entre corchetes y con un espacio posterior para que el script pueda identificarlos con facilidad.
5.  Para establecer los emparejamientos (etiqueta, borrador) se recurre a una tabla de reglas en una hoja de cálculo de Google, en la que a cada etiqueta se le asocia uno de los prefijos utilizados en los asuntos de los borradores.
6.  Cada regla cuenta, opcionalmente, con una expresión regular para extraer la dirección de email a la que se debe responder del propio contenido del mensaje.
7.  La hoja de cálculo dispone de un menú específico para el script que permite activarlo, es decir, instalar un [activador (trigger) instalable](https://developers.google.com/apps-script/guides/triggers/installable) que se ejecuta cada hora,o ejecutarlo manualmente. No se ha contemplado la posibilidad de que el usuario pueda seleccionar otras periodicidades.
8.  Cada vez que eMayordomo procesa el buzón de correo registra el resultado de todos los intentos de envío de respuestas en una tabla situada en otra pestaña de la hoja de cálculo. Esta información es procesada por un conjunto de fórmulas para obtener métricas de procesamiento diferenciadas por cada par etiqueta / borrador.

# La hoja de cálculo

eMayordomo es un script que reside en una hoja de cálculo de Google. Esta hoja de cálculo, además, sirve a dos propósitos:

*   Configurar el script (pestaña 🔀 **Reglas**).
*   Mostrar un registro de eventos de funcionamiento (pestaña 🗒️ **Registro**).

Aunque, evidentemente, las hojas de cálculo no constituyen en general el mejor modo de construir una interfaz de usuario, lo cierto es que hay unas cuantas cosas que podemos hacer para reducir la fricción cuando se utilizan como tal, un hecho extremadamente frecuente en innumerables desarrollos basados en Apps Script. Algunas de sus características integradas tales como los [intervalos protegidos](https://support.google.com/docs/answer/1218656), el [formato condicional](https://support.google.com/docs/answer/78413), la validación de datos o incluso la inserción de notas en celdas pueden resultar de gran ayuda en esos casos para conseguirlo.

## Pestaña 🔀 **Reglas**

![](https://user-images.githubusercontent.com/12829262/122110014-537d6680-ce1e-11eb-8320-d4308c526abf.png)

Las columnas A - D son las utilizadas para ajustar la configuración del script. El resto (E - H, con encabezado de azul más claro), contienen una serie de fórmulas matriciales que resumen los datos contenidos en la pestaña de registro (a continuación). Se ha [protegido](https://support.google.com/docs/answer/1218656?co=GENIE.Platform%3DDesktop&hl=es) el intervalo E1:H11 para evitar ediciones accidentales que pudieran romper las fórmulas.

Formato condicional en casilla de verificación

Formato condicional en toda la fila (rojo)

Notas en B1, C1, D1

Validación en B para evitar repetición de etiqueta en regla

Arrayformula en encabezado para contar nº envíos OK y fecha último

Arrayformula en encabezado para contar nº envíos KO y fecha último

## Pestaña 🗒️ **Registro**

Filtros "integrados" en la fila 1 para localizar la información. El script anota los elementos más recientes en la parte superior.

# Implementación

## Estructura del código

## acercaDe.html

## Activador.gs

### comprobarEstado()

### activar()

### desactivar()

### gestionarTrigger()

## Código.gs

### onOpen()

### construirMenu()

### acercaDe()

### ejecutarManualmente()

### procesarEmails()

### etiquetasMensaje()

### duplicarBorradorAPI() y extraerElementos()

### actualizarLog()

# Licencia

© 2021 Pablo Felip Monferrer ([@pfelipm](https://twitter.com/pfelipm)). Se distribuye bajo licencia GNU GPL v3.

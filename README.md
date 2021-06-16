![](https://user-images.githubusercontent.com/12829262/122110050-6132ec00-ce1e-11eb-99f8-e0ce463c6cd6.png)

![](https://user-images.githubusercontent.com/12829262/122248331-4b7a0100-cec8-11eb-960a-b8684166756f.gif)

**\*\*\* En construcción \*\*\***

# Tabla de contenidos

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
    *   [acercaDe.html](#licencia)
*   [Licencia](#licencia)

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
8.  Cada vez que eMayordomo procesa el buzón de correo registra el resultado de todos los intentos de envío de respuestas en una tabla situada en otra pestaña de la hoja de cálculo. Esta información es procesada por un conjunto de fórmulas para obtener métricas de procesamiento para cada par etiqueta / borrador.

# La hoja de cálculo

eMayordomo es un script que reside en una hoja de cálculo de Google. Esta hoja de cálculo, además, sirve a dos propósitos:

*   Configurar el script (pestaña 🔀 **Reglas**).
*   Mostrar un registro de eventos de funcionamiento (pestaña 🗒️ **Registro**).

Aunque, evidentemente, las hojas de cálculo no constituyen en general el mejor modo de construir una interfaz de usuario, lo cierto es que hay unas cuantas cosas que podemos hacer para reducir la fricción cuando se utilizan como tal, un hecho extremadamente frecuente en innumerables desarrollos basados en Apps Script. Por esta razón voy a dedicar unas líneas a mostrar cómo algunas de sus características integradas, tales como los [intervalos protegidos](https://support.google.com/docs/answer/1218656), el [formato condicional](https://support.google.com/docs/answer/78413), la validación de datos o incluso la inserción de notas en celdas pueden resultar de gran ayuda para al menos mejorar esta situación.

## Pestaña 🔀 **Reglas**

![](https://user-images.githubusercontent.com/12829262/122110014-537d6680-ce1e-11eb-8320-d4308c526abf.png)

Las columnas `A` - `D` son las utilizadas para ajustar la configuración del script. El resto (`E` - `H`, con encabezado de azul más claro), contienen una serie de fórmulas matriciales que resumen los datos contenidos en la pestaña de registro (a continuación). Se ha [protegido](https://support.google.com/docs/answer/1218656?co=GENIE.Platform%3DDesktop&hl=es) el intervalo `E1:H11` para reducir la posibilidad de ediciones accidentales susceptibles de romper las fórmulas. Como los permisos de edición que incluyen una lista de control de acceso con usuarios específicos se pierden al hacer una copia de la hoja de cálculo, he usado en su lugar la posibilidad de mostrar una advertencia al tratar de editar el intervalo protegido, que sí se mantiene.

![](https://user-images.githubusercontent.com/12829262/122237707-d5719c00-cebf-11eb-9c87-deb57cb4567d.png)

Un ajuste visual al que casi siempre recurro en mis hojas de cálculo para mejorar su aspecto consiste en eliminar las líneas de cuadrícula (`Ver` ⇒ `Eliminar las líneas de cuadrícula`) y activar simultáneamente los colores alternos en las tablas de datos (`Formato` ⇒ `Colores alternos`), una combinación de colores poco saturados para las filas alternas con otro más intenso (y texto en blanco) en el encabezado suele facilitar la legibilidad de la tabla.

![](https://user-images.githubusercontent.com/12829262/122234185-f71d5400-cebc-11eb-84e4-b679a06b4db1.png)

Las casillas de verificación en la columna `A`, que permiten desactivar selectivamente algunas reglas, podrían haberse ocultado en aquellas filas vacías con facilidad usando una regla de formato condicional, con las funciones [`ES.PAR()`](https://support.google.com/docs/answer/3093419) y [`ES.IMPAR()`](https://support.google.com/docs/answer/3093491), para hacer coincidir en su caso el color del texto de la celda de cada fila con el de fondo. No obstante, las casillas, aunque invisibles, siguen ahí y de hacer clic dentro de la celda aparecería un desconcertante mensaje informando de su presencia.

![](https://user-images.githubusercontent.com/12829262/122235480-05b83b00-cebe-11eb-859f-33eed18bb9c7.png)

Por esa razón he optado por simplemente reducir la visibilidad de aquellas casillas de verificación en filas en las que no se ha introducido el nombre de una etiqueta.

![](https://user-images.githubusercontent.com/12829262/122236496-da821b80-cebe-11eb-9fd0-f93a0c36da07.png)

He aplicado una nueva regla de formato condicional sobre las columnas `B` y `C` para destacar las celdas en las que falta información necesaria para definir completamente una regla de autorespuesta que cuando está activada (la expresión regular de extracción del email es un parámetro opcional). La fórmula utilizada en la regla de formato es `=Y($A2=VERDADERO;ESBLANCO(B2))`.

![](https://user-images.githubusercontent.com/12829262/122237277-7ca20380-cebf-11eb-906d-fa89ef974735.png)

Se han insertado notas (`Insertar` ⇒ `Nota`) en las celdas `B1`, `C1` y `D1` con instrucciones básicas de uso. Aunque las hojas de cálculo de Google también admiten comentarios, l[as notas resultan más convenientes](https://twitter.com/pfelipm/status/1317511665773051905) cuando no se requiere una discusión activa con el resto de usuarios que tuvieran acceso al documento.

![](https://user-images.githubusercontent.com/12829262/122239697-701eaa80-cec1-11eb-8e1b-1c39f6e6107e.gif)

También he utilizado la validación de datos (`Datos` ⇒ `Validación de datos`) para evitar que se configuren dos reglas sobre la misma etiqueta de correo. La fórmula personalizada usada en el criterio de validación es `=CONTAR.SI($B$2:$B;B2)=1`, lo que rechaza cualquier secuencia de texto ya presente en el intervalo `B2:B`.

![](https://user-images.githubusercontent.com/12829262/122242130-5da57080-cec3-11eb-8c3e-0a91f396ee7e.png)

Finalmente, cuatro fórmulas de tipo matricial ([`ARRAYFORMULA`](https://support.google.com/docs/answer/3093275)) realizan recuentos ([`CONTAR.SI.CONJUNTO`](https://support.google.com/docs/answer/3256550)) y búsquedas ([`BUSCARV`](https://support.google.com/docs/answer/3093318)) en la tabla de registro (pestaña 🗒️ **Registro**, a continuación) para calcular, para cada regla, el nº de envíos realizados, los que han experimentado errores y sus marcas de tiempo correspondientes. Veamos, por ejemplo, las correspondientes a los envíos realizados con éxito y a la marca temporal del último envío.

```
={"📨 Envíos";
  ArrayFormula(SI(ESBLANCO(B2:B);"";CONTAR.SI.CONJUNTO('🗒️ Registro'!D2:D;B2:B;'🗒️ Registro'!A2:A;"🆗")))}
```

```
={"📨 Último envío";
  ArrayFormula(SI.ERROR(BUSCARV("🆗" & B2:B;{'🗒️ Registro'!A2:A & '🗒️ Registro'!D2:D\'🗒️ Registro'!C2:C};2;FALSO);))}
```

![](https://user-images.githubusercontent.com/12829262/122248390-53d23c00-cec8-11eb-94bb-6f0a909291b9.gif)

Estas fórmulas se encuentran en la fila de encabezado y por tanto devuelven en la 1ª fila del resultado la etiqueta informativa como literal de texto . Esto resulta muy práctico, dado que de este modo es posible ordenar la tabla sin que los cálculos dejen de funcionar del modo esperado.

Y, naturalmente, estos cálculos podrían haberse realizado en el seno del código Apps Script, pero dado que en este caso tenemos a nuestra disposición toda la potencia que nos ofrecen las fórmulas de las hojas de cálculo de Google ¿por qué no usarlas? 

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

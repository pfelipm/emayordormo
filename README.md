![](https://user-images.githubusercontent.com/12829262/122110050-6132ec00-ce1e-11eb-99f8-e0ce463c6cd6.png)

# eMayordormo

**eMayordomo** es un script desarrollado con el objetivo de vigilar un buzón de Gmail para **responder automáticamente a ciertos mensajes con respuestas prediseñadas específicas**. Este documento recoge información técnica sobre su funcionamiento, limitaciones y algunos detalles de implementación que tal vez resulten de tu interés.

![](https://user-images.githubusercontent.com/12829262/122110114-7740ac80-ce1e-11eb-96b4-70304088d53b.gif)

Si simplemente deseas utilizarlo cuanto antes, puedes averiguar rápidamente cómo usarlo y obtener una copia de la plantilla de hoja de cálculo en la que se basa en este artículo en mi blog:

[👉 https://pablofelip.online/emayordomo 👈](https://pablofelip.online/emayordomo)

Si por el contrario prefieres conocer esos detalles técnicos que mencionaba, este es el lugar adecuado.

Lógicamente también puedes hacer ambas cosas, lo que por otra parte es lo más recomendable, en mi opinión.

# ¿Cómo funciona eMayordomo?

En el artículo mencionado anteriormente se facilitan las [especificaciones](https://pablofelip.online/emayordomo/#mcetoc_1f7masso32l) de eMayordomo para, a continuación, explicar [cómo se han llegado a satisfacer](https://pablofelip.online/emayordomo/#mcetoc_1f7m9lbio2h).

No obstante, repasemos el funcionamiento general del script para centrar la discusión antes de abordar algunos de los aspectos técnicos de su implementación.

![Diagrama de eMayordomo](https://docs.google.com/drawings/d/e/2PACX-1vS6_mjaL-sZabk3piQYjGwOQWytUsRRnmE-Khrijj5hs_A8ivxCeO0tha1YKW4wGKnQXS0BXVTA8PIp/pub?w=1000&h=1000)

1.  Un usuario rellena un formulario web de contacto.
2.  El formulario envía una notificación por correo electrónico a un buzón de Gmail.
3.  El correo entrante es clasificando utilizado los filtros de Gmail. Se aplican etiquetas diferenciadoras y se marcan los mensajes como destacados ⭐ para indicar que aún no han sido respondidos.
4.  Cada una de las etiquetas anteriores llevará asociada una respuesta predefinida. Estas respuestas se construyen a partir de una serie de mensajes en borrador, en cuyo asunto se utilizan prefijos, siempre entre corchetes y con un espacio posterior, para que el script pueda identificarlos con facilidad.
5.  Para establecer los emparejamientos (etiqueta, borrador) se recurre a una tabla de reglas en una hoja de cálculo de Google, en la que a cada etiqueta se le asocia uno de los prefijos utilizados en los asuntos de los borradores.
6.  Cada regla cuenta, opcionalmente, con una expresión regular para extraer la dirección de email a la que se debe responder del propio contenido del mensaje.
7.  La hoja de cálculo dispone de un menú específico para el script que permite activarlo, es decir, construir un [activador (trigger) instalable](https://developers.google.com/apps-script/guides/triggers/installable) que se ejecuta cada hora. No se ha contemplado la posibilidad de permitir la selección de otras periodicidades.
8.  Cada vez que eMayordomo procesa el buzón de correo, bien sea como consecuencia de una ejecución programada o de una invocación manual, registra el resultado de todos los intentos de envío de mensajes de respuesta en una tabla situada en otra pestaña de la hoja de cálculo. Esta información es procesada por un conjunto de fórmulas, que obtienen métricas de procesamiento diferenciadas para cada par (etiqueta, borrador) en la tabla de reglas.

# El diseño de la hoja de cálculo

eMayordomo es un script que reside en una hoja de cálculo de Google. Esta hoja de cálculo, además, sirve a dos propósitos:

*   Configurar el script (pestaña 🔀 **Reglas**).
*   Mostrar un registro de eventos de funcionamiento (pestaña 🗒️ **Registro**).

Aunque, evidentemente, las hojas de cálculo no constituyen en general el mejor modo de construir una interfaz de usuario, lo cierto es que hay unas cuantas cosas que podemos hacer para reducir la fricción cuando se utilizan como tal, un hecho extremadamente frecuente en innumerables desarrollos basados en Apps Script. Algunas de sus características integradas tales como los [intervalos protegidos](https://support.google.com/docs/answer/1218656), el [formato condicional](https://support.google.com/docs/answer/78413), la validación de datos o incluso las notas pueden resultar de gran ayuda en esos casos para conseguirlo.

## Pestaña 🔀 **Reglas**

![](https://user-images.githubusercontent.com/12829262/122110014-537d6680-ce1e-11eb-8320-d4308c526abf.png)

Las columnas A - D son las utilizadas para ajustar la configuración del script. El resto (E - H, con encabezado de azul más claro), contienen una serie de fórmulas matriciales que resumen los datos contenidos en la pestaña de registro (a continuación). Se ha [protegido](https://support.google.com/docs/answer/1218656?co=GENIE.Platform%3DDesktop&hl=es) el intervalo E1:H11 para evitar ediciones accidentales que pudieran romper las fórmulas.

*   Se utilizan reglas de formato condicional

## Pestaña 🗒️ **Registro**

# Implementación

# Licencia

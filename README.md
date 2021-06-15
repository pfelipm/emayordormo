![Banner repo](https://user-images.githubusercontent.com/12829262/122108541-9b02f300-ce1c-11eb-951e-784f99ad65a6.png)

# eMayordormo

**eMayordomo** es un script desarrollado con el objetivo de vigilar un buzón de Gmail para **responder automáticamente a ciertos mensajes con respuestas prediseñadas específicas**. Este documento recoge información técnica sobre su funcionamiento, limitaciones y algunos detalles de implementación que tal vez resulten de tu interés.

![Mayordomo de email (Audio Training) - Hojas de cálculo de Google](https://user-images.githubusercontent.com/12829262/122108556-9fc7a700-ce1c-11eb-9ec3-04f5573de035.gif)

Si simplemente deseas utilizarlo cuanto antes, puedes averiguar rápidamente cómo usarlo y obtener una copia de la plantilla de hoja de cálculo en la que se basa en este artículo en mi blog:

[👉 https://pablofelip.online/emayordomo 👈](https://pablofelip.online/emayordomo)

Si por el contrario prefieres conocer esos detalles técnicos que mencionaba, este es el lugar adecuado.

Lógicamente también puedes hacer ambas cosas, lo que por otra parte es lo más recomendable, en mi opinión.

# ¿Cómo funciona eMayordomo?

En el artículo mencionado anteriormente se facilitan las [especificaciones](https://pablofelip.online/emayordomo/#mcetoc_1f7masso32l) de eMayordomo para, a continuación, explicar [cómo se han llegado a satisfacer](https://pablofelip.online/emayordomo/#mcetoc_1f7m9lbio2h).

No obstante, en este diagrama te muestro el funcionamiento general del script para centrar la discusión sobre algunos de sus aspectos técnicos.

![Diagrama de eMayordomo](https://docs.google.com/drawings/d/e/2PACX-1vS6_mjaL-sZabk3piQYjGwOQWytUsRRnmE-Khrijj5hs_A8ivxCeO0tha1YKW4wGKnQXS0BXVTA8PIp/pub?w=1000&h=1000)

Podemos resumir todo esto de manera rápida en 7 **pasos**:

1.  El correo entrante es clasificando utilizado los filtros de Gmail. Se aplican etiquetas diferenciadas y se marcan los mensajes como destacados para indicar ⭐ que aún no han sido respondidos.
2.  Cada una de las etiquetas anteriores llevará asociada una respuesta predefinida. Estas respuestas son borradores, en cuyo asunto se utilizan prefijos, siempre entre corchetes y con un espacio posterior, para que el script pueda identificarlos sin problemas.
3.  Para establecer los emparejamientos (etiqueta, borrador) se recurre a una tabla de reglas en una hoja de cálculo de Google, en la que a cada etiqueta se le asocia uno de los prefijos utilizados en los asuntos de los borradores.
4.  Cada regla cuenta, opcionalmente, con una expresión regular para extraer la dirección de email a la que se debe responder del propio contenido del mensaje.
5.  La hoja de cálculo dispone de un menú específico para el script que permite activarlo, es decir, construir un [activador (trigger) instalable](https://developers.google.com/apps-script/guides/triggers/installable) que se ejecuta cada hora. No se ha contemplado la posibilidad ofrece otras periodicidades fácilmente seleccionables por el usuario.
6.  Cada vez que eMayordomo procesa el buzón de correo, bien sea como consecuencia de una ejecución programada o de una invocación manual, registrará el resultado de todos los intentos de envío de mensajes de respuesta automática en otra pestaña de la hoja de cálculo.
7.  Una serie de fórmulas en la tabla de reglas analizan en continuo los datos del registro de ejecución para obtener métricas de ejecución relativas diferenciadas.

# El diseño de la hoja de cálculo

eMayordomo es un script que reside en una hoja de cálculo de Google, que además se utiliza con dos finalidades:

*   Configurar el funcionamiento del script (pestaña 🔀 **Reglas**).
*   Mostrar un registro de eventos y acciones (pestaña 🗒️ **Registro**).

## Pestaña 🔀 **Reglas**

## Pestaña 🗒️ **Registro**

# Implementación

# Licencia

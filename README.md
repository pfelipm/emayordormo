![](https://user-images.githubusercontent.com/12829262/122110050-6132ec00-ce1e-11eb-99f8-e0ce463c6cd6.png)

**\*\*\* En construcción \*\*\***

# Tabla de contenidos

*   [¿Qué es eMayordormo?](#qu%C3%A9-es-emayordormo)
*   [¿Cómo funciona eMayordomo?](#c%C3%B3mo-funciona-emayordomo)
*   [La hoja de cálculo](#la-hoja-de-c%C3%A1lculo)
    *   [Pestaña 🔀 Reglas](#pesta%C3%B1a--reglas)
    *   [Pestaña 🗒️ Registro](#pesta%C3%B1a-%EF%B8%8F-registro)
*   [Implementación](#implementaci%C3%B3n)
    *   [Diagrama de bloques](#diagrama-de-bloques)
    *   [acercaDe.html](#acercadehtml)
    *   [Activador.gs](#activadorgs)
    *   [Código.gs](#c%C3%B3digogs)
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

![Esquema funcional](https://docs.google.com/drawings/d/e/2PACX-1vS6_mjaL-sZabk3piQYjGwOQWytUsRRnmE-Khrijj5hs_A8ivxCeO0tha1YKW4wGKnQXS0BXVTA8PIp/pub?w=1000&h=1000)

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

También he utilizado la validación de datos (`Datos` ⇒ `Validación de datos`) para evitar reglas duplicadas sobre la misma etiqueta de correo. La fórmula personalizada usada en el criterio de validación es `=CONTAR.SI($B$2:$B;B2)=1`, lo que rechaza la introducción de cualquier secuencia de texto ya presente en el intervalo `B2:B`.

![](https://user-images.githubusercontent.com/12829262/122250606-15d61780-ceca-11eb-95b1-624782a6b0b3.png)

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

Estas cuatro fórmulas se encuentran en la fila de encabezado y por tanto devuelven en la 1ª fila del resultado la etiqueta que da título a la columna como literal de texto . Esto resulta muy práctico, dado que de este modo es posible ordenar la tabla sin que los cálculos dejen de funcionar.

Y, naturalmente, estos cálculos podrían haberse realizado en el seno del código Apps Script, pero dado que en este caso tenemos a nuestra disposición toda la potencia que nos ofrecen las fórmulas de las hojas de cálculo de Google ¿por qué no usarlas? 

## Pestaña 🗒️ **Registro**

![](https://user-images.githubusercontent.com/12829262/122252608-c7c21380-cecb-11eb-8ad5-ad6434776eb8.png)

En esta pestaña se muestran ciertos eventos de funcionamiento registrados por el script, siempre más arriba que incluyen:

*   Respuestas enviadas correctamente.
*   Respuestas que no han podido ser enviadas, bien por algún fallo en la configuración de las reglas, bien por errores en tiempo de ejecución de cualquier índole.
*   Ejecuciones programadas o manuales en las que no se han detectado correos electrónicos a los que responder.

Por comodidad, los elementos más recientes aparecerán siempre en la parte superior de la tabla, en la que se ha usado nuevamente la combinación de colores alternos que se aplicó sobre la de reglas.

Además, se han dispuesto tres controles de filtro en la parte superior para facilitar un primer análisis de los datos, aunque cabe la posibilidad, tal y como [se recomendaba en el artículo previo](https://pablofelip.online/emayordomo/#mcetoc_1f829n2n14f), de llevarlos a una herramienta de visualización más avanzada como Data Studio. Se ha ajustado el color de fondo de los controles de filtro para hacerlo coincidir con el de la fila sobre la que flotan para lograr una mejor integración visual, aunque esto probablemente sea una manía mía.

# Implementación

## Diagrama de bloques

![Diagrama de bloques](https://docs.google.com/drawings/d/e/2PACX-1vRGv92McVLaESzpO2jSc8j_gq8VO7u2lPc4A0-DUWIIq8F1hauwxLojvkZSrPG5hNUy-Y0ReclagLAy/pub?w=1000&h=1000)

## acercaDe.html

Se trata de una plantilla HTML necesaria para generar la ventana que muestra información sobre eMayordomo.

Se utiliza el servicio de plantillas HTML [(HTMLService](https://developers.google.com/apps-script/guides/html)) y sendos [scriptlets explícitos](https://developers.google.com/apps-script/guides/html/templates#printing_scriptlets) (_printing scriptlets_) para parametrizar los elementos de texto que indican el nombre y la versión del script.

![](https://user-images.githubusercontent.com/12829262/123538857-0b701500-d737-11eb-853f-ad97d5d8b7ce.png)

```javascript
const EMAYORDOMO = {
  version: 'Versión: 1.0 (junio 2021)',
  icono: '📭',
  nombre: 'eMayordomo',
  ...
};

function acercaDe() {
  let panel = HtmlService.createTemplateFromFile('acercaDe');
  panel.version = EMAYORDOMO.version;
  panel.nombre = EMAYORDOMO.nombre;
  SpreadsheetApp.getUi().showModalDialog(panel.evaluate().setWidth(420).setHeight(450), `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`);
}
```

```html
<b><?= nombre ?></b> es una plantilla de hoja de cálculo de Google que permite 
administrar y enviar mensajes de respuesta automática, con HTML, imágenes en línea y
adjuntos, en función de las etiquetas aplicadas a los correos electrónicos recibidos
en un buzón de Gmail.
...
<p><?= version ?>.</p>
```

La pequeña imagen en la cabecera del cuadro de diálogo se ha insertado usando un [esquema de URI de datos](https://es.wikipedia.org/wiki/Esquema_de_URI_de_datos), eludiendo así su hospedaje en un URL externo. La codificación Base 64 se ha obtenido en el conocido sitio web [Base64 Image Encoder](https://www.base64-image.de/).

```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAaQAA...>
```

## Activador.gs

El modo de funcionamiento natural de eMayordomo es en 2º plano, gracias a un [activador por tiempo instalable](https://developers.google.com/apps-script/guides/triggers/installable), instanciado mediante la clase [`ClockTriggerBuilder`](https://developers.google.com/apps-script/reference/script/clock-trigger-builder),  que es inicializado por el usuario mediante el comando del menú del script `⏰ Procesar etiquetas cada hora`.

![](https://user-images.githubusercontent.com/12829262/123541712-2b5b0500-d746-11eb-91f9-f7a00851e22c.png)

La interfaz de usuario de eMayordormo no contempla en estos momentos la posibilidad de que el usuario pueda introducir una frecuencia distinta a 1 hora para las ejecuciones periódicas del activador por tiempo, pero este valor puede ser variado fácilmente modificando la constante `EMAYORDOMO.horasActivador` en la sección de inicialización de variables globales en `Código.gs`.

:warning:  Cuando un script que instala _triggers_ puede ser utilizado por varios usuarios es conveniente **impedir que se activen múltiples instancias**. De lo contrario nos podemos encontrar con la situación de que el script reacciona por duplicado ante un determinado evento, lo que probablemente puede suponer un mal funcionamiento o, como mínimo, un pérdida de eficiencia. Esto se consigue utilizando:

*   [PropertiesService](https://developers.google.com/apps-script/guides/properties), para llevar la cuenta de la dirección de email del usuario que ha realizado la activación del _trigger_. Un valor de `null` o `''` indica que no está activo. El uso de este registro es imprescindible dado que un usuario [no puede determinar](https://developers.google.com/apps-script/reference/script/script-app#getProjectTriggers()) qué _triggers han_ sido activados por otros, ni siquiera en el contexto de un mismo script. La información se guarda en el registro de **propiedades del documento**, de modo que quede compartida entre todos sus usuarios.
*   [LockService](https://developers.google.com/apps-script/reference/lock), para garantizar que no se produzcan problemas de concurrencia al modificar la propiedad que identifica al usuario que ha instalado el activador. Dado que este script no se distribuye como complemento, [`getDocumentLock()`](https://developers.google.com/apps-script/reference/lock/lock-service?hl=en#getdocumentlock) y [`getScriptLock()`](https://developers.google.com/apps-script/reference/lock/lock-service?hl=en#getscriptlock). podrían utilizarse indistintamente, obteniendo en ambos casos los mismos resultados.

![](https://user-images.githubusercontent.com/12829262/123540516-ae2c9180-d73f-11eb-9b0f-e63a616eed08.png)

:point\_right: [Ver vídeo demostrativo en YouTube](https://youtu.be/O4HvbyFLeHw)

Adicionalmente, y dado que eMayordomo requiere que se hayan definido una serie de reglas de filtro sobre el buzón de Gmail que se desea vigilar, se establece una **verificación adicional para impedir que un usuario distinto al propietario de la hoja de cálculo de control instale el activador**. Se supone, por tanto, que **el propietario de ambos elementos (buzón y hoja de cálculo) es el mismo**.

Veamos las distintas funciones involucradas en esta gestión de los activadores.

### comprobarEstado()

Esta función es invocada por el comando `❓ Comprobar estado` del menú del script.

![](https://user-images.githubusercontent.com/12829262/123541754-7248fa80-d746-11eb-9928-60ea2001c4ae.png)

Simplemente muestra un mensaje indicando si eMayordomo está procesando respuestas en 2º plano o no y, en su caso, qué usuario lo ha activado.

![](https://user-images.githubusercontent.com/12829262/123541617-bb4c7f00-d745-11eb-8458-f31f2c3bfcf5.png)

```javascript
/**
 * Informa del estado de activación de eMayordomo
 * ¿Se está vigilando el buzón de Gmail en 2º plano?
 */
 function comprobarEstado() {

   const ssUi = SpreadsheetApp.getUi();
   const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
   if (activadoPor == '') {
     mensaje = `No se está vigilando el buzón de Gmail en 2º plano.`;
   } else {
     mensaje = `El proceso en 2º plano ha sido activado por ${activadoPor}
     y se está vigilando su buzón de Gmail.`;
   }
   ssUi.alert(
     `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
     mensaje,
     ssUi.ButtonSet.OK);
     
   // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
   construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));   

}
```

La función siempre actualiza el menú del script antes de finalizar su ejecución para que este refleje su estado de activación tan pronto como sea posible en un escenario multi usuario.

### activar()

Esta función es invocada al utilizar el comando `⏰ Procesar etiquetas cada hora` del menú del script.

![](https://user-images.githubusercontent.com/12829262/123542152-3f076b00-d748-11eb-8762-eda619d51fb4.png)

La lógica del control tiene en cuenta las circunstancias ya descritas, que pueden combinarse entre sí de distintos modos, para evitar tanto activaciones múltiples como que un usuario distinto al propietario de la hoja de cálculo realice la instalación del _trigger_ (cuando sea posible comprobarlo, claro está).

Primeramente se comprueba si ya hay un _trigger_ activo. De ser así se cancela la activación.

```javascript
/**
 * Menú >> Activar
 * Trata de impedir que un usuario distinto al propietario de la hdc active el trigger,
 * esto es una medida de seguridad para evitar que eMayordomo actúe sobre el buzón de
 * Gmail incorrecto. La comprobación no es concluyente cuando la hdc reside en una
 * unidad compartida, en ese caso se solicita confirmación al usuario.
 */
function activar() {

  const ssUi = SpreadsheetApp.getUi();
  let emailPropietario;
  let activar = true;
  const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);

  // [1] Cancelar si ya está activado
  if (activadoPor) {
    ssUi.alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    `${EMAYORDOMO.simboloError} Ya hay un proceso en 2º plano activado por ${activadoPor}.`,
    ssUi.ButtonSet.OK);
```

 A continuación se trata de identificar al propietario de la hoja de cálculo.

```javascript
  } else {
    // No hay proceso en 2º plano activo, veamos quién es el propietario de la hdc
    const propietario = SpreadsheetApp.getActiveSpreadsheet().getOwner();
    const emailUsuarioActivo = Session.getEffectiveUser().getEmail();
    if (propietario) {
      emailPropietario = propietario.getEmail();
    } else {
      emailPropietario = null;
    }
```

Esta comprobación, no obstante, :warning: [no puede realizarse](https://twitter.com/pfelipm/status/1404186554378108931) :warning: **cuando la hoja de cálculo reside en una unidad compartida**. En esta circunstancia, eMayordomo informará al usuario y solicitará su confirmación antes de poner en marcha el activador por tiempo.

![Imagen](https://pbs.twimg.com/media/E3yppjMWQAEzcgZ?format=png&name=900x900)

```javascript
    // [2] Si la hdc está en unidad compartida solicitar confirmación para proseguir o cancelar activación
    if (!emailPropietario) {
      activar = ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Solo el propietario del buzón de Gmail en el que se han definido las reglas de
        filtrado, etiquetas y borradores debe realizar la activación en 2º plano.
        
        ¿Seguro que deseas continuar?`,
        ssUi.ButtonSet.OK_CANCEL) == ssUi.Button.OK;
      if (!activar) {
        ssUi.alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          `Activación en 2º plano cancelada.`,
          ssUi.ButtonSet.OK);
      }
```

Si el usuario actual del script no es quien realizó la activación, el proceso finaliza con un mensaje de alerta.

```javascript
    } else if (emailPropietario != emailUsuarioActivo) {
      // [3] Cancelar activación si se puede determinar que el usuario actual no es el propietario de la hdc
      ssUi.alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} Solo ${emailPropietario} debe activar el proceso en 2º plano.`,
      ssUi.ButtonSet.OK);
      activar = false;
    }
```

De ser así se procede, en su caso, a tratar de poner en marcha el activador por tiempo, obteniendo previamente un acceso exclusivo a la sección de código crítica por medio de [`getDocumentLock()`](https://developers.google.com/apps-script/reference/lock/lock-service?hl=en#getDocumentLock()) y [`waitLock(1)`](https://developers.google.com/apps-script/reference/lock/lock?hl=en#waitLock(Integer)), que fallará inmediatamente con una excepción, capturada por el bloque [`try...catch`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/try...catch) si otra instancia del script estuviera tratando de realizar también la activación en ese mismo instante.

```javascript
    // [4] Continuamos con activación a menos que se haya cancelado en [2] o [3]
    if (activar) {

      // Solo gestionaremos el activador si no hay otra instancia del script ya intentándolo
      const mutex = LockService.getDocumentLock();
      try {

        // Queremos fallar cuanto antes
        mutex.waitLock(1);
```

Si el script consigue acceder al bloque de código protegido por el semáforo de acceso, invocará a continuación `gestionarTrigger('ON')` para instalar el activador. Si la llamada tiene éxito se escribe la dirección de email del usuario que ha conseguido ejecutar este procedimiento en la propiedad del documento indicada por la constante de texto `EMAYORDOMO.propActivado`. 

En caso contrario, o si se ha producido algún otro error en tiempo de ejecución, se emiten las alertas correspondientes.

```javascript
        const resultado = gestionarTrigger('ON');
        let mensaje;    
        if (resultado == 'OK') {
          mensaje = `Vigilando ahora el buzón de Gmail de ${emailUsuarioActivo}.`;
          PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, emailUsuarioActivo);
        } else {
          mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error en la activación del proceso en 2º plano: 

          ${resultado}`;
        }

        // Aquí termina la sección crítica cuando se intenta realizar activación
        mutex.releaseLock();

        ssUi.alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          mensaje,
          ssUi.ButtonSet.OK);

      } catch(e) {
           // No ha sido posible obtener acceso al bloque de código exclusivo
        ssUi.alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          `${EMAYORDOMO.simboloError} En este momento no es posible activar el proceso en 2º plano, inténtalo más tarde.`,
          ssUi.ButtonSet.OK);
      }
    }
  }
```

Antes de terminar, se actualiza nuevamente el menú del script para reflejar el cambio en el primer comando, que ahora se transformará en `⏸️ Dejar de procesar etiquetas cada hora` siempre y cuando la activación del _trigger_ se haya realizado del modo esperado.

```javascript
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}
```

Como puedes apreciar, se emiten numerosas alertas visibles con el método [`alert(title, prompt, buttons)`](https://developers.google.com/apps-script/reference/base/ui.html?hl=en#alert(String,String,ButtonSet)) para mostrar lo que está ocurriendo en cada momento a lo largo del proceso.

### desactivar()

Esta función, complementaria de la anterior, es invocada por el comando `⏸️ Dejar de procesar etiquetas cada hora` del menú del script y trata de eliminar un _trigger_ previamente activado, teniendo en cuenta todas las consideraciones acerca de la casuística de concurrencia mencionadas.

![](https://user-images.githubusercontent.com/12829262/123549669-3889eb00-d76a-11eb-8e82-578ec15df79c.png)

Nuevamente se utiliza un bloque de ejecución en exclusión mutua para acceder a la propiedad del documento `EMAYORDOMO.propActivado`. Si el usuario que ejecuta la función es el mismo que realizó previamente la activación, se invoca inmediatamente `gestionarTrigger('OFF')`, controlando como siempre los posibles errores en tiempo de ejecución en todo momento mediante un bloque [`try...catch`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/try...catch).

```javascript
/**
 * Menú >> Desactivar
 * Trata de eliminar el trigger de tratamiento de respuestas (un usuario nunca tiene acceso a los triggers de otro)
 */
function desactivar() {

  const ssUi = SpreadsheetApp.getUi();
  const mutex = LockService.getDocumentLock();
  try {

     // Queremos fallar cuanto antes
    mutex.waitLock(1);

    const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);

    if (activadoPor == Session.getEffectiveUser()) {

      const resultado = gestionarTrigger('OFF');
      let mensaje;
      if (resultado == 'OK') {     
        mensaje = `Ya no se está vigilando el buzón de Gmail de ${activadoPor}.`;
        PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, '');
      } else {
        mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error al desactivar el proceso en 2º plano: 

        ${resultado}`;
      } 

      // Aquí termina la sección crítica cuando se intenta realizar desactivación
      mutex.releaseLock();

      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        ssUi.ButtonSet.OK);
```

En caso contrario, simplemente se muestra una alerta informativa.

```javascript
    } else {
        
      // Aquí termina la sección crítica cuando *no* se realiza desactivación porque lo ha activado otro usuario o no está activado
      mutex.releaseLock();

      if (activadoPor == '') {
        mensaje = `${EMAYORDOMO.simboloError} El proceso en 2º plano no está activado.`;
      } else {
        mensaje = `${EMAYORDOMO.simboloError} El proceso en 2º plano debe ser desactivado por ${activadoPor}.`;
      }
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        ssUi.ButtonSet.OK);
    }        
  } catch (e) {
    // No ha sido posible obtener acceso al bloque de código exclusivo
    ssUi.alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} En este momento no es posible desactivar el proceso en 2º plano, inténtalo más tarde.`,
      ssUi.ButtonSet.OK);
  }
```

En todos los casos se actualiza el menú del script antes de finalizar y, como siempre, se lanzan alertas para mantener al usuario informado.

```javascript
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}
```

### gestionarTrigger()

Se trata de una función auxiliar a la que llaman tanto `activar()` como `desactivar()`. Es la que se encarga realmente de crear o destruir el _trigger_, devolviendo como resultado un valor que indica si la operación ha podido realizare con éxito o no.

```javascript
/**
 * Instala o elimina el trigger que se ejecuta cada hora
 * @param {string} orden "ON" | "OFF"
 * @return {string} Mensaje de error / 'OK'.
 */
function gestionarTrigger(orden) {

  let estado = 'OK';

  switch (orden) {
      
    case 'ON':  
      // Crear trigger
      try {
        ScriptApp.newTrigger('procesarEmails')
        .timeBased()
        .everyHours(EMAYORDOMO.horasActivador)
        .create();
        console.info('Creado');
      } catch(e) {
        estado = e;
      }
      break;
      
    case 'OFF':
      // Eliminar trigger(s)
      try {
        const triggers = ScriptApp.getProjectTriggers();
        triggers.filter(t => t.getEventType() ==  ScriptApp.EventType.CLOCK).map(trigger => ScriptApp.deleteTrigger(trigger));
      } catch (e) {
        estado = e;
      }
      
      break;
  }

  return estado;

}
```

Importantísimo de nuevo el uso de un bloque [`try...catch`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/try...catch) para dar caza a los errores en tiempo de ejecución y _fallar graciosamente_ cuando corresponda. Y es que si algo puede ir mal al utilizar los servicios de Apps Script, ten por seguro que en algún momento irá mal. Más vale que estés preparados para manejar la situación.

## Código.gs

### onOpen()

Esta es la función que se ejecuta cada vez que se abre la hoja de cálculo. Se limita a leer la propiedad que identifica al usuario que ha realizado la activación y pasársela como parámetro a la función `construirMenu()`, que es la que realmente crea el menú del script.

```javascript
/**
 * Construye el menú de la aplicación al abrir la hdc de acuerdo con el estado de activación
 */
function onOpen() {

  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}
```

Como probablemente sepas, [onOpen()](https://developers.google.com/apps-script/guides/triggers?hl=en#onopene) es un [activador simple](https://developers.google.com/apps-script/guides/triggers?hl=en#onopene). Hay que tener cuidado con el código que se mete en ellos dado que hay ciertas cosas de las que nos son capaces . Concretamente, no pueden utilizar servicios que requieran de autorización (más sobre esto en el apartado 2.1 de este [artículo](https://comunidad.gedu.es/post/bas-002-exportar-diapositivas-de-una-presentacion-como-png-6072aa8f5c5c167af76f8508)). Afortunadamente, leer las propiedades del documento usando `PropertiesService` no es una de ellas en este caso (:warning: cuidado , otro gallo cantaría si se tratara de un complemento para hojas de cálculo, donde existen ciertas [circunstancias](https://developers.google.com/workspace/add-ons/concepts/editor-auth-lifecycle?hl=en#authorization_modes) que complican un poco las cosas).

### construirMenu()

Otra función sencillita.

El primer comando del menú del script será uno u otro dependiendo del estado de activación de eMayordomo, es decir, de si está vigilando o no el buzón de Gmail por medio del consabido activador por tiempo.

```javascript
function construirMenu(activadoPor) {

  // Construye menú en función del estado del trigger
  const menu = SpreadsheetApp.getUi().createMenu(`${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`);  
  if (!activadoPor) {
    menu.addItem('️⏰ Procesar etiquetas cada hora', 'activar');
  } else {
    menu.addItem('⏸️ Dejar de procesar etiquetas cada hora', 'desactivar');
  }

  // Resto del menú (no dinámico)  
  menu.addItem('🔁 Ejecutar manualmente', 'ejecutarManualmente')
  menu.addItem('❓ Comprobar estado', 'comprobarEstado')
    .addSeparator()
    .addItem(`💡 Acerca de ${EMAYORDOMO.nombre}`, 'acercaDe')
    .addToUi();

}
```

### acercaDe()

Esta función es invocada por el comando `💡 Acerca de eMayordomo` y se utiliza para abrir la ventana de información de eMayordomo, parametrizando su contenido con sendos _scriptlets._ Esto ya lo comentamos en el apartado dedicado a [acercaDe.html](#acercadehtml), así que nada más que decir aquí.

### ejecutarManualmente()

eMayordomo también admite la ejecución manual del proceso de atención a los mensajes recibidos en el buzón de Gmail. Esto puede resultar de utilidad para procesar correos electrónicos a los que no se ha respondido como consecuencia de algún error temporal.

Esta función puede invocarse el comando `🔁 Ejecutar manualmente`.

![](https://user-images.githubusercontent.com/12829262/123556666-c1b21980-d78c-11eb-9a60-05900701e74f.png)

Si un usuario distinto al que ejecuta la función ya ha activado el funcionamiento en 2º plano de eMayordomo la ejecución manual queda cancelada. Lógico, el buzón de Gmail no será en ese caso el del usuario actual.

```javascript
/**
 * Menú >> Ejecutar manualmente la función procesarEmails(),
 * Trata de impedir que un usuario distinto al propietario de la hdc realice un proceso manual
 * esto es una medida de seguridad para evitar que eMayordomo actúe sobre el buzón de
 * Gmail incorrecto. La comprobación no es concluyente cuando la hdc reside en una
 * unidad compartida, en ese caso se solicita confirmación al usuario para proceder.
 */
function ejecutarManualmente() {

  const ssUi = SpreadsheetApp.getUi();
  const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
  const emailUsuarioActivo = Session.getEffectiveUser().getEmail();
  let ejecutar = true;

  // [1] ¿Otro usuario ha realizado ya la activación?
  if (activadoPor && activadoPor != emailUsuarioActivo) {
    ssUi.alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    `${EMAYORDOMO.simboloError} Ya hay un proceso en 2º plano activado por ${activadoPor}, no parece
    buena idea que un usuario distinto (¡tú!) realice un procesado manual.`,
    ssUi.ButtonSet.OK);
```

En caso contrario, se pasa a determinar quién es el propietario de  la hoja de cálculo, del mismo modo que en la función `activar()`.

```javascript
  } else {
    // No hay proceso en 2º plano activo, veamos quién es el propietario de la hdc ¡getOwner() devuelve null si hdc está en unidad compartida!
    let emailPropietario;
    const propietario = SpreadsheetApp.getActiveSpreadsheet().getOwner();
    if (propietario) {
      emailPropietario = propietario.getEmail();
    } else {
      emailPropietario = null;
    }
```

Lo que sigue es muy similar. Si la hoja de cálculo está en una unidad compartida se pide confirmación al usuario.

```javascript
    // [2] Si la hdc está en unidad compartida y el proceso en 2º plano no ha sido activado por el usuario actual solicitar confirmación para proseguir
    if (!emailPropietario && activadoPor != emailUsuarioActivo) {
      ejecutar = ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Solo el propietario del buzón de Gmail en el que se han definido las reglas de
        filtrado, etiquetas y borradores debe realizar un procesado manual.
        
        ¿Seguro que deseas continuar?`,
        ssUi.ButtonSet.OK_CANCEL) == ssUi.Button.OK;
```

Si no lo está, se verifica si el usuario activo no es el propietario de la hoja de cálculo, en ese caso se cancela también la ejecución manual.

```javascript
   } else if (emailPropietario && emailPropietario != emailUsuarioActivo) {
     // [3] Cancelar ejecución si se puede determinar que el usuario actual no es el propietario de la hdc
     ssUi.alert(
     `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
     `${EMAYORDOMO.simboloError} Solo ${emailPropietario} debe realizar un procesado manual.`,
     ssUi.ButtonSet.OK);
     ejecutar = false;
   }
```

Por último se llama, en su caso, a la función `procesarEmails()`.

```javascript
    // Seguir con ejecución manual a menos que se haya cancelado en [2] o [3]
    if (ejecutar) {
      // Ejecutar proceso sobre el buzón de Gmail
      procesarEmails();
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Ejecución manual terminada. Revisa la hoja ${EMAYORDOMO.tablaLog.nombre}.`,
        ssUi.ButtonSet.OK);
    } else {
      // Activación cancelada
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Ejecución manual cancelada.`,
        ssUi.ButtonSet.OK);
    }
  }

}
```

### procesarEmails()

Esta función constituye el bloque principal de eMayordomo. Contiene el código que revisa los mensajes a procesar en el buzón de entrada y envía las respuestas automáticas de acuerdo con las reglas definidas por el usuario.

La cosa comienza con la lectura de una serie de parámetros de funcionamiento desde las celdas de la hoja 🔀 **Reglas**. La variable `selloTiempo` se utilizará para datar en la hoja del registro de operaciones cada la ejecución de esta función.

```javascript
/**
 * Revisa el buzón de Gmail del usuario que lo ejecuta y responde a los mensajes
 * con respuestas preparadas de acuerdo a las reglas de procesamiento definidas
 * en el hojaEMAYORDOMO.tablaReglas.nombre.
 * Los mensajes a los que se ha respondido quedan marcados como leídos y no destacados.
 */
function procesarEmails() {

  // Sello de tiempo de este lote
  const selloTiempo = new Date();

  // Registro de operaciones
  const operaciones = [];

  // Leer reglas de procesamiento de mensajes recibidos
  const reglas = SpreadsheetApp.getActive().getSheetByName(EMAYORDOMO.tablaReglas.nombre).getDataRange().getValues();
  const [encabezados, ...tabla] = reglas;

  // Identificar columnas en la tabla de configuración / resultados
  // const colProcesar =  encabezados.indexOf('☑️');
  const colEtiqueta = encabezados.indexOf('Etiqueta a procesar');
  const colPlantilla = encabezados.indexOf('Plantilla email');
  const colRegExEmail = encabezados.indexOf('RegEx extracción email');
```

A continuación se enumeran las etiquetas que intervienen en alguna regla (`etiquetasReglas`), las existentes en el buzón de Gmail (`etiquetasUsuario`) y los mensajes en borrador (`borradores`). Estos últimos se guardan de cierta manera con el objetivo de facilitar las acciones posteriores:

*   Id del borrador.
*   Objeto [`GmailMessage`](https://developers.google.com/apps-script/reference/gmail/gmail-message) asociado al borrador.
*   Prefijo del asunto del mensaje, de la forma `[identificador]`. Ejemplo: Si el asunto es "_\[GEN\] Información general_", el prefijo almacenado será "_\[GEN\]_".
*   Asunto del mensaje, sin su \[prefijo\] ni el espacio posterior que lo separa del asunto real. Siguiendo con el ejemplo anterior, aquí se guardará "_Información general_".

Para extraer prefijo y asunto se emplea un [`match()`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/String/match) con sendos grupos de captura.

```javascript
  // Obtener etiquetas de las reglas a procesar: todos los campos requeridos de la regla deben ser VERDADERO (o truthy)
  // En la hdc se impide que varias reglas se apliquen sobre una misma etiqueta por medio de validación de datos
  const etiquetasReglas = tabla.filter(regla =>
    regla.slice(EMAYORDOMO.tablaReglas.colInicioRegla, EMAYORDOMO.tablaReglas.colFinRegla + 1).every(campo => campo))
    .map(regla => regla[colEtiqueta]);

  // Obtener etiquetas existentes en el buzón, la usaremos más adelante para comprobar que las reglas son válidas
  const etiquetasUsuario = GmailApp.getUserLabels().map(etiqueta => etiqueta.getName());

  // Obtener mensajes en borrador {idBorrador, mensaje, [prefijo asunto, asunto sin prefijo]}
  const borradores = GmailApp.getDrafts().map(borrador => 
    ({
      id: borrador.getId(),
      mensaje: borrador.getMessage(),
      // Obtener prefijo (asuntoRegEx[1]) y asunto (asuntoRegEx[2])
      asuntoRegEx: borrador.getMessage().getSubject().match(/^(\[.+\]) (.+)$/)
    })
  );
```

El nombre que aparecerá como remitente en las respuestas enviadas se intenta extraer del propio nombre asignado a la hoja de cálculo. Se emplea para ello una expresión regular que intenta extraer una secuencia de texto, entre paréntesis y precedida de un espacio, en la parte final del nombre del archivo. Lo sé, esto es una rareza, pero en algún momento me debió parecer una buena idea.

```
  // Se intenta extraer el nombre del remitente de las respuestas a partir del nombre de la hoja de cálculo >> "texto (remitente)"
  let remitente = SpreadsheetApp.getActiveSpreadsheet().getName().match(/^.+\((.+)\)$/);
  if (remitente) {
    remitente = remitente[1];
  } else {
    // ...en caso contrario, nombre usuario (valor por defecto al enviar emails con GmailApp/MailApp si no se especifica 'name')
    remitente = Session.getEffectiveUser().getEmail().match(/^(.+)@.+$/)[1];
  }
```

El bucle principal de la función recorre cada una de las etiquetas (únicas) vinculadas a una de las reglas de auto respuesta definidas en la hoja de cálculo por medio de una `forEach()`. La primera comprobación se asegura de que la regla asociada a la etiqueta sea válida. De no ser así, se registra el error en el vector `operaciones` y se pasa a analizar la siguiente etiqueta.

```
  // Procesar cada etiqueta
  etiquetasReglas.forEach(etiqueta => {

    // ¿La etiqueta que vamos a procesar existe realmente en el buzón?

    if (!etiquetasUsuario.includes(etiqueta)) {
      console.error(`La etiqueta "${etiqueta}" no existe.`);
      operaciones.push(
        {
          estado: EMAYORDOMO.simboloError,
          inicio: selloTiempo,
          tiempo: new Date(),
          etiqueta: etiqueta,
          email: '',
          plantilla: '',
          mensaje: `Etiqueta "${etiqueta}" no existe en el buzón`
        });
    }
```

Seguidamente se verifica 

### etiquetasMensaje()

Es una sencilla función auxiliar que devuelve `TRUE` si el mensaje que se pasa como parámetro está marcado con la etiqueta de Gmail facilitada.

```javascript
/**
 * Devuelve TRUE si el mensaje está etiquetado con la etiqueta
 * que se pasa como parámetro
 * @param {GmailMessage} msg
 * @param {string} etiqueta
 * @returns {Boolean}
 */
function etiquetasMensaje(msg, etiqueta) {

  const id = msg.getId();
  const idEtiqueta = Gmail.Users.Labels.list('me').labels.find(e => e.name == etiqueta).id;
  etiquetas = Gmail.Users.Messages.get('me', id).labelIds;
  console.info(etiquetas)

  if (etiquetas.map) {
    return etiquetas.includes(idEtiqueta);
  }
  else {
    return false;
  }

}
```

### duplicarBorradorAPI() y extraerElementos()

### actualizarLog()

# Licencia

© 2021 Pablo Felip Monferrer ([@pfelipm](https://twitter.com/pfelipm)). Se distribuye bajo licencia GNU GPL v3.

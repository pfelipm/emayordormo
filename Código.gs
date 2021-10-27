/**
 * e-Mayordomo
 * Un script que envía respuestas enlatadas de acuerdo con las etiquetas 
 * y marca de destacados que se detectan en los mensajes recibidos. 
 *
 * @OnlyCurrentDoc
 * 
 * Copyright (C) Pablo Felip (@pfelipm) · Se distribuye bajo licencia GNU GPL v3.
 */

// Algunas inicializaciones
const EMAYORDOMO = {
  version: 'Versión: 1.0 (junio 2021)',
  icono: '📭',
  nombre: 'eMayordomo',
  tablaReglas: {
    nombre: '🔀 Reglas',
    colInicioRegla: 0,
    colFinRegla: 2,
    filInicialDatos: 2
  },
  tablaLog: {
    nombre: '🗒️ Registro',
    filInicialDatos: 3
  },
  simboloOk: '🆗',
  simboloError: '⚠️',
  simboloInfo: 'ℹ️',
  maxEmails: 20,
  propActivado: 'activadoPor',
  horasActivador: 1
};

/**
 * Construye el menú de la aplicación al abrir la hdc de acuerdo con el estado de activación
 */
function onOpen() {
  
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));
 
}

function construirMenu(activadoPor) {

  // Construye menú en función del estado del trigger
  const menu = SpreadsheetApp.getUi().createMenu(`${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`);  
  if (!activadoPor) {
    menu.addItem('️⏰ Procesar etiquetas cada hora', 'activar');
  } else {
    menu.addItem('⏸️ Dejar de procesar etiquetas cada hora', 'desactivar');
  }
  
  // Resto del menú (no dinámico)  
  menu.addItem('🔁 Ejecutar manualmente', 'ejecutarManualmente');
  menu.addItem('❓ Comprobar estado', 'comprobarEstado')
    .addSeparator()
    .addItem(`💡 Acerca de ${EMAYORDOMO.nombre}`, 'acercaDe')
    .addToUi();
  
}

/**
 * Muestra la ventana de información de la aplicación
 */
function acercaDe() {
  
  let panel = HtmlService.createTemplateFromFile('acercaDe');
  panel.version = EMAYORDOMO.version;
  panel.nombre = EMAYORDOMO.nombre;
  SpreadsheetApp.getUi().showModalDialog(panel.evaluate().setWidth(420).setHeight(450), `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`);

}

/**
 * Menú >> Ejecutar manualmente la función procesarEmails(),
 * Trata de impedir que un usuario distinto al propietario de la hdc realice un proceso manual
 * esto es una medida de seguridad para evitar que eMayordomo actúe sobre el buzón de
 * Gmail incorrecto. La comprobación no es concluyente cuando la hdc reside en una
 * unidad compartida, en ese caso se solicita confirmación al usuario para proceder.
 */
function ejecutarManualmente() {

  const ssUi = SpreadsheetApp.getUi();
  const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
  const emailUsuarioActivo = Session.getEffectiveUser().getEmail();
  let ejecutar = true;

  // [1] ¿Otro usuario ha realizado ya la activación?
  if (activadoPor && activadoPor != emailUsuarioActivo) {
    ssUi.alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    `${EMAYORDOMO.simboloError} Ya hay un proceso en 2º plano activado por ${activadoPor}, no parece
    buena idea que un usuario distinto (¡tú!) realice un procesado manual.`,
    ssUi.ButtonSet.OK);
  }
  else {
    // No hay proceso en 2º plano activo, veamos quién es el propietario de la hdc ¡getOwner() devuelve null si hdc está en unidad compartida!
    let emailPropietario;
    const propietario = SpreadsheetApp.getActiveSpreadsheet().getOwner();
    if (propietario) {
      emailPropietario = propietario.getEmail();
    } else {
      emailPropietario = null;
    }
    // [2] Si la hdc está en unidad compartida y el proceso en 2º plano no ha sido activado por el usuario actual solicitar confirmación para proseguir
    if (!emailPropietario && activadoPor != emailUsuarioActivo) {
      ejecutar = ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Solo el propietario del buzón de Gmail en el que se han definido las reglas de
        filtrado, etiquetas y borradores debe realizar un procesado manual.
        
        ¿Seguro que deseas continuar?`,
        ssUi.ButtonSet.OK_CANCEL) == ssUi.Button.OK;
    } else if (emailPropietario && emailPropietario != emailUsuarioActivo) {
      // [3] Cancelar ejecución si se puede determinar que el usuario actual no es el propietario de la hdc
      ssUi.alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} Solo ${emailPropietario} debe realizar un procesado manual.`,
      ssUi.ButtonSet.OK);
      ejecutar = false;
    }
    
    // Seguir con ejecución manual a menos que se haya cancelado en [2] o [3]
    if (ejecutar) {
      // Ejecutar proceso sobre el buzón de Gmail
      procesarEmails();
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Ejecución manual terminada. Revisa la hoja ${EMAYORDOMO.tablaLog.nombre}.`,
        ssUi.ButtonSet.OK);
    } else {
      // Activación cancelada
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Ejecución manual cancelada.`,
        ssUi.ButtonSet.OK);
    }
  }

}
/**
 * Revisa el buzón de Gmail del usuario que lo ejecuta y responde a los mensajes
 * con respuestas preparadas de acuerdo a las reglas de procesamiento definidas
 * en el hojaEMAYORDOMO.tablaReglas.nombre.
 * Los mensajes a los que se ha respondido quedan marcados como leídos y no destacados.
 */
function procesarEmails() {

  // Sello de tiempo de este lote
  const selloTiempo = new Date();

  // Registro de operaciones
  const operaciones = [];

  // Leer reglas de procesamiento de mensajes recibidos
  const reglas = SpreadsheetApp.getActive().getSheetByName(EMAYORDOMO.tablaReglas.nombre).getDataRange().getValues();
  const [encabezados, ...tabla] = reglas;

  // Identificar columnas en la tabla de configuración / resultados
  // const colProcesar =  encabezados.indexOf('☑️');
  const colEtiqueta = encabezados.indexOf('Etiqueta a procesar');
  const colPlantilla = encabezados.indexOf('Plantilla email');
  const colRegExEmail = encabezados.indexOf('RegEx extracción email');
 
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

  // Se intenta extraer el nombre del remitente de las respuestas a partir del nombre de la hoja de cálculo >> "texto (remitente)"
  let remitente = SpreadsheetApp.getActiveSpreadsheet().getName().match(/^.+\((.+)\)$/);
  if (remitente) {
    remitente = remitente[1];
  } else {
    // ...en caso contrario, nombre usuario (valor por defecto al enviar emails con GmailApp/MailApp si no se especifica 'name')
    remitente = Session.getEffectiveUser().getEmail().match(/^(.+)@.+$/)[1];
  }

  // Procesar cada regla / etiqueta
  etiquetasReglas.forEach(etiqueta => {

    // ¿La etiqueta que vamos a procesar existe realmente en el buzón?

    if (!etiquetasUsuario.includes(etiqueta)) {
      console.error(`La etiqueta "${etiqueta}" no existe.`);
      operaciones.push(
        {
          estado: EMAYORDOMO.simboloError,
          inicio: selloTiempo,
          tiempo: new Date(),
          etiqueta: etiqueta,
          email: '',
          plantilla: '',
          mensaje: `Etiqueta "${etiqueta}" no existe en el buzón`
        });
    } else {

      // La etiqueta sí existe, seguimos...

      const fila = tabla.find(regla => regla[colEtiqueta] == etiqueta);
      const plantilla = fila[colPlantilla];
      const regExEmail = fila[colRegExEmail]; // Opcional
      
      // ¿La plantilla (borrador) a utilizar existe? (¡cuidado con los duplicados!)
      
      const borrador = borradores.find(borrador => borrador.asuntoRegEx ? borrador.asuntoRegEx[1] == plantilla : null);
      if (!borrador) {
        console.error(`El borrador con prefijo "${plantilla} " no existe.`);
        operaciones.push(
          {
            estado: EMAYORDOMO.simboloError,
            inicio: selloTiempo,
            tiempo: new Date(),
            etiqueta: etiqueta,
            email: '',
            plantilla: plantilla,
            mensaje: `Borrador no encontrado`
          });
      } else {    

        // Etiqueta, borrador y regla OK, intentemos responder a los mensajes 

        // Extraer hilos con la etiqueta actual
        let hilosEtiquetados = [];
        let nHilo = 0;
        let nHilos;
        do {
          // Devuelve 0 si no hay mensajes
          const paginaHilos = GmailApp.getUserLabelByName(etiqueta).getThreads(nHilo, EMAYORDOMO.maxEmails);
          nHilos = paginaHilos.length;
          if (nHilos) {
            hilosEtiquetados = [...hilosEtiquetados, ...paginaHilos];
            nHilo += nHilos;
          }
        // Si se ha devuelto el nº máximo de mensajes solicitados haremos una nueva iteración, tal vez haya más
        } while (nHilos == EMAYORDOMO.maxEmails);

        // Recorramos ahora los mensajes de todos los hilos
        hilosEtiquetados.forEach(hilo => {
          
          // ¿Hay mensajes con estrella (no procesados) en el hilo?
          // Alternativa >> Usar fecha de última ejecución vs fecha mensaje (¿condiciones de carrera?)
          if (hilo.hasStarredMessages()) {

            hilo.getMessages().forEach(mensaje => {
              
              // ¿Mensaje aún no procesado *y* etiquetado con etiqueta que estamos procesando?
              // Si está activada la vista de conversación en Gmail es posible que el hilo
              // contenga mensajes con distintas etiquetas. Al usar GmailLabel.getThreads()
              // se devolverán todos siempre, por lo que es necesaria esta comprobación adicional,
              // que utiliza el servicio avanzado de Gmail para enumerar las etiquetas propias
              // de un mensaje dado.
              if (mensaje.isStarred() && etiquetasMensaje(mensaje, etiqueta)) {
              
                const body = mensaje.getPlainBody();
                let destinatario;

                // Destinatario: 1º RegEx, 2º Responder a, 3º Remitente
                if (regExEmail) destinatario = body.match(new RegExp(regExEmail))[1];
                  
                // ¿El email extraído tiene pinta de email?
                const emailTest = /^\S+@\S+\.[a-z]{2,}$/;

                // Si es que no, o no se ha usando una RegEx, utilizar responder-a (puede no haberlo) o remitente (en ese orden)
                if (!regExEmail || !(emailTest.test(destinatario))) destinatario = mensaje.getReplyTo() ? mensaje.getReplyTo() : mensaje.getFrom();

                // Extraer el cuerpo HTML, imágenes en línea y adjuntos del borrador correspondiente
                const elementosMensaje = extraerElementos(borrador.mensaje);

                // Enviar mensaje y eliminar estrella si todo ha ido bien

                try {
                  // Usaremos MailApp dado que GmailApp no preserva emojis en asunto ni cuerpo:
                  // https://stackoverflow.com/questions/50686254/how-to-insert-an-emoji-into-an-email-sent-with-gmailapp/50690214
                  MailApp.sendEmail(destinatario, borrador.asuntoRegEx[2],
                    'Debes usar un cliente de correo compatible con HTML para visualizar este mensaje.',
                    {
                      htmlBody: elementosMensaje.htmlBody,
                      attachments: elementosMensaje.attachments,
                      inlineImages: elementosMensaje.inlineImages,
                      name: remitente
                    });

                  // El estado "destacado" no se refresca visualmente (sí internamente) si ha sido establecido *manualmente* >>  https://issuetracker.google.com/issues/77320923
                  mensaje.unstar().markRead().refresh();

                  operaciones.push(
                    {
                      estado: EMAYORDOMO.simboloOk,
                      inicio: selloTiempo,
                      tiempo: new Date(),
                      etiqueta: etiqueta,
                      email: destinatario,
                      plantilla: plantilla,
                      mensaje: `Autorespuesta enviada`
                    });

                } catch(e) {
                  console.error(`Error al enviar respuesta ${plantilla} a ${remitente}.`);
                  operaciones.push(
                    {
                      estado: EMAYORDOMO.simboloError,
                      inicio: selloTiempo,
                      tiempo: new Date(),
                      etiqueta: etiqueta,
                      email: destinatario,
                      plantilla: plantilla,
                      mensaje: `Error indeterminado al enviar email`
                    });
                }
              }
              
              // Refresca hilo para que .hasStarredMessages() devuelva el valor correcto inmediatamente >> https://stackoverflow.com/a/65515913
              hilo.refresh();  
            }); // De envío de respuesta  
            
            hilo.moveToArchive().refresh();

          } // De procesamiento de mensajes de cada hilo
        }); // De procesamiento de hilos
      } // De comprobación de existencia de plantilla
    } // De existencia de etiqueta a procesar
  }); // De proceso de la regla de cada etiqueta

  // Escribe eventos en log (hdc) solo al finalizar completamentente la ejecución
  if (operaciones.length == 0) {
    operaciones.push(
      {
        estado: EMAYORDOMO.simboloInfo,
        inicio: selloTiempo,
        tiempo: new Date(),
        etiqueta: '',
        email: '',
        plantilla: '',
        mensaje: 'Sin actividad'
      });
  }
  actualizarLog(operaciones);

}

/**
 * Crea un duplicado del cuerpo html, imágenes en línea y adjuntos del mensaje
 * cuyo id se pasa como parámetro.
 * 
 * Usa el servicio estándar de Gmail para reconstruir en nuevo mensaje
 * el contenido del original, incluyendo imágenes en línea (reemparejando CIDs)
 * y archivos adjuntos.
 *  
 * @param   {GmailMessage}  msg
 * @returns {Object}        {htmlBody, {attachments}, {inLineImages}}, si no ha sido posible crearlo
 * 
 * Tomado de:
 * https://hawksey.info/blog/2021/02/everything-you-ever-wanted-to-know-about-gmail-draft-inline-images-and-google-apps-script-but-were-afraid-to-ask/
 */
function extraerElementos(msg) {

  const allInlineImages = msg.getAttachments({includeInlineImages: true, includeAttachments: false});
  const attachments = msg.getAttachments({includeInlineImages: false});
  const htmlBody = msg.getBody(); 

  // Create an inline image object with the image name as key 
  // (can't rely on image index as array built based on insert order)
  const img_obj = allInlineImages.reduce((obj, i) => (obj[i.getName()] = i, obj) ,{});

  // Regex to search for all img string positions with cid and alt
  const imgexp = RegExp('<img.*?src="cid:(.*?)".*?alt="(.*?)"[^\>]+>', 'g');
  const matches = [...htmlBody.matchAll(imgexp)];

  // Initiate the allInlineImages object
  const inlineImagesObj = {};
  // built an inlineImagesObj from inline image matches
  // match[1] = cid, match[2] = alt
  matches.forEach(match => inlineImagesObj[match[1]] = img_obj[match[2]]);
  
  return {
    htmlBody: htmlBody,
    attachments: attachments,
    inlineImages: inlineImagesObj
  };

}

/**
 * Devuelve TRUE si el mensaje está etiquetado con la etiqueta
 * que se pasa como parámetro
 * @param {GmailMessage} msg
 * @param {string} etiqueta
 * @returns {Boolean}
 */
function etiquetasMensaje(msg, etiqueta) {

  const id = msg.getId();
  const idEtiqueta = Gmail.Users.Labels.list('me').labels.find(e => e.name == etiqueta).id;
  etiquetas = Gmail.Users.Messages.get('me', id).labelIds;
  
  if (etiquetas.map) {
    return etiquetas.includes(idEtiqueta);
  }
  else {
    return false;
  }

}

/**
 * /// NO UTILIZADO ///
 * Crea un duplicado del borrador cuyo id se pasa como parámetro,
 * incluyendo cuerpo html, imágenes en línea y adjuntos.
 * 
 * Usa la API avanzada de Gmail vía REST
 * Problema: posteriormente no consigo modificar las cabeceras
 * para establecer ASUNTO o DESTINATARIO ¿vía muerta?
 * 
 * @param   {string}        idBorrador
 * @returns {null | Object} Nuevo borrador o null, si no ha sido posible crearlo
 *   {
 *      "id": string,
 *      "message": {
 *        "id": ID_MENSAJE
 *        "threadId": ID_HILO
 *        "labelIds": ['ETIQUETA']
 *       }
 *   }
 */
function duplicarBorradorAPI(idBorrador) {

  let nuevoBorrador;
  try {

      const borrador = GmailApp.getMessageById(idBorrador);
      const endPoint = 'https://www.googleapis.com/upload/gmail/v1/users/me/drafts?uploadType=media';
      const parametros = {
        method: 'POST',
        contentType: 'message/rfc822',
        muteHttpExceptions: true,
        headers: {'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`},
        payload: borrador.getRawContent()
      };
      nuevoBorrador = UrlFetchApp.fetch(endPoint, parametros);
    
    } catch(e) {
      return null;
    }

  return nuevoBorrador.getResponseCode() == 200 ? JSON.parse(nuevoBorrador.getContentText()) : null;

}

/**
 * Anota en la tabla de registro el resultado de una o varias operaciones
 * en orden inverso (primero el más reciente)
 * @params {Object[]} registros Vector de elementos a registrar:
 *  { estado: >> símbolo de error
 *    inicio: >> selleo de tiempo del lote de ejecución
 *    tiempo: >> sello de tiempo del evento
 *    etiqueta: >> etiqueta afectada
 *    email: >> email afectado
 *    plantilla: >> plantilla afectada
 *    mensaje: >> mensaje a registrar }
 */
function actualizarLog(registros) {

  if (registros.map) {
    const tablaRegistros = registros.reverse().map(registro =>
      [
        registro.estado,
        registro.inicio,
        registro.tiempo,
        registro.etiqueta,
        registro.email,
        registro.plantilla,
        registro.mensaje
      ]);
    const hoja = SpreadsheetApp.getActive().getSheetByName(EMAYORDOMO.tablaLog.nombre);

    // Inserta las filas necesarias en la parte superior de la tabla, se tiene en cuenta la situación inicial (filas vacías)
    let filasNuevas;
    if (hoja.getLastRow() < EMAYORDOMO.tablaLog.filInicialDatos) {
      if (hoja.getMaxRows() - EMAYORDOMO.tablaLog.filInicialDatos + 1 - tablaRegistros.length >= 0) {
        filasNuevas = 0;
      } else {
        filasNuevas = tablaRegistros.length - (hoja.getMaxRows() - EMAYORDOMO.tablaLog.filInicialDatos + 1);
      }
    } else {
      filasNuevas = tablaRegistros.length;
    }
    if (filasNuevas) hoja.insertRowsBefore(EMAYORDOMO.tablaLog.filInicialDatos,filasNuevas);
    hoja.getRange(EMAYORDOMO.tablaLog.filInicialDatos, 1, tablaRegistros.length, tablaRegistros[0].length).setValues(tablaRegistros);
  };
  
}
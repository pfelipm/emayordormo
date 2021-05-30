/**
 * e-Mayordomo
 * Un script que envía respuestas enlatadas de acuerdo con las etiquetas 
 * y marca de destacados que se detectan en los mensajes recibidos. 
 *
 * Hay que desactivar la vista 
 * 
 * @OnlyCurrentDoc
 * CC BY-NC-SA @pfelipm
 */

const EMAYORDOMO = {
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
  maxEmails: 20
};

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
  if (remitente) remitente = remitente[1]
  // ...en caso contrario, nombre usuario (valor por defecto al enviar emails con GmailApp si no se especifica 'name')
  else remitente = Session.getEffectiveUser().getEmail().match(/^(.+)@.+$/)[1];

  console.info(`Etiquetas a procesar: ${etiquetasReglas}`);
  console.info(`Borradores encontrados: ${borradores.length}`);

  // Procesar cada etiqueta
  etiquetasReglas.forEach(etiqueta => {

    // ¿La etiqueta que vamos a procesar existe realmente?

    if (!etiquetasUsuario.includes(etiqueta)) {
      console.error(`La etiqueta "${etiqueta}" no existe.`);
      operaciones.push(
        {
          estado: EMAYORDOMO.simboloError,
          tiempo: selloTiempo,
          etiqueta: etiqueta,
          email: '',
          plantilla: '',
          mensaje: `Etiqueta "${etiqueta}" no existe en el buzón`
        });
    } else {

      // La etiqueta sí existe, seguimos...

      const fila = tabla.find(regla => regla[colEtiqueta] == etiqueta);

      if (!fila) {
        console.error(`No se encuentra regla para "${etiqueta}".`);
        operaciones.push(
          {
            estado: EMAYORDOMO.simboloError,
            tiempo: selloTiempo,
            etiqueta: etiqueta,
            email: '',
            plantilla: '',
            mensaje: `No se encuentra regla para "${etiqueta}".`
          });
      } else {
        
        // La regla existe, seguimos...

        const plantilla = fila[colPlantilla];
        const regExEmail = fila[colRegExEmail]; // Opcional
        console.info(`Etiqueta: ${fila[colEtiqueta]} · Plantilla: "${plantilla} " · RegEx email: ${regExEmail}`)

        // ¿La plantilla (borrador) a utilizar existe? (¡cuidado con los duplicados!)
        
        const borrador = borradores.find(borrador => borrador.asuntoRegEx ? borrador.asuntoRegEx[1] == plantilla : null);
        if (!borrador) {
          console.error(`El borrador con prefijo "${plantilla} " no existe.`);
          operaciones.push(
            {
              estado: EMAYORDOMO.simboloError,
              tiempo: selloTiempo,
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
          // Si se han devuelto el nº máximo de mensajes solicitados haremos una nueva iteración, tal vez haya más
          } while (nHilos == EMAYORDOMO.maxEmails);

          console.info(`Procesando etiqueta "${etiqueta}", hilos: ${hilosEtiquetados.length}.`);

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

                    console.info(`Enviando respuesta ${plantilla} a ${remitente}`);

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

                    // ¡No se refrescan en Gmail, aunque realmente sin estrella! >>  https://issuetracker.google.com/issues/77320923
                    mensaje.unstar().markRead().refresh();

                    operaciones.push(
                      {
                        estado: EMAYORDOMO.simboloOk,
                        tiempo: selloTiempo,
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
                        tiempo: selloTiempo,
                        etiqueta: etiqueta,
                        email: destinatario,
                        plantilla: plantilla,
                        mensaje: `Error intederminado al enviar email`
                      });
                  }
                }       
              }); // De envío de respuesta  
              
              // hilo.moveToArchive().refresh(); // Esto tampoco elimina estrellas (ni refresca la IU inmediatamete :-/)

            } // De procesamiento de hilo
          }); // De procesamiento de hilos
        } // De comprobación de existencia de plantilla
      } // De comprobación de existencia de regla
    } // De existencia de etiqueta a procesar
  }); // De proceso de la regla de cada etiqueta

  // Registrar resultados en log >> Mejora: no esperar al final, hacerlo tras procesar cada regla (etiqueta), por ejemplo
  if (operaciones.length > 0) actualizarLog(operaciones);

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
  console.info(etiquetas)
  
  if (etiquetas.map) return etiquetas.includes(idEtiqueta);
  else return false;

}

/**
 * NO UTILIZADO
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
 * añadiendo sello de tiempo para la operación
 * @params {Object[]} registros Vector de elementos a registrar:
 *  { tiempo: >> sello de tiempo
 *    etiqueta: >> etiqueta afectada
 *    email: >> email afectado
 *    plantilla: >> plantilla afectada
 *    estado: >> símbolo de error
 *    mensaje: >> mensaje a registrar }
 */
function actualizarLog(registros) {

  if (registros.map) {
    const tablaRegistros = registros.map(registro =>
      [
        registro.estado,
        registro.tiempo,
        new Date(),
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
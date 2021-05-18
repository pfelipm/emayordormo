/**
 * e-Mayordomo
 * Un script que envía respuestas enlatadas de acuerdo con las etiquetas 
 * y marca de destacados que se detectan en los mensajes recibidos. * 
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
 
  // Obtener etiquetas de las reglas a procesar: todos los campos requeridos deben ser VERDADERO (o truthy)
  // En la hdc se impide que más de 1 regla opere sobre la misma etiqueta
  const etiquetasReglas = tabla.filter(regla =>
    regla.slice(EMAYORDOMO.tablaReglas.colInicioRegla, EMAYORDOMO.tablaReglas.colFinRegla + 1).every(campo => campo))
    .map(regla => regla[colEtiqueta]);

  // Obtener etiquetas existentes en el buzón, la usaremos más adelante para comprobar que las reglas son válidas
  const etiquetasUsuario = GmailApp.getUserLabels().map(etiqueta => etiqueta.getName());

  // Obtener mensajes en borrador
  const borradores = GmailApp.getDraftMessages().map(borrador => 
    ({
      // Obtener prefijo y asunto de cada borrador: asuntoRegEx[1] >> prefijo, asuntoRegEx[2] (no usado)
      asuntoRegEx: borrador.getSubject().match(/^(\[.+\]) (.+$)/),
      mensaje: borrador
    })
  );

  // Obtener prefijo y asunto de cada borrador: asuntoBorradores[1] >> prefijo, asuntoBorradores[2]
  // const asuntoBorradores = borradores.map(borrador => borrador.getSubject().match(/^(\[.+\]) (.+$)/));

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

        // ¿La plantilla (borrador) a utilizar existe?
        
        const borrador = borradores.find(borrador => borrador.asuntoRegEx[1] == plantilla);
        if (!borrador) {
          console.error(`El borrador con prefijo "${plantilla} " no existe.`);
          operaciones.push(
            {
              estado: EMAYORDOMO.simboloError,
              tiempo: selloTiempo,
              etiqueta: etiqueta,
              email: '',
              plantilla: '',
              mensaje: `Borrador "${plantilla}" no existe en el buzón`
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
            // Si devuelve el nº máximo de mensajes solicitados haremos una nueva iteración, tal vez haya más
            nHilos = paginaHilos.length;
            if (nHilos) {
              hilosEtiquetados = [...hilosEtiquetados, ...paginaHilos];
              nHilo += nHilos;
            }
          } while (nHilos == EMAYORDOMO.maxEmails);

          console.info(`Procesando etiqueta "${etiqueta}", hilos: ${hilosEtiquetados.length}.`);

          // Recorramos ahora los mensajes de todos los hilos
          hilosEtiquetados.forEach(hilo => {
            
            // ¿Hay mensajes sin estrella (no procesados) en el hilo?
            // Alternativa >> Usar fecha de última ejecución vs fecha mensaje (¿condiciones de carrera?)
            if (hilo.hasStarredMessages()) {

              hilo.getMessages().forEach(mensaje => {
                
                // ¿Mensaje aún no procesado?
                if (mensaje.isStarred()) {
                
                  const body = mensaje.getPlainBody();
                  let remitente;

                  // Destinatario: 1º RegEx, 2º Responder a, 3º Remitente
                  if (regExEmail) remitente = body.match(new RegExp(regExEmail))[1];
                   
                  const emailTest = /^\S+@\S+\.[a-z]{2,}$/; // ¿El email extraído tiene pinta de email?

                  // Si es que no, o no se ha usando una RegEx, utilizar responder-a (puede no haberlo) o remitente (en ese orden)
                  if (!regExEmail || !(emailTest.test(remitente))) remitente = mensaje.getReplyTo() ? mensaje.getReplyTo() : mensaje.getFrom();

                  // Duplicamos el borrador correspondiente
                  const nuevoMensaje = duplicarBorrador(borrador.mensaje.getId());
                  console.info(nuevoMensaje.message);

                  //console.info(GmailApp.getMessageById(nuevoMensaje.message.id).getSubject());
                  


                }
                
              });

            } 
          
          });
          
        } // De comprobación de existencia de plantilla
      
      } // De comprobación de existencia de regla
    
    } // De existencia de etiqueta a procesar

  }); // De proceso de la regla de cada etiqueta

  // Registrar resultados en log
  // actualizarLog(operaciones);

}

/**
 * Crea un duplicado del borrador cuyo id se pasa como parámetro,
 * incluyendo cuerpo html, imágenes en línea y adjuntos.
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
function duplicarBorrador(idBorrador) {

  let nuevoBorrador;
  try {

      const borrador = GmailApp.getMessageById(idBorrador);
      const endPoint = "https://www.googleapis.com/upload/gmail/v1/users/me/drafts?uploadType=media";
      const parametros = {
        method: "POST",
        muteHttpExceptions: true,
        contentType: "message/rfc822",
        headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
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
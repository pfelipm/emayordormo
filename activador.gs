/**
 * Informa del estado de activación de eMayordomo
 * ¿Se está vigilando el buzón de Gmail en 2º plano?
 */
function comprobarEstado() {
  
  const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
  if (activadoPor == '') {
    mensaje = `${EMAYORDOMO.simboloInfo} No se está vigilando tu buzón de Gmail en 2º plano.`;
  } else {
    mensaje = `${EMAYORDOMO.simboloInfo} El proceso en 2º plano ya ha sido activado por ${activadoPor}.`;
  }

  SpreadsheetApp.getUi().alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    mensaje,
    SpreadsheetApp.getUi().ButtonSet.OK);

  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));   

}

/**
 * Menú >> Activar
 * Impide que un usuario distinto al propietario de la hdc active el trigger,
 * esto es una medida de seguridad para evitar que eMayordomo actúe sobre
 * el buzón de Gmail incorrecto.
 */
function activar() {
  
  // ¿El usuario actual es el propietario de la hdc y suponemos que, por ende, del buzón de Gmail que se debe procesar?
  const emailPropietario = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getOwner().getEmail();
  if (emailPropietario != Session.getEffectiveUser().getEmail()) {
    SpreadsheetApp.getUi().alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    `${EMAYORDOMO.simboloInfo} Solo ${emailPropietario} puede activar el proceso en 2º plano.`,
    SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    // Solo gestionaremos el activador si no hay otra instancia del script ya intentándolo
    const mutex = LockService.getDocumentLock();
    try {

      // Queremos fallar cuanto antes
      mutex.waitLock(1);
      
      const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
      if (activadoPor == '') {

        const resultado = gestionarTrigger('ON');
        let mensaje;    
        if (resultado == 'OK') {     
          mensaje = `${EMAYORDOMO.simboloInfo} Vigilando ahora tu buzón de Gmail.`;
          PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, Session.getEffectiveUser());
        } else {
          mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error en la activación del proceso en 2º plano: 
          
          ${resultado}`;
        }
        
        // Aquí termina la sección crítica cuando se intenta realizar activación
        mutex.releaseLock();
        
        SpreadsheetApp.getUi().alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          mensaje,
          SpreadsheetApp.getUi().ButtonSet.OK);
        
      } else {
        
        // Aquí termina la sección crítica cuando *no* se realiza activación porque ya está activado
        mutex.releaseLock();
        
        SpreadsheetApp.getUi().alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          `${EMAYORDOMO.simboloInfo} El proceso en 2º plano ya ha sido activado por ${activadoPor}.`,
          SpreadsheetApp.getUi().ButtonSet.OK);
      }    
      
    } catch(e) {
      // No ha sido posible obtener acceso al bloque de códido mutex
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `${EMAYORDOMO.simboloError} En este momento no es posible activar el proceso en 2º plano, inténtalo más tarde.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
    }
  
  }
  
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}

/**
 * Menú >> Activar
 * Verifica si algún usuario ha activado el trigger previamente, en ese caso no lo hace de nuevo
 */
function activarV2() {
  
  // Solo gestionaremos el activador si no hay otra instancia del script ya intentándolo
  const mutex = LockService.getDocumentLock();
  try {  
    
    // Queremos fallar cuanto antes
    mutex.waitLock(1);
    
    const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
    if (activadoPor == '') {

      const resultado = gestionarTrigger('ON');
      let mensaje;    
      if (resultado == 'OK') {     
        mensaje = `${EMAYORDOMO.simboloInfo} Vigilando ahora tu buzón de Gmail`;
        PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, Session.getEffectiveUser());
      }
      else {
        mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error en la activación del proceso en 2º plano: 
        
        ${resultado}`;
      }
      
      // Aquí termina la sección crítica cuando se intenta realizar activación
      mutex.releaseLock();
      
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK);
      
    } else {

      // Aquí termina la sección crítica cuando *no* se realiza activación porque ya está activado
      mutex.releaseLock();
      
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `${EMAYORDOMO.simboloInfo} El proceso en 2º plano ya ha sido activado por ${activadoPor}.`,
        SpreadsheetApp.getUi().ButtonSet.OK);
    }    
    
  } catch(e) {
    // No ha sido posible obtener acceso al bloque de códido mutex
    SpreadsheetApp.getUi().alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} En este momento no es posible activar el proceso en 2º plano, inténtalo más tarde.`,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
  
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}

/**
 * Menú >> Desactivar
 * Trata de eliminar el trigger de tratamiento de respuestas (un usuario nuncano tiene acceso a los triggers de otro)
 */
function desactivar() {

  const mutex = LockService.getDocumentLock();
  try {
    
     // Queremos fallar cuanto antes
    mutex.waitLock(1);
    
    const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
        
    if (activadoPor == Session.getEffectiveUser()) {

      const resultado = gestionarTrigger('OFF');
      let mensaje;
      if (resultado == 'OK') {     
        mensaje = `${EMAYORDOMO.simboloInfo} Ya no se está vigilando tu buzón de Gmail`;
        PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, '');
      } else {
        mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error al desactivar el proceso en 2º plano: 
        
        ${resultado}`;
      } 
      
      // Aquí termina la sección crítica cuando se intenta realizar desactivación
      mutex.releaseLock();

      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK);

    } else {    

      // Aquí termina la sección crítica cuando *no* se realiza desactivación porque lo ha activado otro usuario o no está activado
      mutex.releaseLock();

      if (activadoPor == '') {
        mensaje = `${EMAYORDOMO.simboloInfo} El proceso en 2º plano no está activado.`;
      } else {
        mensaje = `${EMAYORDOMO.simboloInfo} El proceso en 2º plano debe ser desactivado por ${activadoPor}.`;
      }
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK);
    }        
  } catch (e) {
    // No ha sido posible obtener acceso al bloque de códido mutex

    SpreadsheetApp.getUi().alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} En este momento no es posible desactivar el proceso en 2º plano, inténtalo más tarde.`,
      SpreadsheetApp.getUi().ButtonSet.OK);

  }
  
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));
  
}

/**
 * Instala o elimina el trigger que se ejecuta cada hora
 * @param {string} orden "ON" | "OFF"
 * @return {string} Mensaje de error / 'OK'.
 */
function gestionarTrigger(orden) {
  
  let estado = 'OK';
  
  switch (orden) {
      
    case 'ON':  
      // Crear trigger
      try {
        ScriptApp.newTrigger('procesarEmails')
        .timeBased()
        .everyHours(1)
        .create();
        console.info('Creado');
      } catch(e) {
        estado = e;
      }
      break;
      
    case 'OFF':
      // Eliminar trigger(s)
      try {
        const triggers = ScriptApp.getProjectTriggers();
        triggers.filter(t => t.getEventType() ==  ScriptApp.EventType.CLOCK).map(trigger => ScriptApp.deleteTrigger(trigger));
      } catch (e) {
        estado = e;
      }
      
      break;
  }
  
  return estado;
  
}
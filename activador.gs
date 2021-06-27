/**
 * Informa del estado de activación de eMayordomo
 * ¿Se está vigilando el buzón de Gmail en 2º plano?
 */
function comprobarEstado() {
  
  const ssUi = SpreadsheetApp.getUi();
  const activadoPor = PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado);
  if (activadoPor == '') {
    mensaje = `No se está vigilando el buzón de Gmail en 2º plano.`;
  } else {
    mensaje = `El proceso en 2º plano ha sido activado por ${activadoPor}
    y se está vigilando su buzón de Gmail.`;
  }
  ssUi.alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    mensaje,
    ssUi.ButtonSet.OK);

  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));   

}

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
  
  // [1] Cancelar si ya está activado
  if (activadoPor) {
    ssUi.alert(
    `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
    `${EMAYORDOMO.simboloError} Ya hay un proceso en 2º plano activado por ${activadoPor}.`,
    ssUi.ButtonSet.OK);
  } else {
    // No hay proceso en 2º plano activo, veamos quién es el propietario de la hdc
    const propietario = SpreadsheetApp.getActiveSpreadsheet().getOwner();
    const emailUsuarioActivo = Session.getEffectiveUser().getEmail();
    if (propietario) {
      emailPropietario = propietario.getEmail();
    } else {
      emailPropietario = null;
    }

    // [2] Si la hdc está en unidad compartida solicitar confirmación para proseguir o cancelar activación
    if (!emailPropietario) {
      activar = ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `Solo el propietario del buzón de Gmail en el que se han definido las reglas de
        filtrado, etiquetas y borradores debe realizar la activación en 2º plano.
        
        ¿Seguro que deseas continuar?`,
        ssUi.ButtonSet.OK_CANCEL) == ssUi.Button.OK;
      if (!activar) {
        ssUi.alert(
          `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
          `Activación en 2º plano cancelada.`,
          ssUi.ButtonSet.OK);
      }
    } else if (emailPropietario != emailUsuarioActivo) {
      // [3] Cancelar activación si se puede determinar que el usuario actual no es el propietario de la hdc
      ssUi.alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} Solo ${emailPropietario} debe activar el proceso en 2º plano.`,
      ssUi.ButtonSet.OK);
      activar = false;
    }
    
    // [4] Continuamos con activación a menos que se haya cancelado en [2] o [3]
    if (activar) {

      // Solo gestionaremos el activador si no hay otra instancia del script ya intentándolo
      const mutex = LockService.getDocumentLock();
      try {

        // Queremos fallar cuanto antes
        mutex.waitLock(1);
        
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
    
  // Se ejecuta siempre para sincronizar estado del menú cuanto antes cuando hay varias instancias abiertas de la hdc
  construirMenu(PropertiesService.getDocumentProperties().getProperty(EMAYORDOMO.propActivado));

}

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

    } else {    

      // Aquí termina la sección crítica cuando *no* se realiza desactivación porque lo ha activado otro usuario o no está activado
      mutex.releaseLock();

      if (activadoPor == '') {
        mensaje = `${EMAYORDOMO.simboloError} El proceso en 2º plano no está activado.`;
      } else {
        mensaje = `${EMAYORDOMO.simboloError} El proceso en 2º plano debe ser desactivado por ${activadoPor}.`;
      }
      ssUi.alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        ssUi.ButtonSet.OK);
    }        
  } catch (e) { 
    // No ha sido posible obtener acceso al bloque de código exclusivo
    ssUi.alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} En este momento no es posible desactivar el proceso en 2º plano, inténtalo más tarde.`,
      ssUi.ButtonSet.OK);
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
        .everyHours(EMAYORDOMO.horasActivador)
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
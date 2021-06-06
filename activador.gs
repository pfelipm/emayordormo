/**
 * Menú >> Activar
 * Verifica si algún usuario ha activado el trigger previamente, en ese caso no lo hace de nuevo
 */
function activar() {
  
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
        mensaje = `${EMAYORDOMO.simboloInfo} Vigilando tu buzón de Gmail`;
        PropertiesService.getDocumentProperties().setProperty(EMAYORDOMO.propActivado, Session.getEffectiveUser());
      }
      else {
        mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error en la activación del proceso en segundo plano: 
        
        ${resultado}`;
      }
      
      // Aquí termina la sección crítica cuando se intenta realizar activación
      mutex.releaseLock();
      
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK
        );
      
    } else {
      
      // Aquí termina la sección crítica cuando *no* se realiza activación porque ya está activado
      mutex.releaseLock();
      
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        `${EMAYORDOMO.simboloInfo} El proceso en segundo plano ya ha sido activado por ${activadoPor}.`,
        SpreadsheetApp.getUi().ButtonSet.OK
        );
    }    
    
  } catch(e) {
    // No ha sido posible obtener acceso al bloque de códido mutex
    SpreadsheetApp.getUi().alert(
      `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
      `${EMAYORDOMO.simboloError} En este momento no es posible activar el proceso en segundo plano, inténtalo más tarde.`,
      SpreadsheetApp.getUi().ButtonSet.OK
      );
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
      }
      else {
        mensaje = `${EMAYORDOMO.simboloError} Se ha producido un error al desactivar el proceso en segundo plano: 
        
        ${resultado}`;
      } 
      
      // Aquí termina la sección crítica cuando se intenta realizar desactivación
      mutex.releaseLock();

      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK
        );

    } else {
            
      // Aquí termina la sección crítica cuando *no* se realiza desactivación porque lo ha activado otro usuario o no está activado
      mutex.releaseLock();
      
      if (activadoPor == '') {
        mensaje = `${EMAYORDOMO.simboloInfo} El proceso en segundo plano no está activado.`;
      } else {
        mensaje = `${EMAYORDOMO.simboloInfo} El proceso en segundo plano debe ser desactivado por ${activadoPor}.`;
      }
      SpreadsheetApp.getUi().alert(
        `${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`,
        mensaje,
        SpreadsheetApp.getUi().ButtonSet.OK
        );
    }       
    
  } catch (e) {
    // No ha sido posible obtener acceso al bloque de códido mutex
    SpreadsheetApp.getUi().alert(`${EMAYORDOMO.icono} ${EMAYORDOMO.nombre}`, `❌ En este momento no es posible desactivar AdminProxy,
                                  inténtalo más tarde`, SpreadsheetApp.getUi().ButtonSet.OK);
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
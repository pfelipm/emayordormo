function aa() {

  const mensajes = GmailApp.search('from:(pablo.felip@agilcentros.es');
  console.info(mensajes[0].getMessages()[0].getFrom());
  console.info(mensajes[0].getMessages()[0].getReplyTo() == false); // Puede estar vacío
   

  /*
  const emailTest = /^\S+@\S+\.[a-z]{2,}$/;
  console.info(emailTest.test('pfelipm@gmail.com.es'));
  */

}
function myFunction() {
  
  const hilos =GmailApp.getUserLabelByName('AT General').getThreads();
  const mensaje = hilos[0].getMessages()[0].getBody();
  console.info(mensaje);

  const borrador = GmailApp.getDraftMessages().find(m => m.getSubject() == '[borrador]');


  console.info(borrador.getBody());
  console.info(borrador.getPlainBody());
  console.info(borrador.getAttachments()[0].getName());
  const payload = borrador.getRawContent();
  
  /*GmailApp.createDraft('pablo.felip@agilcentros.es',
    borrador.getSubject(),
    borrador.getPlainBody(),
    {
      htmlBody: borrador.getBody(),
      replyTo: 'formate@agilcentros.es',
      attachments: borrador.getAttachments() // La imagen aparece como adjunto pero no se ve en línea!!
    }); */


 
  // Usando elservicio avanzado no se genera copia, solo se actualiza la fecha de creación del original
  const copiaBorrador = Gmail.newDraft({"payload": borrador.getRawContent()}); 
  //const nuevoBorrador = GmailApp.getDraft(duplicarBorrador(borrador.getId()).id);
  //console.info(nuevoBorrador.getMessage().getBody());
  
}
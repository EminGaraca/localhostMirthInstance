function gerarNumerosAleatorios(qtd, min, max) {
 var numeros = [];
 while (numeros.length < qtd) {
  var numero = Math.floor(Math.random() * (max - min + 1)) + min;
  if (numeros.indexOf(numero) === -1) {
   numeros.push(numero);
  }
 }
 return numeros;
}


return JSON.stringify(
 {
  "externalAppointmentId": gerarNumerosAleatorios(3, 1, 60).join(''),
  "status": "S",
  "messageError": null
 }
)
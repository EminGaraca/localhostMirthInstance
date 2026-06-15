const obj = JSON.parse(connectorMessage.getRawData())

return JSON.stringify(
 {
  "slot": gerarSlotsPorDia(obj.startDateTime, obj.endDateTime, 4)
 }
)

function gerarSlotsPorDia(timestampInicio, timestampFim, slotsPorDia) {
 const inicio = new Date(timestampInicio)
 const fim = new Date(timestampFim)

 if (inicio > fim) {
  throw new Error("A data de início deve ser anterior à data de fim.");
 }

 const resultado = [];
 var dataAtual = inicio

 var test = 0
 while (dataAtual <= fim) {
  var slotData = dataAtual
  for (var i = 0; i < slotsPorDia; i++) {
   slotData.setHours(dataAtual.getHours() + 1)
   slotData.setMinutes(0)
   slotData.setSeconds(0)
   slotData.setMilliseconds(0)


   if (slotData >= inicio && slotData <= fim) {
    var time = {}
    time.startDateTime = slotData.getTime()
    time.endDateTime = new Date(slotData.getTime() + 30 * 60 * 1000).getTime()
    resultado.push(time)
   }
  }
  dataAtual.setDate(dataAtual.getDate() + 1)
 }

 return resultado
}
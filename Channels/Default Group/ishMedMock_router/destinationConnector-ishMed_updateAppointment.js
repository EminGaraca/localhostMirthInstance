const data = JSON.parse(connectorMessage.getRawData())
return JSON.stringify(
 {
  "externalAppointmentId": data.externalAppointmentId,
  "status": "S",
  "messageError": null
 }
)
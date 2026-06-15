const data = JSON.parse(connectorMessage.getRawData())
return JSON.stringify(
 {
  "externalAppointmentId": data.questionnaireExternalId,
  "status": "S",
  "messageError": null
 }
)
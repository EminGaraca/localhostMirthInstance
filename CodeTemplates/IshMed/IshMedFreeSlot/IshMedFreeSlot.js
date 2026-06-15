/**
  IshMedFreeSlot
*/
function IshMedFreeSlot() {
 const cfg = Util2().cfg()
 const date = Util2().date()
 const tools = IshMed()
 const data = JSON.parse(connectorMessage.getRawData())

 function getSlots() {
  const obj = {}

  $c('url_http_post_freeslot_ishMed', cfg.configuration.base_url + cfg.configuration.path.freeslots)
  $c('auth_ishmed', Util2().baseAuth(cfg.configuration.auth.ishmed.user, cfg.configuration.auth.ishmed.pass))

  $c('DATE',)

  obj.startDateTime = data.hasOwnProperty('dateStart') ? date.getMillis(data.dateStart.replace('T', ' ')) : null
  obj.endDateTime = data.hasOwnProperty('dateEnd') ? date.getMillis(data.dateEnd.replace('T', ' ')) : null
  //obj.specialty = cfg.configuration.location.specialty
  obj.specialty = data.consultationType
  obj.status = 'free'
  obj.clinicId = cfg.configuration.location.clinicId
  //obj.appointmentType = cfg.configuration.location.appointmentType
  obj.appointmentType = data.consultationTypeExternalId

  return JSON.stringify(obj)
 }

 function resp() {
  var respClient = JSON.parse(response.getMessage())
  var respBackend = []
 
  $c('QtySlot', String(respClient.slot.length))
 
  if (respClient.slot.length !== 0) {
   var list = respClient.slot
   list.forEach((e, i) => {
    var obj = {}
    /*
    obj.dateStart = date.getSeconds(e.startDateTime)
    obj.dateEnd = date.getSeconds(e.endDateTime)
    obj.free = 'true'
    obj.externalId = e.externalId     obj.appointmentType = cfg.configuration.location.appointmentType
    */
    obj.start = date.getSeconds(e.startDateTime)
    obj.end = date.getSeconds(e.endDateTime)
    //obj.free = 'true'
    obj.slot = e.externalId     
    //obj.appointmentType = cfg.configuration.location.appointmentType
    respBackend.push(obj)
   })
  }
 
  return respBackend
}

 return {
  getSlots: getSlots,
  resp: resp
 }
}
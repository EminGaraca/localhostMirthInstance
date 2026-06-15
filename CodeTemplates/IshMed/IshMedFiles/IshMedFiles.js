/**
  IshMedFiles
*/
function IshMedFiles() {
 const http = Http()
 const hl7 = Hl7v2()

 /**
  @desc: Function for the proccess inbound where the customer send message to m.Doc
  @author: Anderson Araujo
 */
 function inbound() {
  var data = new XML(SerializerFactory.getSerializer('HL7V2').toXML(connectorMessage.getRawData()))
  const messageCode = String(data.MSH['MSH.9']['MSH.9.1'])

  data.MSH['MSH.5']['MSH.5.1'] = String(data.PV1['PV1.3']['PV1.3.5'])

  function source() {
   if (messageCode == 'MDM') {
    return destinationSet.removeAllExcept('http_create_files_mdoc')
   } else {
    return destinationSet.removeAllExcept(['http_get_user_mDoc', 'http_get_files_mDoc', 'http_get_poll_mDoc', 'http_post_assign_mDoc'])
   }
  }

  function mdmT02() {
	var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', connectorMessage.getRawData());
	
	if (santeMpiJson.status == 'SENT') {
		var clinicPrefix = santeMpiJson.clinicPrefix;
		channelMap.put('clinicPrefix', clinicPrefix)
		var masterId = santeMpiJson.masterId
		channelMap.put('masterId', masterId)
	}
	
   return http.postPoll(null, hl7.inbound().mdmT02(data))
  }

  function assign() {
   const obj = {}
   obj.patientExternalUniqueId = null
   obj.healthMediaExternalIds = []
   return http.postPoll()
  }
  
  return {
   mdmT02: mdmT02,
   source: source
  }
 }

 function outbound() {
  const data = JSON.parse(connectorMessage.getRawData())
 	
  function getFilesBase64() {
    return http.getFilesBase64(data.id)
  }

  function getCases() {
    return http.getCaseUserV2('/' + data.file.owner.externalUniqueId)
   }

  return {
   getFilesBase64: getFilesBase64,
   getCases: getCases
  }
 }

 return {
  inbound: inbound,
  outbound: outbound
 }
}
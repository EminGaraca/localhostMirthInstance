/**
   @author Anderson Araujo
   @desc Router of message inbound to these channels
*/
function IshMedRouter() {
 //const data = JSON.parse(connectorMessage.getRawData())
 const data = new XML(connectorMessage.getTransformedData())
 const log = CommonLogger()

 function source() {
 	if (String(connectorMessage.getRawData()).length <= 2) {
      $c('Warnng', 'Message dont have content')
      return destinationSet.removeAll()
    }
   //const data = new XML(connectorMessage.getTransformedData())

//    if (String(data.MSH['MSH.3']['MSH.3.1']).toLowerCase().includes('orbis')) {
//    	data.PV1['PV1.3']['PV1.3.1'] = String(data.PV1['PV1.3']['PV1.3.4'])
//    	data.PV1['PV1.3']['PV1.3.4'] = String(data.MSH['MSH.5']['MSH.5.1'])
//    }
    
    msg = new XML(data)

    metadata(data.MSH)

    const feature = flowOfFeature(data.MSH)

    logger.info("FEATURE: " + feature)


    if (feature === false) {
      $c('Message warning', 'Event Message ' + String(data['MSH.9']['MSH.9.2']) + ' not configuration on cfg')
      return destinationSet.removeAll()
    } 

    if (feature == 'appointment_inbound') {
      return destinationSet.removeAllExcept(['appointment_inbound'])
    } 

    if (feature == 'patient') {
    	logger.info("USO: ")
      return destinationSet.removeAllExcept(['patient_onboarding_inbound'])
    } 

    if (feature == 'files_inbound') {
      return destinationSet.removeAllExcept(['files_inbound'])
    } 

    if (feature == 'questionnaire_assign') {
      return destinationSet.removeAllExcept(['questionnaire_assign'])
    }

    $c('Message Warning', 'Dont exist flow for attendance this request')

    return destinationSet.removeAll()
  }
  function flowOfFeature(flow) {
    const msgCode = String(flow['MSH.9']['MSH.9.1'])

    if (msgCode == 'ADT') return 'patient'
    if (msgCode == 'SIU') return 'appointment_inbound'
    if (msgCode == 'MDM') return 'files_inbound'
    if (msgCode == 'ORM') return 'questionnaire_assign'
    return common_handlingLogMessage('Is feature ' + feature + ' is not configured in file cfg', 'error')
  }

  
  function metadata(data) {
  	$c('id_message', String(data['MSH.10']['MSH.10.1']))
  }

 function eventUnknow() {
  log.loggerMessage('Unknow Message Event', 50)
  connectorMap.put('Message Warning', 'Unknow Message Event')
  return destinationSet.removeAll()
 }

 return {
  source: source
 }
}
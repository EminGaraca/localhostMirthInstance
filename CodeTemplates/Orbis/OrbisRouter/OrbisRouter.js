/**
  Router message for Feature

  @return {String} return Filter destinations
  @author Anderson Araujo
  @version 0.0.1
  @since 01/16/2023
*/

function OrbisRouter() {
  function source() {
  	// monitoring code
  	function formatMyDate(date, format) {
	    var year = date.getFullYear();
	    var month = String(date.getMonth() + 1).padStart(2, '0');
	    var day = String(date.getDate()).padStart(2, '0');
	    var hours = String(date.getHours()).padStart(2, '0');
	    var minutes = String(date.getMinutes()).padStart(2, '0');
	    var seconds = String(date.getSeconds()).padStart(2, '0');
	
	    return format
	        .replace('yyyy', year)
	        .replace('MM', month)
	        .replace('dd', day)
	        .replace('HH', hours)
	        .replace('mm', minutes)
	        .replace('ss', seconds);
	}
	var MONITORED_KEY = 'lastReceived_HTTP_ROUTER';
	var now = new Date();
	var formattedDate = formatMyDate(now, 'yyyy-MM-dd HH:mm:ss');
	globalMap.put(MONITORED_KEY, formattedDate);
	globalMap.put('alertSent_HTTP_ROUTER', false);
	//monitoring code
	
    if (String(connectorMessage.getRawData()).length <= 2) {
      $c('Warnng', 'Message dont have content')
      return destinationSet.removeAll()
    }

    const data = new XML(connectorMessage.getTransformedData())

//    if (String(data.MSH['MSH.3']['MSH.3.1']).toLowerCase().includes('orbis')) {
//    	data.PV1['PV1.3']['PV1.3.1'] = String(data.PV1['PV1.3']['PV1.3.4'])
//    	data.PV1['PV1.3']['PV1.3.4'] = String(data.MSH['MSH.5']['MSH.5.1'])
//    }
    
    msg = new XML(data)

    metadata(data.MSH)

    const feature = flowOfFeature(data.MSH)


    if (feature === false) {
      $c('Message warning', 'Event Message ' + String(data['MSH.9']['MSH.9.2']) + ' not configuration on cfg')
      return destinationSet.removeAll()
    } 

    if (feature == 'appointment_inbound') {
      return destinationSet.removeAllExcept(['appointment_inbound'])
    } 

    if (feature == 'patient') {
      return destinationSet.removeAllExcept(['patient_onboarding'])
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
  
  /**
    Feature for filter and destinations
  
    @return {String} return feature
    @author Anderson Araujo
    @version 0.0.2
    @since 10/13/2022
  */
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
  
  return {
    source: source
  }
}
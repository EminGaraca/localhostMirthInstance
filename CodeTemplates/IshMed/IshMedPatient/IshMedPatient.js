/**
    @desc For use with flow of Patient or Case
*/
function IshMedPatient() {
 function inbound() {
  const http = Http()
  var data = new XML(SerializerFactory.getSerializer('HL7V2').toXML(connectorMessage.getRawData()))
  const cfg = Util2().cfg()
  const date = Util2().date()
  const hl7 = Hl7v2().inbound()
  function validation() {
   if (String(data.PV1['PV1.3']['PV1.3.4']).length == 0)
    throw 'The field clinicID "PV1.3.4" is nandatory and is not empty'
  }

  /**
    @desc Create a patient and a case on portal side
    @author Anderson Rocha de Araujo
  */
  function createOrUpdate() {
	var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', connectorMessage.getRawData());
	logger.info('santeMpiJson ' + JSON.stringify(santeMpiJson))
	
	if (santeMpiJson.status == 'SENT') {
		var clinicPrefix = santeMpiJson.clinicPrefix;
		channelMap.put('clinicPrefix', clinicPrefix);
		var masterId = santeMpiJson.masterId;
		channelMap.put('masterId', masterId);
	}
	$c('mpi', channelMap.get('clinicPrefix') + '.' + channelMap.get('masterId') || 'N/A')
   if (String(data['PV1']['PV1.19']['PV1.19.1']).length >= 1)
     return http.postPatientOnboardingV2(null, hl7.adt(data))

   return http.patient(null, hl7.adt(data))
  }

  /**
    @desc Creating metadata for search in the dashboard of Application
    @author Anderson Rocha de Araujo
  */
  function metadata() {
   $c('patient_id', String(data.PID['PID.3']['PID.3.1']) || 'N/A')
   $c('case_id', String(data.PV1['PV1.19']['PV1.19.1']) || 'N/A')
   $c('username', String(data.MSH['MSH.4']['MSH.4.2']) + '.' + String(data.PID['PID.3']['PID.3.1']) || 'N/A')
   $c('mpi', $('mpi') || 'N/A')
   $c('clinic_id', String(data.MSH['MSH.4']['MSH.4.2']) || 'N/A')
   $c('department_id', String(data.PV1['PV1.3']['PV1.3.5']) || 'N/A')
  }

  /**
      @desc Function for create or update the date of Patient and Case
  */
  function source() {

   if (String(data['PV1']['PV1.19']['PV1.19.1']).length >= 1)
    return destinationSet.removeAllExcept(['http_create_update_patient_onboarding'])

   return destinationSet.removeAllExcept('http_create_update_patient')
  }

  return {
   metadata: metadata,
   createOrUpdate: createOrUpdate,
   source: source,
   validation: validation
  }
 }

 function outbound() { }

 return {
  inbound: inbound,
  outbound: outbound
 }
}
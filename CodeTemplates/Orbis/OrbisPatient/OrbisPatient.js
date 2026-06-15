/**
  Method of Patient Onboarding

  @author Anderson Araujo
*/
function OrbisPatient() {

  function inbound() {
    const hl7 = Hl7v2().inbound()
    var data = new XML(SerializerFactory.getSerializer('HL7V2').toXML(connectorMessage.getRawData()))
    const http = Http()

    function departmentResp() {
      const resp = JSON.parse(response.getMessage())
      
      if ((resp.hasOwnProperty('statusCode') && statusCode >= 400) || (resp.hasOwnProperty('status') && resp.status >= 400)) {
        channelMap.put('department', false)
        channelMap.put('department Warnning', 'Fail in flow of Department. Please, check in channel backend-request -> backend_request_department')
      } else {
        channelMap.put('department', true)
      }
    }

    function resp() {
      responseStatus = SENT
    }

    function department() {
      return hl7.department(data)
    }

    function source() {
      metadata(data)

      if (String(data.PV1['PV1.19']['PV1.19.1']).length >= 1) 
        return destinationSet.removeAllExcept(['http_post_patient_onboarding_mdoc', 'http_createOrUpdateDepartment_mdoc'])
        
      return destinationSet.removeAllExcept('http_post_patient_update_mdoc')
    }

    function metadata(data) {
      $c('userId', String(data.PID['PID.3']['PID.3.1']) || 'N/A')
      $c('externalIdUniqueId', String(data.MSH['MSH.5']['MSH.5.1']) + '.' + String(data.PID['PID.3']['PID.3.1']) || 'N/A')
      $c('caseId', String(data.PV1['PV1.19']['PV1.19.1']) || 'N/A')
      $c('organizationID', String(data.MSH['MSH.4']['MSH.4.1']) || 'N/A')
      $c('clinicID', String(data.PV1['PV1.3']['PV1.3.4']) || 'N/A')
      $c('departID', String(data.PV1['PV1.3']['PV1.3.1']) || 'N/A')
    }

    function adt() {
      if (String(data.PV1['PV1.19']['PV1.19.1']).length >= 1) {
      	return http.postPatientOnboardingV2(null, hl7.adt(data))
      } else {
      	return http.patient(null, hl7.adt(data))
      }
    }

    return {
      source: source,
      resp: resp,
      adt: adt,
      department: department,
      departmentResp: departmentResp
    }
  }

  function oubound() {

  }

  return {
    inbound: inbound,
    oubound: oubound
  }
}
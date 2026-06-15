/**
  Services files outbound
*/
function OrbisFilesOutbound() {
  const cfg = common_environment()
  const mdoc = common_environment('base')
  const connector = String(connectorMessage.getConnectorName())
  const data = JSON.parse(connectorMessage.getTransformedData())
  const http = common_http_request_mDoc()

  function outbound(data) {
    const respGetFile = $r('http_get_filesDownload_mDoc').getMessage()
    const obj = {}

    const dateCreate = convertDate(new Date(Number(data.creationDate + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin')
    const dateTimeDefault = convertDate(new Date(), 'yyyyMMddHHmmss', 'Europe/Berlin')

    tmp['MSH']['MSH.1']['MSH.1.1'] = '|'
    tmp['MSH']['MSH.2']['MSH.2.1'] = '^~\&'
    tmp['MSH']['MSH.3']['MSH.3.1'] = 'mdoc.connect'
    tmp['MSH']['MSH.4']['MSH.4.1'] = 'mdoc.connect'
    tmp['MSH']['MSH.5']['MSH.5.1'] = data.receivedApplication
    tmp['MSH']['MSH.6']['MSH.6.1'] = data.ReceivedFacility
    tmp['MSH']['MSH.7']['MSH.7.1'] = dateTimeDefault
    tmp['MSH']['MSH.9']['MSH.9.1'] = 'MDM'
    tmp['MSH']['MSH.9']['MSH.9.2'] = 'T02'
    tmp['MSH']['MSH.10']['MSH.10.1'] = data.pollExternalId
    tmp['MSH']['MSH.11']['MSH.11.1'] = 'P'
    tmp['MSH']['MSH.12']['MSH.12.1'] = data.versionHl7
    tmp['MSH']['MSH.15']['MSH.15.1'] = 'NE'
    tmp['MSH']['MSH.16']['MSH.16.1'] = 'NE'

    tmp['PID']['PID.2']['PID.2.1'] = data.participants[0].externalId
    tmp['PID']['PID.3']['PID.3.1'] = data.participants[0].externalId
    tmp['PID']['PID.5']['PID.5.1'] = data.participants[0].lastName
    tmp['PID']['PID.5']['PID.5.2'] = data.participants[0].firstName
    tmp['PID']['PID.7']['PID.7.1'] = convertDate(new Date(Number(data.participants[0].dob + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin')
    tmp['PID']['PID.8']['PID.8.1'] = data.participants[0].sex
    tmp['PID']['PID.18']['PID.18.1'] = data.caseUniqueIdentifier
    
    obj.timestamp = convertDate(new Date(), patterns[28], 'Europe/Berlin')
    obj.messageControlId = getMillis(new Date()) - 1523015158243
    obj.proccessId = getMillis(new Date())
    obj.externalPatientId = data.user.externalId
    obj.firstName = data.user.firstName
    obj.lastName = data.user.lastName
    obj.birthDate = data.casePatient.hasOwnProperty('dob') ? convertDate(data.user.dob, patterns[28], 'Europe/Berlin') : ''
    obj.sex = data.user.gender
    obj.externalCaseId = data.casePatient.hasOwnProperty('externalId') ? data.casePatient.externalId : ''
    obj.roomStation = data.casePatient.hasOwnProperty('roomStation') ? data.casePatient.roomStation : ''
    obj.department = data.casePatient.hasOwnProperty('department') ? data.casePatient.department : ''
    obj.clinicId = data.casePatient.hasOwnProperty('clinicId') ? data.casePatient.clinicId : ''
    obj.admitDateTime = data.casePatient.hasOwnProperty('start') ? convertDate(data.casePatient.start, patterns[28], 'Europe/Berlin') : ''
    obj.admitDischargeDate = data.casePatient.hasOwnProperty('end') ? convertDate(data.casePatient.end, patterns[28], 'Europe/Berlin') : ''
    obj.caseId = data.casePatient.hasOwnProperty('id') ? data.casePatient.id : ''
    obj.fileCategory = data.casePatient.hasOwnProperty('category') ? data.category : ''
    obj.fileId = data.id
    obj.fileName = data.casePatient.hasOwnProperty('name') ? data.name : ''
    obj.fileEncoding = data.casePatient.hasOwnProperty('encoding') ? data.encoding : ''
    obj.fileExtension = 'pdf'
    obj.fileDescription = data.casePatient.hasOwnProperty('fileDescription') ? data.fileDescription : ''
    obj.clinicName = data.casePatient.hasOwnProperty('clinicName') ? data.clinicName : ''

    $c('Message Payload', JSON.stringify(obj))
    
    var msh = 'MSH|^~\&|mdoc.one|mdoc.one|SP6|' + obj.clinicName + '|' + obj.timestamp + '||MDM^T02^MDM_T02|' + obj.messageControlId + '|P|2.5|0'
    var env = 'EVN|T02|||||' + obj.timestamp + ''
    var pid = 'PID|1|' + obj.externalPatientId + '|' + obj.externalPatientId + '||' + obj.lastName + '^' + obj.firstName + '||' + obj.birthDate + '|' + obj.sex + '||||||||||' + obj.externalCaseId + ''
    var pv1 = 'PV1|1|S|^^^' + obj.roomStation + '^^' + obj.department + '^||||||||||||||||' + obj.externalCaseId + '|||||||||||||||||||||||||' + obj.admitDateTime + '|' + obj.admitDischargeDate + '|||||' + obj.fileId + ''
    var txa = 'TXA|1|' + obj.fileName + '|pdf|' + obj.timestamp + '|||' + obj.timestamp + '|||||' + obj.fileId + '^m.Doc^' + obj.fileId + '||||' + obj.fileName + '|||PROTECTED||' + obj.fileDescription + ''
    var obx = 'OBX|1|ED|' + obj.fileId + '^' + obj.fileCategory + '||' + obj.fileId + '^application^pdf^Base64^' + respGetFile + '|||||||||' + obj.timestamp + '|||^^^^pdf'

    return SerializerFactory.getSerializer('HL7V2').toXML(msh + '\n' + env + '\n' + pid + '\n' + pv1 + '\n' + txa + '\n' + obx);
    

  }

  function getFilesBase64() {
  	return http.getFilesBase64(data.id)
  }

  return {
  	outbound: outbound,
  	getFilesBase64: getFilesBase64
  }
}
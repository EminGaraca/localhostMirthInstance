/**
  Backend to the channels listener
*/
function CommonBackend() {
  //emin test from mirth instance to commit on github
 const listTenant = Util2().cfg("tenant")
 const log = CommonLogger()

 function organization() {
  const data = JSON.parse(connectorMessage.getRawData())

  function getClinicalByExternalId() {
   connectorMap.put('url', data.url + '/' + data.clinicId)
   channelMap.put('auth', data.auth)
  }

  function getClinicalByExternalIdResponse() {
   const resp = JSON.parse(response.getMessage())

   if (resp.status >= 400) {
    channelMap.put('department', false)
    channelMap.put('updateExternalIdd', false)
    return
   }

   channelMap.put('department', true)

   if (resp.hasOwnProperty('unitChildren') && resp.unitChildren.length >= 1) {
    channelMap.put('clinic_internal_uuid', resp.id)

    for (var index in resp.unitChildren) {
     var department = resp.unitChildren[index]

     if (department.name == data.departmentName) {
      channelMap.put('department', false)
      if (department.externalId == null || department.externalId != data.departmentCode) {
       channelMap.put('updateExternalIdd', true)
       channelMap.put('internal_id_department', department.id)
       return
      } else {
       channelMap.put('updateExternalIdd', false)
       return
      }
     }
    }
   }
  }

  function updateDepartmentExternalID() {
   connectorMap.put('url', data.url + '/' + $('internal_id_department') + '/external-id/' + data.departmentCode)
  }

  function createDepartment() {
   connectorMap.put('url', data.url)

   const obj = {}
   obj.externalId = data.departmentCode
   obj.name = data.departmentName
   obj.description = null
   obj.category = "DEPARTMENT"
   obj.parentId = $('clinic_internal_uuid')
   return JSON.stringify(obj)
  }

  return {
   createDepartment: createDepartment,
   updateDepartmentExternalID: updateDepartmentExternalID,
   getClinicalByExternalId: getClinicalByExternalId,
   getClinicalByExternalIdResponse: getClinicalByExternalIdResponse
  }
 }

 function configEnv() {
  function setConfigAppointment() {
   if (String(response.getMessage()).length == 0)
    return JSON.stringify({ 'message': 'Failed request to the backend. Please check with issue with the integration team' })

   const resp = JSON.parse(response.getMessage())
   const data = JSON.parse(connectorMessage.getRawData())

   if (resp.length == 0) return null

   var customerName = data.description
   var model = CommonModel()
   var cfg = model.environment(customerName)

   for (var index in resp) {
    var config = resp[index]

    if (String(config.property) != 'appointments.delay.message_queue') continue

    var cfgMirth = globalMap.get('cfg_' + customerName + '') != null ? globalMap.get('cfg_' + customerName + '') : null

    if (cfgMirth != null && cfgMirth.configuration.hasOwnProperty('delayOfAppointment') && cfgMirth.configuration.delayOfAppointment == config.value) continue

    cfg['configuration']['delayOfAppointment'] = config.value

    globalMap.put('cfg_' + customerName + '', cfg)

    model.updateEnvironment(customerName, 'delayOfAppointment', config.value)
   }
   return JSON.stringify(cfg)
  }

  function createMessageRequest() {
   const data = JSON.parse(connectorMessage.getRawData())

   channelMap.put('url', data.url)
   channelMap.put('token', data.token)
   channelMap.put('tenant_id', data.tenant)
   channelMap.put('customer', data.description)
  }

  function createMessage() {
   const list = new java.util.ArrayList()

   for (var index in listTenant) {
    var obj = listTenant[index]

    if (globalMap.get('mdoc_token_from_' + obj.description + '') == null) continue

    obj.url = Http().tenantConfiguration(obj.tenant) //'https://qa-app.mdoc.one/api/tenantconfig/v1/public/tenant/' + obj.tenant + '/module/properties/active?moduleAlias=APPOINTMENTS'
    obj.token = globalMap.get('mdoc_token_from_' + obj.description + '')
    list.add(JSON.stringify(listTenant[index]))
   }
   return list
  }

  return {
   createMessage: createMessage,
   createMessageRequest: createMessageRequest,
   setConfigAppointment: setConfigAppointment
  }
 }

 function testQaEnd2End() {
  const env = Util2().onlyEnv()

  if (env == 'qa') {
   if (String(channelName) == 'listener_files') {
    channelMap.put('channel_id', ChannelUtil.getDeployedChannelId('mock_backend_files'))
    return true
   }

   if (String(channelName) == 'listener_appointment') {
    channelMap.put('channel_id', ChannelUtil.getDeployedChannelId('mock_backend_appointment'))
    return true
   }

   if (String(channelName) == 'listener_patientOnboarding') {
    channelMap.put('channel_id', ChannelUtil.getDeployedChannelId('mock_backend_patient'))
    return true
   }

   if (String(channelName) == 'listener_questionnaireAnswer') {
    channelMap.put('channel_id', ChannelUtil.getDeployedChannelId('mock_backend_patient'))
    return true
   }
  }
  return false
 }

 function source() {
  if (String(channelName) == 'listener_appointment') backendDto().appointmentOutbound()
  if (String(channelName) == 'listener_files') backendDto().filesOutbound()
  if (String(channelName) == 'listener_patientOnboarding') backendDto().patientOutbound()
  if (String(channelName) == 'listener_questionnaireAnswer') backendDto().questionnaireAnsewerOutbound()

  const path = sourceMap.get("contextPath") == undefined ? null : sourceMap.get("contextPath").toString()
  const url = path != null ? path.split("/") : null

  globalChannelMap.put('desc_error', '')

  channelMap.put('routed', true)

  const data = validateMessage() == true ? JSON.parse(connectorMessage.getRawData()) : false

  const feature = path != null ? searchPort(String($('localPort'))) : null

  if (feature == false) throw log.loggerMessage('Feature not found! Check the file of cfg in config Maps', 50)


  if (data == false) {
   $co('Message Warning', 'Message empty is not permission')
   return destinationSet.removeAll()
  }

  if (String($('method')) == 'PATCH') {
   var uuidPattern = /\/tenant\/([a-f\d-]+)\//;
   var uuidMatch = path.match(uuidPattern);
   var uuidValue = (uuidMatch && uuidMatch[1]) || null;

   var appointmentIdPattern = /\/externalid\/([^/]+)\//;
   var appointmentIdMatch = path.match(appointmentIdPattern);
   var appointmentIdValue = (appointmentIdMatch && appointmentIdMatch[1]) || null;

   var statusValue = url[url.length - 1] || null;

   if (uuidValue == null || uuidValue == 'undefined') {
    connectorMap.put('Message Warning', "The URL sent does not have tenant ID information. The tenant information in the URL is: /tenant/{{UUID}}/")
    var outcome = $co('Message Warning')
    channelMap.put('outcome', outcome)
    channelMap.put('status', '500')
    channelMap.put('routed', false)
    destinationSet.removeAll()
    return globalChannelMap.put('desc_error', log.loggerMessage('The URL sent does not have tenant ID information. The tenant information in the URL is: /tenant/{{UUID}}/', 50))
   } else {
    data.tenantId = uuidValue
    data.appointmentId = appointmentIdValue
    data.status = statusValue
    msg = data
   }
  }

  const costumerName = searchTenant(listTenant, data)
  const channel = String(channelName).split('_')[1]
  const cfg = Util2().cfg(String(costumerName))

  channelMap.put('cfg', cfg)

  if (String($('method')) == 'GET' && costumerName != 'freeSlot_outbound') {
   $co('Message Warning', 'GET is not authorization')
   return destinationSet.removeAll()
  }

  if (String($('method')) != 'PATCH') {
   if (data.hasOwnProperty('tenantId') == false && costumerName != 'freeSlot_outbound') {
    $co('Message Warning', "The 'tenantID' field is missing and required")
    var outcome = $co('Message Warning')
    channelMap.put('outcome', outcome)
    channelMap.put('status', '500')
    channelMap.put('routed', false)
    return destinationSet.removeAll()
   }
  }

  if (costumerName == false) {
   $co('Message Warning', 'Configuration not found! Check if if this customer is set up')
   var outcome = $co('Message Warning')
   channelMap.put('outcome', outcome)
   channelMap.put('status', '500')
   channelMap.put('routed', false)
   return destinationSet.removeAll()
  }

  if (cfg.configuration.hasOwnProperty('messageOutboundAuthorization') == false) {
   $co('Message Warning', 'This feature is not enable for this customer. Please, check the field messageOutboundAuthorization is set up for this customer')
   var outcome = $co('Message Warning')
   channelMap.put('outcome', outcome)
   channelMap.put('status', '500')
   channelMap.put('routed', false)
   return destinationSet.removeAll()
  }

  if (cfg.configuration.messageOutboundAuthorization.hasOwnProperty(channel) == false) {
   $co('Message Warning', 'This feature is not exist for this customer. Please, check the field ' + channel + ' is set up for this customer')
   var outcome = $co('Message Warning')
   channelMap.put('outcome', outcome)
   channelMap.put('status', '500')
   channelMap.put('routed', false)
   return destinationSet.removeAll()
  }

  if (cfg.configuration.messageOutboundAuthorization[channel] == false) {
   $co('Message Warning', 'This feature is not enable for this customer. Please, check the field ' + channel + ' is set up for this customer')
   var outcome = $co('Message Warning')
   channelMap.put('outcome', outcome)
   channelMap.put('status', '500')
   channelMap.put('routed', false)
   return destinationSet.removeAll()
  }

  if (testQaEnd2End() == false) {
   var nameChannel = costumerName + '_' + feature

   channelMap.put('nameChannel', nameChannel)

   if (costumerName == false) throw log.loggerMessage('Customer not found! Check the file of cfg in config Maps', 50)

   var idChannel = ChannelUtil.getDeployedChannelId(nameChannel)

   if (idChannel == null) throw log.loggerMessage('desc_error', log.loggerMessage('Module not found. Please check if this module is active and working', 50))

   channelMap.put('channel_id', idChannel)

  }
 }

 function outcome() {
  var appointmentReturn = {}
  if (channelMap.get('routed') == true) {
   var destinationResponse;
   var destinationList = [];
   var destinations = sourceMap.get('destinationSet');
   destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

   for (let i = 0; i < destinationList.length; i++) {
    var response = responseMap.get(destinationList[i]);
   }
   const resp = JSON.parse(response.getMessage())
   if (resp.hasOwnProperty("appointmentId")) {
    return resp.appointmentId
   } else {
    return JSON.stringify(resp)
   }
  } else {
   appointmentReturn.status = 500
   appointmentReturn.response = String(channelMap.get('outcome'))
   return JSON.stringify(appointmentReturn)
  }
 }

 function searchTenant(cfg, data) {
  for (i = 0; i < cfg.length; i++) {
   if (String(cfg[i].tenant) == String(data.tenant) || String(cfg[i].tenant) == String(data.tenantId)) {
    channelMap.put('customer', cfg[i].description)
    channelMap.put('tenant', cfg[i].tenant)
    return cfg[i].description
   }
  }
  return false
 }

 function searchPort(vr1) {
  switch (String(vr1)) {
   case '7019':
    return 'freeslot_outbound'
   case '7016':
    return 'consent_outbound'
   case '7015':
    return 'questionnaire_answer_outbound'
   case '7014':
    return 'appointment_outbound'
   case '7018':
    return 'files_outbound'
   case '7017':
    return 'questionnaire_template_outbound'
   case '7020':
    return 'patient_outbound'
   default:
    return false
  }
 }

 function validateMessage() {
  if (String(msg).length == 0) {
   channelMap.put('Message Warnning', 'Do not permission payload empty')
   return false
  } else {
   return true
  }
 }

 function respAppointment() {
  try {
   const resp = JSON.parse(response.getMessage())
   if (resp.hasOwnProperty("appointmentId")) {
    channelMap.put('status', '201')
   } else {
    channelMap.put('status', '500')
   }
  } catch (error) {
   channelMap.put('status', '500')
   return
  }
 }

 function channel(sourceMap, responseMap, message) {
  var sourceError = message.getConnectorMessages().get(0).getProcessingError()
  var destinations = sourceMap.get('destinationSet')
  var out = null
  var obj = {}
  var status = String(message.getConnectorMessages().get(0).getStatus())

  try {
   if (status == 'ERROR') {
    obj.code = 400
    obj.text = 'An error was identified, please contact the support for more details'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    return ResponseFactory.getErrorResponse(JSON.stringify(obj))
   }

   /**
     Failed for the transformation of message
   */
   if (isEmpty(sourceError) == false) {
    obj.code = 400
    obj.text = 'Bad Request'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    return ResponseFactory.getErrorResponse(JSON.stringify(obj))
   }

   if (destinations == null || destinations.size() < 1) {
    obj.code = 400
    obj.text = 'Bad Request'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    return ResponseFactory.getErrorResponse(JSON.stringify(obj))
   }

   var destinationList = [];
   destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

   for (var i = 0; i < destinationList.length; i++) {
    var response = responseMap.get(destinationList[i])

    if (responseMap.get(destinationList[i]) == null) continue
    if (response.getStatus().toString() == 'FILTERED') continue

    if (String(response.getMessage()).length != 0 && JSON.parse(response.getMessage()).hasOwnProperty('status')) {
     var respCode = JSON.parse(response.getMessage()).status
     var respText = String(JSON.parse(response.getMessage()).error)
    }

    /**
     Message Failed
    */
    if (response.getStatus().toString() == 'ERROR') {
     var resp = null

     if (String(response.getMessage()).length != 0) {
      resp = JSON.parse(response.getMessage())
     } else {
      message.getConnectorMessages().forEach(e => {
       if (message.getConnectorMessages().get(e).getProcessingError() != null)
        resp = message.getConnectorMessages().get(e).getProcessingError()
      })
     }

     obj.code = respCode || 500
     obj.text = respText || 'Internal Server Error'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.trace = resp
     out = JSON.stringify(obj)
     return ResponseFactory.getErrorResponse(JSON.stringify(obj))
    }

    /**
     Message was sent with success
    */
    if (response.getStatus().toString() == 'SENT') {
     obj.code = 201
     obj.text = 'Create successfully'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.trace = null
     out = JSON.stringify(obj)
    }

    /**
     Message is in QUEUED
    */
    if (response.getStatus().toString() == 'QUEUED') {
     obj.code = 307
     obj.text = 'Temporary Redirect'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.trace = resp || null
     out = JSON.stringify(obj)
    }
   }
   if (JSON.parse(out).code <= 308) return ResponseFactory.getSentResponse(out)
   if (JSON.parse(out).code >= 400) return ResponseFactory.getErrorResponse(out)

  } catch (e) {
   obj.code = 500
   obj.text = 'Internal Server Error'
   obj.integrationId = message.getMessageId()
   obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
   obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
   obj.trace = resp || null
   out = JSON.stringify(obj)
  }
 }

 function resp(sourceMap, responseMap, message) {
     var status = String(message.getConnectorMessages().get(0).getStatus())
     const processingError = message.getConnectorMessages().get(0).getProcessingError()
     var destinations = sourceMap.get('destinationSet')
     var destinationList = []
     const obj = {}
   
     if (status == 'TRANSFORMED' && destinations.size() < 1) {
      globalChannelMap.put('statusCode', '400')
      obj.code = 400
      obj.text = 'Please, check if the field tenantId was sent. If the problem persist, contat the team of support for more detail'
      obj.integrationId = message.getMessageId()
      obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
      obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
      return ResponseFactory.getErrorResponse(JSON.stringify(obj))
     }
   
     if (status == 'ERROR' && processingError != null) {
      const mssgErrorOut = processingError.substr(String(processingError).indexOf('DETAILS'))
      const processingErrorStart = String(mssgErrorOut).indexOf('DETAILS')
      const processingErrorEnd = String(mssgErrorOut).indexOf('\n')
   
      globalChannelMap.put('statusCode', '400')
      obj.code = 400
      obj.text = mssgErrorOut.substr(processingErrorStart + 9, processingErrorEnd - 9)
      obj.integrationId = message.getMessageId()
      obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
      obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
      obj.trace = null
      return ResponseFactory.getErrorResponse(JSON.stringify(obj))
     }
   
     destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex))
   
     for (var i = 0; i < destinationList.length; i++) {
      try {
       var response = responseMap.get(destinationList[i])
       var mssg = JSON.parse(response.getMessage())
   
       if (Object.keys(mssg).length == 0) throw 'Error Unknown. Contact support team for more information'
   
       globalChannelMap.put('statusCode', String(mssg.code))
       return ResponseFactory.getSentResponse(response.getMessage())
   
      } catch (e) {
       globalChannelMap.put('statusCode', '500')
       return ResponseFactory.getSentResponse(
        JSON.stringify({
         code: 500,
         text: e.message,
         date: DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss'),
         integrationId: message.getMessageId(),
         serviceName: ChannelUtil.getChannelName(message.getChannelId()),
        }))
      }
     }
    }

 function isEmpty(val) {
  if (val === undefined || val === null || val === "") return true;
  if (typeof val === "string" || val instanceof String) {
   return val ? false : true;
  } else if (Array.isArray(val)) {
   return !val.length;
  } else if (typeof val === "object") {
   return Object.keys(val).length === 0;
  }
  return false;
 }

 function auth() {
  const data = JSON.parse(connectorMessage.getRawData())
  channelMap.put('url', data.url)
  delete data.url
  //Http().signIn(data, data)
  msg = JSON.stringify(data)
 }

 function backendDto() {
  const data = JSON.parse(connectorMessage.getRawData())
  const tenantDescription = searchTenant(listTenant, data)

  const msgPayloadMandatory = 'The payload are mandatory'
  const msgTenantIdMandatory = 'The information of tenantId is mandatory'
  const msgPatientMandatory = 'The information of Patient are mandatory'
  const msgFileMandatory = 'The information of file is mandatory'
  const msgCaseMandatory = 'The information of medicalCase is mandatory'
  const msgTypeLengthError = 'Invalid Type or length to field: '
  const msgMandatoryFieldError = ', are mandatory and is not empty or null, and you request is not correct to the field: '

  function validNumber(dataPatient, patient, minLength, maxLength) {
   return (typeof dataPatient[patient] !== 'number' || String(dataPatient[patient]).length < minLength || String(dataPatient[patient]).length > maxLength) ? false : true
  }

  function validString(dataPatient, patient, minLength, maxLength) {
   return (typeof dataPatient[patient] !== 'string' || dataPatient[patient].length < minLength || dataPatient[patient].length > maxLength) ? false : true
  }

  function appointmentOutbound() {
   const patient = Util2().cfg(tenantDescription).validation.outbound.patient.fieldMandatory
   const appointment = Util2().cfg(tenantDescription).validation.outbound.appointment.fieldMandatory
   const errosFields = []

   if (data == null || data.length == 0)
    throw msgPayloadMandatory

   if (data.hasOwnProperty('tenantId') == false || data.tenantId == null || data.tenantId == "")
    throw msgTenantIdMandatory

   if (data.patients == null || data.patients.length == 0)
    throw msgPatientMandatory

   for (var i = 0; i < patient.length; i++) {
    var dataPatient = data.patients[0]
    if (dataPatient.hasOwnProperty(String(patient[i])) == false || dataPatient[patient[i]] == null || dataPatient[patient[i]] == '')
     errosFields.push(patient[i])
   }

   for (var i = 0; i < appointment.length; i++) {
    if (data.hasOwnProperty(String(appointment[i])) == false || data[appointment[i]] == null || data[appointment[i]] == '')
     errosFields.push(appointment[i])
   }

   if (errosFields.length >= 1)
    throw 'These fields: ' + patient + ', ' + appointment + msgMandatoryFieldError + errosFields + ''
  }

  function filesOutbound() {
   const patient = Util2().cfg(tenantDescription).validation.outbound.patient.fieldMandatory
   const file = Util2().cfg(tenantDescription).validation.outbound.file.fieldMandatory
   const errosFields = []

   if (data == null || data.length == 0)
    throw msgPayloadMandatory

   if (data.hasOwnProperty('tenantId') == false || data.tenantId == null || data.tenantId == "")
    throw msgTenantIdMandatory

   if (data.file == null)
    throw msgFileMandatory

   if (patient.length >= 1) {
    logger.debug('medicalCase')
    for (var i = 0; i < patient.length; i++) {
     var dataPatient = data.medicalCase.patient

     if (dataPatient.hasOwnProperty(String(patient[i])) == false || dataPatient[patient[i]] == null || dataPatient[patient[i]] == '') {
      errosFields.push(patient[i])
     } else {
      switch (patient[i]) {
       case 'dob':
        if (!validNumber(dataPatient, patient[i], 5, 10))
         errosFields.push(msgTypeLengthError + patient[i]);
        break;
       case 'firstName':
        if (!validString(dataPatient, patient[i], 3, 50))
         errosFields.push(msgTypeLengthError + patient[i]);
        break;
       default:
        break;
      }
     }
    }
   }

   for (var i = 0; i < file.length; i++) {
    if (data.file.hasOwnProperty(String(file[i])) == false || data.file[file[i]] == null || data.file[file[i]] == '')
     errosFields.push(file[i])
   }

   if (errosFields.length >= 1)
    throw 'These fields: ' + patient + ', ' + file + msgMandatoryFieldError + errosFields + ''

  }

  function patientOutbound() {
   const patient = Util2().cfg(tenantDescription).validation.outbound.patient.fieldMandatory
   const errosFields = []

   if (data == null || data.length == 0)
    throw msgPayloadMandatory

   if (data.hasOwnProperty('tenantId') == false || data.tenantId == null || data.tenantId == "")
    throw msgTenantIdMandatory

   for (var i = 0; i < patient.length; i++) {
    var dataPatient = data
    if (dataPatient.hasOwnProperty(String(patient[i])) == false || dataPatient[patient[i]] == null || dataPatient[patient[i]] == '') {
     errosFields.push(patient[i])
    } else {
     switch (patient[i]) {
      case 'dob':
       if (!validNumber(dataPatient, patient[i], 5, 10))
        errosFields.push(msgTypeLengthError + patient[i]);
       break;
      case 'firstName':
       if (!validString(dataPatient, patient[i], 3, 50))
        errosFields.push(msgTypeLengthError + patient[i]);
       break;
      default:
       break;
     }
    }
   }

   if (errosFields.length >= 1)
    throw 'These fields: ' + patient + msgMandatoryFieldError + errosFields + ''
  }

  function questionnaireAnsewerOutbound() {
   const questionnaire = Util2().cfg(tenantDescription).validation.outbound.questionnaire.fieldMandatory
   const errosFields = []

   if (data == null || data.length == 0)
    throw msgPayloadMandatory

   if (data.hasOwnProperty('tenantId') == false || data.tenantId == null || data.tenantId == "")
    throw msgTenantIdMandatory

   for (var i = 0; i < questionnaire.length; i++) {
    if (data.hasOwnProperty(String(questionnaire[i])) == false || data[questionnaire[i]] == null || data[questionnaire[i]] == '')
     errosFields.push(questionnaire[i])
   }

   if (errosFields.length >= 1)
    throw 'These fields: ' + questionnaire + msgMandatoryFieldError + errosFields + ''
  }

  return {
   appointmentOutbound: appointmentOutbound,
   filesOutbound: filesOutbound,
   patientOutbound: patientOutbound,
   questionnaireAnsewerOutbound: questionnaireAnsewerOutbound
  }
 }

 return {
  source: source,
  outcome: outcome,
  respAppointment: respAppointment,
  configEnv: configEnv,
  resp: resp,
  channel: channel,
  organization: organization,
  auth: auth
 }
}
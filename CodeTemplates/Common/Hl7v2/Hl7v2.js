/**
  Common for use library HL7v2
*/
function Hl7v2() {
 const cfg = Util2().cfg()
 const date = Util2().date()
 const http = Http()

   /**
     @desc: Function for timezone fix - MDOP-1059
     @author: Sasa Lazic
  */
function toEpochFromHL7(ts) {
  var ymdHms = String(ts).concat('000000').substring(0, 14);
  var tzId = (cfg && cfg.configuration && cfg.configuration.timezone)
    ? cfg.configuration.timezone
    : 'Europe/Berlin';
  var SimpleDateFormat = java.text.SimpleDateFormat;
  var TimeZone = java.util.TimeZone;

  var fmt = new SimpleDateFormat("yyyyMMddHHmmss");
  fmt.setLenient(false);
  fmt.setTimeZone(TimeZone.getTimeZone(tzId));

  var dt = fmt.parse(ymdHms);
  return Math.floor(dt.getTime() / 1000);
}

 function formatDate(param) {
  return DateUtil.convertDate('yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm:ss', param.concat('000000').substring(0, 14))
 }

 function checkField(value) {
  if (value != undefined && value != null && value != '' && value != 0) return value

  return ''
 }

 function getFilesBase64(data) {
  return http.getFilesBase64(data.file.id)
 }

 function validation() {
  function appointmentInbound(data) {
   channelMap.put('TIME START', DateUtil.convertDate('yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm:ss', String(String(data['TQ1']['TQ1.7']['TQ1.7.1']).concat('0000')).substr(0, 14)))

   const dateStart = date.getSeconds(formatDate(String(data['TQ1']['TQ1.7']['TQ1.7.1'])))
   const dateEnd = date.getSeconds(formatDate(String(data['TQ1']['TQ1.8']['TQ1.8.1'])))

   if (dateStart >= dateEnd) throw 'The date start(TQ1.7.1) is greater than the date end(TQ1.8.1)'

   if (String(data['AIG']['AIG.4']['AIG.4.1']).length == 0) throw 'The ConsultationType field (AIS.4.1) is mandatory and cannot be blank'
  }
  return {
   appointmentInbound: appointmentInbound
  }
 }

 function createNameOfPatient(data) {
  if (String(data['AIP']['AIP.3']['AIP.3.3']).length == 0 || String(data['AIP']['AIP.3']['AIP.3.2']).length == 0) return null

  const name = String(String(data['AIP']['AIP.3']['AIP.3.6']) + '.' + String(data['AIP']['AIP.3']['AIP.3.3']) + '.' +
   String(data['AIP']['AIP.3']['AIP.3.4']) + '.' + String(data['AIP']['AIP.3']['AIP.3.2']) + '.' +
   String(data['AIP']['AIP.3']['AIP.3.5'])).split('.')

  return name.map((e, i) => {
   if (e != '') {
    if (i == 0) return e.concat('. ')
    if (i == 3 && name[4] != '') return e.concat(', ')
    if (i == 4) return e.concat('.')

    return e.concat(' ')
   }
  })
   .join('')
   .trim()
 }

 function inbound() {
  /**
     @type: MDM-T02
     @desc: Function for create a file
     @author: Anderson Araujo
  */
  function ormO01(data) {
   const obj = {}
   obj.externalTemplateId = String(data.OBR['OBR.4']['OBR.4.1'])
   obj.externalUserId = String(data['PV1']['PV1.3']['PV1.3.4']) + '.' + String(data['PID']['PID.3']['PID.3.1'])
   return obj
  }

  /**
     @type: MDM-T02
     @desc: Function for create a file
     @author: Anderson Araujo
  */
  function mdmT02(data) {
   const obj = {}
   //obj.fileName = String(data.TXA['TXA.16']['TXA.16.1']) + '.' + "pdf"
   obj.fileName = String(data.TXA['TXA.16']['TXA.16.1']) + '.' + String(data.TXA['TXA.3']['TXA.3.1']).split('/')[1]
   obj.externalId = String(data.TXA['TXA.12']['TXA.12.1'])
   obj.fileDescription = String(data.TXA['TXA.21']['TXA.21.1'])
   obj.categoryName = String(data.TXA["TXA.2"]["TXA.2.1"])
   obj.content = String(data.OBX['OBX.5']['OBX.5.5'])
   obj.format = String(data.OBX['OBX.5']['OBX.5.4']).toUpperCase()
   obj.externalCaseId = String(data.PV1['PV1.19']['PV1.19.1'])
   //obj.externalOwnerId = String(data.PV1['PV1.3']['PV1.3.5'])+'.'+String(data['PID']['PID.3']['PID.3.1'])
   //obj.externalOwnerId = '1B'+'.'+String(data['PID']['PID.3']['PID.3.1'])
   obj.externalOwnerId = channelMap.get('clinicPrefix') + '.' + channelMap.get('masterId') || null;
   return obj
  }

  /**
     @type: ADT-A01, ADT-A04, ADT-A08
     @desc: Function for create or update the date of Patient and Case
     @author: Anderson Araujo
  */
  function adt(data) {
   const obj = {}
   obj.patient = {}

   obj.patient.firstName = String(data['PID']['PID.5']['PID.5.2'][0]) || null
   obj.patient.lastName = String(data['PID']['PID.5']['PID.5.1'][0]) || null
   //obj.patient.externalUniqueId = String(data['PV1']['PV1.3']['PV1.3.4']) + '.' + String(data['PID']['PID.3']['PID.3.1']) || null
   obj.patient.externalUniqueId = channelMap.get('clinicPrefix') + '.' + channelMap.get('masterId') || null
   //obj.patient.externalUniqueId = String(data['MSH']['MSH.4']['MSH.4.2']) + '.' + String(data['PID']['PID.2']['PID.2.1']) || null
   obj.patient.externalId = channelMap.get('clinicPrefix') + '.' + channelMap.get('masterId') || null
  // obj.patient.externalId = String(data['PID']['PID.2']['PID.2.1']) || null
   obj.patient.email = null
   //obj.patient.username = String(data['PV1']['PV1.3']['PV1.3.4']) + '.' + String(data['PID']['PID.3']['PID.3.1']) || null
   obj.patient.username = channelMap.get('clinicPrefix') + '.' + channelMap.get('masterId') || null
   // obj.patient.username = String(data['MSH']['MSH.4']['MSH.4.2']) + '.' + String(data['PID']['PID.2']['PID.2.1']) || null
   obj.patient.dob = date.getSeconds(formatDate(String(data['PID']['PID.7']['PID.7.1']))) || null
   obj.patient.gender = String(data['PID']['PID.8']['PID.8.1']) || null
   obj.patient.addresses = []
   obj.patient.phones = []
   obj.patient.userType = 'PATIENT'
   obj.patient.appUser = null
   obj.patient.printPatientPlan = null

   /*
     Address for Patient
   */
   for (var index in data.PID['PID.11']) {
    var typeComunication = new XML(data.PID['PID.11'][index])

    if (String(typeComunication['PID.11.1']).length === 0) continue

    var addresses = {}
    addresses.city = String(typeComunication['PID.11.3'])
    addresses.zipCode = String(typeComunication['PID.11.5'])
    addresses.street = String(typeComunication['PID.11.1']['PID.11.1.1']).length == 0 ? String(typeComunication['PID.11.1']) : String(typeComunication['PID.11.1']['PID.11.1.1'])
    addresses.countryCode = String(typeComunication['PID.11.6'])
    addresses.type = 'PRIMARY'
    obj.patient.addresses.push(addresses)
   }

   for (var index in data.PID['PID.13']) {
    var typeComunication = new XML(data.PID['PID.13'][index])
    if (String(typeComunication['PID.13.3']).toLowerCase() == 'internet' || String(typeComunication['PID.13.3']).toLowerCase() == 'x.400' ||
     String(typeComunication['PID.13.4']).search('@') != -1 || String(typeComunication['PID.13.1']).search('@') != -1) {
     if (String(typeComunication['PID.13.4']).search('@') != -1 || String(typeComunication['PID.13.1']).search('@') != -1) {
      obj.patient.email = String(typeComunication['PID.13.4']) || String(typeComunication['PID.13.1'])
     } else {
      continue
     }
    }

    if (String(typeComunication['PID.13.3']).toLowerCase() == 'cp' || String(typeComunication['PID.13.3']).toLowerCase() == 'ph') {
     if (String(typeComunication['PID.13.1']).length < 5) continue

     var phones = {}
     phones.type = String(typeComunication['PID.13.3']).toLowerCase() == 'ph' ? 'TELEPHONE' : 'MOBILE'
     phones.number = String(typeComunication['PID.13.1'])
     obj.patient.phones.push(phones)
    }
   }

   if (String(data['PV1']['PV1.19']['PV1.19.1']).length >= 1) {
    obj.medicalCase = {}
    obj.medicalCase.externalId = String(data['PV1']['PV1.19']['PV1.19.1']) || null
    //obj.medicalCase.externalUniqueId = String(data.PV1['PV1.3']['PV1.3.4']) + '.' + String(data.PV1['PV1.19']['PV1.19.1']) || null
    //obj.medicalCase.externalUniqueId = String(data['MSH']['MSH.4']['MSH.4.2']) + '.' + String(data.PV1['PV1.19']['PV1.19.1']) || null
    obj.medicalCase.externalUniqueId = String(data.PV1['PV1.19']['PV1.19.1']) || null
    obj.medicalCase.start = String(data['PV1']['PV1.44']['PV1.44.1']).length !== 0 ? toEpochFromHL7(data['PV1']['PV1.44']['PV1.44.1']) : 0;
    //obj.medicalCase.end = String(data['PV1']['PV1.45']['PV1.45.1']).length !== 0 ? toEpochFromHL7(data['PV1']['PV1.45']['PV1.45.1']) : 0;
    obj.medicalCase.end = String(data['PV1']['PV1.45']['PV1.45.1']).length !== 0 ? toEpochFromHL7(data['PV1']['PV1.45']['PV1.45.1']) : null;
    obj.medicalCase.arrival = String(data['PV1']['PV1.44']['PV1.44.1']).length !== 0 ? toEpochFromHL7(data['PV1']['PV1.44']['PV1.44.1']) : 0;
    obj.medicalCase.plannedDeparture = null
    obj.medicalCase.actualDeparture = null
    obj.medicalCase.caseLocation = {}
    //obj.medicalCase.caseLocation.clinicExternalId = String(data['MSH']['MSH.4']['MSH.4.2'])
    obj.medicalCase.caseLocation.clinicExternalId = String(data['MSH']['MSH.4']['MSH.4.1'])
    //obj.medicalCase.caseLocation.departmentExternalId = String(data['PV1']['PV1.3']['PV1.3.5']) || null
    logger.info("DEPARTMENT: " + String(data['PV1']['PV1.3']['PV1.3.4']))
    obj.medicalCase.caseLocation.departmentExternalId =  String(data['MSH']['MSH.4']['MSH.4.1']) + '.' + String(data['PV1']['PV1.3']['PV1.3.4']) || null
    //obj.medicalCase.caseLocation.wardExternalId = String(data.PV1['PV1.3']['PV1.3.1']) || null
    obj.medicalCase.caseLocation.wardExternalId = null
    obj.medicalCase.caseLocation.roomExternalId = null //String(data.PV1['PV1.3']['PV1.3.2']) || null

    return obj
   }
   return obj.patient
  }

  /**
    @type: SIU-12
    @desc: For to create an appointment
    @author Anderson Araujo
  */
  function siu12(data) {
   validation().appointmentInbound(data)

   const obj = {}
   obj.tenantId = cfg.configuration.auth.login.tenant
   obj.externalId = String(data['SCH']['SCH.2']['SCH.2.1']).trim()
   obj.externalCaseId = String(data.PV1['PV1.19']['PV1.19.1']).trim()
   obj.title = String(data.AIG['AIG.3']['AIG.3.1']).length == 0 ? '' : String(data.AIG['AIG.3']['AIG.3.1']).trim()
   obj.comments = String(data.OBX['OBX.5']['OBX.5.1']).length == 0 ? null : [String(data.OBX['OBX.5']['OBX.5.1']).trim()]
   obj.dateStart = date.getSeconds(formatDate(String(data['TQ1']['TQ1.7']['TQ1.7.1'])))
   obj.dateEnd = date.getSeconds(formatDate(String(data['TQ1']['TQ1.8']['TQ1.8.1'])))
   obj.consultationType = String(data['AIG']['AIG.4']['AIG.4.1']).length == 0 ? null : String(data['AIG']['AIG.4']['AIG.4.1'])
   obj.type = "ON_SITE"
   obj.status = 'CONFIRMED'
   obj.cancelable = true
   obj.timeVisible = true
   obj.visible = true
   obj.priority = 0
   obj.specialty = cfg.configuration.appointment.specialty
   obj.description = null
   obj.generalInstructions = null
   obj.therapyId = null
   obj.therapeutic = createNameOfPatient(data)
   obj.therapeuticId = createNameOfPatient(data) != null ? String(data['AIP']['AIP.3']['AIP.3.1']) : null
   obj.patients = []
   obj.patients.push(String(data.PID['PID.3'][0]['PID.3.1']).trim())
   obj.generalInstructions = String(data.OBX['OBX.5']['OBX.5.1']).length == 0 ? null : String(data.OBX['OBX.5']['OBX.5.1'])
   obj.hasInstructions = String(data.OBX['OBX.5']['OBX.5.1']).length == 0 ? false : true
   obj.professionals = []
   return obj
  }

  /**
    @type SIU-15
    @desc: For to cancel the appointment
    @author Anderson Araujo
  */
  function siu15(data) {
   return http.patchAppointment('/' + data + '/status/' + 'CANCELED', null)
  }

  /**
    @type SIU-17
    @desc: For to delete the appointment
    @author Anderson Araujo
  */
  function siu17(data) {
   return http.deleteAppointment('/' + data, null)
  }


  /**
    @type SIU-23 or SIU-S24
    @desc: For blocked or unblocked an appointment in the portal side
    @author Anderson Araujo
  */
  function siu23OrSiu24(data) {
   const obj = {}
   obj.organizationExternalId = String(data['MSH']['MSH.5']['MSH.5.1'])
   obj.consultationType = null //String(data['AIG']['AIG.4']['AIG.4.1']).length == 0 ? null : String(data['AIG']['AIG.4']['AIG.4.1'])
   obj.consultationTypeExternalId = null
   obj.dateStart = date.getSeconds(formatDate(String(data['TQ1']['TQ1.7']['TQ1.7.1'])))
   obj.dateEnd = date.getSeconds(formatDate(String(data['TQ1']['TQ1.8']['TQ1.8.1'])))
   obj.status = String(data['MSH']['MSH.9']['MSH.9.2']) == 'S12' ? 'BLOCKED' : 'FREE'
   obj.externalId = String(data['SCH']['SCH.2']['SCH.2.1']).trim()
   obj.therapeutic = createNameOfPatient(data)
   obj.therapeuticId = createNameOfPatient(data) != null ? String(data['AIP']['AIP.3']['AIP.3.1']) : null
   return obj
  }

  return {
   adt: adt,
   siu12: siu12,
   siu15: siu15,
   siu17: siu17,
   mdmT02: mdmT02,
   siu23OrSiu24: siu23OrSiu24,
   ormO01: ormO01
  }
 }

 function outbound() {
  function mdmT02(data, application, facility) {
   const hl7 = SerializerFactory.getSerializer('HL7V2').fromXML(segment().msh(data, 'MDM', 'T02', application, facility)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().evn(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pid(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pv1(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().txa(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().obx(data))
   return hl7
  }

  function siu(data, application, facility, trigger, status) {
   const hl7 = SerializerFactory.getSerializer('HL7V2').fromXML(segment().msh(data, 'SIU', trigger, application, facility)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().sch(data, status)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pid(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pv1(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().tq1(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().nte(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().ais(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().aig(data))
   return hl7
  }

  function oru(data, application, facility, trigger) {
   const hl7 = SerializerFactory.getSerializer('HL7V2').fromXML(segment().msh(data, 'ORU', trigger, application, facility)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pid(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().pv1(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().orc(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().obr(data)) + '\n' +
    SerializerFactory.getSerializer('HL7V2').fromXML(segment().obx(data))

   return hl7
  }

  return {
   mdmT02: mdmT02,
   siu: siu,
   oru: oru
  }
 }

 function segment() {
  const dateTimeDefault = DateUtil.getCurrentDate('yyyyMMddHHmmss')
  /**
    @type: MSH
    @desc: For to create a MSH
    @author Anderson Araujo
  */
  function msh(data, event, trigger, application, facility) {
   const msh = new XML("<MSH/>")
   // 1. Provjeri da li pacijenti uopšte postoje u nizu
	if (data.patients && data.patients.length > 0) {
	    var firstPatient = data.patients[0];
	    var extUniqueId = firstPatient.externalUniqueId;
	
	    // 2. Izvrši siguran split po tački
	    if (extUniqueId && extUniqueId.indexOf('.') !== -1) {
	        externalIdPrefix = extUniqueId.split('.')[0];
	    } else {
	        externalIdPrefix = extUniqueId || "";
	    }
	}
   msh['MSH.1'] = '|'
   msh['MSH.2'] = '^~\\&'
   msh['MSH.3']['MSH.3.1'] = 'mdoc.integration'
   msh['MSH.4']['MSH.4.1'] = externalIdPrefix
   msh['MSH.5']['MSH.5.1'] = application
   msh['MSH.6']['MSH.6.1'] = externalIdPrefix
   msh['MSH.7']['MSH.7.1'] = dateTimeDefault
   msh['MSH.9']['MSH.9.1'] = event
   msh['MSH.9']['MSH.9.2'] = trigger
   msh['MSH.9']['MSH.9.3'] = event + '_' + trigger
   msh['MSH.10']['MSH.10.1'] = connectorMessage.getMessageId()
   msh['MSH.11']['MSH.11.1'] = 'P'
   msh['MSH.12']['MSH.12.1'] = '2.5'

   return msh
  }

  /**
    @type: EVN
    @desc: For to create an EVN
    @author Anderson Araujo
  */
  function evn() {
   const evn = new XML('<EVN/>')
   evn['EVN.1'] = 'T02'
   evn['EVN.6']['EVN.6.1'] = dateTimeDefault
   return evn
  }

  /**
    @type: PID
    @desc: For to create a PID
    @author Anderson Araujo
  */
  function pid(data) {
   const pid = new XML('<PID/>')
   pid['PID.1'] = '1'
   pid['PID.2']['PID.2.1'] = data.medicalCase.patient.hasOwnProperty('externalId') ? data.medicalCase.patient.externalId : ''
   pid['PID.3']['PID.3.1'] = data.medicalCase.patient.hasOwnProperty('externalId') ? data.medicalCase.patient.externalId : ''
   pid['PID.5']['PID.5.1'] = data.medicalCase.patient.hasOwnProperty('lastName') ? data.medicalCase.patient.lastName : ''
   pid['PID.5']['PID.5.2'] = data.medicalCase.patient.hasOwnProperty('firstName') ? data.medicalCase.patient.firstName : ''
   pid['PID.7']['PID.7.1'] = data.medicalCase.patient.hasOwnProperty('dob') ? date.fromSecondToHl7DateTime(data.medicalCase.patient.dob) : ''
   pid['PID.8']['PID.8.1'] = data.medicalCase.patient.hasOwnProperty('gender') == true ? data.medicalCase.patient.gender : ''
   pid['PID.18']['PID.18.1'] = data.medicalCase.hasOwnProperty('externalId') == true ? data.medicalCase.externalId : ''
   return pid
  }

  /**
    @type: PV1
    @desc: For to create a PV1
    @author Anderson Araujo
  */
  function pv1(data) {
   const pv1 = new XML('<PV1/>')
   pv1['PV1.1'] = '1'
   pv1['PV1.2'] = 'S'
   pv1['PV1.19']['PV1.19.1'] = checkField(data.medicalCase.externalId)
   pv1['PV1.44']['PV1.44.1'] = checkField(date.fromSecondToHl7DateTime(data.medicalCase.arrival))
   pv1['PV1.45']['PV1.45.1'] = checkField(date.fromSecondToHl7DateTime(data.medicalCase.actualDeparture))
   return pv1
  }

  /**
    @type: TXA
    @desc: For to create a TXA
    @author Anderson Araujo
  */
  function txa(data) {
   const txa = new XML('<TXA/>')
   txa['TXA.1'] = '1'
   txa['TXA.2'] = 'K7'
   txa['TXA.3']['TXA.3.1'] = data.file.hasOwnProperty('content') == true ? String(data.file.content).split('.').pop() : ''
   txa['TXA.4']['TXA.4.1'] = dateTimeDefault
   txa["TXA.7"]["TXA.7.1"] = dateTimeDefault
   txa["TXA.12"]["TXA.12.1"] = data.file.id
   txa["TXA.12"]["TXA.12.2"] = 'm.Doc'
   txa["TXA.12"]["TXA.12.3"] = data.file.id
   txa["TXA.16"]["TXA.16.1"] = data.file.fileName || ''
   txa["TXA.19"]["TXA.19.1"] = 'PROTECTED'
   txa["TXA.21"]["TXA.21.1"] = data.file.fileDescription || ''
   return txa
  }

  /**
    @type: OBX
    @desc: For to create an OBx
    @author Anderson Araujo
  */
  function obx(data) {
   const obx = new XML('<OBX/>')
   obx["OBX.1"] = '1'
   obx["OBX.2"] = 'ED'
   obx["OBX.3"]["OBX.3.1"] = data.file.hasOwnProperty('id') ? data.file.id : ''
   obx["OBX.3"]["OBX.3.2"] = data.file.hasOwnProperty('fileName') ? data.file.fileName : ''
   obx["OBX.5"]["OBX.5.1"] = data.file.hasOwnProperty('id') == true ? data.file.id : ''
   obx["OBX.5"]["OBX.5.2"] = 'application'
   obx["OBX.5"]["OBX.5.3"] = data.file.hasOwnProperty('content') == true ? String(data.file.content).split('.').pop() : ''
   obx["OBX.5"]["OBX.5.4"] = 'Base64'
   obx["OBX.5"]["OBX.5.5"] = responseMap.get('http_get_fileBase64_mdoc').getMessage()
   obx["OBX.14"]["OBX.14.1"] = dateTimeDefault
   obx["OBX.17"]["OBX.17.5"] = data.file.hasOwnProperty('content') == true ? String(data.file.content).split('.').pop() : ''
   return obx
  }

  /**
      @type: SCH
      @desc: For to create an OBx
      @author Jhonata Rebouças
    */
  function sch(data, status) {
   const sch = new XML('<SCH/>')
   sch['SCH.2']['SCH.2.1'] = data.externalId
   sch['SCH.2']['SCH.2.2'] = data.id
   sch['SCH.6']['SCH.6.1'] = 'MDOCAPPOINTMENT'
   sch['SCH.8']['SCH.8.1'] = cfg.appointment.configuration.speciality.outbound.hasOwnProperty('consultationType') && cfg.appointment.configuration.speciality.outbound.consultationType == true ? data.consultationType : data.consultationTypeExternalId
   sch['SCH.25']['SCH.25.1'] = status == 'create' ? 'Booked' : status == 'update' ? 'Updated' : 'Cancel'
   return sch
  }

  /**
   @type: TQ1a
   @desc: For to create an SCH
   @author Jhonata Rebouças
  */
  function tq1(data) {
   const duration = ((data.dateEnd - data.dateStart) / 60)
   const tq1 = new XML('<TQ1/>')
   tq1['TQ1.7']['TQ1.7.1'] = Util2().date().convertDateByEpoch(data.dateStart * 1000, 'yyyyMMddHHmmss')
   tq1['TQ1.8']['TQ1.8.1'] = Util2().date().convertDateByEpoch(data.dateEnd * 1000, 'yyyyMMddHHmmss')
   tq1['TQ1.13']['TQ1.13.1'] = duration + '^min'
   return tq1
  }

  /**
   @type: NTE
   @desc: For to create an NTE
   @author Jhonata Rebouças
  */
  function nte(data) {
   const nte = new XML('<NTE/>')
   nte['NTE.4']['NTE.4.1'] = data.consultationType
   return nte
  }

  /**
   @type: AIS
   @desc: For to create an AIS
   @author Jhonata Rebouças
  */
  function ais(data) {
   const duration = ((data.dateEnd - data.dateStart) / 60)
   const ais = new XML('<AIS/>')
   ais['AIS.3']['AIS.3.1'] = data.externalId
   ais['AIS.4']['AIS.4.1'] = Util2().date().convertDateByEpoch(data.dateStart * 1000, 'yyyyMMddHHmmss')
   ais['AIS.7']['AIS.7.1'] = duration
   return ais
  }

  /**
          @type: AIG
          @desc: For to create an AIG
          @author Jhonata Rebouças
        */
  function aig(data) {
   const aig = new XML('<AIG/>')
   aig['AIG.3']['AIG.3.1'] = data.consultationTypeExternalId;
   aig['AIG.4']['AIG.4.1'] = data.consultationTypeExternalId;
//   aig['AIG.3']['AIG.3.1'] = Util2().date().convertDateByEpoch(data.dateStart * 1000, 'yyyyMMddHHmmss')
//   aig['AIG.4']['AIG.4.1'] = Util2().date().convertDateByEpoch(data.dateEnd * 1000, 'yyyyMMddHHmmss')
   return aig
  }

  /**
   @type: ORC
   @desc: For to create an ORC
   @author Jhonata Rebouças
  */
  function orc(data) {
   const orc = new XML('<ORC/>')
   orc['ORC.2']['ORC.2.1'] = data.externalQuestionnaireId
   orc['ORC.3']['ORC.3.1'] = data.externalQuestionnaireUniqueId
   orc['ORC.3']['ORC.3.3'] = data.id
   orc['ORC.5']['ORC.5.1'] = 'CM'
   return orc
  }

  /**
   @type: OBR
   @desc: For to create an OBR
   @author Jhonata Rebouças
  */
  function obr(data) {
   const obr = new XML('<OBR/>')
   obr['OBR.2']['OBR.2.1'] = data.medicalCase.externalId
   obr['OBR.3']['OBR.3.1'] = data.externalQuestionnaireId
   obr['OBR.3']['OBR.3.3'] = data.idQuestionnaire
   obr['OBR.7']['OBR.7.1'] = Util2().date().convertDate(data.creationDate, 'yyyyMMddHHmmss')
   obr['OBR.25']['OBR.25.1'] = 'F'
   return obr
  }


  return {
   msh: msh,
   evn: evn,
   pid: pid,
   pv1: pv1,
   txa: txa,
   obx: obx,
   sch: sch,
   tq1: tq1,
   nte: nte,
   ais: ais,
   aig: aig,
   orc: orc,
   obr: obr
  }
 }

 /**
   @type: SIU
   @desc: Create Appointment Inbound
   @deprecated: Not use this function, pleaase use the function that is in inbound function
 */
 function createOrUpdateAppointment(data, respCase, respAppointment, customer, cfg) {
  var obj = {}

  if (respAppointment.status == 'OK') obj.id = respAppointment.response.id

  obj.externalAppointment = String(data['SCH']['SCH.2']['SCH.2.1']).trim()
  obj.externalCase = String(data.MSH['MSH.4']['MSH.4.1']) + '.' + String(data.PV1['PV1.19']['PV1.19.1'])
  obj.timeVisible = true
  obj.visible = true
  obj.title = String(data['AIG']['AIG.3']['AIG.3.1'])
  obj.comments = String(data.OBX['OBX.5']).length == 0 ? null : tring(data.OBX['OBX.5']).trim()
  obj.dateStart = getSeconds(getDate(String(data['TQ1']['TQ1.7']['TQ1.7.1']).trim(), patterns[29]))
  obj.dateEnd = getSeconds(getDate(String(data['TQ1']['TQ1.8']['TQ1.8.1']).trim(), patterns[29]))
  obj.type = "ON_SITE"
  obj.priority = 0
  obj.tenantId = cfg.configuration.auth.login.tenant

  return obj
 }

 function allowedThisHl7SIU(nameChannel) {
  var messageCode = tmp["MSH"]["MSH.9"]["MSH.9.1"].toString()
  var triggerEvent = tmp["MSH"]["MSH.9"]["MSH.9.2"].toString()

  if (messageCode == "SIU") {
   switch (triggerEvent) {
    case "S12":
    case "S13":
    case "S14":
    case "S15":
    case "S17":
    case "S22":
    case "S23":
     destinationSet.removeAllExcept(['' + nameChannel + ''])
     return nameChannel
    default:
     break
   }
  } else {
   destinationSet.removeAll()
   channelMap.put('Message Warning', common_handlingLogMessage('This Message Code is not allowed to the flow Patient Onboarding. Message Code: ' + messageCode + '. Warning message filtered ' + messageCode + '', 'error'))
  }
 }

 /**
   @type: SIU
   @desc: Create Appointment Outbound
 */
 function appointmentOutboundHl7(data) {
  const payload = data.dataInbound
  const user = data.user
  const casee = data.caseData
  const location = data.location
  const dateTime = DateUtil.getCurrentDate('yyyyMMddHHmmss')
  const duration = (((new Date(payload.dateEnd).getTime() - new Date(payload.dateStart).getTime()) / 1000) / 60)

  /*
   MSH
  */
  tmp['MSH']['MSH.3']['MSH.3.1'] = 'integra.mdoc'
  tmp['MSH']['MSH.4']['MSH.4.1'] = 'mDoc'
  tmp['MSH']['MSH.5']['MSH.5.1'] = cfg.configuration.facility
  tmp['MSH']['MSH.6']['MSH.6.1'] = location.response.name
  tmp['MSH']['MSH.7']['MSH.7.1'] = dateTime
  tmp['MSH']['MSH.9']['MSH.9.1'] = 'SIU'
  tmp['MSH']['MSH.9']['MSH.9.2'] = payload.status == 'CONFIRMED' ? 'S12' : 'S14'
  tmp['MSH']['MSH.9']['MSH.9.3'] = tmp['MSH']['MSH.9']['MSH.9.1'] + '_' + tmp['MSH']['MSH.9']['MSH.9.2']
  tmp['MSH']['MSH.10']['MSH.10.1'] = payload.appointmentId.substr(0, 20)
  tmp['MSH']['MSH.11']['MSH.11.1'] = 'P'
  tmp['MSH']['MSH.12']['MSH.12.1'] = '2.5'
  tmp['MSH']['MSH.14']['MSH.14.1'] = '59729601'
  tmp['MSH']['MSH.15']['MSH.15.1'] = 'NE'
  tmp['MSH']['MSH.16']['MSH.16.1'] = 'NE'
  tmp['MSH']['MSH.18']['MSH.18.1'] = '8859/1'

  /*
   SCH
  */
  tmp['SCH']['SCH.2']['SCH.2.1'] = payload.appointmentId
  tmp['SCH']['SCH.2']['SCH.2.2'] = 'MDOCAPPOINTMENT'
  tmp['SCH']['SCH.6']['SCH.6.1'] = '60016_59729601'
  tmp['SCH']['SCH.8']['SCH.8.1'] = 'Arbeits-/Schul-/Wegeunfall/BG'
  tmp['SCH']['SCH.25']['SCH.25.1'] = payload.status == 'CONFIRMED' ? 'Booked' : 'Cancel'

  /*
   TQ1
  */
  tmp['TQ1']['TQ1.7']['TQ1.7.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateStart.replace('T', ' '))
  tmp['TQ1']['TQ1.8']['TQ1.8.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateEnd.replace('T', ' '))
  tmp['TQ1']['TQ1.13']['TQ1.13.1'] = duration + '^min'

  /*
   NTE
  */
  tmp['NTE']['NTE.3']['NTE.3.1'] = 'AppointmentTitle'
  tmp['NTE']['NTE.4']['NTE.4.1'] = "AppointmentTitle"

  /*
    PID
 */
  tmp['PID']['PID.2']['PID.2.1'] = payload.participants.map(p => p.participantType == 'PATIENT' ? p.username.split('.')[1] : null).filter(p => p).toString()
  tmp['PID']['PID.3']['PID.3.1'] = payload.participants.map(p => p.participantType == 'PATIENT' ? p.username.split('.')[1] : null).filter(p => p).toString()
  tmp['PID']['PID.4']['PID.4.1'] = payload.caseId.split('.').length >= 2 ? payload.caseId.split('.')[1] : payload.caseId
  tmp['PID']['PID.5']['PID.5.1'] = payload.participants.map(p => p.participantType == 'PATIENT' ? p.lastName : null).filter(p => p).toString()
  tmp['PID']['PID.5']['PID.5.2'] = payload.participants.map(p => p.participantType == 'PATIENT' ? p.firstName : null).filter(p => p).toString()
  tmp['PID']['PID.7']['PID.7.1'] = DateUtil.convertDate('yyyy-MM-dd', 'yyyyMMdd', payload.participants.map(p => p.participantType == 'PATIENT' ? p.birthDate : null).filter(p => p).toString())
  tmp['PID']['PID.8']['PID.8.1'] = user.response.gender

  /*
    PV1
 */
  tmp['PV1']['PV1.3']['PV1.3.4'] = cfg.configuration.facility
  tmp['PV1']['PV1.7']['PV1.7.1'] = "sfs.admin"
  tmp['PV1']['PV1.19']['PV1.19.1'] = payload.caseId.split('.').length >= 2 ? payload.caseId.split('.')[1] : payload.caseId
  tmp['PV1']['PV1.44']['PV1.44.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateStart.replace('T', ' '))

  /*
    AIS
 */
  tmp['AIS']['AIS.3']['AIS.3.1'] = payload.appointmentId
  tmp['AIS']['AIS.4']['AIS.4.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateStart.replace('T', ' '))
  tmp['AIS']['AIS.7']['AIS.7.1'] = duration

  /*
  AIG
 */
  tmp['AIG']['AIG.3']['AIG.3.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateStart.replace('T', ' '))
  tmp['AIG']['AIG.4']['AIG.4.1'] = DateUtil.convertDate('yyyy-MM-dd HH:mm:ss', 'yyyyMMddHHmmss', payload.dateEnd.replace('T', ' '))

  return tmp
 }

 /**
   @type: SIU
   @desc: Create Appointment Inbound
   @deprecated: Not use this function, pleaase use the function that is in inbound function
 */
 function appointmentV2Inbound(data) {
  validation().appointmentInbound(data)

  const obj = {}
  obj.tenantId = cfg.configuration.auth.login.tenant
  obj.externalId = String(data['SCH']['SCH.2']['SCH.2.1']).trim()
  obj.externalCaseId = String(data.MSH['MSH.4']['MSH.4.1']) + '.' + String(data.PV1['PV1.19']['PV1.19.1'])
  obj.title = String(data['AIG']['AIG.3']['AIG.3.1']).length == 0 ? '' : String(data['AIG']['AIG.3']['AIG.3.1'])
  obj.comments = String(data.OBX['OBX.5']).length == 0 ? null : String(data.OBX['OBX.5']).trim()
  obj.dateStart = getSeconds(getMillisWithTimeZone(DateUtil.convertDate('yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm:ss', String(data['TQ1']['TQ1.7']['TQ1.7.1']).concat('0000').concat('0000').substr(0, 14)), 'Europe/Berlin'))
  obj.dateEnd = getSeconds(getMillisWithTimeZone(DateUtil.convertDate('yyyyMMddHHmmss', 'yyyy-MM-dd HH:mm:ss', String(data['TQ1']['TQ1.8']['TQ1.8.1']).concat('0000').substr(0, 14)), 'Europe/Berlin'))
  obj.consultationType = String(data['AIG']['AIG.3']['AIG.3.2']).length == 0 ? 'Rehabilitation' : String(data['AIG']['AIG.3']['AIG.3.2'])
  obj.type = "ON_SITE"
  obj.status = 'CONFIRMED'
  obj.cancelable = false
  obj.timeVisible = true
  obj.visible = true
  obj.priority = 0
  obj.specialty = null
  obj.description = null
  obj.generalInstructions = null
  obj.therapyId = null
  obj.therapeutic = createNameOfPatient(data)
  obj.therapeuticId = createNameOfPatient(data) != null ? String(data['AIP']['AIP.3']['AIP.3.1']) : null
  obj.patients = []
  obj.patients.push(String(data['PID']['PID.3']['PID.3.1']))

  return obj
 }

 /**
   @type: MDM
   @desc: Create Files
   @deprecated: Not use this function, pleaase use the function that is in inbound function
 */
 function createFilesInbound(data) {
  const obj = {}
  obj.tenantId = cfg.configuration.auth.login.tenant
  obj.fileName = String(data.TXA['TXA.16']['TXA.16.1'])
  obj.externalId = String(data.TXA['TXA.12']['TXA.12.1'])
  obj.fileDescription = String(data.TXA['TXA.21']['TXA.21.1']).length == 0 ? String(data.TXA['TXA.16']['TXA.16.1']) : String(data.TXA['TXA.21']['TXA.21.1'])
  obj.externalOwnerId = String(data.PID['PID.3']['PID.3.1'])
  obj.categoryName = String(data.TXA["TXA.2"]["TXA.2.1"])
  obj.content = String(data.OBX['OBX.5']['OBX.5.5']).length == 0 ? String(data.OBX['OBX.5']['OBX.5.1']) : String(data.OBX['OBX.5']['OBX.5.5'])
  obj.format = 'BASE64'
  obj.externalAppointmentId = null
  return obj
 }

 /**
   @type: ADT-A01, ADT-A04, ADT-A08
     @desc: Function for create or update the date of Patient and Case
     @author: Anderson Araujo
     
 */
 function patientOnboarding() {
  const obj = {}
  obj.patient = {}

  obj.patient.firstName = String(data['PID']['PID.5']['PID.5.2']) || null
  obj.patient.lastName = String(data['PID']['PID.5']['PID.5.1']) || null
  obj.patient.externalUniqueId = String(data['MSH']['MSH.4']['MSH.4.2']) + '.' + String(data['PID']['PID.3']['PID.3.1']) || null
  obj.patient.externalId = String(data['PID']['PID.2']['PID.2.1']) || null
  obj.patient.email = null
  obj.patient.username = String(data['MSH']['MSH.4']['MSH.4.2']) + '.' + String(data['PID']['PID.3']['PID.3.1']) || null
  obj.patient.dob = getSeconds(data['PID']['PID.7']['PID.7.1']) || null
  obj.patient.gender = String(data['PID']['PID.8']['PID.8.1']) || null
  obj.patient.addresses = []
  obj.patient.phones = []
  obj.patient.userType = 'PATIENT'
  obj.patient.appUser = null
  obj.patient.printPatientPlan = null

  /*
    Address for Patient
  */
  for (var index in data.PID['PID.11']) {
   var typeComunication = new XML(data.PID['PID.11'][index])

   if (String(typeComunication['PID.11.1']).length === 0) continue

   var addresses = {}
   addresses.city = String(typeComunication['PID.11.3'])
   addresses.zipCode = String(typeComunication['PID.11.5'])
   addresses.street = String(typeComunication['PID.11.1']['PID.11.1.1']).length == 0 ? String(typeComunication['PID.11.1']) : String(typeComunication['PID.11.1']['PID.11.1.1'])
   addresses.countryCode = String(typeComunication['PID.11.6'])
   addresses.type = 'PRIMARY'
   obj.patient.addresses.push(addresses)
  }

  for (var index in data.PID['PID.13']) {
   var typeComunication = new XML(data.PID['PID.13'][index])
   if (String(typeComunication['PID.13.3']).toLowerCase() == 'internet' || String(typeComunication['PID.13.3']).toLowerCase() == 'x.400' ||
    String(typeComunication['PID.13.4']).search('@') != -1 || String(typeComunication['PID.13.1']).search('@') != -1) {
    if (String(typeComunication['PID.13.4']).search('@') != -1 || String(typeComunication['PID.13.1']).search('@') != -1) {
     obj.patient.email = String(typeComunication['PID.13.4']) || String(typeComunication['PID.13.1'])
    } else {
     continue
    }
   }

   if (String(typeComunication['PID.13.3']).toLowerCase() == 'cp' || String(typeComunication['PID.13.3']).toLowerCase() == 'ph') {
    if (String(typeComunication['PID.13.1']).length < 5) continue

    var phones = {}
    phones.type = String(typeComunication['PID.13.3']).toLowerCase() == 'ph' ? 'TELEPHONE' : 'MOBILE'
    phones.number = String(typeComunication['PID.13.1'])
    obj.patient.phones.push(phones)
   }
  }
  if (String(data['PV1']['PV1.19']['PV1.19.1']).length >= 1) {
   /*
     Case
   */
   obj.medicalCase = {}
   obj.medicalCase.externalId = String(data['PV1']['PV1.19']['PV1.19.1']) || null
   obj.medicalCase.externalUniqueId = String(data.MSH['MSH.4']['MSH.4.2']) + '.' + String(data.PV1['PV1.19']['PV1.19.1']) || null
   obj.medicalCase.start = dateTimeWithTimeZone(String(data['PV1']['PV1.44']['PV1.44.1']), cfg.configuration.timezone) || null
   obj.medicalCase.end = String(data['PV1']['PV1.45']['PV1.45.1']).length != 0 ? dateTimeWithTimeZone(String(data['PV1']['PV1.45']['PV1.45.1']), cfg.configuration.timezone) : null
   obj.medicalCase.arrival = null
   obj.medicalCase.plannedDeparture = null
   obj.medicalCase.actualDeparture = null

   /*
     Organization
   */
   obj.medicalCase.caseLocation = {}
   obj.medicalCase.caseLocation.clinicExternalId = String(data['MSH']['MSH.4']['MSH.4.1'])
   obj.medicalCase.caseLocation.departmentExternalId = String(data['PV1']['PV1.3']['PV1.3.5'])
   obj.medicalCase.caseLocation.wardExternalId = null
   obj.medicalCase.caseLocation.roomExternalId = null

   return obj
  }
  return obj.patient
 }

 return {
  createOrUpdateAppointment: createOrUpdateAppointment,
  allowedThisHl7SIU: allowedThisHl7SIU,
  appointmentOutboundHl7: appointmentOutboundHl7,
  appointmentV2Inbound: appointmentV2Inbound,
  createFilesInbound: createFilesInbound,
  patientOnboarding: patientOnboarding,
  getFilesBase64: getFilesBase64,
  inbound: inbound,
  outbound: outbound
 }
}
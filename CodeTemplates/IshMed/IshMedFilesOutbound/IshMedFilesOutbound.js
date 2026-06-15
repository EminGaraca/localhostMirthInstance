/**
  IshMedFilesOutbound
*/
importPackage(java.util);
importPackage(java.io);
importPackage(Packages.com.lowagie.text);
importPackage(Packages.com.lowagie.text.pdf);

function IshMedFilesOutbound() {
 const cfg = Util2().cfg()
 const date = Util2().date()
 const data = JSON.parse(connectorMessage.getRawData())
 const rawData = connectorMessage.getRawData()
 const http = Http()
 const tools = IshMed()

 function create() {
  const filesBase64 = $r('http_get_files_mDoc').getMessage()
  const dateTimeDefault = date.convertDate(new Date(), 'yyyyMMddHHmmss', 'Europe/Berlin')

  //$c('http_http_post_files_ishMed', cfg.configuration.base_url + cfg.configuration.path.files)
  $c('http_http_post_files_ishMed', cfg.configuration.base_url_archiv)
  $c('auth_ishmed', Util2().baseAuth(cfg.configuration.auth.ishmed.user, cfg.configuration.auth.ishmed.pass))

  const hl7 = SerializerFactory.getSerializer('HL7V2').fromXML(msh(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(evn(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(pid(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(pv1(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(txa(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(obx(filesBase64, dateTimeDefault))

//  return JSON.stringify({
//   "process": "MDM",
//   "hl7Message": hl7
//  })
	return hl7
 }

 function createAlwaysPdf() {
  const filesBase64 = $r('http_get_files_mDoc').getMessage()
  const dateTimeDefault = date.convertDate(new Date(), 'yyyyMMddHHmmss', 'Europe/Berlin')

  //$c('http_http_post_files_ishMed', cfg.configuration.base_url + cfg.configuration.path.files)
  $c('http_http_post_files_ishMed', cfg.configuration.base_url_archiv)
  $c('auth_ishmed', Util2().baseAuth(cfg.configuration.auth.ishmed.user, cfg.configuration.auth.ishmed.pass))

  var finalBase64 = transferToPdf(filesBase64);

  const hl7 = SerializerFactory.getSerializer('HL7V2').fromXML(msh(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(evn(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(pid(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(pv1(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(txa(dateTimeDefault)) + '\r' +
   SerializerFactory.getSerializer('HL7V2').fromXML(obx(finalBase64, dateTimeDefault))

//  return JSON.stringify({
//   "process": "MDM",
//   "hl7Message": hl7
//  })
	return hl7
 }

 function transferToPdf(filesBase64){
 	var filesBase64 = filesBase64.trim();
	logger.info("Received Base64 length: " + filesBase64.length);
 
	var decoder = Base64.getDecoder();
	var bytes = decoder.decode(filesBase64);
	logger.info("Decoded Byte length: " + bytes.length);
	
	// PNG magic bytes: 89 50 4E 47
	var isPNG = (bytes[0] == -119 && bytes[1] == 80 && bytes[2] == 78 && bytes[3] == 71);
	// JPG magic bytes: FF D8
	var isJPG = (bytes[0] == -1 && bytes[1] == -40);
	// PDF magic bytes: %PDF (25 50 44 46)
	var isPDF = (bytes[0] == 37 && bytes[1] == 80 && bytes[2] == 68 && bytes[3] == 70);

	logger.info("Detected file type: " + (isPNG ? "PNG" : isJPG ? "JPG" : isPDF ? "PDF" : "UNKNOWN"));

	if (isPDF) {
	    logger.info("Input is already PDF. Re-encoding to Base64...");
	    var encoder = Base64.getEncoder();
	    var outBase64 = new java.lang.String(encoder.encode(bytes));
	    logger.info("=== Done (PDF passthrough) ===");
	    return outBase64;
	}

	logger.info("Creating PDF document...");

	var outputStream = new ByteArrayOutputStream();
	var document = new Document();
	PdfWriter.getInstance(document, outputStream);
	document.open();

	try {
	    var img = Image.getInstance(bytes);
	    logger.info("Image loaded. Width=" + img.getWidth() + " Height=" + img.getHeight());
	
	    img.scaleToFit(PageSize.A4.getWidth(), PageSize.A4.getHeight());
	    document.add(img);
	    logger.info("Image added to PDF.");
	} catch (e) {
	    logger.error("Error processing image into PDF: " + e);
	    throw e;
	}
	
	document.close();

	logger.info("Encoding PDF to Base64...");
	var encoder = Base64.getEncoder();
	var pdfBytes = outputStream.toByteArray();
	var finalBase64 = new java.lang.String(encoder.encode(pdfBytes));
	
	logger.info("Output Base64 PDF length: " + finalBase64.length());
	logger.info("=== Universal Base64 → PDF Conversion Completed ===   " + finalBase64);

	return finalBase64;
	
 }

 function msh(dateTimeDefault) {
 	var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', connectorMessage.getRawData());
 	var facilitySystem = '';
	if (santeMpiJson.status == 'SENT') {
		localId = santeMpiJson.localId;
		var fs = santeMpiJson.facilitySystem.split('/');
		facilitySystem = fs[fs.length - 1];
	}
  const msh = new XML('<MSH/>')
  msh['MSH']['MSH.1'] = '|'
  msh['MSH']['MSH.2'] = '^~\\&'
  msh['MSH']['MSH.3'] = 'mdoc.connect'
  msh['MSH']['MSH.4'] = 'mdoc.one'
  //msh['MSH']['MSH.5'] = data.file.owner.externalUniqueId.split('.')[0]
  msh['MSH']['MSH.5'] = facilitySystem
  msh['MSH']['MSH.6']['MSH.6.1'] = '430'
  //msh['MSH']['MSH.6']['MSH.6.2'] = data.file.owner.externalUniqueId.split('.')[0]
  msh['MSH']['MSH.6']['MSH.6.2'] = facilitySystem
  msh['MSH']['MSH.7']['MSH.7.1'] = dateTimeDefault
  msh['MSH']['MSH.9']['MSH.9.1'] = 'MDM'
  msh['MSH']['MSH.9']['MSH.9.2'] = 'T02'
  msh['MSH']['MSH.10']['MSH.10.1'] = data.file.id
  msh['MSH']['MSH.11']['MSH.11.1'] = 'P'
  msh['MSH']['MSH.12']['MSH.12.1'] = '2.4'
  msh['MSH']['MSH.15']['MSH.15.1'] = 'NE'
  msh['MSH']['MSH.16']['MSH.16.1'] = 'NE'
  msh['MSH']['MSH.13'] = '0'
  return msh.MSH
 }

 function evn(dateTimeDefault) {
  const evn = new XML('<EVN/>')
  evn['EVN']['EVN.1'] = 'T02'
  evn['EVN']['EVN.6']['EVN.6.1'] = dateTimeDefault
  return evn.EVN
 }

 function pid(param) {
 	var lastCase = data.medicalCase ? data.medicalCase : channelMap.get('lastCase') 
 	var localId = lastCase.patient.externalId
  	var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', rawData);
	
	if (santeMpiJson.status == 'SENT') {
		localId = santeMpiJson.localId;
	}
	
  const pid = new XML('<PID/>')
  pid['PID']['PID.1'] = '1'
  pid['PID']['PID.2']['PID.2.1'] = localId // (data.file.owner.hasOwnProperty('externalId') == true && data.file.owner.externalId != null) ? data.file.owner.externalId : ''
  pid['PID']['PID.3']['PID.3.1'] = localId // (data.file.owner.hasOwnProperty('externalId') == true && data.file.owner.externalId != null) ? data.file.owner.externalId : ''
  pid['PID']['PID.5']['PID.5.1'] = (data.file.owner.hasOwnProperty('lastName') == true && data.file.owner.lastName != null) ? data.file.owner.lastName : ''
  pid['PID']['PID.5']['PID.5.2'] = (data.file.owner.hasOwnProperty('firstName') == true && data.file.owner.firstName != null) ? data.file.owner.firstName : ''
  pid['PID']['PID.7']['PID.7.1'] = data.file.owner.dob != null ? date.convertDate(new Date(Number(data.file.owner.dob + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin') : ''
  pid['PID']['PID.8']['PID.8.1'] = (data.file.owner.hasOwnProperty('gender') == true && data.file.owner.gender != null) ? data.file.owner.gender : ''
  pid['PID']['PID.18']['PID.18.1'] = (data.casePatient != null && data.casePatient.hasOwnProperty('externalId') == true && data.casePatient.externalId != null) ? data.casePatient.externalId : ''
  return pid.PID
 }

 function pv1(param) {
  const imedone = FilesUtils()
  const caseData = imedone.outbound().mdmT02(data, 'REHA', 'CGM')
  const pv1 = new XML('<PV1/>')
  pv1['PV1']['PV1.2'] = '1'
  pv1['PV1']['PV1.2']['PV1.2.1'] = 'S'
  pv1['PV1']['PV1.3']['PV1.3.5'] = (caseData.caseLocation && caseData.caseLocation.unitExternalId) ? caseData.caseLocation.unitExternalId : 'N/A';
  //pv1['PV1']['PV1.19']['PV1.19.1'] = (data.medicalCase != null && data.medicalCase.hasOwnProperty('externalId') == true && data.medicalCase.externalId != null) ? data.medicalCase.externalId : ''
  //pv1['PV1']['PV1.19']['PV1.19.1'] = '4101074555'
  pv1['PV1']['PV1.19']['PV1.19.1'] = checkField(caseData.externalId)
  pv1['PV1']['PV1.50']['PV1.50.1'] = data.file.id
  return pv1.PV1
 }

 function txa(dateTimeDefault) {
  const txa = new XML('<TXA/>')
  txa['TXA']['TXA.1'] = '1'
  txa['TXA']['TXA.2'] = 'K7'
  txa['TXA']['TXA.2']['TXA.2.2'] = (data.file && data.file.categoryName) ? data.file.categoryName : 'N/A'
  txa['TXA']['TXA.3']['TXA.3.1'] = 'pdf'
//  txa['TXA']['TXA.3']['TXA.3.1'] = String(data.file.fileName).split('.').length >= 2 ? String(data.file.fileName).split('.')[1].toLowerCase() : 'pdf'
  txa['TXA']['TXA.4']['TXA.4.1'] = dateTimeDefault
  txa['TXA']['TXA.7']['TXA.7.1'] = dateTimeDefault
  txa['TXA']['TXA.12']['TXA.12.1'] = data.file.id
  txa['TXA']['TXA.12']['TXA.12.2'] = 'm.Doc'
  txa['TXA']['TXA.12']['TXA.12.3'] = data.file.id
  txa['TXA']['TXA.16'] = data.file.fileName
  txa['TXA']['TXA.19']['TXA.19.1'] = 'PROTECTED'
  return txa.TXA
 }

 function obx(filesBase64, dateTimeDefault) {
  const obx = new XML('<OBX/>')
  obx['OBX']['OBX.1'] = '1'
  obx['OBX']['OBX.2']['OBX.2.1'] = 'ED'
  obx['OBX']['OBX.3']['OBX.3.1'] = data.file.id
  obx['OBX']['OBX.3']['OBX.3.2'] = data.file.fileName
  obx['OBX']['OBX.5']['OBX.5.1'] = data.file.id
  obx['OBX']['OBX.5']['OBX.5.2'] = 'application'
//  obx['OBX']['OBX.5']['OBX.5.3'] = String(data.file.fileName).split('.').length >= 2 ? String(data.file.fileName).split('.')[1].toLowerCase() : 'pdf'
  obx['OBX']['OBX.5']['OBX.5.3'] = 'pdf'
  obx['OBX']['OBX.5']['OBX.5.4'] = 'Base64'
  obx['OBX']['OBX.5']['OBX.5.5'] = filesBase64
  obx['OBX']['OBX.14']['OBX.14.1'] = dateTimeDefault
//  obx['OBX']['OBX.17']['OBX.17.5'] = String(data.file.fileName).split('.').length >= 2 ? String(data.file.fileName).split('.')[1].toLowerCase() : 'pdf'
  obx['OBX']['OBX.17']['OBX.17.5'] = 'pdf'
  return obx.OBX
 }

 //  function outbound() {
 //    const filesBase64 = $r('http_get_files_mDoc').getMessage()
 //    const dateTimeDefault = convertDate(new Date(), 'yyyyMMddHHmmss', 'Europe/Berlin')
 //
 //    $c('http_http_post_files_ishMed', cfg.configuration.base_url + cfg.configuration.path.appointment)
 //    $c('auth_ishmed', tools.auth())
 //
 //    if (String(filesBase64).length == 0) 
 //    	return common_handlingLogMessage('Response of Files not found! For this flow is requeired the file in base64.', 'error')
 //
 //    tmp['MSH']['MSH.1'] = '|'
 //    tmp['MSH']['MSH.2'] = '^~\\&'
 //    tmp['MSH']['MSH.3'] = 'mdoc.connect'
 //    tmp['MSH']['MSH.4'] = 'mdoc'
 //    tmp['MSH']['MSH.5'] = data.hasOwnProperty('receivedApplication') == true ? data.receivedApplication : 'kis'
 //    tmp['MSH']['MSH.6']['MSH.6.1'] = '100'//data.hasOwnProperty('ReceivedFacility') == true ? data.ReceivedFacility : 'kis'
 //    tmp['MSH']['MSH.6']['MSH.6.2'] = 'STEI'
 //    tmp['MSH']['MSH.7']['MSH.7.1'] = dateTimeDefault
 //    tmp['MSH']['MSH.9']['MSH.9.1'] = 'MDM'
 //    tmp['MSH']['MSH.9']['MSH.9.2'] = 'T02'
 //    tmp['MSH']['MSH.10']['MSH.10.1'] = data.id
 //    tmp['MSH']['MSH.11']['MSH.11.1'] = 'P'
 //    tmp['MSH']['MSH.12']['MSH.12.1'] = '2.4'
 //    tmp['MSH']['MSH.15']['MSH.15.1'] = 'NE'
 //    tmp['MSH']['MSH.16']['MSH.16.1'] = 'NE'
 //    tmp['MSH']['MSH.13'] = '0'
 //
 //    tmp['EVN']['EVN.1'] = 'T02'
 //    tmp['EVN']['EVN.6']['EVN.6.1'] = dateTimeDefault
 //
 //    tmp['PID']['PID.1'] = '1'
 //    tmp['PID']['PID.2']['PID.2.1'] = (data.user.hasOwnProperty('externalId') == true && data.user.externalId != null) ? data.user.externalId : ''
 //    tmp['PID']['PID.3']['PID.3.1'] = (data.user.hasOwnProperty('externalId') == true && data.user.externalId != null) ? data.user.externalId : ''
 //    tmp['PID']['PID.5']['PID.5.1'] = (data.user.hasOwnProperty('lastName') == true && data.user.lastName != null) ? data.user.lastName : ''
 //    tmp['PID']['PID.5']['PID.5.2'] = (data.user.hasOwnProperty('firstName') == true && data.user.firstName != null) ? data.user.firstName : ''
 //    tmp['PID']['PID.7']['PID.7.1'] = convertDate(new Date(Number(data.user.dob + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin')
 //    tmp['PID']['PID.8']['PID.8.1'] = (data.user.hasOwnProperty('gender') == true && data.user.gender != null) ? data.user.gender : ''
 //    tmp['PID']['PID.18']['PID.18.1'] = (data.casePatient != null && data.casePatient.hasOwnProperty('externalId') == true && data.casePatient.externalId != null) ? data.casePatient.externalId : ''
 //
 //    tmp['PV1']['PV1.2'] = '1'
 //    tmp['PV1']['PV1.2']['PV1.2.1'] = 'S'
 //    tmp['PV1']['PV1.3']['PV1.3.1'] = (data.casePatient != null && data.casePatient.hasOwnProperty('pointOfCare') == true && data.casePatient.pointOfCare != null) ? data.casePatient.pointOfCare : ''
 //    tmp['PV1']['PV1.3']['PV1.3.2'] = (data.casePatient != null && data.casePatient.hasOwnProperty('room') == true && data.casePatient.room != null) ? data.casePatient.room : ''
 //    tmp['PV1']['PV1.3']['PV1.3.3'] = (data.casePatient != null && data.casePatient.hasOwnProperty('bed') == true && data.casePatient.bed != null) ? data.casePatient.bed : ''
 //    tmp['PV1']['PV1.3']['PV1.3.4'] = (data.casePatient != null && data.casePatient.hasOwnProperty('facility') == true && data.casePatient.facility != null) ? data.casePatient.facility : ''
 //    tmp['PV1']['PV1.3']['PV1.3.7'] = (data.casePatient != null && data.casePatient.hasOwnProperty('building') == true && data.casePatient.building != null) ? data.casePatient.building : ''
 //    tmp['PV1']['PV1.19']['PV1.19.1'] = (data.casePatient != null && data.casePatient.hasOwnProperty('externalId') == true && data.casePatient.externalId != null) ? data.casePatient.externalId : ''
 //    tmp['PV1']['PV1.44']['PV1.44.1'] = (data.hasOwnProperty('start') == true && data.start != null) ? convertDate(data.start, patterns[28], 'Europe/Berlin') : ''
 //    tmp['PV1']['PV1.45']['PV1.45.1'] = (data.hasOwnProperty('end') == true && data.end != null) ? convertDate(data.end, patterns[28], 'Europe/Berlin') : ''
 //    tmp['PV1']['PV1.50']['PV1.50.1'] = data.hasOwnProperty('id') == true ? data.id : ''
 //
 //    tmp['TXA']['TXA.1'] = '1'
 //    tmp['TXA']['TXA.2'] = 'K7'
 //    tmp['TXA']['TXA.3']['TXA.3.1'] = String(data.fileName).split('.').length >= 2 ? String(data.fileName).split('.')[1].toLowerCase() : 'pdf'
 //    tmp['TXA']['TXA.4']['TXA.4.1'] = dateTimeDefault
 //    tmp['TXA']['TXA.7']['TXA.7.1'] = dateTimeDefault
 //    tmp['TXA']['TXA.12']['TXA.12.1'] = data.id
 //    tmp['TXA']['TXA.12']['TXA.12.2'] = 'm.Doc'
 //    tmp['TXA']['TXA.12']['TXA.12.3'] = data.id
 //    tmp['TXA']['TXA.16'] = data.fileName
 //    tmp['TXA']['TXA.19']['TXA.19.1'] = 'PROTECTED'
 //
 //    tmp['OBX']['OBX.1'] = '1'
 //    tmp['OBX']['OBX.2']['OBX.2.1'] = 'ED'
 //    tmp['OBX']['OBX.3']['OBX.3.1'] = data.id
 //    tmp['OBX']['OBX.3']['OBX.3.2'] = data.fileName
 //    tmp['OBX']['OBX.5']['OBX.5.1'] = data.id
 //    tmp['OBX']['OBX.5']['OBX.5.2'] = 'application'
 //    tmp['OBX']['OBX.5']['OBX.5.3'] = String(data.fileName).split('.').length >= 2 ? String(data.fileName).split('.')[1].toLowerCase() : 'pdf'
 //    tmp['OBX']['OBX.5']['OBX.5.4'] = 'Base64'
 //    tmp['OBX']['OBX.5']['OBX.5.5'] = filesBase64
 //    tmp['OBX']['OBX.14']['OBX.14.1'] = dateTimeDefault
 //    tmp['OBX']['OBX.17']['OBX.17.5'] = String(data.fileName).split('.').length >= 2 ? String(data.fileName).split('.')[1].toLowerCase() : 'pdf'
 //
 //    return tmp
 //  }

 function getFilesBase64() {
  return http.getFilesBase64(data.file.id)
 }

 function checkField(value) {
     if (value != undefined && value != null && value != '' && value != 0) return value
   
     return ''
 }

 function source() {
  $c('patientid', data.file.owner.externalUniqueId)
  $c('fileid', data.file.id)
 }

 return {
  create: create,
  createAlwaysPdf: createAlwaysPdf,
  getFilesBase64: getFilesBase64,
  source: source
 }
}
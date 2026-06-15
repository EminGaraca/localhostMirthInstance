/**
	HL7-A08-Outbound after patient consent

	@param {String} arg1 - arg1 description
	@return {String} return description
*/
/**
  Services files outbound
*/
	function HL7ConsentOutbound() {

		const log = CommonLogger()
		
		const data = JSON.parse(connectorMessage.getTransformedData());
		const connector = String(connectorMessage.getConnectorName());
		
		const actdate = CommonDate().actualDate()
		const actdate365 = CommonDate().addDaysToTimestamp(actdate, 365)


	 function createMessage() {

		const obj = {};

	     obj.timestamp = CommonDate().getMillisWithTimeZone(actdate, 'Europe/Berlin')
		obj.messageControlId = CommonDate().getMillis(new Date()) - 1523015158243
	
	
	     //MSH segment
	     var msh = 'MSH|^~\&|MDOC|MDOC|KIS|KIS|' + actdate + '||ADT^A08^ADT_A08|' + obj.messageControlId + '|' + obj.timestamp + '|2.5|NE|NE||8859/1'
	  
	     //EVN segment 
	     var env = 'EVN|A08|||||' + obj.timestamp  
	      
	    //PID segment
		obj.externalPatientId = data.patient.externalId
	     obj.firstName = data.patient.firstName
	     obj.lastName = data.patient.lastName
	     obj.birthDate = CommonDate().millisecToYYYYMMDD(data.patient.dob)
	     obj.sex = data.patient.gender
	     
	
	     var pid = 'PID|1|' + obj.externalPatientId + '|' + obj.externalPatientId + '||' + obj.lastName + '^' + obj.firstName + '||' + obj.birthDate + '|' + obj.sex + '||||||||||'

	     //PV1 segment

	     obj.patientClass = "O";  
		obj.assignedPatientLocation = data.medicalCase.caseLocation ? data.medicalCase.caseLocation.id : "";
		obj.admissionType = "R"; 
		obj.preadmitNumber = data.medicalCase.externalId;
		obj.visitNumber = data.medicalCase.id;
		obj.admitDateTime = CommonDate().millisecToYYYYMMDD(data.medicalCase.start);
		obj.externalUniqueId = data.medicalCase.externalUniqueId;
		var index = obj.externalUniqueId.lastIndexOf(".");
		obj.assignedPatientLocation = data.medicalCase.caseLocation.unitExternalId; 

	     var pv1 = 'PV1|1|' + obj.patientClass + '|' + obj.assignedPatientLocation + '||||||||||||||||' + obj.preadmitNumber + '|||||||||||||||||||||||||' + obj.admitDateTime;
	
	    //CON segment
	     var con = 'CON|001|Y|' + actdate.slice(0,8) + '|' + actdate365.slice(0,8) + '|Patient consented to treatment|'
	  
	     var hl7Message = msh + '\n' + env + '\n' + pid + '\n' + pv1 + '\n' + con
	 
	    
	    $c('Message Payload', JSON.stringify(obj))
	    $c('HL7Message', hl7Message)
	
	   
	    return hl7Message
	}

	function filterMissingID() {
		
		if ((data.patient.externalId.length > 0) || data.patient.externalId != "") {
    			return true;
		} else { 
			$c('Error', 'Missing externalIdentifyer')
		     return false
		}
	}

	return {
      createMessage: createMessage,
      filterMissingID:filterMissingID
    }
	
  }

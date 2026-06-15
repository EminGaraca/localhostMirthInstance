/**
  Appointment inboound and outbound
  @author Jhonata Rebouças
  @author Anderson Araujo
*/
function IshMedAppointment() {
  const cfg = Util2().cfg()
  const http = Http()

  channelMap.put('timeout', cfg.configuration.timeout)
  channelMap.put('contentType', cfg.configuration.contentType)

  function inbound() {
    const appointment = Hl7v2().inbound()
    const data = new XML(connectorMessage.getTransformedData())

    const msgCode = String(data['MSH']['MSH.9']['MSH.9.1'])
    const msgEvent = String(data['MSH']['MSH.9']['MSH.9.2'])

    function resp() {
      responseStatus = SENT
    }

    function metadaAppointment() {
    	$c('appointment_id', String(data.SCH['SCH.2']['SCH.2.1']).trim())
    	$c('case_id', String(data.PV1['PV1.19']['PV1.19.1']).trim())
    }

    function source() {
      const orbis = IshMed()
      const appointmentAllowedToCreate = ['S12', 'S13', 'S14', 'S22']
      metadaAppointment(data)

      if (msgCode == 'SIU' && msgEvent == 'S15')
        return destinationSet.removeAlexternalCaseIdlExcept(['http_unblock_appointment_mdoc', 'http_cancel_appointment_mdoc'])

      if (msgCode == 'SIU' && msgEvent == 'S17')
        return destinationSet.removeAllExcept(['http_unblock_appointment_mdoc', 'http_delete_appointment_mdoc'])

      if (msgCode == 'SIU' && appointmentAllowedToCreate.includes(msgEvent)) {
       // Prüfe ob AIS-Segment vorhanden ist
       var hasAisSegment = false;
       try {
         hasAisSegment = String(data['AIS']['AIS.1']['AIS.1.1']).length > 0;
      } catch(e) {
         hasAisSegment = false;
       }
  
       if (hasAisSegment) {
         // AIS vorhanden → Content Package zuweisen, KEINEN Termin erstellen
         logger.info('AIS segment detected - routing to Content Package assignment');
         return destinationSet.removeAllExcept(['http_assign_content_package_mdoc'])
       }
       // Kein AIS → normaler Termin-Flow
       return destinationSet.removeAllExcept(['http_block_appointment_mdoc', 'http_createOrUpdate_appointment_mdoc'])
     }

      if (msgCode == 'SIU' && msgEvent == 'S23')
        return destinationSet.removeAllExcept(['http_block_appointment_mdoc'])

      if (msgCode == 'SIU' && msgEvent == 'S24')
        return destinationSet.removeAllExcept(['http_unblock_appointment_mdoc'])

      channelMap.put('Message warning', 'Event Message ' + msgEvent + ' not autorization. Please check method "orbis_appointment_source_transformer"')

      return destinationSet.removeAll()
    }

    function metadata() {
      channelMap.put('appointmentId', JSON.parse(connectorMessage.getRawData()).appointmentId)
      channelMap.put('caseId', JSON.parse(connectorMessage.getRawData()).caseId)
    }

    /**
      @desc SIU-S15: To cancel an appointment in the Portal side
      @author Anderson Araujo
    */
    function siu15() {
      return appointment.siu15(String(data['SCH']['SCH.2']['SCH.2.1']).trim())
    }

    /**
      @desc SIU-S17: To delete an appointment in the Portal side
      @author Anderson Araujo
    */
    function siu17() {
      return appointment.siu17(String(data['SCH']['SCH.2']['SCH.2.1']).trim())
    }

    /**
      @desc SIU-S12: To create an appointment in the Portal side
      @author Anderson Araujo
    */
    function siu12() {
      return http.appointmentV2(null, appointment.siu12(data))
    }

    /**
      @desc SIU-S22: To block slot in the Portal side
      @author Anderson Araujo
    */
    function siu23OrSiu24() {
      return http.createBlockedOrUnblocked(null, appointment.siu23OrSiu24(data))
    }

    /**
  @desc SIU mit AIS-Segment: Content Package zuweisen statt Termin erstellen
  */
  function assignContentPackage() {
    // 1. SanteMPI-Patienten-Auflösung
    var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', connectorMessage.getRawData());
    var patientExternalId = '';
  
    if (santeMpiJson.status == 'SENT') {
      patientExternalId = santeMpiJson.clinicPrefix + '.' + santeMpiJson.masterId;
    } else {
      // Fallback: PID.3.1 verwenden
      patientExternalId = String(data['PID']['PID.3'][0]['PID.3.1']).trim();
      logger.warn('SanteMPI resolution failed, using PID.3.1: ' + patientExternalId);
   }

    // 2. Content-Package-ID aus AIS.3.4 extrahieren
    var packageExternalId = String(data['AIS']['AIS.3']['AIS.3.4']).trim();
    logger.info('Content Package assignment - Patient: ' + patientExternalId + ', Package: ' + packageExternalId);
  
    // 3. URL setzen und Body zurückgeben
    return http.assignContentPackage(patientExternalId, packageExternalId);
  }

    return {
      source: source,
      metadata: metadata,
      siu12: siu12,
      siu15: siu15,
      siu17: siu17,
      siu23OrSiu24: siu23OrSiu24,
      assignContentPackage: assignContentPackage,
      resp: resp
    }
  }

  /**
   All outbound source is below
   */

  function outbound() {
    const appointment = Hl7v2().outbound()

    /**
     Filter the last case
     @author Jhonata Rebouças
     */
    function lastCase() {
      var cases = JSON.parse(responseMap.get("http_get_cases_mdoc").getMessage())
      var last = 0
      var resp = {}

      cases.forEach(e => {
        if (e.hasOwnProperty("start") && e.externalUniqueId != null && e.start > last) {
          resp = e;
          last = e.start;
        }
      })
      return resp;
    }

    function source() {
	    if (String(connectorMessage.getRawData()).length <= 2) {
	      $c('Warnng', 'Message dont have content')
	      return destinationSet.removeAll()
	    }
	
	    const data = JSON.parse(connectorMessage.getRawData());
	    logger.info("DATAL " + data);
		logger.info("DATAL2 " + data.title);
		if(data.patients && data.patients.length > 0 && data.patients[0] && data.patients[0].externalId && data.patients[0].externalId.trim() !== ''){
			logger.info("prvi if ");
			return destinationSet.remove("tcp_create_appointment_without_externalId");
		}
		else{
			logger.info("else ");
			return destinationSet.removeAllExcept(['tcp_create_appointment_without_externalId'])
		}
	
    }

    /**
         Identify the message trigger
         @author Jhonata Rebouças
    */
    function triggerType() {
      var data = JSON.parse(connectorMessage.getRawData())
      if (data.externalId == null) {
        return 'create'
      }
      else if (data.externalId != null && data.status != 'CANCELED') {
        return 'update'
      }
      else if (data.status == 'CANCELED') {
        return 'cancel'
      }
      else {
        return null
      }
    }

    /**
         Get cases
         @author Jhonata Rebouças
    */
    function getCases() {
      var data = JSON.parse(connectorMessage.getRawData())
      return http.getCaseUserV2('/' + data.patients[0].externalUniqueId)
    }

    function getCasesV2() {
   	 return http.getCaseUserV2('/' + data.file.owner.externalUniqueId)
    }

    /**
      Create appointment outbound
      @author Jhonata Rebouças
      @author Anderson Araujo
    */
    function siu() {
      var data = JSON.parse(connectorMessage.getRawData())
      var cases = {}
      cases = lastCase()
      data.medicalCase = cases

      if (triggerType() != null) {
        var trigger = triggerType() == 'create' ? 'S12' : (triggerType() == 'update' ? 'S14' : 'S15')
      }
      var externalIdPrefix = "";

      var siu = new XML(SerializerFactory.getSerializer('HL7V2').toXML(appointment.siu(data, 'ORBIS', 'mDoc', trigger, triggerType())))

      return SerializerFactory.getSerializer('HL7V2').fromXML(siu);
    }

    /**
      Create appointment outbound without externalId
      @author Amar Kvakic
      @author Amar Kvakic
    */
    function siuWithoutExternalId() {
      var data = JSON.parse(connectorMessage.getRawData())
//      var cases = {}
//      cases = lastCase()
//      data.medicalCase = cases

      if (triggerType() != null) {
        var trigger = triggerType() == 'create' ? 'S12' : (triggerType() == 'update' ? 'S14' : 'S15')
      }
      var siu = new XML(SerializerFactory.getSerializer('HL7V2').toXML(appointment.siuWithoutExternalId(data, 'Orbis', 'mDoc', trigger, triggerType())))

      return SerializerFactory.getSerializer('HL7V2').fromXML(siu);
    }

    function outcome() {
      const resp = new XML(SerializerFactory.getSerializer('HL7V2').toXML(response.getMessage()))
      var externalId = {}
      if (String(resp['MSA']['MSA.1']['MSA.1.1']) == "AA") {
        externalId.appointmentId = resp['MSA']['MSA.4']['MSA.4.1']
        return externalId
      } else {
        externalId.status = 500
        return externalId
      }
    }

    return {
      getCases: getCases,
      getCasesV2:getCasesV2,
      siu: siu,
      outcome: outcome,
      source: source,
      siuWithoutExternalId: siuWithoutExternalId
    }
  }

  return {
    outbound: outbound,
    inbound: inbound
  }
}
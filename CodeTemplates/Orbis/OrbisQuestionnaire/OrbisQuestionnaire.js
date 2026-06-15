/**
  This method is to all questionnaire inbound or outbound

  @author Anderson Araujo
  @version 0.0.1
  @since 2/10/2023
*/

function OrbisQuestionnaire() {
    const hl7 = Hl7v2()
    const http = Http()

    function inbound() {
        var data = new XML(connectorMessage.getTransformedData())

        data.PV1['PV1.3']['PV1.3.4'] = String(data.MSH['MSH.4']['MSH.4.1'])

        function source() {
        	if (data.MSH['MSH.9']['MSH.9.1'] == 'ORM' && data.MSH['MSH.9']['MSH.9.2'] == 'O01'){
        		if (data.OBR['OBR.4']['OBR.4.1'] == 'mediaFile') {
        			return destinationSet.removeAllExcept(['http_assign_healthmedia'])
        		} 
        		else if (data.OBR['OBR.4']['OBR.4.1'] == 'contentPackage') {
        			return destinationSet.removeAllExcept(['http_assign_content_package'])
        		} else {
        			return destinationSet.removeAllExcept(['http_assign_questionnaire'])		
        		}
        	}
        	return destinationSet.removeAllExcept(['http_assign_questionnaire'])

        	return destinationSet.removeAll()
        }

        function getUser() {
            return http.getUser('?externalId=' + String(data.PID['PID.3']['PID.3.1']))
        }

        function getCase() {
            return http.getCase('?externalId=' + String(data.PV1['PV1.19']['PV1.19.1']))
        }

        function getFiles() {
            return http.getFiles('?externalId=' + String(data.PV1['PV1.19']['PV1.19.1']))
        }

        function postFiles() {
            return http.postQuestionnaire(hl7.createFiles(data))
        }

        function getPollByParentId() {
            return http.getPoll('?externalTemplateId=' + String(data.OBR['OBR.4']['OBR.4.1']) + '&parentId=' + JSON.parse($r('http_get_user_mDoc').getMessage()).response.parentId + '' + '&page=0&size=1&sort=string')
        }

        function getPoll() {
            return http.getPoll('?externalId=' + String(data.OBR['OBR.4']['OBR.4.1']))
        }

        function createQuestionnaireAssign() {
            return http.createAssignV2(null, hl7.inbound().ormO01(data))
        }

        function createHealthmediaAssign() {
            return http.createAssignHealthmediaV2(null, hl7.inbound().ormO01Healthmedia(data))
        }

        function createContentPackageAssign() {
        	  var dto = hl7.inbound().ormO01ContentPackage(data)
            return http.createAssignContentPackage("/" + dto.contentPackageExternalId + "/assign" , hl7.inbound().ormO01ContentPackage(data))
        }

        return {
            getUser: getUser,
            getCase: getCase,
            getFiles: getFiles,
            postFiles: postFiles,
            getPollByParentId: getPollByParentId,
            getPoll: getPoll,
            source: source,
            createQuestionnaireAssign: createQuestionnaireAssign,
            createHealthmediaAssign: createHealthmediaAssign,
            createContentPackageAssign: createContentPackageAssign
        }
    }

    function outbound() {
        const data = JSON.parse(connectorMessage.getRawData())

        function getCases() {
            return http.getCaseUserV2('/' + data.person.externalUniqueId)
        }

        function getFilesBase64() {
            return hl7.getFilesBase64(data)
        }

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

        function Oldoru() {
            var cases = {}
            cases = lastCase()
            data.medicalCase = cases
            var oru = new XML(SerializerFactory.getSerializer('HL7V2').toXML(hl7.outbound().oru(data, 'Orbis', 'mDoc', 'R01')))

            return SerializerFactory.getSerializer('HL7V2').fromXML(oru);
        }

        function oru() {
            var cases = {}
            cases = lastCase()
            data.medicalCase = cases
            var oruHL7 = hl7.outbound().oru(data, 'Orbis', 'mDoc', 'R01')
            return oruHL7;
//            logger.info("ORUIII: " + oruHL7)
//            var oru = new XML(SerializerFactory.getSerializer('HL7V2').toXML(oruHL7))
// 			logger.info("ORUIIV: " + oru)
//            return SerializerFactory.getSerializer('HL7V2').fromXML(oru);
        }

        return {
            getCases: getCases,
            getFilesBase64: getFilesBase64,
            oru: oru,
            outcome: outcome
        }


    }

    return {
        inbound: inbound,
        outbound: outbound
    }
}
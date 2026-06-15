
function OrbisFieldsMandatory() {
 function inbound() { }

 function outbound() {
  const obj = JSON.parse(connectorMessage.getRawData())

  function validfildMandatoryMdmT02() {
   const mandatory = ['externalId']

   for (var index = 0; index < mandatory.length; index++) {
    const element = mandatory[index]

    if (obj.medicalCase == null || obj.medicalCase.hasOwnProperty(element) == false || obj.medicalCase[element] == null) {
    	destinationSet.removeAll()
    	
     return JSON.stringify({
      "code": 400,
      "text": "HIS does not allow sharing without Encounter Context"
     })
    } else {
     return connectorMessage.getRawData()
    }
   }
  }

  function validfildsQuestionnaire() {
   const mandatory = ['externalId']

   for (var index = 0; index < mandatory.length; index++) {
    const element = mandatory[index]

    if (obj.medicalCase == null || obj.medicalCase.hasOwnProperty(element) == false || obj.medicalCase[element] == null) {
    	destinationSet.removeAll()
    	
     return JSON.stringify({
      "code": 400,
      "text": "HIS does not allow sharing without Encounter Context"
     })
    } else {
     return connectorMessage.getRawData()
    }
   }
  }
  return {
  	validfildMandatoryMdmT02: validfildMandatoryMdmT02,
  	validfildsQuestionnaire: validfildsQuestionnaire
  }
 }

 return {
  inbound: inbound,
  outbound: outbound
 }
}

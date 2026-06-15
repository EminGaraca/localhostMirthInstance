/**
  Questionnaire Outbound

  @author Anderson Araujo
  @version 0.0.1
  @since 2/10/2023
*/

function OrbisQuestionnaireOutbound() {
  const data = JSON.parse(connectorMessage.getRawData())
  const connector = String(connectorMessage.getConnectorName())
  const cfg = common_environment()
  const mdoc = common_environment('base')
  const http = common_http_request_mDoc()

  function getUser(param) {
    var caseValue = param == undefined ? data.patientExternalId : param
    return http.getUser('?externalId=' + caseValue)
  }

  function answer() {
    const dateCreate = convertDate(new Date(Number(data.creationDate + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin')
    const dateTimeDefault = convertDate(new Date(), 'yyyyMMddHHmmss', 'Europe/Berlin')
    const respUSer = JSON.parse($r('http_get_user_mDoc').getMessage())

    tmp['MSH']['MSH.3']['MSH.3.1'] = 'mdoc.one'
    tmp['MSH']['MSH.4']['MSH.4.1'] = 'mdoc.one'
    tmp['MSH']['MSH.5']['MSH.5.1'] = cfg.configuration.application
    tmp['MSH']['MSH.6']['MSH.6.1'] = cfg.configuration.facility
    tmp['MSH']['MSH.7']['MSH.7.1'] = dateTimeDefault
    tmp['MSH']['MSH.9']['MSH.9.1'] = 'ORU'
    tmp['MSH']['MSH.9']['MSH.9.2'] = 'R01'
    tmp['MSH']['MSH.10']['MSH.10.1'] = data.pollExternalId
    tmp['MSH']['MSH.11']['MSH.11.1'] = 'P'
    tmp['MSH']['MSH.12']['MSH.12.1'] = '2.5'
    tmp['MSH']['MSH.13']['MSH.13.1'] = '0'

    tmp['PID']['PID.2']['PID.2.1'] = respUSer.response.externalId
    tmp['PID']['PID.3']['PID.3.1'] = respUSer.response.externalId
    tmp['PID']['PID.5']['PID.5.1'] = respUSer.response.lastName
    tmp['PID']['PID.5']['PID.5.2'] = respUSer.response.firstName
    tmp['PID']['PID.7']['PID.7.1'] = convertDate(new Date(Number(respUSer.response.dob + '000')), 'yyyyMMddHHmmss', 'Europe/Berlin')
    tmp['PID']['PID.8']['PID.8.1'] = respUSer.response.gender
    tmp['PID']['PID.18']['PID.18.1'] = data.caseUniqueIdentifier

    tmp['PV1']['PV1.2']['PV1.2.1'] = 'O'
    tmp['PV1']['PV1.19']['PV1.19.1'] = data.caseUniqueIdentifier

    tmp['ORC']['ORC.2']['ORC.2.1'] = data.pollExternalId
    tmp['ORC']['ORC.3']['ORC.3.1'] = data.pollExternalUniqueId
    tmp['ORC']['ORC.3']['ORC.3.3'] = data.pollId
    tmp['ORC']['ORC.5']['ORC.5.1'] = 'CM'

    tmp['OBR']['OBR.2']['OBR.2.1'] = data.caseUniqueIdentifier
    tmp['OBR']['OBR.3']['OBR.3.1'] = data.pollExternalUniqueId
    tmp['OBR']['OBR.3']['OBR.3.3'] = data.pollExternalTemplateId == null ? data.pollId : ata.pollExternalTemplateId
    tmp['OBR']['OBR.7']['OBR.7.1'] = dateCreate
    tmp['OBR']['OBR.25']['OBR.25.1'] = 'F'

    var qty = 0

    for (var s in data.items) {
      var section = data.items[s]

      for (var i in section.items) {
        var item = section.items[i]

        for (var a in item.answerOptions) {
          var answerOptions = item.answerOptions[a]
          var obx = <OBX />;

          obx["OBX.1"]["OBX.1.1"] = (qty + 1)
          obx["OBX.2"]["OBX.2.1"] = 'ST'

          if (item.itemType == 'CHECKBOX') {
            if (answerOptions.answerValue == '1') {
              obx["OBX.3"]["OBX.3.1"] = String(answerOptions.value)
              obx["OBX.5"]["OBX.5.1"] = String(answerOptions.answerValue)
            } else {
              continue
            }
          } else if (item.itemType == 'RADIO' || item.itemType == 'DROPDOWN') {
            if (answerOptions.answerValue == '1') {
              obx["OBX.3"]["OBX.3.1"] = String(answerOptions.value)
              obx["OBX.5"]["OBX.5.1"] = String(answerOptions.answerValue)
            } else {
              continue
            }
          } else if (item.itemType == 'TEXT' || item.itemType == 'DECIMAL' || item.itemType == 'DATE' || item.itemType == 'TIME' || item.itemType == 'TEXT_AREA') {
            obx["OBX.3"]["OBX.3.1"] = answerOptions.value
            obx["OBX.5"]["OBX.5.1"] = answerOptions.answerDescription
          }

          obx["OBX.11"]["OBX.11.1"] = 'F'
          obx["OBX.14"]["OBX.14.1"] = dateCreate
          obx["OBX.16"]["OBX.16.1"] = respUSer.response.externalId
          obx["OBX.16"]["OBX.16.2"] = respUSer.response.lastName
          obx["OBX.16"]["OBX.16.3"] = respUSer.response.firstName
          obx["OBX.16"]["OBX.16.7"] = 'Dr.'

          tmp.appendChild(obx)
          qty = qty + 1
        }
      }
    }
    return tmp
  }

  return {
    answer: answer,
    getUser: getUser
  }
}
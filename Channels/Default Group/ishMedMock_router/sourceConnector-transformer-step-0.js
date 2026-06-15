const path = sourceMap.get('uri').toString()
const data = JSON.parse(connectorMessage.getRawData())

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_RECEIVE_CONSENT&loglevel=1&lang=EN')
  return destinationSet.removeAllExcept('ishMed_consent')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_GET_FREE_SLOT_APP&loglevel=1&lang=EN')
  return destinationSet.removeAllExcept('ishMed_freeSlot')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_RECEIVE_MDM&loglevel=1&lang=EN')
  return destinationSet.removeAllExcept('ishMed_files')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_CREATE_APPOINTMENT&loglevel=1&lang=EN' && data.status.toLowerCase() == 'canceled')
  return destinationSet.removeAllExcept('ishMed_cancelAppointment')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_CREATE_APPOINTMENT&loglevel=1&lang=EN' && data.hasOwnProperty('externalId') == false)
  return destinationSet.removeAllExcept('ishMed_createAppointment')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_CREATE_APPOINTMENT&loglevel=1&lang=EN' && data.hasOwnProperty('externalId') == true)
  return destinationSet.removeAllExcept('ishMed_updateAppointment')

if (path == '/sap/ishmed/mci/http_resp?sap-client=110&process=ZMDOC_QUEST_RESPONSE&loglevel=1&lang=EN')
  return destinationSet.removeAllExcept('ishMed_questionnaireReply')

throw new Error('Destination not found to the path '+path+'')
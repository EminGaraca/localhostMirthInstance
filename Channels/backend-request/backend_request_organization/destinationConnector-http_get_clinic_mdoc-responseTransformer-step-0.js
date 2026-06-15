CommonBackend().organization().getClinicalByExternalIdResponse()

//function organization() {
// const data = JSON.parse(connectorMessage.getRawData())
//
// function getClinicalByExternalIdResponse() {
//  const resp = JSON.parse(response.getMessage())
//
//  channelMap.put('department', true)
//
//  if (resp.hasOwnProperty('unitChildren') && resp.unitChildren.length >= 1) {
//   channelMap.put('clinic_internal_uuid', resp.id)
//   
//   for (var index in resp.unitChildren) {
//    var department = resp.unitChildren[index]
//
//    if (department.name == data.FachbereichDescr) {
//     channelMap.put('department', false)
//
//     if (department.externalId == null || department.externalId != data.FachbereichCode) {
//      channelMap.put('updateExternalIdd', true)
//      channelMap.put('internal_id_department', department.id)
//      return
//     } else {
//      channelMap.put('updateExternalIdd', false)
//      return
//     }
//    }
//   }
//  }
// }
//
// return {
//  getClinicalByExternalIdResponse: getClinicalByExternalIdResponse
// }
//}
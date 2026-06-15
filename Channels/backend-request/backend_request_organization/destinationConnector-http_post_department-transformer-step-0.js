msg = CommonBackend().organization().createDepartment()
//
//function organization() {
//  const data = JSON.parse(connectorMessage.getRawData())
//
//  function createDepartment() {
//  	connectorMap.put('url',data.url)
//  	
//  	const obj = {}
//  	obj.externalId = data.FachbereichCode
//  	obj.description = null
//  	obj.name = data.FachbereichDescr
//  	obj.category = "DEPARTMENT"
//  	obj.parentId = $('clinic_internal_uuid')
//  	return JSON.stringify(obj)
//  }
//
//  return {
//    createDepartment: createDepartment
//  }
//}
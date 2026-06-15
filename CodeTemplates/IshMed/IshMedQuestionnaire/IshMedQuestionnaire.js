/**
  IshMedQuestionnaire
*/
function IshMedQuestionnaire() {
 const http = Http()
 const data = JSON.parse(connectorMessage.getRawData())
 const cfg = Util2().cfg()

 $c('timeout', cfg.configuration.timeout)
 $c('contentType', cfg.configuration.responseContentType)

 function inbound() { }

 function outbound() {
  function getUser() {
   return http.getCaseUserV2('/' + data.person.externalUniqueId)
  }

  function reply() {
   const obj = {}
   const casePatient = JSON.parse($r('http_get_user_mdoc').getMessage())[0]
   const tools = IshMed()
   const section = {}

   for (var sec in data.sections) {
     section[data.sections[sec].sectionId] = data.sections[sec].label
   }

   $c('url_http_post_questionnaire_outbound_ishMed', cfg.configuration.base_url + cfg.configuration.path.questionnaire)
   $c('auth_ishmed', Util2().baseAuth(cfg.configuration.auth.ishmed.user, cfg.configuration.auth.ishmed.pass))

   /*
     Header
   */
   obj.clinicId = '0001' //change to get on configuration map this information
   obj.externalPatientId = casePatient.patient.externalId
   obj.questionnaireExternalId = data.externalQuestionnaireId
   obj.name = data.title
   obj.description = null
   obj.caseId = casePatient.externalId
   obj.departmentId = null
   obj.answeringDate = data.creationDate
   obj.items = []

   for (var a in data.components) {
    var component = data.components[a]

    if (['myquestionnaireheader', 'panel', 'myquestionnairefooter'].indexOf(component.componentType) != -1)
     continue

    /*
      Header of Component
    */
    var item = {}
    item.itemId = component.sectionId
    item.name = section[component.sectionId]
    item.type = typeOutbound(component.componentType)
    item.item = []

    /*
      Component
    */
    var items = {}
    items.itemId = component.externalId
    items.name = component.text
    items.type = typeOutbound(component.componentType)
    items.answers = []
    items.items = []

     for (var i in component.answerOptions) {
      var answer = component.answerOptions[i]
      var answerOptions = {}
      answerOptions.itemId = answer.externalId
      answerOptions.name = answer.value
      answerOptions.answers = answer.answerValue
      
      items.answers.push(answer.value)
      items.items.push(answerOptions)
     }
     item.item.push(items)
     obj.items.push(item)
   }
   return JSON.stringify(obj)
  }

  return {
   reply: reply,
   getUser: getUser
  }
 }

 function createTemplate() {
  /*
  Header of message
*/
  const obj = {}
  obj.externalId = data.externalId
  obj.title = data.title
  obj.creationDate = data.date
  obj.language = data.language.toUpperCase()
  obj.sections = []
  obj.components = []
  /*
  Creating the section
*/
  for (var a in data.item) {
   var section = data.item[a
   ]

   if (section.type == 'label' || section.type == '') continue

   var createSection = {}
   createSection.index = Number(a)
   createSection.sectionId = section.itemId
   createSection.label = section.text
   createSection.parentSectionId = null
   obj.sections.push(createSection)
  }
  /*
  Creating the components
*/
  var indexOfComponent = 0

  for (var e in data.item) {
   var a = data.item[e]

   if (a.type == 'label' || a.type == '') continue

   for (var i in a.item) {
    var component = a.item[i]

    if (component.type == 'label' || component.type == '') continue

    var item = {}
    item.index = indexOfComponent
    item.componentType = typeInbound(component.type)
    item.type = typeInbound(component.type)
    item.text = component.text
    item.externalId = component.itemId
    item.required = (component.required == '' || component.required == 'false') ? false : true
    item.sectionId = a.itemId
    item.answerOptions = []

    component.answerOptions.forEach((n, i) => {
     var answerOptions = {}
     answerOptions.index = i
     answerOptions.key = 0
     answerOptions.value = 0
     answerOptions.label = n.value
     answerOptions.type = item.componentType
     answerOptions.externalId = component.itemId.concat('_' + i)
     item.answerOptions.push(answerOptions)
    })
    indexOfComponent = indexOfComponent + 1
    obj.components.push(item)
   }
  }
  return http.questionnairePost(obj)
 }

 function typeOutbound(data) {
  switch (data) {
   case 'SECTION':
    return 'group'
   case 'BOOLEAN':
    return 'boolean'
   case 'DECIMAL':
    return 'decimal'
   case 'INTEGER':
    return 'integer'
   case 'DATE':
    return 'date'
   case 'DATETIME':
    return 'date_time'
   case 'TIME':
    return 'time'
   case 'checkbox':
    return 'open-choice'
   case 'RADIO':
    return 'choice'
   case 'RATING':
    return 'rating'
   case 'SCORING_SCALE':
    return 'scoring_scale'
   case 'DROPDOWN':
    return 'dropdown'
   case 'TEXT':
    return 'text'
   default:
    throw 'ComponentType not found to the ishmed '+data+''
  }
 }

 function typeInbound(data) {
  switch (data.toLowerCase()) {
   case 'group':
    return 'select'
   case 'boolean':
    return 'boolean'
   case 'decimal':
    return 'decimal'
   case 'integer':
    return 'integer'
   case 'date':
    return 'date'
   case 'dateTime':
    return 'datetime'
   case 'time':
    return 'time'
   case 'open-choice':
    return 'checkbox'
   case 'choice':
    return 'radio'
   case 'text':
    return 'textfield'
   default:
    throw 'ComponentType not found to the type ' + data + ''
  }
 }

 return {
  createTemplate: createTemplate,
  outbound: outbound
 }
}
/**
  This common to http request to m.Doc backend
	
  @param {String} params - Params to insert in URL
  @param {String} dto - Data transfer Object
*/
function Http() {
 const configController = com.mirth.connect.server.controllers.ControllerFactory.getFactory().createConfigurationController();
 const serverSettings = configController.getServerSettings();
 const env = String(serverSettings.getEnvironmentName()).toLowerCase()
 const mdoc = Util2().cfg('base')
 const request = env == 'qa' ? Util2().cfg('base').url.base_url_qa : Util2().cfg('base').url.base_url

 /**
    Request to get the configuration of tenant
 */
 function tenantConfiguration(tenant) {
  return request + '/api/tenantconfig/v1/public/tenant/' + tenant + '/module/properties/active?moduleAlias=APPOINTMENTS'
 }

 /**
    Check token is active
 */
 function tokenIsActive() {
  return request + mdoc.url.path.checkToken
 }

 /**
    Create  Sign In to create the TOKEN
 */
 function signIn(param, dto) {
  channelMap.put('url_signIn', request + mdoc.url.path.signIn)
  return JSON.stringify(dto)
 }

 /**
    Create Appoointment V2
 */
 function appointmentV2(param, dto) {
  channelMap.put('url_http_post_appointmentV2_mDoc', request + mdoc.url.path.appointmentV2)
  return JSON.stringify(dto)
 }

 /**
    Create Template V2
 */
 function template(param, dto) {
  channelMap.put('url_createOrUpdate_template', request + mdoc.url.path.template)
  return JSON.stringify(dto)
 }

 function createOrUpdateDepamentv2() {
  channelMap.put('url_createOrUpdateDepamentv2', request + mdoc.url.path.createOrUpdateDepamentv2)
  return {}
 }

 /**
    Create or Update Therapyinfo
 */
 function therapyinfo(params, dto) {
  channelMap.put('url_http_update_therapyinfo_mDoc', request + mdoc.url.path.appointmentV2 + params)
  return JSON.stringify(dto)
 }

 /**
    To delete an Appointment
 */
 function deleteAppointment(param, dto) {
  channelMap.put('url_http_delete_appointment', request + mdoc.url.path.appointmentCancel +'/'+param)
  return JSON.stringify(dto)
 }

 /**
    Create Patient V2
 */
 function patient(param, dto) {
  channelMap.put('url_http_post_patient_mDoc', request + mdoc.url.path.patient)
  return JSON.stringify(dto)
 }

 /**
    Create PatientOnboarding V2
 */
 function postPatientOnboardingV2(param, dto) {
  connectorMap.put('url_http_post_patientOnboardingV2_mDoc', request + mdoc.url.path.patientOnboardingV2)
  return JSON.stringify(dto)
 }

 /**
    Route to access all information Patient
 */
 function getUser(params) {
  channelMap.put('url_http_get_user_mDoc', request + mdoc.url.path.userFetch + params)
  return {}
 }

 /**
    Import Questionnaire
 */
 function questionnairePost(dto) {
  channelMap.put('url_http_post_questionnaireImport_mDoc', request + mdoc.url.path.questionnaire_import)
  return JSON.stringify(dto)
 }

 /**
    Route to access all information Patient
 */
 function getUserById(params) {
  channelMap.put('url_http_get_userById_mDoc', request + mdoc.url.path.userFetch + params)
  return {}
 }

 /**
    Get Case for ID
 */
 function getCaseById(params) {
  channelMap.put('url_http_get_caseById_mDoc', request + mdoc.url.path.caseFetch + params)
  return {}
 }

 /**
    Access data of case of user
 */
 function getCaseUser(params) {
  channelMap.put('url_http_get_caseUser_mDoc', request + mdoc.url.path.userCase + params + '/PATIENT')
  return {}
 }

 /**
         Get Case V2 for Patient
   */
    function getCaseUserV2(params) {
        channelMap.put('url_http_get_caseUser_mDoc', request + mdoc.url.path.userCaseFetchV2 + params + "/case")
        return {}
    }

 /**
      Get Case V2 for Patient
*/
 function getCaseUserV2(params) {
  channelMap.put('url_http_get_caseUser_mDoc', request + mdoc.url.path.userCaseFetchV2 + params + "/case")
  return {}
 }

 /**
       Route to access all information Case
 */
 function getCase(params) {
  channelMap.put('url_http_get_case_mDoc', request + mdoc.url.path.caseFetch + params)
  return {}
 }

 /**
       getDepartments
 */
 function getDepartments(params) {
  channelMap.put('url_http_get_departments_mDoc', request + mdoc.url.path.getDepartments + params)
  return {}
 }

 /**
       Route to access all information poll
 */
 function getPoll(params) {
  $co('url_http_get_poll_mDoc', request + mdoc.url.path.fetchPoll + params)
  return {}
 }

 /**
       Route to access all information poll import
 */
 function postPoll(params, dto) {
  $co('url_http_post_files_mDoc', request + mdoc.url.path.fileUploadv2)
  return JSON.stringify(dto)
 }

 /**
       Route to access all information poll import
 */
 function postPollV2(params, dto) {
  channelMap.put('url_http_post_files_mDoc', request + mdoc.url.path.fileUploadv2)
  return JSON.stringify(dto)
 }

 /**
       Route to access all information Files
 */
 function getFiles(params) {
  channelMap.put('url_http_get_files_mDoc', request + mdoc.url.path.filesFetch + params)
  return {}
 }

 /**
      Route to upload Files
*/
 function postFiles(dto) {
  channelMap.put('url_http_upload_files_mDoc', request + mdoc.url.path.fileUpload)
  return JSON.stringify(dto)
 }

 /**
     Route to access all information Files
 */
 function getFilesBase64(params) {
  channelMap.put('url_http_get_fileBase64_mDoc', request + mdoc.url.path.getFilesDownloadBase64 + params + '/download?as=BASE64')
  return {}
 }

 /**
       Route to access all information Location
 */
 function getLocation(params, dto) {
  channelMap.put('url_http_get_location_mDoc', request + mdoc.url.path.locationFetch + params)
  return {}
 }

 /**
       Route to access all information appointment
 */
 function getAppointment(params, dto) {
  channelMap.put('url_http_get_appointment_mDoc', request + mdoc.url.path.appointmentFetch + params)
  return {}
 }

 /**
     Route to access all information appointment V2
 */
 function getAppointmentV2(params, dto) {
  channelMap.put('url_http_get_appointmentV2_mDoc', request + mdoc.url.path.appointmentFetchV2 + params)
  return {}
 }

 /**
       Route to send message User
 */
 function postUser(params, dto) {
  channelMap.put('url_http_post_user_mDoc', request + mdoc.url.path.userFetch)
  return JSON.stringify(dto)
 }

 /**
       Route to send message Case
 */
 function postCase(params, dto) {
  channelMap.put('url_http_post_case_mDoc', request + mdoc.url.path.caseFetch)
  return JSON.stringify(dto)
 }

 /**
       Route to send message Appointment
 */
 function postAppointment(params, dto) {
  channelMap.put('url_http_post_appointment_mDoc', request + mdoc.url.path.appointmentFetch)
  return JSON.stringify(dto)
 }

 /**
       Route to send message Questionnaire
 */
 function postQuestionnaire(dto) {
  channelMap.put('url_http_post_questionnaire_mDoc', request + mdoc.url.path.fileUpload)
  return JSON.stringify(dto)
 }

 /**
       Route to send message Questionnaire Assign
 */
 function postQuestionnaireAssign(dto) {
  channelMap.put('url_http_post_questionnaire_assignment_mDoc', request + mdoc.url.path.assign)
  return JSON.stringify(dto)
 }

 /**
       Route to send message Appointment Cancel
 */
 function patchAppointment(params, dto) {
  channelMap.put('url_http_patch_appointment_mDoc', request + mdoc.url.path.appointmentCancel + params)
  return {}
 }

 function patchPatientV2(params, dto) {
  channelMap.put('url_http_patch_appointment_mDoc', request + mdoc.url.path.patchPatientV2 + params)
  return {}
 }

 /**
    Create Appoointment V2
 */
 function createBlockedOrUnblocked(param, dto) {
  channelMap.put('url_http_blockedOrUnblocked_appointment_mdoc', request + mdoc.url.path.createBlockedOrUnblocked)
  return JSON.stringify(dto)
 }

 /**
    Create Appoointment V2
 */
 function createAssignV2(param, dto) {
  channelMap.put('url_http_create_assign_mdoc', request + mdoc.url.path.assignV2)
  return JSON.stringify(dto)
 }

 function statusRequest(status) {
  switch (String(status)) {
   case 200:
    return { mssg: 'Ok', status: 200 }
   case 200:
    return { mssg: 'Temporary Redirect', status: 307 }
   case 400:
    return { mssg: 'Bad Request', status: 400 }
   case 404:
    return { mssg: 'Not Found', status: 404 }
   case 500:
    return { mssg: 'Internal Server Error', status: 500 }
   default:
    return { mssg: 'Ok', status: 200 }
  }
 }

 /**
   Assign Content Package to Patient
 */
 function assignContentPackage(patientExternalId, packageExternalId) {
  channelMap.put('url_http_assign_content_package_mdoc',
    request + '/api/content-package-integration/v1/packages/patient/' + encodeURIComponent(patientExternalId) + '/assign')
  return JSON.stringify({ packageExternalIds: [packageExternalId] })
 }

 return {
  getUser: getUser,
  getCase: getCase,
  getLocation: getLocation,
  getAppointment: getAppointment,
  getAppointmentV2: getAppointmentV2,
  getPoll: getPoll,
  getCaseById: getCaseById,
  getUserById: getUserById,
  getCaseUserV2: getCaseUserV2,
  getCaseUserV2: getCaseUserV2,
  getFilesBase64: getFilesBase64,
  postUser: postUser,
  postCase: postCase,
  postAppointment: postAppointment,
  postFiles: postFiles,
  postQuestionnaire: postQuestionnaire,
  postQuestionnaireAssign: postQuestionnaireAssign,
  patchAppointment: patchAppointment,
  getFiles: getFiles,
  postPoll: postPoll,
  getCaseUser: getCaseUser,
  questionnairePost: questionnairePost,
  postPatientOnboardingV2: postPatientOnboardingV2,
  appointmentV2: appointmentV2,
  patient: patient,
  getDepartments: getDepartments,
  deleteAppointment: deleteAppointment,
  patchPatientV2: patchPatientV2,
  appointmentV2: appointmentV2,
  postPollV2: postPollV2,
  therapyinfo: therapyinfo,
  createOrUpdateDepamentv2: createOrUpdateDepamentv2,
  createBlockedOrUnblocked: createBlockedOrUnblocked,
  statusRequest: statusRequest,
  createAssignV2: createAssignV2,
  template: template,
  signIn: signIn,
  tokenIsActive: tokenIsActive,
  assignContentPackage: assignContentPackage,
  tenantConfiguration: tenantConfiguration
 }
}
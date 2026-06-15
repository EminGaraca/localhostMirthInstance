/**
  @desc Integration of Consentment
  @author Anderson Araujo
*/
function IshMedConsent() {

 /**
   @desc To the flow of inbound
 */
 function inbound() { }

 /**
   @desc To the flow of outbound
   @author Anderson Araujo
 */
 function outbound() {
  const data = JSON.parse(connectorMessage.getRawData())
  const cfg = Util2().cfg()
  const tools = IshMed()
  const http = Http()

  function source() {
   channelMap.put('patient_id', data.patient.externalId)
  }

  function create() {
  	var localId = data.patient.externalId;
  	var facilitySystem = '';
  	var santeMpiJson = Util2().routeAndParse('SanteMPI_orchestrator', connectorMessage.getRawData());
	
	if (santeMpiJson.status == 'SENT') {
		localId = santeMpiJson.localId;
		var fs = santeMpiJson.facilitySystem.split('/');
		facilitySystem = fs[fs.length - 1];
	}
	
   channelMap.put('url_http_create_consent_outbound_ishmed', cfg.configuration.base_url + cfg.configuration.path.consent)
   $c('auth_ishmed', Util2().baseAuth(cfg.configuration.auth.ishmed.user, cfg.configuration.auth.ishmed.pass))

   const obj = {}
   obj.einri = facilitySystem // data.patient.externalUniqueId.split('.')[0]
   obj.patnr = localId
   obj.consent = (data.patient.privacyAccepted == true && data.patient.termsAccepted == true) ? "X" : null

   return JSON.stringify(obj)
  }
  return {
   create: create,
   source: source
  }
 }

 return {
  inbound: inbound,
  outbound: outbound
 }
}
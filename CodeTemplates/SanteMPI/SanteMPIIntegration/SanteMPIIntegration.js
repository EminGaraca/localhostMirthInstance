/**
 * SanteMPIIntegration
 */
var SanteMPIIntegration = (function() {
	// --- Config ---
	const configController = com.mirth.connect.server.controllers.ControllerFactory.getFactory().createConfigurationController();
	const serverSettings = configController.getServerSettings();
	const env = String(serverSettings.getEnvironmentName()).toLowerCase();
	const cfg = Util2().cfg('base');
	const MDOC_BASE_URL = env == 'qa' ? Util2().cfg('base').url.base_url_qa : Util2().cfg('base').url.base_url;
	
	// --- Constants ---
	var STRUCTURES_BASE_URL = 'https://mdoc.app/api/unit-api/v1';
	var MPI_BASE_URL = 'https://sfs.apisantempi.mdoc.app/fhir';
	var MPI_AUTH_URL = 'https://sfs.apisantempi.mdoc.app/auth/oauth2_token';
	var SKIP_AUTH = false;
	var SEARCH_THRESHOLD = 0.75;

	var authData = {
		grant_type: 'client_credentials',
		client_id: 'fiddler',
		client_secret: 'fiddler',
		scope: '*'
	};

	// --- Helpers ---

	function routeAndParse(route, payload) {
		// var body = (typeof payload === 'string') ? payload : JSON.stringify(payload);
		var resp = router.routeMessage(route, payload);
		return JSON.parse(resp.getMessage());
	}

	function isOperationOutcome(resource) {
		return resource.resourceType === 'OperationOutcome';
	}

	function findLocalId(resource, demo) {
		for (var i = 0; i < resource.identifier.length; i++) {
			if (resource.identifier[i].system == demo.facilitySystem) {
				return resource.identifier[i].value;
			}
		}

		return null;
	}

	function buildSuccessResponse(id, resource, demo) {
		var localId = findLocalId(resource, demo);
		var identifiers = resource.identifier[0].system.split('/');
		return ResponseFactory.getSentResponse(JSON.stringify({
			status: 'SENT',
			masterId: id,
			localId: localId,
			facilitySystem: demo.facilitySystem,
			clinicPrefix: identifiers[identifiers.length - 1],
			patient: resource
		}));
	}

	function findHighConfidence(entries) {
		if (!entries) return null;
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			if (e.search && e.search.score >= SEARCH_THRESHOLD) {
				return e;
			}
		}
		return null;
	}

	function updateDemographics(patient, demo) {
		patient.name = [{
			family: demo.familyName,
			given: [demo.givenName]
		}];
		patient.birthDate = demo.dob;
		patient.gender = demo.gender;
		patient.address = demo.city ? [{
			city: demo.city
		}] : [];
	}

	function mapFacilityCodeToSystem(code) {
		var mapping = {
			'SBK': {url: 'https://sfs.apisantempi.mdoc.app/SBK', uid: '1.3.6.1.4.1.33349.3.1.4'},
			'SFM': {url: 'https://sfs.apisantempi.mdoc.app/SFM', uid: '1.3.6.1.4.1.33349.3.1.5'},
			'SEM': {url: 'https://sfs.apisantempi.mdoc.app/SEM', uid: '1.3.6.1.4.1.33349.3.1.6'},
			'HJK': {url: 'https://sfs.apisantempi.mdoc.app/HJK', uid: '1.3.6.1.4.1.33349.3.1.7'},
			'SML': {url: 'https://sfs.apisantempi.mdoc.app/SML', uid: '1.3.6.1.4.1.33349.3.1.8'}
		};
		return mapping[code].url || null;
	}

	function findClinicAncestor(root, targetId) {
		function recurse(node, path) {
			path = path.concat([node]);
			if (node.id === targetId) {
				return path;
			}
			if (node.children) {
				for (var i = 0; i < node.children.length; i++) {
					var res = recurse(node.children[i], path);
					if (res) return res;
				}
			}
			return null;
		}
		var fullPath = recurse(root, []);
		if (!fullPath) return null;
		for (var j = fullPath.length - 1; j >= 0; j--) {
			if (fullPath[j].type === 'CLINIC') {
				return fullPath[j];
			}
		}
		return null;
	}

	function findLatestCase(cases) {
		if (!cases || cases.length === 0) {
			return null;
		}
		
		var latest = cases[0];
		for (var i = 1; i < cases.length; i++) {
			if (cases[i].start > latest.start) {
				latest = cases[i];
			}
		}
		
		return latest;
	}

	// --- Message Checkers & Extractors ---

	function isHL7(raw) {
		return raw && raw.indexOf('MSH|') === 0;
	}

	function isFHIR(raw) {
		try {
			var obj = JSON.parse(raw);
			return obj.resourceType === 'Patient';
		} catch (e) {
			return false;
		}
	}

	function isAppointmentInbound(raw) {
		try {
			var obj = JSON.parse(raw);
			return obj.hasOwnProperty('externalParticipantId');
		} catch (e) {
			return false;
		}
	}

	function extractFacilitySystemFromHL7(raw) {
		try {
			var xml = new XML(SerializerFactory.getSerializer('HL7V2').toXML(raw));
			var code3 = String(xml.MSH['MSH.3']['MSH.3.2'] || '');
			var code4 = String(xml.MSH['MSH.4']['MSH.4.2'] || '');
			var code5 = String(xml.MSH['MSH.4']['MSH.4.1'] || '');
			var code = code3 || code4 || code5;
			return mapFacilityCodeToSystem(code);
		} catch (e) {
			logger.error('extractFacilitySystemFromHL7 error: ' + e);
			return null;
		}
	}

		function extractDemographics(raw) {
		if (!raw) throw new Error('Empty message');
		try {
			if (isHL7(raw)) {
				var xml = new XML(SerializerFactory.getSerializer('HL7V2').toXML(raw));
				var pid = xml.PID;
				var dob = String(pid['PID.7']['PID.7.1'] || '');
				if (/^\d{8}$/.test(dob)) {
					dob = dob.substring(0, 4) + '-' + dob.substring(4, 6) + '-' + dob.substring(6);
				}
				var genderCode = String(pid['PID.8']['PID.8.1'] || '');
				var demoHL7 = {
					givenName: String(pid['PID.5']['PID.5.2'] || ''),
					familyName: String(pid['PID.5']['PID.5.1'] || ''),
					dob: dob,
					gender: genderCode === 'M' ? 'male' : genderCode === 'F' ? 'female' : 'other',
					city: String(pid['PID.11']['PID.11.3'] || ''),
					localId: String(pid['PID.3']['PID.3.1'] || ''),
					facilitySystem: extractFacilitySystemFromHL7(raw)
				};
				if (!demoHL7.givenName || !demoHL7.familyName || !demoHL7.dob || !demoHL7.localId) {
					throw new Error('Missing fields in HL7');
				}
				return demoHL7;
			} else if (isFHIR(raw)) {
				var fhir = JSON.parse(raw);
				var idf0 = (fhir.identifier && fhir.identifier[0]) || {};
				var name0 = (fhir.name && fhir.name[0]) || {};
				var demoFHIR = {
					givenName: name0.given ? name0.given[0] : '',
					familyName: name0.family || '',
					dob: fhir.birthDate || '',
					gender: fhir.gender || '',
					city: (fhir.address && fhir.address[0] ? fhir.address[0].city : ''),
					localId: idf0.value || '',
					facilitySystem: idf0.system || null
				};
				if (!demoFHIR.givenName || !demoFHIR.familyName || !demoFHIR.dob || !demoFHIR.localId) {
					throw new Error('Missing fields in FHIR');
				}
				return demoFHIR;
			} else if (isAppointmentInbound(raw)) {
				var obj = JSON.parse(raw);
				var demoAppt = {
					localId: obj.externalParticipantId,
					facilitySystem: mapFacilityCodeToSystem(obj.clinicId),
					givenName: obj.firstName,
					familyName : obj.lastName
				};
				return demoAppt;
			} else {
				var obj = JSON.parse(raw);
				logger.info("usoo: " + obj)
				obj.medicalCase = channelMap.get('lastCase');
				var p = obj.hasOwnProperty('patient') == true ? obj.patient : obj.hasOwnProperty('file') == true ? obj.file.owner : obj.medicalCase.patient;
				logger.info("ppp: " + p)
				var m = obj.medicalCase;
				var parts = (p.externalUniqueId || '').split('.');
				var unit;
				
				if (m == null || m == 'undefined') {
					var cases = routeAndParse('ishmed_mDocCaseDecode', JSON.stringify({externalUniqueId: p.externalUniqueId}));
					var lc = findLatestCase(cases);
					unit = lc.caseLocation.unit;
				} else {
					unit = m.caseLocation.unit;
				}
	
				var struct = routeAndParse('ishmed_mDocStructureDecode', JSON.stringify({unit: unit}));
				var clinic = findClinicAncestor(struct, unit);
				var facilitySys = mapFacilityCodeToSystem(clinic ? clinic.externalId : null);
				var demoCustom = {
					givenName: p.firstName || '',
					familyName: p.lastName || '',
					dob: p.dob ? new Date(p.dob * 1000).toISOString().slice(0, 10) : '',
					gender: p.gender === 'M' ? 'male' : p.gender === 'F' ? 'female' : 'other',
					city: (p.addresses && p.addresses[0] ? p.addresses[0].city : ''),
					localId: parts[1], // p.externalId || parts[1] || '',
					facilitySystem: facilitySys
				};
				if (!demoCustom.givenName || !demoCustom.familyName || !demoCustom.dob || !demoCustom.localId) {
					throw new Error('Missing fields in custom JSON');
				}
				return demoCustom;
			}
		} catch (e) {
			logger.error('extractDemographics error: ' + e);
			throw new Error('Invalid message format: ' + e.message);
		}
	}

	// --- FHIR Builders ---

	function buildFhirPatient(demo, includeId) {
		logger.info(demo)
		includeId = includeId || false;
		var patient = {
			resourceType: 'Patient',
			name: [{
				family: demo.familyName,
				given: [demo.givenName]
			}],
			birthDate: demo.dob,
			gender: demo.gender,
			address: demo.city ? [{
				city: demo.city
			}] : []
		};
		if (includeId) {
			patient.identifier = [{
				system: demo.facilitySystem,
				value: demo.localId
			}];
		}
		return patient;
	}

	function buildFhirMatchPayload(demo) {
		return {
			resourceType: 'Parameters',
			parameter: [{
					name: 'resource',
					resource: buildFhirPatient(demo, false)
				},
				{
					name: 'count',
					valueInteger: 10
				},
				{
					name: 'onlyCertainMatches',
					valueBoolean: false
				},
				{
					name: 'matchAlgorithm',
					valueCode: 'exact'
				}
			]
		};
	}

	// --- Authentication ---

	function auth() {
		if (SKIP_AUTH) return;
		var authResp = routeAndParse('SanteMPI_auth', authData);
		channelMap.put('mpiAuth', 'BEARER ' + authResp.access_token);
	}

	function authPayload() {
		channelMap.put('mpiAuthUrl', MPI_AUTH_URL);
		return JSON.stringify(authData);
	}

	// --- ChannelMap Setup ---

	function configureMatch(raw) {
		raw = raw || connectorMessage.getRawData();
		var demo = extractDemographics(raw);
		channelMap.put('mpiMatchUrl', MPI_BASE_URL + '/Patient/$match');
		return buildFhirMatchPayload(demo);
	}

	function configureRegister(raw) {
		raw = raw || connectorMessage.getRawData();
		var demo = extractDemographics(raw);
		channelMap.put('mpiRegisterUrl', MPI_BASE_URL + '/Patient');
		return buildFhirPatient(demo, true);
	}

	function configureUpdate(raw) {
		  raw = raw || connectorMessage.getRawData();
		  var fhir = JSON.parse(raw);
		
		  // Clean identifiers: remove any identifier with null/empty system
		  if (fhir.identifier && fhir.identifier.length) {
		    var cleaned = [];
		    for (var i = 0; i < fhir.identifier.length; i++) {
		      var x = fhir.identifier[i];
		      var sys = x && x.system != null ? String(x.system).trim() : '';
		      if (sys.length > 0) cleaned.push(x);
		    }
		    fhir.identifier = cleaned;
		  }
		
		  channelMap.put('mpiUpdateUrl', MPI_BASE_URL + '/Patient/' + fhir.id);
		  return fhir;
	}

	function configureGetByIdentifier(raw) {
		raw = raw || connectorMessage.getRawData();
		var demo = extractDemographics(raw);
		var system = encodeURIComponent(demo.facilitySystem);
		var value = encodeURIComponent(demo.localId);
		channelMap.put('mpiGetByIdentifierUrl', MPI_BASE_URL + '/Patient?identifier=' + system + '%7C' + value);
	}

	function configureGetById(raw) {
		raw = raw || connectorMessage.getRawData();
		var demo = extractDemographics(raw);
		channelMap.put('mpiGetByIdUrl', MPI_BASE_URL + '/Patient/' + demo.localId);
	}

	function configureGetMdocStructures(raw) {
		raw = raw || connectorMessage.getRawData();
		var obj = JSON.parse(raw);
		channelMap.put('mdocStructuresUrl', STRUCTURES_BASE_URL + '/structures/' + obj.unit);
	}

	function configureGetMdocCases(raw) {
		raw = raw || connectorMessage.getRawData();
		var obj = JSON.parse(raw);
		channelMap.put('mdocCasesUrl', MDOC_BASE_URL + cfg.url.path.userCaseFetchV2 + "/" + obj.externalUniqueId + "/case");
	}

	// --- Resolve Patient ID ---

	function resolvePatientId() {
		try {
			var raw = connectorMessage.getRawData();
			var demo = extractDemographics(raw);

			logger.info('SanteMPI: Searching by ID');
			var byId = routeAndParse('SanteMPI_getById', raw);
			if (!isOperationOutcome(byId)) {
				return buildSuccessResponse(byId.id, byId, demo);
			}

			logger.info('SanteMPI: Searching by identifier');
			var byIdent = routeAndParse('SanteMPI_getByIdentifier', raw);
			var entries = byIdent.entry || [];
			if (entries.length === 1) {
				return buildSuccessResponse(entries[0].resource.id, entries[0].resource, demo);
			}
			if (entries.length > 1) {
				throw new Error('Multiple patients for ' + demo.facilitySystem + '|' + demo.localId);
			}

			logger.info('SanteMPI: Performing $match');
			var matchResp = routeAndParse('SanteMPI_match', raw);
			var matchEntry = findHighConfidence(matchResp.entry);
			logger.info("matchEntry " + JSON.stringify(matchEntry))
			if (matchEntry) {
				return handleHighConfidence(matchEntry, demo);
			}

			logger.info('SanteMPI: Registering new patient');
			return registerPatient(raw, demo);
		} catch (e) {
			logger.error('SanteMPI: Error in resolvePatientId: ' + e);
			return ResponseFactory.getErrorResponse(JSON.stringify({
				status: 'ERROR',
				messageError: e.message || String(e)
			}));
		}
	}

		
	function handleHighConfidence(entry, demo) {
		var patient = entry.resource;
		patient.identifier = patient.identifier || [];
		logger.info("patient.identifier" + JSON.stringify(patient.identifier))
		var exists = false;
		for (var i = 0; i < patient.identifier.length; i++) {
			var id = patient.identifier[i];
			if (id.system === demo.facilitySystem && id.value === demo.localId) {
				exists = true;
				break;
			}
		}
		if (!exists) {
			patient.identifier.push({
				system: demo.facilitySystem,
				value: demo.localId
			});
			updateDemographics(patient, demo);
			logger.info('SanteMPI: Updating patient with new identifier');
			var updated = routeAndParse('SanteMPI_update', JSON.stringify(patient));
			
			var link = updated.link && updated.link[0] && updated.link[0].other.reference;
			var id = link ? link.split('/')[1] : patient.id;
			return buildSuccessResponse(id, updated, demo);
		}

		var link = patient.link && patient.link[0] && patient.link[0].other.reference;
		var id = link ? link.split('/')[1] : patient.id;
		return buildSuccessResponse(id, patient, demo);
	}

	function registerPatient(raw, demo) {
		var reg = routeAndParse('SanteMPI_register', raw);
		var link = reg.link && reg.link[0] && reg.link[0].other.reference;
		var id = link ? link.split('/')[1] : reg.id;
		return buildSuccessResponse(id, reg, demo);
	}

	// --- Public API ---
	return {
		auth: auth,
		authPayload: authPayload,
		match: configureMatch,
		register: configureRegister,
		update: configureUpdate,
		getByIdentifier: configureGetByIdentifier,
		getById: configureGetById,
		getMdocStructures: configureGetMdocStructures,
		getMdocCases: configureGetMdocCases,
		resolvePatientId: resolvePatientId
	};
})();
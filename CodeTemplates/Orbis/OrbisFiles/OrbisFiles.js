/**
 .
*/
function OrbisFiles() {
  const http = Http()
  const hl7 = Hl7v2()
  const orbis = OrbisFilesV2()

  function inbound() {
    var data = new XML(connectorMessage.getTransformedData())

    //data.PV1['PV1.3']['PV1.3.4'] = String(data.MSH['MSH.5']['MSH.4.1'])
    data.PV1['PV1.3']['PV1.3.4'] = String(data.MSH['MSH.5']['MSH.5.1'])

    function mdmT02() {
      return http.postPoll(null, hl7.inbound().mdmT02(data))
    }
    return {
      mdmT02: mdmT02
    }
  }

function outbound() {
  var data = JSON.parse(connectorMessage.getRawData());

  //safe reading
  function safeGet(obj, path) {
    try {
      var parts = path.split('.');
      var cur = obj;
      for (var i = 0; i < parts.length; i++) {
        if (cur == null || !(parts[i] in cur)) return null;
        cur = cur[parts[i]];
      }
      return cur;
    } catch (e) {
      return null;
    }
  }

  
  function resolveExternalUniqueId(d) {
    var euid = safeGet(d, 'file.owner.externalUniqueId');
    if (!euid) euid = safeGet(d, 'person.externalUniqueId');
    if (!euid) euid = safeGet(d, 'externalUniqueId');
    return euid;
  }

  
  function resolveFacilityFromEuid(euid) {
    if (!euid) return 'HDZ';
    var parts = String(euid).split('.');
    if (parts.length >= 2) return parts[0] + '.' + parts[1];
    return parts[0] || 'HDZ';
  }

  var externalUniqueId = resolveExternalUniqueId(data);
  var facility = resolveFacilityFromEuid(externalUniqueId);

  channelMap.put('externalUniqueId', externalUniqueId);
  channelMap.put('facility', facility);

  function mdmT02() {
    return orbis.outbound().mdmT02(data, 'ORBIS', facility);
  }

  function getFilesBase64() {
    return hl7.getFilesBase64(data);
  }

  function getCasesV2() {
    return http.getCaseUserV2('/' + externalUniqueId);
  }

  function respGetFiles() {
    if (String(response.getNewMessageStatus()) == 'ERROR') {
      channelMap.put('files', false);
      throw ('Message Warning', 'File not found on Portal side');
    } else {
      channelMap.put('files', true);
    }
  }

  function filterMdm() {
    if ($('files') == true) return true;
    return false;
  }

  return {
    mdmT02: mdmT02,
    getCasesV2: getCasesV2,
    getFilesBase64: getFilesBase64,
    respGetFiles: respGetFiles,
    filterMdm: filterMdm
  };
}


  return {
    inbound: inbound,
    outbound: outbound
  }
}
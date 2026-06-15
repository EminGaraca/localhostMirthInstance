/**
    @author Anderson Araujo
    @desc Case of Util for use in the channels
*/
function Util2() {
 function date() {
  var patterns = [
   "yyyy-MM-dd HH:mm:ss.SSSSSSS ZZ",
   "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
   "yyyy-MM-dd'T'HH:mm:ssZ",
   "yyyy-MM-dd'T'HH:mm:ssZZ",
   "yyyy-MM-dd'T'HH:mm:ss",
   "yyyy-MM-dd'T'HH:mm",
   'yyyy-MM-dd',
   'yyyyMMdd',
   'yyyy-MM-dd HH:mm:ss:SSS',
   'yyyy-MM-dd HH:mm:ss.SSS',
   'yyyy-MM-dd HH:mm:ss',
   'yyyy-MM-dd HH:mm',
   'EEE MMM dd HH:mm:ss:SSS zzz yyyy',
   'EEE MMM dd HH:mm:ss.SSS zzz yyyy',
   'EEE MMM dd HH:mm:ss zzz yyyy',
   'EEE MMM dd zzz yyyy',
   'dd-MMM-yyyy HH:mm:ss:SSS',
   'dd-MMM-yyyy HH:mm:ss.SSS',
   'dd-MMM-yyyy HH:mm:ss',
   'yyyy MM dd',
   'yyyy.MM.dd',
   'MM-dd-yyyy',
   'MM dd yyyy',
   'MM.dd.yyyy',
   'HH:mm:ss:SSS',
   'HH:mm:ss.SSS',
   'HH:mm:ss',
   'yyyyMMddHHmmssSSS',
   'yyyyMMddHHmmss',
   'yyyyMMddHHmm',
   'hh:mm aa',
   'MM/dd/yy',
   'MM/dd/yyyy',
   'dd.MM.yyyy HH:mm:ss'
  ]

  var formatters = [];
  for (pattern in patterns) {
   formatters.push(org.joda.time.format.DateTimeFormat.forPattern(patterns[pattern]).withPivotYear(2000));
  }

  /**
         @author Anderson Araujo
         @desc type is the model that you need
         @desc Type: 1 = IsoDateTime
         @desc Type: 2 = Cgm
  */
  function convertDate(date, type) {
   const msDateTime = String(date).length < 13 ? new Date(Number(String(date + '000').slice(0, 13))) : (String(date).length > 13 ? new Date(Number(String(date).slice(-13))) : null)
   const year = msDateTime.getFullYear()
   const month = ('0' + (msDateTime.getMonth() + 1)).slice(-2)
   const day = ('0' + msDateTime.getDate()).slice(-2)
   const hour = ('0' + msDateTime.getHours()).slice(-2)
   const min = ('0' + msDateTime.getMinutes()).slice(-2)
   const sec = ('0' + msDateTime.getSeconds()).slice(-2)
   const ms = ('0' + msDateTime.getMilliseconds()).slice(-2)

   switch (type) {
    case 1:
     return year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + ':' + ms
    case 2:
     return day + '.' + month + '.' + year + ' ' + hour + ':' + min + ':' + sec + ':' + ms
    default:
     break
   }
  }

  function fromSecondToHl7DateTime(value) {
   if (value == '' || value == null || value == undefined) return 0

   return new Date(Number(value + '000')).toISOString().replace(/-/g, '').replace('T', '').replace(/:/g, '').slice(0, 14)
  }

  function getSeconds(date) {
   return (getMillis(date) / 1000);
  }

  function getMillis(date) {
   var instant = 0;
   if (typeof date == 'number' || date instanceof java.lang.Number) {
    instant = date;

   } else if (date instanceof Date || date instanceof java.util.Date) {
    instant = date.getTime();

   } else if (date instanceof org.joda.time.ReadableInstant) {
    instant = date.getMillis()

   } else {
    for (formatter in formatters) {
     try {
      instant = formatters[formatter].parseMillis(new String(date))
      break
     } catch (e) { }
    }
   }
   return instant;
  }

  function convertEpochToIsoDate(date, outpattern) {
   return org.joda.time.format.DateTimeFormat.forPattern(outpattern).print(getMillis(date))
  }

  function convertDate(date, outpattern) {
   return org.joda.time.format.DateTimeFormat.forPattern(outpattern).print(getMillis(date))
  }

  function getMillisWithTimeZone(date, timeZone) {
   var instant = 0

   if (typeof date == 'number' || date instanceof java.lang.Number) {
    instant = date

   } else if (date instanceof Date || date instanceof java.util.Date) {
    instant = date.getTime()

   } else if (date instanceof org.joda.time.ReadableInstant) {
    instant = date.getMillis()

   } else {
    for (formatter in formatters) {
     try {
      if (timeZone != 'undefined') {
       instant = formatters[formatter].withZone(org.joda.time.DateTimeZone.forTimeZone(java.util.TimeZone.getTimeZone(timeZone))).parseMillis(new String(date))
      } else {
       instant = formatters[formatter].parseMillis(new String(date))
      }
      break
     } catch (e) { }
    }
   }
   return instant
  }

  function convertDateByEpoch(date, outpattern) {
   return org.joda.time.format.DateTimeFormat.forPattern(outpattern).print(date);
  }

  return {
   getSeconds: getSeconds,
   getMillis: getMillis,
   getMillisWithTimeZone: getMillisWithTimeZone,
   convertDate: convertDate,
   fromSecondToHl7DateTime: fromSecondToHl7DateTime,
   convertDateByEpoch: convertDateByEpoch,
   convertEpochToIsoDate: convertEpochToIsoDate
  }
 }

 function onlyEnv() {
  const configController = com.mirth.connect.server.controllers.ControllerFactory.getFactory().createConfigurationController()
  const serverSettings = configController.getServerSettings()
  const envName = String(serverSettings.getEnvironmentName()).toLowerCase()
  if (envName != 'development' && envName != 'production' && envName != 'qa' && envName != 'stage')
   throw CommonLogger().loggerMessage('Environment name not configured. Please, check in Settings if name environment is configured', 50)

  return envName
 }

 /**
   @desc Case of Util for use in the channels
   @author Anderson Araujo
   @return cfg
 */
 function cfg(base_configuration) {
  const configController = com.mirth.connect.server.controllers.ControllerFactory.getFactory().createConfigurationController();
  const serverSettings = configController.getServerSettings();
  const envName = String(serverSettings.getEnvironmentName()).toLowerCase();
  const connectorName = String(channelName).split('_')[0]

  if (envName != 'development' && envName != 'production' && envName != 'qa') throw new Error('Environment name not configured. Please, check in Settings if name environment is configured')

  if (!$cfg('cfg')) throw new Error('Please, check file configuration in Settings -> Configuration Map')

  const cfg = JSON.parse($cfg('cfg'))

  if (base_configuration != undefined) return cfg[envName][base_configuration]

  if (!cfg[envName][connectorName]) throw 'Client not have configuration in file. Please, input configuration this client ' + connectorName + ' in file Settings -> Configuration Map -> variable cfg'

  return cfg[envName][connectorName]
 }

 function auth() {
  const obj = {}
  const cfg = Util2().cfg()
  const mdoc = Util2().cfg('base')

  obj.client_id = cfg.configuration.auth.mfa.client_id
  obj.client_secret = cfg.configuration.auth.mfa.client_secret
  obj.grant_type = cfg.configuration.auth.mfa.grant_type
  obj.tenant = cfg.configuration.auth.mfa.tenant
  obj.url = mdoc.url.base_url + mdoc.url.path.mfa
  channelMap.put('auth', 'Bearer ' + router.routeMessage('backend_request_login', JSON.stringify(obj)).getMessage())
 }

 function authMfa() {
  const data = JSON.parse(connectorMessage.getRawData())
  channelMap.put('url', data.url)
  delete data.url
  msg = JSON.stringify(data)
 }

 function dateTimeOfAuthBase64(dateEnd, dateStart) {
  var sub = null

  if (dateEnd === undefined && dateStart === undefined) {
   sub = (new Date(connectorMessage.getResponseDate().getTime()).getTime() - new Date(connectorMessage.getSendDate().getTime()).getTime())
  } else {
   sub = (new Date(dateEnd).getTime() - new Date(dateStart).getTime())
  }

  var respMessage = new Date(sub).toISOString().split('T')[1]
  return respMessage
 }

 function md5() {
  var md5 = com.google.common.hash.Hashing.md5().hashString(connectorMessage.getRawData(), java.nio.charset.Charset.forName('US-ASCII')).toString()
  return md5
 }

 /**
   @desc Method to generate basic authentication token with user and password
   @param {*} user username
   @param {*} password password of the user
   @returns baseAuth
 */
 function baseAuth(user, password) {
  var token = user + ":" + password;
  var tokenByteArray = ((java.lang.String)(user + ":" + password)).getBytes();
  var hash = java.util.Base64.getEncoder().encodeToString(tokenByteArray);
  return "Basic " + hash;
 }

	function routeAndParse(route, payload) {
		// var body = (typeof payload === 'string') ? payload : JSON.stringify(payload);
		var resp = router.routeMessage(route, payload);
		return JSON.parse(resp.getMessage());
	}

 return {
  cfg: cfg,
  auth: auth,
  authMfa: authMfa,
  date: date,
  md5: md5,
  baseAuth: baseAuth,
  onlyEnv: onlyEnv,
  routeAndParse: routeAndParse
 }
}
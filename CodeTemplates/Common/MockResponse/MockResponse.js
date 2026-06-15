/**
    Response for the CGM
    @author Anderson Araujo
*/
function MockResponse() {
 function resp(sourceMap, responseMap, message) {
  var sourceError = message.getConnectorMessages().get(0).getProcessingError()
  var destinations = sourceMap.get('destinationSet')
  var out = null
  var obj = {}

  try {
   /**
     Failed for the transformation of message
   */
   if (isEmpty(sourceError) == false) {
    obj.code = 400
    obj.text = 'Bad Request'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    return ResponseFactory.getErrorResponse(JSON.stringify(obj))
   }

   if ((destinations == null || destinations.size() < 1)) {
    obj.code = 307
    obj.text = 'Temporary Redirect'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    obj.messageError = resp || null
    out = JSON.stringify(obj)
    return ResponseFactory.getSentResponse(JSON.stringify(obj))
   }

   var destinationList = [];
   destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

   for (var i = 0; i < destinationList.length; i++) {
    var response = responseMap.get(destinationList[i])

    if (responseMap.get(destinationList[i]) == null) continue
    if (response.getStatus().toString() == 'FILTERED') continue

    if (String(response.getMessage()).length != 0 && JSON.parse(response.getMessage()).hasOwnProperty('status')) {
     var respCode = JSON.parse(response.getMessage()).status
     var respText = String(JSON.parse(response.getMessage()).error)
    }

    /**
     Message Failed
    */
    if (response.getStatus().toString() == 'ERROR') {
     var resp = null

     if (String(response.getMessage()).length != 0) {
      resp = JSON.parse(response.getMessage())
     } else {
      message.getConnectorMessages().forEach(e => {
       if (message.getConnectorMessages().get(e).getProcessingError() != null)
        resp = message.getConnectorMessages().get(e).getProcessingError()
      })
     }

     obj.code = respCode || 500
     obj.text = respText || 'Internal Server Error'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.messageError = resp
     out = JSON.stringify(obj)
     return ResponseFactory.getErrorResponse(JSON.stringify(obj))
    }

    /**
     Message was sent with success
    */
    if (response.getStatus().toString() == 'SENT') {
     obj.code = 201
     obj.text = 'Create successfully'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.messageError = null
     out = JSON.stringify(obj)
    }

    /**
     Message is in QUEUED
    */
    if (response.getStatus().toString() == 'QUEUED') {
     obj.code = 307
     obj.text = 'Temporary Redirect'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.messageError = resp || null
     out = JSON.stringify(obj)
    }
   }
   if (JSON.parse(out).code <= 308) return ResponseFactory.getSentResponse(out)
   if (JSON.parse(out).code >= 400) return ResponseFactory.getErrorResponse(out)

  } catch (e) {
   obj.code = 500
   obj.text = 'Internal Server Error'
   obj.integrationId = message.getMessageId()
   obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
   obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
   obj.messageError = resp || null
   out = JSON.stringify(obj)
  }
 }

 function route(sourceMap, responseMap, message) {
  var sourceError = message.getConnectorMessages().get(0).getProcessingError()
  var status = String(message.getConnectorMessages().get(0).getStatus())
  var destinations = sourceMap.get('destinationSet')
  var objRouter = {}

  /**
    Validation of DTO on Router
  */
  if (status == 'ERROR') {
   globalChannelMap.put('status', '400')

   objRouter.code = 400
   objRouter.text = 'Bad Request'
   objRouter.integrationId = message.getMessageId()
   objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
   objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
   objRouter.messageError = sourceError.substring(sourceError.indexOf('DETAILS'), Number(sourceError.indexOf('DETAILS') + 1000)).split('\n')[0].replace('DETAILS:\t', '')
   return ResponseFactory.getErrorResponse(JSON.stringify(objRouter))
  }
  
  /**
    Failed for the transformation of message
  */
  if (isEmpty(sourceError) == false || destinations == null || destinations.size() < 1) {
   globalChannelMap.put('status', '520')

   objRouter.code = 520
   objRouter.text = 'Unknown'
   objRouter.integrationId = message.getMessageId()
   objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
   objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
   return ResponseFactory.getErrorResponse(JSON.stringify(objRouter))
  }

  var destinationList = [];
  destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

  var destinationResponse;
  for (var i = 0; i < destinationList.length; i++) {
   var response = responseMap.get(destinationList[i])

   if (String(response.getMessage()).length == 0) {
    objRouter.text = 'OK'
    objRouter.integrationId = message.getMessageId()
    objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')

    globalChannelMap.put('status', objRouter.code)

    return ResponseFactory.getSentResponse(JSON.stringify(objRouter))
   }
   globalChannelMap.put('status', String(JSON.parse(response.getMessage()).code))
  }
  return ResponseFactory.getSentResponse(response.getMessage())
 }

 function isEmpty(val) {
  if (val === undefined || val === null || val === "") return true;
  if (typeof val === "string" || val instanceof String) {
   return val ? false : true;
  } else if (Array.isArray(val)) {
   return !val.length;
  } else if (typeof val === "object") {
   return Object.keys(val).length === 0;
  }
  return false;
 }

 return {
  resp: resp,
  route: route
 }
}
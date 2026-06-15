/**
    Response for the IshMed
    @author: Anderson Araujo
*/
function IshMed() {
 function channel(sourceMap, responseMap, message) {
  var sourceError = message.getConnectorMessages().get(0).getProcessingError()
  var destinations = sourceMap.get('destinationSet')
  var out = null
  var obj = {}

  try {
   /**
     Failed for the transformation of message
   */
   if (isEmpty(sourceError) == false) {
    obj.statusCode = 400
    obj.code = 'Bad Request'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    return ResponseFactory.getErrorResponse(JSON.stringify(obj))
   }

   if ((destinations == null || destinations.size() < 1)) {
    obj.statusCode = 307
    obj.code = 'Temporary Redirect'
    obj.integrationId = message.getMessageId()
    obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    obj.info = null
    out = JSON.stringify(obj)
    return ResponseFactory.getSentResponse(JSON.stringify(obj))
   }

   var destinationList = [];
   destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

   for (var i = 0; i < destinationList.length; i++) {
    var response = responseMap.get(destinationList[i])

    try {
    var info = JSON.parse(response.getMessage()).hasOwnProperty('externalAppointmentId') ? JSON.parse(response.getMessage()).externalAppointmentId : null
    }catch(e) {
    info = null
    }

    if (responseMap.get(destinationList[i]) == null)
      continue

    /**
     Message Failed
    */
    if (response.getStatus().toString() == 'ERROR') {
    	 var resp = null
      message.getConnectorMessages().forEach(e => {
       if (message.getConnectorMessages().get(e).getProcessingError() != null)
        resp = message.getConnectorMessages().get(e).getProcessingError()
      })

     obj.statusCode = 400
     obj.code = 'Bad Request'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.info = resp
     out = JSON.stringify(obj)
    }

    /**
     Message was sent with success
    */
    if (response.getStatus().toString() == 'SENT') {
     obj.statusCode = 201
     obj.code = 'Create successfully'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.info = info
     out = JSON.stringify(obj)
    }

    /**
     Message is in QUEUED
    */
    if (response.getStatus().toString() == 'QUEUED') {
     obj.statusCode = 307
     obj.code = 'Temporary Redirect'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.info = resp || null
     out = JSON.stringify(obj)
    }

    /**
     Message is with the status FILTERED
    */
    if (response.getStatus().toString() == 'FILTERED') {
     obj.statusCode = 406
     obj.code = 'Not Acceptable'
     obj.integrationId = message.getMessageId()
     obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     obj.info = 'Your message was filtered in our application, please contact support for more details'
     out = JSON.stringify(obj)
    }
   }

   if (JSON.parse(out).statusCode <= 308) return ResponseFactory.getSentResponse(out)
   if (JSON.parse(out).statusCode >= 400) return ResponseFactory.getErrorResponse(out)

  } catch (e) {
   obj.statusCode = 500
   obj.code = 'Internal Server Error'
   obj.integrationId = message.getMessageId()
   obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
   obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
   obj.info = e.message
   return ResponseFactory.getErrorResponse(JSON.stringify(obj))
  }
 }

 function route(sourceMap, responseMap, message) {
  try {
   var sourceError = message.getConnectorMessages().get(0).getProcessingError()
   var status = String(message.getConnectorMessages().get(0).getStatus())
   var destinations = sourceMap.get('destinationSet')
   var objRouter = {}

   /**
     Validation of DTO on Router
   */
   if (status == 'ERROR') {
    $gc('status', '400')

    objRouter.statusCode = '400'
    objRouter.code = 'Bad Request'
    objRouter.integrationId = message.getMessageId()
    objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    objRouter.info = sourceError.substring(sourceError.indexOf('DETAILS'), Number(sourceError.indexOf('DETAILS') + 1000)).split('\n')[0].replace('DETAILS:\t', '')
    return ResponseFactory.getErrorResponse(JSON.stringify(objRouter))
   }

   /**
     Failed for the transformation of message
   */
   if (isEmpty(sourceError) == false || destinations == null || destinations.size() < 1) {
    $gc('status', '500')

    objRouter.statusCode = '500'
    objRouter.code = 'Unknown'
    objRouter.integrationId = message.getMessageId()
    objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
    objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
    objRouter.info = 'An error was identified, please contact the support for more details'
    return ResponseFactory.getErrorResponse(JSON.stringify(objRouter))
   }

   var destinationList = [];
   destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

   var destinationResponse;
   for (var i = 0; i < destinationList.length; i++) {
    var response = responseMap.get(destinationList[i])

    if (String(response.getMessage()).length == 0) {
     $gc('status', '400')
     objRouter.statusCode = 400
     objRouter.code = 'Bad Request'
     objRouter.integrationId = message.getMessageId()
     objRouter.serviceName = ChannelUtil.getChannelName(message.getChannelId())
     objRouter.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
     objRouter.info = 'An error was identified, please contact the support for more details'
     return ResponseFactory.getErrorResponse(JSON.stringify(objRouter))
    }
   }
   
   $gc('status', String(JSON.parse(response.getMessage()).statusCode))
   return ResponseFactory.getSentResponse(JSON.parse(response.getMessage()).info)
   
  } catch (e) {
   $gc('status', '500')
   return ResponseFactory.getErrorResponse(
    JSON.stringify({
     statusCode: 500,
     code: 'Internal Server Error',
     integrationId: message.getMessageId(),
     serviceName: ChannelUtil.getChannelName(message.getChannelId()),
     date: new Date().toISOString(),
     info: e.message || null
    }))
  }
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
  channel: channel,
  route: route
 }
}
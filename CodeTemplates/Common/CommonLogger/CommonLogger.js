/**
  CommonLogger
*/
function CommonLogger() {
 function loggerMessage(mssg, type) {

  if (type == 20) {
   var a = success(mssg)
   logger.info(a)
   return a

  } else if (type == 30) {
   var b = warning(mssg)
   logger.warn(b)
   return b

  } else if (type == 50) {
   var c = error(mssg)
   logger.error(c)
   return c
  }
 }

 function success(mssg) {
  return JSON.stringify({
   connector: this.connector,
   serviceName: this.channelName,
   messageInfo: mssg,
   status: 'success',
   typeId: 20,
   date: new Date().toISOString()
  })
 }

 function warning(mssg) {
  return JSON.stringify({
   connector: this.connector,
   serviceName: this.channelName,
   messageInfo: mssg,
   status: 'warn',
   typeId: 30,
   date: new Date().toISOString()
  })
 }

 function error(mssg) {
  return JSON.stringify({
   connector: this.connector,
   serviceName: this.channelName,
   messageInfo: mssg,
   status: 'error',
   typeId: 50,
   date: new Date().toISOString()
  })
 }

 return {
  loggerMessage: loggerMessage
 }
}
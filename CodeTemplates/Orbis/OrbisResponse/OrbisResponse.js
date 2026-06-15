/**
	Response for the Orbis
*/
function OrbisResponse() {
	function outbound() {
		function resp(sourceMap, responseMap, message) {
			var sourceError = message.getConnectorMessages().get(0).getProcessingError()
			var destinations = sourceMap.get('destinationSet')
			var out = null
			var obj = {}

			/**
			  Failed for the transformation of message
			*/
			if (isEmpty(sourceError) == false) {
				obj.code = '520'
				obj.text = 'Unknown'
				obj.integrationId = message.getMessageId()
				obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
				obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
				return ResponseFactory.getErrorResponse(JSON.stringify(obj))
			}

			if (JSON.parse(message.getConnectorMessages().get(0).getEncodedData()).code && JSON.parse(message.getConnectorMessages().get(0).getEncodedData()).code >= 400) {
				var mandatoryResponse = JSON.parse(message.getConnectorMessages().get(0).getEncodedData())
				mandatoryResponse.integrationId = message.getMessageId()
				mandatoryResponse.serviceName = ChannelUtil.getChannelName(message.getChannelId())
				mandatoryResponse.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
				return ResponseFactory.getErrorResponse(JSON.stringify(mandatoryResponse))
			}

			if (destinations == null || destinations.size() < 1) {
				obj.code = '520'
				obj.text = 'Unknown'
				obj.integrationId = message.getMessageId()
				obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
				obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
				return ResponseFactory.getErrorResponse(JSON.stringify(obj))
			}

			var destinationList = [];
			destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

			for (var i = 0; i < destinationList.length; i++) {
				var response = responseMap.get(destinationList[i])

			    if (responseMap.get(destinationList[i]) == null) continue

				/**
				 Message Failed
				*/
				if (response.getStatus().toString() == 'ERROR' || response.getStatus().toString() == 'FILTERED') {
					var resp = null
					if (String(response.getMessage()).length != 0) {
						resp = JSON.parse(response.getMessage())
					} else {
						message.getConnectorMessages().forEach(e => {
							if (message.getConnectorMessages().get(e).getProcessingError() != null)
								resp = message.getConnectorMessages().get(e).getProcessingError()
						})
					}

					obj.code = '400'
					obj.text = 'Success'
					obj.integrationId = message.getMessageId()
					obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
					obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
					obj.trace = resp
					return ResponseFactory.getErrorResponse(JSON.stringify(obj))
				}

				/**
				 Message was sent with success
				*/
				if (response.getStatus().toString() == 'SENT') {
					obj.code = 201
					obj.text = 'Success'
					obj.integrationId = message.getMessageId()
					obj.serviceName = ChannelUtil.getChannelName(message.getChannelId())
					obj.date = DateUtil.getCurrentDate('yyyy-MM-dd HH:mm:ss')
					obj.trace = resp || null
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
					obj.trace = resp || null
					out = JSON.stringify(obj)
				}
			}

			if (JSON.parse(out).code <= 308) return ResponseFactory.getSentResponse(out)
			if (JSON.parse(out).code >= 500) return ResponseFactory.getErrorResponse(out)
		}
		return {
			resp: resp
		}
	}
	function inbound() {
		function resp(sourceMap, responseMap, message) {
			var destinations = sourceMap.get('destinationSet')
			const data = new XML(message.getConnectorMessages().get(0).getTransformedData())
			const dateTimeDefault = DateUtil.getCurrentDate('yyyyMMddHHmmss')
			const msgEvent = String(data['MSH']['MSH.9']['MSH.9.2'])
			const receiveApp = String(data['MSH']['MSH.3']['MSH.3.1'])
			const sendFacility = String(data['MSH']['MSH.4']['MSH.4.1'])
			const sendApp = String(data['MSH']['MSH.5']['MSH.5.1'])
			const messageId = String(data['MSH']['MSH.10']['MSH.10.1'])

			var destinationList = [];
			destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

			for (var i = 0; i < destinationList.length; i++) {
				var response = responseMap.get(destinationList[i])
				if (responseMap.get(destinationList[i]) == null) continue
				var responseMessage = String(response.getMessage()).trim()
				if (String(response.getMessage()).length <= 0 && responseMessage != "") {
					var msh = "MSH|^~\&|" + sendApp + "|" + sendFacility + "|" + receiveApp + "|" + sendFacility + "|" + dateTimeDefault + "||ACK^" + msgEvent + "^ACK|" + dateTimeDefault + "|P|2.5"
					var msa = "MSA|AE|Unknown error, please validate that the message structure is correct"
					var ack = msh + "\n" + msa
				} else if (String(response.getMessage()).trim() != "" && JSON.parse(response.getMessage()).hasOwnProperty('error')) {
					var msh = "MSH|^~\&|" + sendApp + "|" + sendFacility + "|" + receiveApp + "|" + sendFacility + "|" + dateTimeDefault + "||ACK^" + msgEvent + "^ACK|" + dateTimeDefault + "|P|2.5"
					var msa = "MSA|AE|" + messageId + "|" + JSON.parse(response.getMessage()).message

					var ack = msh + "\n" + msa

				} else {
					var msh = "MSH|^~\&|" + sendApp + "|" + sendFacility + "|" + receiveApp + "|" + sendFacility + "|" + dateTimeDefault + "||ACK^" + msgEvent + "^ACK|" + dateTimeDefault + "|P|2.5"
					var msa = "MSA|AA|" + messageId

					var ack = msh + "\n" + msa
				}

			}
			return ack
		}
		function processResponse() {
			var destinations = sourceMap.get('destinationSet')
			var destinationList = [];
			destinations.forEach(destinationIndex => destinationList.push('d' + destinationIndex));

			for (var i = 0; i < destinationList.length; i++) {
				if (responseMap.get(destinationList[i]) == null) continue
				var response = responseMap.get(destinationList[i])
				if (String(response.getMessage()).length <= 0) {
					var data = new XML(message.getConnectorMessages().get(0).getTransformedData())
					const dateTimeDefault = DateUtil.getCurrentDate('yyyyMMddHHmmss')
					const msgEvent = String(data['MSH']['MSH.9']['MSH.9.2'])
					const receiveApp = String(data['MSH']['MSH.3']['MSH.3.1'])
					const sendFacility = String(data['MSH']['MSH.4']['MSH.4.1'])
					const sendApp = String(data['MSH']['MSH.5']['MSH.5.1'])
					const messageId = String(data['MSH']['MSH.10']['MSH.10.1'])
					var msh = "MSH|^~\&|" + sendApp + "|" + sendFacility + "|" + receiveApp + "|" + sendFacility + "|" + dateTimeDefault + "||ACK^" + msgEvent + "^ACK|" + dateTimeDefault + "|P|2.5"
					var msa = "MSA|AE|" + messageId + "|Unknown error, please validate that the message structure is correct"

					ack = msh + "\n" + msa
				} else {
					logger.info('(response.getMessage() '+response.getMessage())
					//var ack = SerializerFactory.getSerializer('HL7V2').fromXML(response.getMessage())
					var ack = response.getMessage();
				}

			}
			return ack
		}
		function statusResponse() {
			if (String(response.getMessage()).length <= 0) {
				channelMap.put('statusResp', '500')
			}
			else if (String(response.getMessage()).length > 0) {
				const XMLResp = new XML(SerializerFactory.getSerializer('HL7V2').toXML(response.getMessage()))

				if (String(XMLResp['MSA']['MSA.1']['MSA.1.1']) == 'AA') {
					channelMap.put('statusResp', '201')
				} else {
					channelMap.put('statusResp', '500')
				}
			} else {
				channelMap.put('statusResp', '500')
			}
		}
		return {
			resp: resp,
			processResponse: processResponse,
			statusResponse: statusResponse
		}
	}

	function route(sourceMap, responseMap, message) {
		var sourceError = message.getConnectorMessages().get(0).getProcessingError()
		var destinations = sourceMap.get('destinationSet')
		var objRouter = {}

		/**
		  Failed for the transformation of message
		*/
		if (isEmpty(sourceError) == false || destinations == null || destinations.size() < 1) {
			globalChannelMap.put('status', '520')

			objRouter.code = '520'
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
		outbound: outbound,
		inbound: inbound,
		route: route
	}
}
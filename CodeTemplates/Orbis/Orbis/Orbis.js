/**
  Methods common to Orbis
*/
function Orbis() {
	const connectorName = String(connectorMessage.getConnectorName())
  /**
    Handle backend responses
  */
  function resp() {
    const resp = JSON.parse(response.getMessage())

    if (connectorName == 'http_get_poll_mDoc' && resp.response.length === 0) {
    	responseStatus = ERROR
    	return common_handlingLogMessage('Poll ID not found.', 'error')
    }

    if (resp.hasOwnProperty('status') && (resp.status === 500 || resp.status === 404 || resp.status == 'OK')) {
      responseStatus = SENT
    } else {
      responseStatus = ERROR
    }
    return response.getMessage()
  }

  /**
    Filter
  */
  function filter(data) {
  	if (connectorName == 'http_post_questionnaire_assignment_mDoc') {
  		const respGetPoll = $r('http_get_poll_mDoc').getStatus()

  		if (respGetPoll == 'ERROR') {
  			return false
  		}
  		return true
  	}
  }

  return {
    resp: resp,
    filter:filter
  }
}
/**
	Modify the description here. Modify the function name and parameters as needed. One function per
	template is recommended; create a new code template for each new function.
 
	@param {String} arg1 - arg1 description
	@return {String} return description
*/
function OrbisFilesV2() {
	const hl7 = Hl7v2()
	function outbound() {
 
		function mdmT02(data, application, facility){
			var lastCase = lastCase()
			logger.info(lastCase)
			if (lastCase.externalId != 0) {
				if(!data.hasOwnProperty("medicalCase")){
					data["medicalCase"] = lastCase
				}
		   	} else {
		    		// will throw error
		   	} 		   	
			function lastCase() {
		   		var index = 0;
		    		var cases = JSON.parse(responseMap.get("http_get_cases_mdoc").getMessage())
		    		var last = 0
		   		var resp = {}
		    		cases.forEach(e => {
		     		if (e.hasOwnProperty("start") && e.externalUniqueId != "" && e.start > last) {
//		      			index = e.externalUniqueId;
		      			last = e.start;
						resp = e
		     		}
		    		})
//		    		resp.externalUniqueId = index
//		    		resp.star = last
		    		return resp;
		   	}
 
			return hl7.outbound().mdmT02(data, application, facility)
		}
		return{
			mdmT02: mdmT02
		}
	}
	return {
		outbound: outbound
	}
}
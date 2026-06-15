var cases = JSON.parse(msg)
      var last = 0
      var resp = {}

      cases.forEach(e => {
        if (e.hasOwnProperty("start") && e.externalUniqueId != null && e.start > last) {
          resp = e;
          last = e.start;
        }
      })
     channelMap.put("lastCase", resp);
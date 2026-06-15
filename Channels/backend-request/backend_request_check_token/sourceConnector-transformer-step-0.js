var data = JSON.parse(connectorMessage.getRawData())
channelMap.put('url', JSON.parse(connectorMessage.getRawData()).url)
delete data.url
msg = data
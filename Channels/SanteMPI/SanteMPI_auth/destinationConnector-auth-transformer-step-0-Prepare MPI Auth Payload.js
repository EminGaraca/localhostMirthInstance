const d = JSON.parse(msg);

const oauth2Map = new java.util.HashMap();
oauth2Map.put('grant_type', d.grant_type);
oauth2Map.put('client_id', d.client_id);
oauth2Map.put('client_secret', d.client_secret);
oauth2Map.put('scope', d.scope);

channelMap.put('oauth2Map', oauth2Map);
google_api = {
    getClientId: async () => {
        let clientId = await utils.cache_get('clientId', "local");

        if (!clientId) {
            clientId = self.crypto.randomUUID();
            await utils.cache_set('clientId', clientId, "local");
        }
        return clientId;
    },

    getSessionId: async () => {
        let session_id = await utils.cache_get('sessionId', "local");
        let currentTimeInMs = Date.now();

        if (!session_id) {
            session_id = currentTimeInMs.toString(),
                await utils.cache_set("sessionId", session_id, "local");
        }

        return session_id;
    },
    sendTracking: async (type, data) => {
        //let GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect?v=1';
        let GA_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect?v=1';
        let MEASUREMENT_ID = `G-4NJZQNDLCJ`;
        let API_SECRET = await utils.getApiKey("google");
        let Client_ID = await google_api.getClientId();
        let Session_ID = await google_api.getSessionId();

        if (type == "page_view") {
            dimensions = (window.screen.width * window.devicePixelRatio) + "x" + (window.screen.height * window.devicePixelRatio);
            payload = {
                name: type,
                params: {
                    session_id: Session_ID,
                    engagement_time_msec: 100,
                    page_title: data.Title,
                    page_location: data.Location,
                    resolution: dimensions,
                    version: await utils.getExtensionVersion()
                },
            };
        }
        else if (type == "API") {
            payload = {
                name: data.service,
                params: {
                    session_id: Session_ID,
                    engagement_time_msec: 100,
                    target: data.target,
                    version: await utils.getExtensionVersion()
                },
            };
        }

        if (payload) {
            fetch(`${GA_ENDPOINT}&measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        client_id: Client_ID,
                        events: [payload],
                    }),
                }
            );
        }
    }
};
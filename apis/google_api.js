google_api = {
    getClientId: async () => {
        let clientId = await utils.cache_get('gcid', "local");

        if (!clientId) {
            clientId = self.crypto.randomUUID();
            await utils.cache_set('gcid', clientId, "local");
        }
        return clientId;
    },

    getSessionId: async () => {
        let session_id = await utils.cache_get('gsid', "local");
        let currentTimeInMs = Date.now();

        if (!session_id) {
            session_id = currentTimeInMs.toString(),
                await utils.cache_set("gsid", session_id, "local");
        }

        return session_id;
    },
    sendTracking: async (type, data) => {
        let debugMode = false;
        let GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect?v=2&npa=1';
        //let GA_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect?v=2&npa=1';
        let MEASUREMENT_ID = `G-4NJZQNDLCJ`;
        let API_SECRET = await utils.getApiKey("google");
        let Client_ID = await google_api.getClientId();
        let Session_ID = await google_api.getSessionId();
        let dimensions = (window.screen.width * window.devicePixelRatio) + "x" + (window.screen.height * window.devicePixelRatio);
        let version = await utils.getExtensionVersion();
        let Engagement_Time = 100;

        if (type == "page_view") {
            payload = {
                name: type,
                params: {
                    page_title: data.Title,
                    page_location: data.Location
                },
            };
        }
        else if (type == "API") {
            payload = {
                name: type,
                params: {
                    api_name: data.service,
                    api_target: data.target
                },
            };
        }

        if (debugMode) {
            payload.params.debug_mode = debugMode;
        }

        payload.params.session_id = Session_ID;
        payload.params.engagement_time_msec = Engagement_Time;
        payload.params.version = version;
        payload.params.screen_resolution = dimensions;

        if (payload) {
            fetch(`${GA_ENDPOINT}&measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}&sr=${dimensions}&av=${version}`,
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
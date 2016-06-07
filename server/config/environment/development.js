'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
    mongo: {
        uri: 'mongodb://localhost/dashboard-dev'
    },

    sp: {
        STORMPATH_API_KEY_ID: '2XWKBCBT8JXO4PE4OFM6RLZIQ',
        STORMPATH_API_KEY_SECRET: 'TimVflOwd7zkVH6wOLdRg0p7cVU+MhQRgSu3mI3nJkc',
        STORMPATH_APP_HREF: 'https://api.stormpath.com/v1/applications/4wDC5hbVrqvQRfJS5GMGru',
    },

    test: {
        apiServer: 'localhost',
        apiServerPort: '9000',
        apiServerURI: 'http://localhost:9000/api/v1.0',
    },

    uber: {
        UBER_SERVER_TOKEN : 'pzj6VnHMUL0cyj8Ipan4_GUyPIjUrj5yU3pN9tD0',
    },
    
    prevoty: {
        PREVOTY_API_KEY : 'd2e635a1-ab04-4bce-a211-56cf44214ae9',
        PREVOTY_CONTENT_KEY : 'daea42e3-29f1-485e-a185-054f877dac2a',
        PREVOTY_MTA_CONTENT_POLICY_KEY : 'b45bd53d-4c2b-4c6a-9a9f-76e667ce1c17',
    },
    seedDB: true
};

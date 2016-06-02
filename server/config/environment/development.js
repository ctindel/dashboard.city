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
        STORMPATH_APP_HREF: 'https://api.stormpath.com/v1/applications/4wDC5hbVrqvQRfJS5GMGru'
    },

    test: {
        apiServer: 'localhost',
        apiServerPort: '9000',
        apiServerURI: 'http://localhost:9000/api/v1.0'
    },

    seedDB: true
};

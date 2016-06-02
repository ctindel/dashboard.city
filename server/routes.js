/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(config, app, mongoose) {

    var apiRoutes = require('./api');

    apiRoutes.addAPIRouter(config, app, mongoose);

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*') .get(function(req, res) {
        console.log("appPath is " + __dirname);
        res.sendFile(__dirname + '/index.html');
    });
};

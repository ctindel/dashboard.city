'use strict';

var express = require('express');
var UserController = require('./user/user.controller');
var exSp = require('express-stormpath');

module.exports.addAPIRouter = function(config, app, mongoose) { 

    var router = express.Router();
    var models = require('./models/models')(mongoose);
    app.set('dashboardModels', models);

    router.use(exSp.init(app, {
        apiKey : { 
            id: config.sp.STORMPATH_API_KEY_ID,
            secret: config.sp.STORMPATH_API_KEY_SECRET 
        },
        application: {
            href: config.sp.STORMPATH_APP_HREF
        }
    }));

    var uc = new UserController(app, mongoose);

    router.use(function(req, res, next) {
        res.contentType('application/json');
        next();
    });

//    app.post('/api/*', function(req, res, next) {
//        res.contentType('application/json');
//        next();
//    });
//
//    app.put('/api/*', function(req, res, next) {
//        res.contentType('application/json');
//        next();
//    });
//
//    app.delete('/api/*', function(req, res, next) {
//        res.contentType('application/json');
//        next();
//    });

    router.get('/', function(req, res) {
        res.json({ message: 'hooray! welcome to our api!' });
    });

    router.post('/user/enroll', uc.enroll);

    router.get('/locations', exSp.loginRequired, uc.getLocations);
    router.put('/locations', exSp.loginRequired, uc.addLocation);
    router.delete('/locations', exSp.loginRequired, uc.removeLocation);

    app.use('/api/v1.0', router);
}

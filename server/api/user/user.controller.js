'use strict';

var _ = require('lodash');
var validator = require('validator');
var async = require('async');
var _mongoose = null;
var _models = null;
var _UserModel = null;
var _logger = null;

module.exports = UserController;

function UserController(app, mongoose) {
    _mongoose = mongoose;
    _models = app.get('dashboardModels');
    _UserModel = _models.UserModel;
    _logger = app.get('dashboardLogger');
}

UserController.prototype.enroll = function(req, res) {
    var errStr = undefined;

    // Structure required by Stormpath API
    var account = {};
    account.givenName = account.surname = account.username = account.email
        = account.password = undefined;

    if (undefined == req.param('firstName')) {
        errStr = "Undefined First Name";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    } else if (undefined == req.param('lastName')) {
        errStr = "Undefined Last Name";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    } else if (undefined == req.param('email')) {
        errStr = "Undefined Email";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    } else if (undefined == req.param('password')) {
        errStr = "Undefined Password";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    }
    if (!validator.isEmail(req.param('email'))) {
        res.status(400);
        res.json({error: 'Invalid email format'})
        return;
    }
    _UserModel.find({'email' : req.param('email')}, function dupeEmail(err, results) {
        if (err) {
            _logger.debug("Error from dupeEmail check");
            console.dir(err);
            res.status(400);
            res.json(err);
            return;
        }
        if (results.length > 0) {
            res.status(400);
            res.json({error: 'Account with that email already exists.  Please choose another email.'});
            return;
        } else {
            account.givenName = req.param('firstName');
            account.surname = req.param('lastName');
            account.username = req.param('email');
            account.email = req.param('email');
            account.password = req.param('password');

            _logger.debug("Calling stormPath createAccount API");
            req.app.get('stormpathApplication').createAccount(account, function(err, acc) {
                if (err) {
                    _logger.debug("Stormpath error: " + err.developerMessage);
                    res.status(400);
                    res.json({error: err.userMessage});
                } else {
                    console.dir(acc);
                    acc.createApiKey(function(err,apiKey) {
                        if (err) {
                            _logger.debug("Stormpath error: " + err.developerMessage);
                            res.status(400);
                            res.json({error: err.userMessage});
                        } else {
                            _logger.debug(apiKey);
                            _logger.debug("Successfully created new SP account for "
                                        + "firstName=" + acc.givenName
                                        + ", lastName=" + acc.surname
                                        + ", email=" + acc.email);
                            var newUser = new _UserModel(
                                {
                                  active: true,
                                  email: acc.email,
                                  firstName: acc.givenName,
                                  lastName: acc.surname,
                                  spApiKeyId: apiKey.id,
                                  spApiKeySecret: apiKey.secret
                                });
                            newUser.save(function (err, user) {
                                if (err) {
                                    _logger.error("Mongoose error creating new account for " + user.email);
                                    _logger.error(err);
                                    res.status(400);
                                    res.json({error: err});
                                } else {
                                    _logger.debug("Successfully added User object for " + user.email);
                                    res.status(201);
                                    res.json(user);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

UserController.prototype.getLocations = function(req, res) {
    _logger.debug('Router for GET /locations');

    var user = null;
    var errStr = null;
    var resultStatus = null;
    var resultJSON = {locations : []};

    if(req.authenticationError){
        console.log("Authentication Error: ");
        console.dir(req.authenticationError);
    }

    var getUserLocationsTasks = [
        function findUser(cb) {
            _UserModel.find({'email' : req.user.email}, function(err, users) {
                if (err) {
                    errStr = 'Internal error with mongoose looking user ' + req.user.email;
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }

                if (users.length == 0) {
                    errStr = 'Stormpath returned an email ' + req.user.email + ' for which we dont have a matching user object';
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }
                user = users[0];
                resultJSON['locations'] = user['locations'];
                cb(null);
            });
        }
    ]

    async.series(getUserLocationsTasks, function finalizer(err, results) {
        if (null == resultStatus) {
            res.status(200);
        } else {
            res.status(resultStatus);
        }
        res.json(resultJSON);
    });
};

UserController.prototype.addLocation = function(req, res) {
    _logger.debug('Router for PUT /locations');

    var user = null;
    var errStr = null;
    var resultStatus = null;
    var resultJSON = {feeds : []};
    var locationName = req.param('locationName');
    var locationPostalCode = req.param('locationPostalCode');

    if(req.authenticationError){
        console.log("Authentication Error: ");
        console.dir(req.authenticationError);
    }

    if (undefined == locationName) {
        errStr = "Undefined Location Name";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    } else if (undefined == locationPostalCode) {
        errStr = "Undefined Location Zip";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    }

    _logger.debug('Adding locationName "' + locationName + 
                  '", locationPostalCode "' + locationPostalCode + 
                  '" for ' + req.user.email);

    var addLocationsTasks = [
        function findUser(cb) {
            _UserModel.find({'email' : req.user.email}, function(err, users) {
                if (err) {
                    errStr = 'Internal error with mongoose looking user ' + req.user.email;
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }

                if (users.length == 0) {
                    errStr = 'Stormpath returned an email ' + req.user.email + ' for which we dont have a matching user object';
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }
                user = users[0];
                cb(null);
            });
        },
        function checkLocationCount(cb) {
            if (user.locations.length > _models['MAX_USER_LOCATIONS']) {
                errStr = 'Max location count of ' +
                         _models['MAX_USER_LOCATIONS'] + ' reached for ' +
                         req.user.email;
                resultStatus = 403;
                resultJSON = { error : errStr };
                _logger.debug(errStr);
                cb(new Error(errStr));
                return;
            }
            cb(null);
        },
        function addLocationToUser(cb) {
            user.locations.addToSet({'name' : locationName, 'postalCode' : locationPostalCode});
            user.save(function(err, user) {
                if (err && null == resultStatus) {
                    errStr = 'Error saving user ' + user.email
                             + ' ' + JSON.stringify(err);
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                    return;
                } else {
                    _logger.debug('Successfully added locationName "' + locationName + 
                                  '", locationPostalCode "' + locationPostalCode + 
                                  '" for ' + req.user.email);
                    resultJSON = {'user' : user};
                    cb(null);
                }
            });
        }
    ]

    async.series(addLocationsTasks, function finalizer(err, results) {
        if (null == resultStatus) {
            res.status(200);
        } else {
            res.status(resultStatus);
        }
        res.json(resultJSON);
    });
};

UserController.prototype.removeLocation = function(req, res) {
    _logger.debug('Router for DELETE /locations');

    var user = null;
    var errStr = null;
    var resultStatus = null;
    var resultJSON = {feeds : []};
    var locationName = req.param('locationName');
    var locationPostalCode = req.param('locationPostalCode');
    var state = {};

    if(req.authenticationError){
        console.log("Authentication Error: ");
        console.dir(req.authenticationError);
    }

    if (undefined == locationName) {
        errStr = "Undefined Location Name";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    } else if (undefined == locationPostalCode) {
        errStr = "Undefined Location Zip";
        _logger.debug(errStr);
        res.status(400);
        res.json({error: errStr});
        return;
    }

    _logger.debug('Removing locationName "' + locationName + 
                  '", locationPostalCode "' + locationPostalCode + 
                  '" for ' + req.user.email);

    var removeLocationsTasks = [
        function findUser(cb) {
            _UserModel.find({'email' : req.user.email}, function(err, users) {
                if (err) {
                    errStr = 'Internal error with mongoose looking user ' + req.user.email;
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }

                if (users.length == 0) {
                    errStr = 'Stormpath returned an email ' + req.user.email + ' for which we dont have a matching user object';
                    resultStatus = 400;
                    resultJSON = { error : errStr };
                    _logger.debug(errStr);
                    cb(new Error(errStr));
                }
                user = users[0];
                cb(null);
            });
        },
        function checkLocationExists(cb) {
            var found = false;

            user.locations.forEach(function checkLocation(loc, index, array) {
                if (loc.name == locationName && loc.postalCode == locationPostalCode) {
                    found = true;
                    // This is faster than trying to reload the object from the
                    // db afer we do the update
                    user.locations.splice(index, 1);
                }
            }); 
            if (false == found) {
                errStr = 'User does not have location locationName "' + locationName +
                                 '", locationPostalCode "' + locationPostalCode + '"';
                resultStatus = 404;
                resultJSON = { error : errStr };
                _logger.debug(errStr);
                cb(new Error(errStr));
                return;
            }
            cb(null);
        },
        function removeLocationFromUser(cb) {
            user.update( 
                { $pull: { locations : { name : locationName, postalCode : locationPostalCode } } },
                { safe : true },
                function removeLocationCB(err, result) {
                    if (err) {
                        errStr = 'Error removing locationName "' + locationName + 
                                 '", locationPostalCode "' + locationPostalCode + 
                                 '" for ' + req.user.email + ": " + JSON.stringify(err);
                        resultStatus = 400;
                        resultJSON = { error : errStr };
                        _logger.debug(errStr);
                        cb(new Error(errStr));
                        return;
                    } else {
                        _logger.debug('Successfully removed locationName "' + locationName + 
                                      '", locationPostalCode "' + locationPostalCode + 
                                      '" for ' + req.user.email);
                        resultJSON = {'user' : user};
                        cb(null);
                    }
                }
            );
        }
    ]

    async.series(removeLocationsTasks, function finalizer(err, results) {
        if (null == resultStatus) {
            res.status(200);
        } else {
            res.status(resultStatus);
        }
        res.json(resultJSON);
    });
};

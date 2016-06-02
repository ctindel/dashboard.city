TU_EMAIL_REGEX = new RegExp('^testuser*');
SP_APP_NAME = 'Dashboard.City Dev';
TEST_CREDS_TMP_FILE = '/tmp/dashboardTestCreds.js';

var async = require('async');
var config = require('../config/environment');
var mongodb = require('mongodb');
var http = require('http');
assert = require('assert');

var uri = config.test.apiServerURI;
var mongoClient = mongodb.MongoClient
var dashboard_db = null;
var users_array = null;
var qs = require('qs');

writeCredsArray = [
    function connectDB(callback) {
        mongoClient.connect(config.mongo.uri, function(err, db) {
            assert.equal(null, err);
            dashboard_db = db; 
            callback(null);
        });
    },
    function lookupUserKeys(callback) {
        console.log("lookupUserKeys");
        user_coll = dashboard_db.collection('user');
        user_coll.find({email : TU_EMAIL_REGEX}).toArray(function(err, users) {
            users_array = users;
            callback(null);
        });
    },
    function getUserTokens(callback) {
        console.log("getUserTokens");
        var numTokens = 0;
        var postData = qs.stringify({ 'grant_type' : 'client_credentials' });

        users_array.forEach(function genToken(user, index, array) {
            var options = {
                hostname: config.test.apiServer,
                auth: user.spApiKeyId + ':' + user.spApiKeySecret,
                port: config.test.apiServerPort,
                path: '/api/v1.0/oauth/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            var req = http.request(options, function(res) {
                var responseString = '';

                res.setEncoding('utf8');
                if (res.statusCode != 200) {
                    throw new Error("Error with oauth token, status code " + res.statusCode);
                }

                res.on('data', function (chunk) {
                    responseString += chunk;
                });

                res.on('end', function() {
                    var responseObject = JSON.parse(responseString);
                    user.token = responseObject;
                    numTokens++;
                    if (numTokens == users_array.length) {
                        callback(null);
                    }
                });

            });
            req.write(postData);
            req.end();
        }); 
    },
    function writeCreds(callback) {
        console.log("writeCreds");
        var fs = require('fs');
        fs.writeFileSync(TEST_CREDS_TMP_FILE, 'TEST_USERS = ');
        fs.appendFileSync(TEST_CREDS_TMP_FILE, JSON.stringify(users_array));
        fs.appendFileSync(TEST_CREDS_TMP_FILE, '; module.exports = TEST_USERS;');
        callback(0);
    },
    function closeDB(callback) {
        dashboard_db.close();
    },
    function callback(err, results) {
        console.log("Write creds callback");
        console.log("Results: %j", results);
    }
]

async.series(writeCredsArray);

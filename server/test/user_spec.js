TEST_USERS = require('/tmp/dashboardTestCreds.js');

var frisby = require('frisby');
var async = require('async');
var config = require('../config/environment');

var tu1Home = { name : 'Home', postalCode: '10017' };
var tu1Work = { name : 'Work', postalCode: '10005' };
var tu2Office = { name : 'Office', postalCode: '10006' };


var uri = config.test.apiServerURI;

userTestArray = [
    function addEmptyLocationListTest(callback) {
        var user = TEST_USERS[0];
        frisby.create('GET empty location list for user ' + user.email)
            .get(uri + '/locations')
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSON({locations : []})
            .toss()
        callback(null);
    },
    function addOneLocation(callback) {
        var user = TEST_USERS[0];
        frisby.create('PUT Add location for user ' + user.email)
            .put(uri + '/locations',
                 {'locationName' : tu1Home.name, 'locationPostalCode' : tu1Home.postalCode })
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSONLength('user.locations', 1)
            .toss()
        callback(null);
    },
    function addDuplicateLocation(callback) {
        var user = TEST_USERS[0];
        frisby.create('PUT Add duplicate location for user ' + user.email)
            .put(uri + '/locations',
                 {'locationName' : tu1Home.name, 'locationPostalCode' : tu1Home.postalCode })
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSONLength('user.locations', 1)
            .toss()
        callback(null);
    },
    function addSecondLocation(callback) {
        var user = TEST_USERS[0];
        frisby.create('PUT Add second location for user ' + user.email)
            .put(uri + '/locations',
                 {'locationName' : tu1Work.name, 'locationPostalCode' : tu1Work.postalCode })
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSONLength('user.locations', 2)
            .toss()
        callback(null);
    },
    function addOneLocationSecondUser(callback) {
        var user = TEST_USERS[1];
        frisby.create('PUT Add location for user ' + user.email)
            .put(uri + '/locations',
                 {'locationName' : tu2Office.name, 'locationPostalCode' : tu2Office.postalCode })
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSONLength('user.locations', 1)
            .toss()
        callback(null);
    },
    function deleteLocation(callback) {
        var user = TEST_USERS[0];
        frisby.create('DELETE Remove location for user ' + user.email)
            .delete(uri + '/locations',
                 {'locationName' : tu1Work.name, 'locationPostalCode' : tu1Work.postalCode })
            .addHeader('Authorization', 'Bearer ' + user.token.access_token)
            .expectStatus(200)
            .expectHeader('Content-Type', 'application/json; charset=utf-8')
            .expectJSONLength('user.locations', 1)
            .toss()
        callback(null);
    },
]

async.series(userTestArray);

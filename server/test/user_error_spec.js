TEST_USERS = require('/tmp/dashboardTestCreds.js');

var frisby = require('frisby');
var async = require('async');
var config = require('../config/environment');

var tu1Home = { name : 'Home', zip: '10017' };
var tu1Work = { name : 'Work', zip: '10005' };
var tu2Office = { name : 'Office', zip: '10006' };

var uri = config.test.apiServerURI;

var user = TEST_USERS[0];

frisby.create('PUT missing locationName for user ' + user.email)
    .put(uri + '/locations',
         {'locationZip' : tu1Home.zip })
    .addHeader('Authorization', 'Bearer ' + user.token.access_token)
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined Location Name'})
    .toss()

frisby.create('PUT missing locationZip for user ' + user.email)
    .put(uri + '/locations',
         {'locationName' : tu1Home.name })
    .addHeader('Authorization', 'Bearer ' + user.token.access_token)
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined Location Zip'})
    .toss()

frisby.create('DELETE missing locationName for user ' + user.email)
    .delete(uri + '/locations',
         {'locationZip' : tu1Home.zip })
    .addHeader('Authorization', 'Bearer ' + user.token.access_token)
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined Location Name'})
    .toss()

frisby.create('DELETE missing locationZip for user ' + user.email)
    .delete(uri + '/locations',
         {'locationName' : tu1Home.name })
    .addHeader('Authorization', 'Bearer ' + user.token.access_token)
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined Location Zip'})
    .toss()

frisby.create('DELETE Remove unknown location for user ' + user.email)
    .delete(uri + '/locations',
         {'locationName' : 'foo', 'locationZip' : 'bar' })
    .addHeader('Authorization', 'Bearer ' + user.token.access_token)
    .expectStatus(404)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'User does not have location locationName "foo", locationZip "bar"'})
    .toss()

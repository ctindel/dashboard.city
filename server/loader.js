/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var WEATHER_POLLING_INTERVAL_MINS = 60;
var UBER_POLLING_INTERVAL_MINS = 3;
var TRANSIT_POLLING_INTERVAL_MINS = 5;

var WEATHER_API_BASE_URL = 'http://forecast.weather.gov/MapClick.php?';
var UBER_API_BASE_URL = 'https://api.uber.com/v1/products';
var MTA_API_BASE_URL = 'http://web.mta.info/status/serviceStatus.txt';

var MTA_SERVICE_TYPES = [
    { 'tag' : 'subway', 'docVar' : 'subway' },
    { 'tag' : 'bus', 'docVar' : 'bus' },
    { 'tag' : 'BT', 'docVar' : 'bridgeTunnel' },
    { 'tag' : 'LIRR', 'docVar' : 'lirr' },
    { 'tag' : 'MetroNorth', 'docVar' : 'mnr' },
];

var fs = require('fs');
var mongoose = require('mongoose');
var config = require('./config/environment');
var zipp = require('node-zippopotamus');
var models = require('./api/models/models')(mongoose);
var async = require('async');
var moment = require('moment');
var request = require('request');
var uber = require('uber-api')({server_token : config.uber.UBER_SERVER_TOKEN});
var prevoty = require('prevoty').client({ key: config.prevoty.PREVOTY_API_KEY });
var S = require('string');
var cheerio = require('cheerio');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.set('debug', true);

function verifyPrevoty() {
    return function(next) {
        prevoty.verify(function(err, verified) {
            if (!verified) {
                return next(err);
            }
            return next();
        });
    }
}

function bootstrapPostalCodes() {
    return [10017, 10453, 11372];

    var nycZips = [];
    // Bronx   
    // Central Bronx   
    nycZips.push(10453, 10457, 10460);
    // Bronx Park and Fordham  
    nycZips.push(10458, 10467, 10468);
    //High Bridge and Morrisania  
    nycZips.push(10451, 10452, 10456);
    //Hunts Point and Mott Haven  
    nycZips.push(10454, 10455, 10459, 10474);
    //Kingsbridge and Riverdale
    nycZips.push(10463, 10471);
    //Northeast Bronx 
    nycZips.push(10466, 10469, 10470, 10475);
    //Southeast Bronx 
    nycZips.push(10461, 10462,10464, 10465, 10472, 10473);

    //Brooklyn    
    //Central Brooklyn    
    nycZips.push(11212, 11213, 11216, 11233, 11238);
    //Southwest Brooklyn  
    nycZips.push(11209, 11214, 11228);
    //Borough Park    
    nycZips.push(11204, 11218, 11219, 11230);
    //Canarsie and Flatlands  
    nycZips.push(11234, 11236, 11239);
    //Southern Brooklyn   
    nycZips.push(11223, 11224, 11229, 11235);
    //Northwest Brooklyn  
    nycZips.push(11201, 11205, 11215, 11217, 11231);
    //Flatbush    
    nycZips.push(11203, 11210, 11225, 11226);
    //East New York and New Lots  
    nycZips.push(11207, 11208);
    //Greenpoint  
    nycZips.push(11211, 11222);
    //Sunset Park 
    nycZips.push(11220, 11232);
    //Bushwick and Williamsburg   
    nycZips.push(11206, 11221, 11237);

    //Manhattan   
    //Central Harlem  
    nycZips.push(10026, 10027, 10030, 10037, 10039);
    //Chelsea and Clinton 
    nycZips.push(10001, 10011, 10018, 10019, 10020, 10036);
    //East Harlem 
    nycZips.push(10029, 10035);
    //Gramercy Park and Murray Hill   
    nycZips.push(10010, 10016, 10017, 10022);
    //Greenwich Village and Soho  
    nycZips.push(10012, 10013, 10014);
    //Lower Manhattan 
    nycZips.push(10004, 10005, 10006, 10007, 10038, 10280);
    //Lower East Side 
    nycZips.push(10002, 10003, 10009);
    //Upper East Side 
    nycZips.push(10021, 10028, 10044, 10065, 10075, 10128);
    //Upper West Side 
    nycZips.push(10023, 10024, 10025);
    //Inwood and Washington Heights   
    nycZips.push(10031, 10032, 10033, 10034, 10040);

    //Queens  
    //Northeast Queens    
    nycZips.push(11361, 11362, 11363, 11364);
    //North Queens    
    nycZips.push(11354, 11355, 11356, 11357, 11358, 11359, 11360);
    //Central Queens  
    nycZips.push(11365, 11366, 11367);
    //Jamaica 
    nycZips.push(11412, 11423, 11432, 11433, 11434, 11435, 11436);
    //Northwest Queens    
    nycZips.push(11101, 11102, 11103, 11104, 11105, 11106);
    //West Central Queens 
    nycZips.push(11374, 11375, 11379, 11385);
    //Rockaways   
    nycZips.push(11691, 11692, 11693, 11694, 11695, 11697);
    //Southeast Queens    
    nycZips.push(11004, 11005, 11411, 11413, 11422, 11426, 11427, 11428, 11429);
    //Southwest Queens    
    nycZips.push(11414, 11415, 11416, 11417, 11418, 11419, 11420, 11421);
    //West Queens 
    nycZips.push(11368, 11369, 11370, 11372, 11373, 11377, 11378);

    //Staten Island   
    //Port Richmond   
    nycZips.push(10302, 10303, 10310);
    //South Shore 
    nycZips.push(10306, 10307, 10308, 10309, 10312);
    //Stapleton and St. George    
    nycZips.push(10301, 10304, 10305);
    //Mid-Island  
    nycZips.push(10314);
    return nycZips;
}

function loadPostalCodes() {
    var fnArray = [];

    bootstrapPostalCodes().forEach(function checkLocation(postalCode, index, array) {
        fnArray.push(function(next) {
            models.LocationModel.find({'postalCode' : postalCode}, function (err, results) {
                if (err) {
                    console.dir(err);
                    return process.nextTick(function() { next(err); });
                }
                if (results.length == 0) {
                    zipp('us', postalCode, function (err, result) {
                        var newLoc = new models.LocationModel(
                            {
                                country: result['country'],
                                countryAbbreviation: result['country abbreviation'],
                                postalCode: postalCode,
                                name: result['places'][0]['place name'],
                                state: result['places'][0]['state'],
                                stateAbbreviation: result['places'][0]['state abbreviation'],
                                geometry: { coordinates :
                                            [result['places'][0]['longitude'],
                                             result['places'][0]['latitude']]
                                }
                        });
                        newLoc.save(function (err, loc) {
                            if (err) {
                                console.log("Mongoose error creating new location for postalCode " + postalCode);
                            } else {
                                console.log("Successfully save Location object for postalCode " + postalCode);
                            }
                            return process.nextTick(next);
                        });
                    });
                } else {
                    console.log(postalCode + " already loaded");
                    return process.nextTick(next);
                }
            });
        });
    });
    
    return fnArray;
}

// Information about the weather.gov API here:
// http://graphical.weather.gov/xml/
function loadWeatherStatus(postalCode) {
    return function(next) {
        models.LocationModel.find({'postalCode' : postalCode}, function (err, locations) {
            if (err) {
                return process.nextTick(function() { next(err) } );
            }
            if (locations.length !== 1) {
                return process.nextTick(function() { 
                    next(new Error('loadWeatherStatus: invalid location result set size ' + locations.length))
                });
            }

            var loc = locations[0];
            var now = moment();
            var lastUpdated = moment(loc.weatherStatus.lastUpdated);

            // loc.weatherStatus.data.forecast.length is 0 only during initial load
            if (lastUpdated.add(WEATHER_POLLING_INTERVAL_MINS, 'minutes').isBefore(now) || 
                loc.weatherStatus.data.forecast.length === 0) {
                console.log("Time to lookup weather status again for location: " + loc.postalCode);
            } else {
                console.log("Not yet time to lookup weather status again for location: " + loc.postalCode);
                return process.nextTick(next);
            }

            var newWeatherStatus = {lastUpdated : new Date(), data : {}};

            var url = WEATHER_API_BASE_URL +
                      'lat='+loc.geometry.coordinates[1] +
                      '&lon='+loc.geometry.coordinates[0] +
                      '&FcstType=json';
            // We have to fill out the User-Agent or we get denied
            var options = {'url' : url, headers : {'User-Agent' : 'Mozilla/5.0'}};

            request(options, function (err, response, body) {
                console.log('loadWeatherStatus: loc=%s url=%s', loc.name, url);

                if (err) {
                    return process.nextTick(function() { next(err) } );
                }

                if (response.statusCode != 200) {
                    return process.nextTick(function() { 
                        next(new Error('loadWeatherStatus: ' + url + 
                                       ' returned statusCode ' + response.statusCode));
                    });
                }

                var res = JSON.parse(body);
                //console.dir(res);
                newWeatherStatus.info = {
                    'siteId' : res.currentobservation.id,
                    'siteName' : res.currentobservation.name,
                };
                var weather = {
                    'current' : {
                        'temp' : res.currentobservation.Temp,
                        'winds' : res.currentobservation.Winds,
                        'relativeHumidity' : res.currentobservation.Relh,
                        'description' : res.currentobservation.Weather,
                        'image' : res.currentobservation.Weatherimage},
                    'forecast' : [],
                };
                var firstDate = moment(res.time.startValidTime[0]);
                var stopDate = firstDate.add(1, 'days');

                var date;
                var ndx = 0;

                // There can be at most 8 6-hour increments for today and tomorrow
                // So we'll make sure we don't go past the 9th element
                for (ndx = 0; ndx < 9; ndx++) {
                    date = moment(res.time.startValidTime[ndx]);
                    console.log("date: %s", date.toString());
                    if (date.isAfter(stopDate)) {
                        break;
                    }
                    var forecast = {
                        'periodName' : res.time.startPeriodName[ndx],
                        'tempLabel' : res.time.tempLabel[ndx],
                        'temp' : res.data.temperature[ndx],
                        'iconLink' : res.data.iconLink[ndx],
                        'shortDescription' : res.data.weather[ndx],
                        'longDescription' : res.data.text[ndx],
                        'hazard' : res.data.hazard[ndx],
                        'hazardUrl' : res.data.hazardUrl[ndx]
                    };
                    if (res.data.hazard[ndx]) {
                        forecast.hazard = res.data.hazard[ndx];
                    }
                    if (res.data.hazardUrl[ndx]) {
                        forecast.hazardUrl = res.data.hazardUrl[ndx];
                    }
                    weather.forecast.push(forecast);
                }
                newWeatherStatus.data = weather;
                loc.update({'$set' : {'weatherStatus' : newWeatherStatus}}, function (err, numberAffected, raw) {
                    if (err) {
                        return process.nextTick(function() { next(err) } );
                    };
                    return process.nextTick(next);
                });
            });
        });
    }
}

function loadUberStatus(postalCode) {
    return function(next) {
        models.LocationModel.find({'postalCode' : postalCode}, function (err, locations) {
            if (err) {
                return process.nextTick(function() { next(err) } );
            }
            if (locations.length !== 1) {
                return process.nextTick(function() { 
                    next(new Error('loadUberStatus: invalid location result set size ' + locations.length))
                });
            }

            var loc = locations[0];
            var now = moment();
            var lastUpdated = moment(loc.transitStatus.lastUpdated);

            // loc.uberStatus.data.products.length is 0 only during initial load
            if (lastUpdated.add(UBER_POLLING_INTERVAL_MINS, 'minutes').isBefore(now) || 
                loc.uberStatus.data.products.length === 0) {
                console.log("Time to lookup Uber status again for location: " + loc.postalCode);
            } else {
                console.log("Not yet time to lookup Uber status again for location: " + loc.postalCode);
                return process.nextTick(next);
            }

            var newUberStatus = {
                lastUpdated : new Date(), 
                data : { 
                    products : []
                }
            };

            var params = {
                sLat : loc.geometry.coordinates[1],
                eLat : loc.geometry.coordinates[1],
                sLng : loc.geometry.coordinates[0],
                eLng : loc.geometry.coordinates[0],
            };
            // We have to use the getPriceEstimate function in order
            // for the surge_multiplier field to show up
            uber.getPriceEstimate(params, function(err, response) {
//            var params = {
//                lat : loc.geometry.coordinates[1],
//                lng : loc.geometry.coordinates[0]
//            };
//            uber.getProducts(params, function(err, response) {
                if (err) {
                    return process.nextTick(function() { next(err) } );
                } else {
                    console.log("%j", response);
                    response.prices.forEach(function processProduct(prod) {
                    //response.products.forEach(function processProduct(prod) {
                        var product = { name : prod.display_name,
                                        surgeMultiplier : prod.surge_multiplier };
                        newUberStatus.data.products.push(product);
                    });
                    loc.update({'$set' : {'uberStatus' : newUberStatus}}, function (err, numberAffected, raw) {
                        if (err) {
                            return process.nextTick(function() { next(err) } );
                        };
                        return process.nextTick(next);
                    });
                }
            });
        });
    }
}

function sanitizeText(newTransitStatus, serviceType, mtaStatus, dirtyText) {
    return function(next) {
        console.log("Calling prevoty.filterContent for dirtyText=\"%s\"", dirtyText);
        prevoty.filterContent(dirtyText,
                              config.prevoty.PREVOTY_MTA_CONTENT_POLICY_KEY,
                              function(err, filtered) {
            if (err) {
                return process.nextTick(function() { next(err) } );
            }
            console.log("After calling filterContent, cleanTest=\"%s\"", filtered.output);
            mtaStatus.text = filtered.output;
            newTransitStatus[serviceType['docVar']].push(mtaStatus);
            return process.nextTick(next);
        });
    }
}

function saveLocation(loc, newTransitStatus) {
    return function(next) {
        loc.update({'$set' : {'transitStatus' : newTransitStatus}}, function (err, numberAffected, raw) {
            if (err) {
                return process.nextTick(function() { next(err) } );
            };
            return process.nextTick(next);
        });
    }
}

function loadTransitStatus() {
    return function(next) {
        models.LocationModel.find({}, function (err, locations) {
            if (err) {
                return process.nextTick(function() { next(err) } );
            }
            if (locations.length === 0) {
                return process.nextTick(function() { 
                    next(new Error('loadTransitStatus: invalid location result set size ' + locations.length))
                });
            }

            var needsUpdate = false;
            var now = moment();
            locations.forEach(function checkUpdateTime(loc, index, array) {
                var loc = locations[0];
                var lastUpdated = moment(loc.transitStatus.lastUpdated);

                // loc.transitStatus.subway.length is 0 only during initial load
                if (lastUpdated.add(TRANSIT_POLLING_INTERVAL_MINS, 'minutes').isBefore(now) || 
                    loc.transitStatus.subway.length === 0) {
                    console.log("Time to lookup transit status again for location: " + loc.postalCode);
                    needsUpdate = true;
                }
            });

            if (!needsUpdate) {
                console.log("Not yet time to lookup transit status: ");
                return process.nextTick(next);
            }

            var newTransitStatus = {
                lastUpdated : new Date(), 
                serviceTimestamp : null,
                subway : [],
                bus : [],
                bridgeTunnel : [],
                lirr : [],
                mnr : [],
            };

            var body = fs.readFileSync('serviceStatus.txt', {encoding : 'utf8'});
            var prevotyTasks = [];
            var serviceTimestamp = null;

            var options = { 'url' : MTA_API_BASE_URL,
                            headers : {'User-Agent' : 'Mozilla/5.0'}};
            request(options, function (err, response, body) {
//            var err = null;
//            var response = { statusCode: 200 };
//            if (true) {
                if (err) {
                    return process.nextTick(function() { next(err) } );
                }

                if (response.statusCode != 200) {
                    return process.nextTick(function() { 
                        next(new Error('loadTransitStatus: ' + 
                                       MTA_API_BASE_URL + ' returned statusCode ' +
                                       response.statusCode));
                    });
                }

                // Because there are things like &amp;nbsp; we need to clean those
                // up before doing the HTML Decode, so we just do the same thing
                // twice.
                var decodedBody = S(body).decodeHTMLEntities().s;
                decodedBody = S(decodedBody).decodeHTMLEntities().s;

                var $ = cheerio.load(decodedBody,
                                     { normalizeWhitespace: true,
                                       lowerCaseTags : false,
                                       lowerCaseAttributeNames : false,
                                       xmlMode: true,
                                       decodeEntities : false});

                $('service').each(function(i, elem) {
                    var line = $(this);
                    var responseCode = line.children('responsecode').text();

                    if (responseCode !== '0') {
                        return process.nextTick(function() { 
                            next(new Error('loadTransitStatus: ' + 
                                           MTA_API_BASE_URL + ' returned responseCode ' +
                                           responseCode));
                        });
                    }

                    newTransitStatus.serviceTimestamp = line.children('timestamp').text();
                });

                MTA_SERVICE_TYPES.forEach(function processtype(serviceType, index, array) {
                    $(serviceType['tag']).children('line').each(function() {
                        var line = $(this);
                        var dirtyText = line.children('text').html();
                        var mtaStatus = {
                            line : line.children('name').text(),
                            status : line.children('status').text(),
                            date : line.children('date').text(),
                            time : line.children('time').text(),
                        };
                        prevotyTasks.push(sanitizeText(newTransitStatus, serviceType, mtaStatus, dirtyText));
                    });
                });

                async.series(prevotyTasks, function(err, results) {
                    if (err) {
                        return process.nextTick(function() { 
                            next(err);
                        });
                    }
                    var saveTasks = []

                    locations.forEach(function updateTransit(updateLoc, index, array) {
                        newTransitStatus.lastUpdated = now;
                        saveTasks.push(saveLocation(updateLoc, newTransitStatus));
                    });
                    async.series(saveTasks, function(err, results) {
                        if (err) {
                            return process.nextTick(function() { 
                                next(err);
                            });
                        }
                        return process.nextTick(next);
                    });
                });
            });
            //}
        });
    }
}

function loadPostalCodeStatus() {
    var fnArray = [];

    bootstrapPostalCodes().forEach(function checkLocation(postalCode, index, array) {
        //fnArray.push(loadWeatherStatus(postalCode));
        //fnArray.push(loadUberStatus(postalCode));
    });
    fnArray.push(loadTransitStatus());
    return fnArray;
}

var runArray = []
runArray.push(verifyPrevoty());
runArray = runArray.concat(loadPostalCodes());
runArray = runArray.concat(loadPostalCodeStatus());
async.series(runArray, function finalizer(err, results) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log("Loader Succeeded");
        process.exit(0);
    }
});

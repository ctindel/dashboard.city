/**
 * Main application file
 */

'use strict';

    
// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var config = require('./config/environment');
var zipp = require('node-zippopotamus');
var models = require('./api/models/models')(mongoose);
var async = require('async');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.set('debug', true);

function getZipCodes() {
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

function loadZipCodes() {
    var fnArray = [];

    getZipCodes().forEach(function checkLocation(zip, index, array) {
        fnArray.push(function(next) {
            models.LocationModel.find({'postalCode' : zip}, function (err, results) {
                if (err) {
                    console.dir(err);
                    return next(err);
                }
                if (results.length == 0) {
                    zipp('us', zip, function (err, result) {
                        var newLoc = new models.LocationModel(
                            {
                                country: result['country'],
                                countryAbbreviation: result['country abbreviation'],
                                postalCode: zip,
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
                                console.log("Mongoose error creating new location for zip " + zip);
                            } else {
                                console.log("Successfully save Location object for zip " + zip);
                            }
                            return process.nextTick(next);
                        });
                    });
                } else {
                    console.log(zip + " already loaded");
                    return process.nextTick(next);
                }
            });
        });
    });
    
    return fnArray;
}

var runArray = []
runArray = runArray.concat(loadZipCodes());
async.series(runArray, function finalizer(err, results) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log("Loader Succeeded");
        process.exit(0);
    }
});

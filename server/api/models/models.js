"use strict";

var MAX_USER_LOCATIONS = 5;

function userLocationsArrayLimit(val) {
  return val.length <= MAX_USER_LOCATIONS;
}

module.exports = function(mongoose) {

    var userSchema = new mongoose.Schema({
        active: Boolean,
        email: { type: String, trim: true, lowercase: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        spApiKeyId: { type: String, trim: true },
        spApiKeySecret: { type: String, trim: true },
        locations: { 
            type: [
                {name: { type: String, trim:true },
                 postalCode: { type: String, trim:true },
                 _id : false }
            ],
            default: [],
            validate: [userLocationsArrayLimit, 
                       '{PATH} exceeds the limit of ' + MAX_USER_LOCATIONS] 
        },
        created: { type: Date, default: Date.now },
        lastLogin: { type: Date, default: Date.now },
    },
    { collection: 'user' }
    );

    userSchema.index({email : 1}, {unique:true});
    userSchema.index({spApiKeyId : 1}, {unique:true});

    var weatherForecastSchema = new mongoose.Schema({
        periodName : { type: String, trim: true},
        temp : { type: Number },
        iconLink : { type: String, trim: true},
        shortDescription : { type: String, trim: true},
        longDescription : { type: String, trim: true},
        hazard : { type: String, trim: true},
        hazardUrl : { type: String, trim: true}
    },
    { _id : false }
    );

    var locationWeatherStatusSchema = new mongoose.Schema({
        current : {
            temp : { type: String, trim: true},
            winds : { type: String, trim: true},
            relativeHumidity : { type: String, trim: true},
            description : { type: String, trim: true},
            image : { type: String, trim: true}
        },
        forecast : [weatherForecastSchema],
    },
    { _id : false }
    );

    var locationUberProductSchema = new mongoose.Schema({
        name : { type: String, trim: true},
        surgeMultiplier : { type: Number }
    },
    { _id : false }
    );

    var locationUberStatusSchema = new mongoose.Schema({
        products : [locationUberProductSchema]
    },
    { _id : false }
    );

    var mtaServiceStatusSchema = new mongoose.Schema({
        line : { type: String, trim: true},
        status : { type: String, trim: true},
        text : { type: String, trim: true},
        date : { type: String, trim: true},
        time : { type: String, trim: true},
    },
    { _id : false }
    );

    var locationSchema = new mongoose.Schema({
        country : { type: String, trim: true },
        countryAbbreviation : { type: String, trim: true, uppercase: true },
        postalCode : { type: String, trim: true, uppercase: true },
        name : { type: String, trim: true },
        state : { type: String, trim: true },
        stateAbbreviation : { type: String, trim: true, uppercase: true },
        geometry: { type: { type: String, default:'Point' },
                    coordinates: [Number] },
        weatherStatus : {
            lastUpdated : { type: Date, default: Date.now },
            data : { type: locationWeatherStatusSchema, default : {} },
            info : { 
                siteId: { type: String, trim: true, uppercase: true },
                siteName: { type: String, trim: true, uppercase: true },
            }
        },
        uberStatus : {
            lastUpdated : { type: Date, default: Date.now },
            data : { type: locationUberStatusSchema, default : {} },
        },
        transitStatus : {
            lastUpdated : { type: Date, default: Date.now },
            serviceTimestamp : { type: String, trim: true },
            subway : [mtaServiceStatusSchema],
            bus : [mtaServiceStatusSchema],
            bridgeTunnel : [mtaServiceStatusSchema],
            lirr : [mtaServiceStatusSchema],
            mnr : [mtaServiceStatusSchema],
        }
    },
    { collection: 'location' }
    );

    locationSchema.index({ geometry: '2dsphere' });
    locationSchema.index({ postalCode: 1}, {unique:true});

    var models = {'MAX_USER_LOCATIONS' : MAX_USER_LOCATIONS};
    
    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("User");
    } catch (e) {
        models.UserModel = mongoose.model('User', userSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("Location");
    } catch (e) {
        models.LocationModel = mongoose.model('Location', locationSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("weatherForecast");
    } catch (e) {
        models.weatherForecastModel = mongoose.model('WeatherForecast', weatherForecastSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("locationWeatherStatus");
    } catch (e) {
        models.locationWeatherStatusModel = mongoose.model('locationWeatherStatus', locationWeatherStatusSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("locationUberProduct");
    } catch (e) {
        models.locationUberProductModel = mongoose.model('locationUberProduct', locationUberProductSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("locationUberStatus");
    } catch (e) {
        models.locationUberStatusModel = mongoose.model('locationUberStatus', locationUberStatusSchema);
    }

    return models;
}

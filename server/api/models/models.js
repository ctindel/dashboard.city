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
                 zip: { type: String, trim:true },
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

    var locationSchema = new mongoose.Schema({
        country : { type: String, trim: true },
        countryAbbreviation : { type: String, trim: true, uppercase: true },
        postalCode : { type: String, trim: true, uppercase: true },
        name : { type: String, trim: true },
        state : { type: String, trim: true },
        stateAbbreviation : { type: String, trim: true, uppercase: true },
        geometry: { type: { type: String, default:'Point' },
                    coordinates: [Number] },
    },
    { collection: 'location' }
    );

    locationSchema.index({ geometry: '2dsphere' });
    locationSchema.index({ postalCode: 1}, {unique:true});

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

    var zipcodeWeatherStatusSchema = new mongoose.Schema({
        zipcode : { type: String, trim: true},
        current : {
            temp : { type: String, trim: true},
            winds : { type: String, trim: true},
            description : { type: String, trim: true},
            image : { type: String, trim: true}
        },
        forecast : [weatherForecastSchema],
    },
    { _id : false }
    );

    var zipcodeUberProductSchema = new mongoose.Schema({
        name : { type: String, trim: true},
        surgeMultiplier : { type: Number }
    },
    { _id : false }
    );

    var zipcodeUberStatusSchema = new mongoose.Schema({
        borough : { type: String, trim: true},
        products : [zipcodeUberProductSchema]
    },
    { _id : false }
    );

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
        mongoose.model("zipcodeWeatherStatus");
    } catch (e) {
        models.zipcodeWeatherStatusModel = mongoose.model('zipcodeWeatherStatus', zipcodeWeatherStatusSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("zipcodeUberProduct");
    } catch (e) {
        models.zipcodeUberProductModel = mongoose.model('zipcodeUberProduct', zipcodeUberProductSchema);
    }

    try {
        // Throws an error if "Name" hasn't been registered
        mongoose.model("zipcodeUberStatus");
    } catch (e) {
        models.zipcodeUberStatusModel = mongoose.model('zipcodeUberStatus', zipcodeUberStatusSchema);
    }

    return models;
}

require("cloud/app.js");
require("cloud/updateStations.js")
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("saveStations", function(request, response) {
    var newStations = request.params.stations;
    if(newStations.length > 0){
        var Stations = AV.Object.extend('stations');
        var query = new AV.Query(Stations);

        query.get('547989d6e4b00f629c08f035',{
            success: function(stations){
                //save
                stations.save({
                    stations: newStations
                })
            },
            error: function (object, error) {

            }
        });
    }
});

AV.Cloud.define("updateStations", function(request, response){
    updateStations("saveStations");
});

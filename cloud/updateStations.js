/**
 * Created by chenwenhong on 14-12-6.
 */

var https = require('https');
var util = require('util');

function updateStations(saveStations) {
    var options = {
        host: 'kyfw.12306.cn',
        path: '/otn/resources/js/framework/station_name.js',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
    };

    https.request(options, function (res) {
        var size = 0;
        var chunks = [];

        res.on('data', function(chunk){
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function(){
            //success
            if(200 == res.statusCode && size > 4)
            {
                var station_names = Buffer.concat(chunks, size).toString();

                station_names = station_names.substring(station_names.indexOf("'@") + 2, station_names.indexOf("';"));
                var stations = station_names.split('@');

                stations = stations.sort(function(a, b)
                {
                    a = a.split('|')[0].toLocaleLowerCase();
                    b = b.split('|')[0].toLocaleLowerCase();

                    return a.localeCompare(b);
                });

                var allGroup = '';

                for(var index in stations) {
                    allGroup = allGroup.concat(stations[index]);
                    if (index < stations.length - 1) {
                        allGroup = allGroup.concat('@');
                    }
                }
                //save order string
                AV.Cloud.run(saveStations, {stations: allGroup});
            }
        });

        res.on('error', function(error){
        });
    }).on('error', function (error) {
    }).end();
}

exports.updateStations = updateStations;
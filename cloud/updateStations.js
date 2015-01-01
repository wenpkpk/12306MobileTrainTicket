/**
 * Created by chenwenhong on 14-12-6.
 */

var https = require('https');
var util = require('util');

var StationsObjectId = '5482c4f1e4b0413d056cb197';

function saveStations(refresh, newStations, lastModified, callback) {
    //if not null
    if (newStations.length > 0) {
        var Stations = AV.Object.extend('stations');
        var query = new AV.Query(Stations);

        query.get(StationsObjectId,{
            success: function (stations) {
                var updateDate = stations.updatedAt;

                if (refresh === 'true' || lastModified > updateDate) {
                    //save
                    stations.save({
                        stations: newStations
                    },{
                        success: function (result) {
                            callback.success({update: 'success'});
                        },
                        error: function (error) {
                            callback.error(error);
                        }
                    });
                } else{
                    callback.success({update: 'is already newest!'});
                }
            },
            error: function (object, error) {
                callback.error(error);
            }
        });
    } else{
        //if null, error
        callback.error({result: 'content is null'});
    }
}

function updateStations(avRequest, avResponse) {
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
        var error = null;

        res.on('data', function (chunk) {
            size += chunk.length;
            chunks.push(chunk);
        });

        res.on('end', function () {
            //success
            if (200 == res.statusCode && size > 4) {
                //get string
                var station_names = Buffer.concat(chunks, size).toString();
                station_names = station_names.substring(station_names.indexOf("'@") + 2, station_names.indexOf("';"));

                //split and order string
                var stations = station_names.split('@');

                stations = stations.sort(function (a, b) {
                    a = a[0].toLocaleLowerCase();
                    b = b[0].toLocaleLowerCase();

                    return a.localeCompare(b);
                });

                var allGroup = '';
                var oldGroupPinYinHead = 'a';

                for (var index in stations) {
                    var group = stations[index];
                    allGroup = allGroup.concat(group);
                    if (group[0].toLocaleLowerCase().localeCompare(oldGroupPinYinHead) > 0 && index < stations.length - 1) {
                        oldGroupPinYinHead = group[0];
                        allGroup = allGroup.concat(',');
                    } else{
                        if (index < stations.length - 1) {
                            allGroup = allGroup.concat('@');
                        }
                    }
                }

                var lastModified = null;

                if (res.headers.hasOwnProperty('last-modified')) {
                    lastModified = res.headers['last-modified'];
                } else{
                    lastModified = new Date();
                }

                //save order string
                error = saveStations(avRequest.params.refresh, allGroup, lastModified, {
                    success: function (result) {
                        avResponse.success(result);
                    },
                    error: function (error) {
                        avResponse.error(error);
                    }
                });
            } else{
                //error
                avResponse.error(error);
            }
        });

        res.on('error', function (error) {
            error = error;
        });
    }).on('error', function (error) {
        avResponse.error(error);
    }).end();
}

exports.updateStations = updateStations;
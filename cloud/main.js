require("cloud/app.js");
var updateStations = require("cloud/updateStations.js");
var userLogin = require("cloud/login.js");
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("updateStations", function(avRequest, avResponse){
    updateStations.updateStations(avRequest, avResponse);
});

AV.Cloud.define("userLogin", function (avRequest, avResponse) {
    userLogin.userLogin('627043744@qq.com', '3a5454719f5ccedae81775a62ddbf2e4', avRequest, avResponse);
});
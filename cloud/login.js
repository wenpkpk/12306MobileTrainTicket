/**
 * Created by chenwenhong on 14-12-21.
 */

var querystring = require('querystring');
var myrequest = require('request');
var utils = require('cloud/utils.js');
var fs = require('fs');
var url = require('url');

/**
 * 获取userAgent
 * @param avRequest
 * @returns {*}
 */
function getUserAgent (avRequest) {
    var userAgent = null;

    if (avRequest.params.headers) {
        userAgent = avRequest.params.headers['User-Agent'];
    }

    if (!userAgent) {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36';
    }

    return userAgent;
}

/**
 * 判断请求是否成功
 * @param error
 * @param response
 * @returns {boolean}
 */
function isSuccess (error, response) {
    return !error && 200 === response.statusCode;
}

/**
 * 获取cookies
 * @param avRequest
 * @param callback
 */
function getCookies (avRequest, callback) {
    var userAgent = getUserAgent(avRequest);
    var options = {
        url: 'https://kyfw.12306.cn/otn/login/init',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent
        }
    };

    myrequest(options, callback);
}

/**
 * 获取验证码
 * @param avRequest
 * @param callback
 */
function getCheckCode (avRequest, callback) {
    var userAgent = getUserAgent(avRequest);

    var options = {
        url: 'https://kyfw.12306.cn/otn/passcodeNew/getPassCodeNew?module=login&rand=sjrand&',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent,
            'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
            'X-Requested-With': 'XMLHttpRequest',
        }
    };

    utils.download_image_options(options, callback);
}

/**
 * 验证验证码
 * @param avRequest
 * @param checkCodeContent
 * @param callback
 */
function verifyCheckCode (avRequest, checkCodeContent, callback) {
    var userAgent = getUserAgent(avRequest);
    var form = querystring.stringify({
        rand: 'srand',
        _json_att: '',
        randCode: checkCodeContent
    });

    var options = {
        url: 'https://kyfw.12306.cn/otn/passcodeNew/checkRandCodeAnsyn',
        method: 'POST',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent,
            'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        form: form
    };

    myrequest(options, callback);
}

/**
 * OCR识别并验证
 * @param avRequest
 * @param imageData
 * @param retryCount
 * @param callback
 */
function doOCRAndVerifyCheckCode (avRequest, imageData, retryCount, callback) {
    var userAgent = getUserAgent(avRequest);

    imageData = decodeURIComponent(imageData);

    var form = querystring.stringify({
        'd': imageData,
        'callBy': 'login',
        'c': '2',
        'v': '2.1.7'
    });

    var options = {
        url: 'http://s17.suanya.cn/shell/img',
        method: 'POST',
        headers: {
            'Accept-Encoding': 'zh-Hans;q=1, en;q=0.9, zh-Hant;q=0.8, fr;q=0.7, de;q=0.6, ja;q=0.5',
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'Content-Length': form.length
        },
        form: form
    };

    myrequest(options, function (error, response, body) {
        if (isSuccess(error, response) && body.length > 1) {
            verifyCheckCode(avRequest, body, function (error, response, body) {
                if (isSuccess(error, response)) {
                    //验证码成功
                    callback(error, response, body);
                } else {
                    //check code error
                    if (retryCount === 0) {
                        callback(error, response, body);
                    } else {
                        //重新解析验证码
                        decodeImageData(avRequest, imageData, retryCount - 1, callback);
                    }
                }
            });
        } else {
            // decode image error
            callback(error, response, body);
        }
    });
}

function init (avRequest, callback) {
    var userAgent = getUserAgent(avRequest);
    var options = {
        url: 'https://kyfw.12306.cn/otn/leftTicket/init',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            cookie: avRequest.cookie
        }
    };

    var req = myrequest(options, function (error, response, body) {
        var searchStr = '/otn/dynamicJs/';
        var index = body.indexOf(searchStr);
        var subStr = body.substr(index, body.length - index);
        var endIndex = subStr.indexOf('"');
        var path = subStr.substr(0, endIndex);
        var jsUrl = url.resolve(req.href, path);
        avRequest.dynamicJs = jsUrl;

        getDynamicJs(avRequest, callback);
    });
}

function getDynamicJs (avRequset, callback) {
    var userAgent = getUserAgent(avRequset);
    var options = {
        url: avRequset.dynamicJs,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            cookie: avRequset.cookie
        }
    };

    myrequest(options, function (error, response, body) {
        var regix = /gc(){var key=\'.*\'/;
        var index = regix.exec(body);
        console.log(index);

    });
}

/**
 * 登录
 * @param avRequest
 * @param callback
 */
function login (avRequest, callback) {
    var userAgent = getUserAgent(avRequest);

    var options = {
        url: 'https://kyfw.12306.cn/otn/passcodeNew/getPassCodeNew?module=login&rand=sjrand&',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent,
            'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
            'X-Requested-With': 'XMLHttpRequest',
        }
    };

    myrequest(options, callback);
}

function userLogin (user_name, user_password, avRequest, avResponse) {
    var options = {
        host: 'kyfw.12306.cn',
        path: '/otn/login/init',
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        headers: {
            'Accept-Encoding': 'gzip'
        }
    };

    var imageData = null;
    var imageCode = null;
    var retryCount = 3;
    var result = [];
    var OCRKey = 'OCRKey';
    var checkCodeKey = 'checkCodeKey';
    var headers = [];
    var headersKey = 'headersKey';
    var getCookiesHeadersKey = 'getCookiesHeadersKey';
    var getCheckCodeHeadersKey = 'getCheckCodeHeadersKey';
    var verityCheckCodeHeadersKey = 'verityCheckCodeHeadersKey';
    var loginHeadersKey = 'loginHeadersKey';
    
    getCookies(avRequest, function (error, response, body) {
        if (isSuccess(error, response)) {
            headers[getCookiesHeadersKey] = response.headers;

            getCheckCode(avRequest, function (error, response, body) {
                if (isSuccess(error, response)) {
                    headers[getCheckCodeHeadersKey] = response.headers;
                    imageData = body;
                    result[checkCodeKey] = imageData;

                    doOCRAndVerifyCheckCode(avRequest, imageData, retryCount, function (error, response, body) {
                        if (isSuccess(error, response) && body.length > 0) {
                            //验证成功
                            headers[verityCheckCodeHeadersKey] = response.headers;
                            result[OCRKey] = body;
                            result[headersKey] = headers;

                            //得到cookies
                            var cookies = new Array();
                            for (var key in headers) {
                                if (headers[key].hasOwnProperty('set-cookie')) {
                                    cookies = cookies.concat(headers[key]['set-cookie']);
                                }
                            }

                            avRequest.cookie = cookies;
                            init(avRequest, function (error, response, body) {
                            });
                        } else {
                            //decode image data error or check code error
                            avResponse.error(error);
                        }
                    });
                } else {
                    // get code error
                    avRequest.error(error);
                }
            });
        } else {
            //get cookie error
            avResponse.error(error);
        }
    });
}

exports.userLogin = userLogin;

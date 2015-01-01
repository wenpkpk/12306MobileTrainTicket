/**
 * Created by chenwenhong on 14-12-29.
 */
var crypto = require('crypto');
var myrequest = require('request');

/**
 * 字符串反转
 * @returns {string}
 */
String.prototype.reverse = function reverse () {
    var str = "";
    var end = this.length - 1;
    for(;end >= 0; end --) {
        str = str + this.charAt(end);
    }

    return str;
};

/**
 * 加密md5
 * @param data
 * @returns {*}
 */
function md5 (data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex');
}

/**
 * 加密md5的base64编码
 * @param data
 * @returns {*}
 */
function md5_base64 (data) {
    return base64(md5(data));
}

/**
 * base64编码
 * @param data
 * @returns {string}
 */
function base64 (data) {
    var buf = new Buffer(data);
    return buf.toString('base64');
}

/**
 * base64解码
 * @param data
 * @returns {string}
 */
function decode_base64 (data) {
    var buf = new Buffer(data, 'base64');
    return buf.toString();
}

/**
 * 客户端加密
 * @param content
 * @param key
 * @returns {string}
 */
function encrypt (content, key) {
    var encrypt = '';
    encrypt += md5_base64(key.reverse());
    encrypt += base64(content).reverse();
    encrypt += md5_base64(key).reverse();
    encrypt = base64(encrypt).reverse();

    return encrypt;
}

/**
 * 客户端解密
 * @param content
 * @param key
 * @returns {string}
 */
function decrypt (content, key) {
    var decrypt = decode_base64(content.reverse());
    decrypt = decrypt.substring(md5_base64(key.reverse()).length, decrypt.length);
    decrypt = decrypt.substring(0, decrypt.length - md5_base64(key).length);
    decrypt = decode_base64(decrypt.reverse());

    return decrypt;
}

/**
 * 下载图片
 * @param options
 * @param callback
 */
function download_image_options (options, callback) {
    var size = 0;
    var chunks = [];
    var imageData = null;
    var err = null;
    myrequest(options, function (error, response, body) {
        callback(error, response, imageData);
    }).on('data', function(data) {
        size += data.length;
        chunks.push(data);
    }).on('end', function() {
        imageData = Buffer.concat(chunks, size).toString('base64');
    });
}

exports.md5 = md5;
exports.base64 = base64;
exports.md5_base64 = md5_base64;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.download_image_options = download_image_options;
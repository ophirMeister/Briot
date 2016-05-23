/**
 * Created by Negan on 11/20/2015.
 */

//var fs = require("fs");
module.exports = {
    checkResponse: function(buffer) {
        var responseYes = (buffer.toString('base64') == "AwQB");
        //console.log("response yes: " + responseYes);
        return responseYes;
    }
}
//var checkResponse = function(buffer) {
//    var responseYes = (buffer.toString('base64') == "AwQB");
//    console.log("response yes: " + responseYes);
//    return responseYes;
//}
//fs.readFile('./updateResponse/ERROR_QUESTION_NO', function (err, buffer) {
//    if (err) {
//        console.error(err);
//        callback(err);
//    }
//    else {
//
//        var responseYes = (buffer.toString('base64') == "AwQB");
//        console.log("response yes: " + responseYes);
//    }
//});

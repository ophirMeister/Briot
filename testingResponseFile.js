///**
// * Created by Negan on 11/20/2015.
// */
//var fs = require("fs");
//var responseParser = require('./checkUpdateResponse');
//
//
//fs.readFile('./updateResponse/ERROR_QUESTION_YES', function (err, buffer) {
//    if (err) {
//        console.error(err);
//        callback(err);
//    }
//    else {
//        var responseYes = responseParser.checkResponse(buffer);
//        console.log(responseYes);
//    }
//});

var Worker = require('workerjs');

var w = new Worker('workerUpdateRequest.js');


var id = "00409D3D421F";
var server = "Europe";
//id = id.concat("/");
console.log("calling worker with: " + id);
console.log("calling worker with: " + server);

// give worker the machine ID:
w.onmessage = function (msg) {
    console.log('got back from worker!');
    console.log('from worker: '+ msg.data);

    if (msg.data == "404") {
        sendError();
    }
    else {
        try {
            tokens.splice(tokens.indexOf(token), 1);
        }
        catch (err) {
            console.log("error while splicing: " + err.message);
        }


        sendResult(msg.data);
    }

};
w.postMessage({id:id , server:server});


function sendResult(data) {
    console.log("sending result.");
    response.status(200);
    response.send(data);
    console.log("ftp results send *-*-*-*-*-*-*-*-*-*-.");
    response.end();

}

function sendError() {
    console.log("sending error result");
    response.status(404);
    response.send();
    response.end();

}

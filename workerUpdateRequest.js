/**
 * This file serves as an update request worker.
 * it's job is to "ask" a device if it would like to receive an update.
 * the worker returns the answer, "yes" or "no", or dies after 10 mins.
 * @type {exports}
 */


var JSFtp = require("jsftp");
var mongoose = require('mongoose');
var xml2js = require('xml2js');
var fs = require("fs");

/**
 * varaibles:
 */

console.log('update request worker initiated');
self.onmessage = function (data) {


    // retrieving the relevant data for the worker:
    console.log('worker looking for machine ID: ' + JSON.stringify(data));
    var id = "";
    var server = "";
    var filePath = "";
    for (i in data) {
        if (typeof(data[i]) == "object") {
            //console.log(i, data[i]);
            //console.log(data[i].id);
            id = data[i].id;
            server = data[i].server;
            filePath = data[i].filePath + "DNL";
        }
    }

    console.log("filepath: " + filePath);

    // look for machine:
    console.log("getting machine from FTP id: " + id);
    console.log("filePath: " + filePath);
    var serverNum = (server == "Europe") ? "internet@M2MBriot" : "internetUS@M2MBriot";
    console.log(serverNum);

    var ftp = new JSFtp({
        host: "91.212.157.71",
        user: serverNum, // defaults to "anonymous"
        pass: "Qc6T5a" // defaults to "@anonymous"

    });
    //
    var oldAnswerFileDate = 0;
    var oldAnswerFile = false;

    var foundDirectory = false;
    ftp.ls(".", function (err, res) {
        if (err) {
            console.log("machine not found");
        }
        else {
            for (folder in res) {
                if (!isNaN(res[folder].name[0])) {

                    //console.log(res[folder].name);
                    if (res[folder].name == id) {
                        console.log("machine found");

                        foundDirectory = true;
                        break;
                    }
                }

            }
        }
        if (foundDirectory) {
            //console.log("found directory");
            sendRequestFile();
        }
        else {
            self.postMessage("404");
            return;
        }

    });

    function sendRequestFile() {
        fs.readFile('./updateResponse/TODO', function (err, buffer) {
            if (err) {
                console.error(err);
                self.postMessage(err);
                return;
            }
            else {
                console.log("read file!");
                console.log("putting question in device folder:");
                ////TODO - check the the folder actualy exists!
                ftp.ls(id, function (err, res) {
                    if (err) {
                        console.log("machine not found");
                    }
                    else {
                        //erase any old answer files:
                        res.forEach(function (file) {

                            if (file.name == "TODO") {
                                console.log("found old answer file. ")
                                oldAnswerFile = true;
                            }
                        });

                        var TODO_QUESTION = id.concat("/TODO");
                        //console.log("TODO: " + TODO);
                        try {
                            ftp.put(buffer, TODO_QUESTION, function (hadError) {
                                if (!hadError) {
                                    oldAnswerFileDate = new Date();
                                    console.log("added question, waiting for answer");
                                    getAnswer(new Date());
                                }
                                else console.log("error putting TODO file: " + hadError.message);
                            });
                        }
                        catch (err) {
                            console.log(err.message);
                        }


                    }
                });


            }
        });
    }
    //
    //
    var gotAnswer = false;
    var CallCounter = 0;

    /**
     * This function looks in the device's folder for an answer
     * from the machine. if there is no answer, the method recursively
     * calls it self again. a counter is kept to make sure we stop
     * looking after a certain amount of iterations.
     * @param callDate
     */
    function getAnswer(callDate) {
        if (!gotAnswer) {
            // keep looking through files
            ftp.ls(id, function (err, res) {
                if (err) {
                    console.log("machine not found or couldn't connect");
                    response.status(404).end();
                }
                else {
                    //console.log("looking for files in folder");
                    res.forEach(function (file) {
                        //console.log(file.name);
                        var date = new Date(file.time);
                        //if (file.name == "UPL") {
                        //    console.log("found UPL! date is: "+date);
                        //}
                        //if (file.name == "UPL") {
                        //if (file.name == "ERROR" && date > oldAnswerFileDate) {
                        if (file.name == "ERROR") {

                            gotAnswer = true;
                            console.log("found new answer FILE!");
                            var errorFile = id.concat("/ERROR");

                            setTimeout(function () {
                                var fileData = "";
                                ftp.get(errorFile, function (err, socket) {
                                    if (err) {
                                        console.error(err);
                                        self.postMessage(err);
                                        return;
                                    }

                                    socket.on("data", function (d) {
                                        console.log("got data!");
                                        fileData += d.toString('base64');

                                    });
                                    socket.on("close", function (hadErr) {
                                        console.log("Data is: "+fileData);

                                        //var responseYes = responseParser.checkResponse(fileData);
                                        if(fileData == "AwQB") {
                                            sendUpdate();
                                        } else {
                                            console.error("User chose not to update");
                                            self.postMessage("User chose not to update");
                                            return;
                                        }
                                    });
                                    socket.resume();
                                });
                            }, 1500);
                        }
                        //        console.log(file.name);
                        //
                    })
                    if (!gotAnswer) {
                        if (CallCounter >= 100) {
                            self.postMessage("404");
                        }
                        else {
                            console.log("calling again! ("+CallCounter+")");
                            CallCounter++;
                            setTimeout(function () {
                                    getAnswer(callDate)
                                }, 5000
                            );
                        }


                    }
                }
            });
        }


    }
    /**
     * This function uploads the update file and TODO_DNL.
     * @param callDate
     */
    function sendUpdate() {
        console.log("sending update file!");
        fs.readFile('./updateFiles/sendFile/TODO', function (err, TODO_DNL_buffer) {
            if (err) {
                console.error(err);
                self.postMessage(err);
                return;
            }
            else {
                //var downloadPath = './updateFiles/'+filePath;
                fs.readFile(filePath, function (err, DNL_BUFFER) {
                    //console.log("dnl sizE: " + DNL_BUFFER);
                    console.log("currently have buffer of TODO and DNL")
                    if (err) {
                        console.error(err);
                        self.postMessage(err);
                        return;
                    }
                    else {
                        console.log("uploading DNL and TODO")
                        ////TODO - check the the folder actualy exists!
                        ftp.ls(id, function (err, res) {
                            if (err) {
                                console.log("machine not found");
                            }
                            else {
                                //
                                //
                                ////erase any old answer files:
                                //res.forEach(function (file) {
                                //
                                //    if (file.name == "TODO") {
                                //        console.log("found old answer file. ")
                                //        oldAnswerFile = true;
                                //        oldAnswerFileDate = new Date(file.time);
                                //
                                //    }
                                //});

                                var DNL = id.concat("/DNL");
                                var TODO = id.concat("/TODO");

                                //console.log("TODO: " + TODO);
                                try {
                                    ftp.put(DNL_BUFFER, DNL, function (hadError) {
                                        if (!hadError) {
                                            console.log("added update file, now adding TODO");
                                            ftp.put(TODO_DNL_buffer, TODO, function (hadError) {
                                                if (!hadError) {
                                                    console.log("added TODO as well!");
                                                    self.postMessage("200");
                                                }
                                                else console.log("error putting TODO file: " + hadError.message);
                                            });
                                        }
                                        else console.log("error putting DNL file: " + hadError.message);
                                    });
                                }
                                catch (err) {
                                    console.log(err.message);
                                }
                            }
                        });

                    }

                });


            }
        });
    }
};

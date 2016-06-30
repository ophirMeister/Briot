var JSFtp = require("jsftp");
var mongoose = require('mongoose');
var xml2js = require('xml2js');
var fs = require("fs");


/**
 * varaibles:
 */

//max number of saved machine data for each machine:
var MAX_MACHINE_SAVES = 15;

var mongodbUri = 'mongodb://admin:Admin!23@ds017193.mlab.com:17193/heroku_jt89c05w';
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };


console.log('workerd initiated');
self.onmessage = function (data) {
    console.log('worker looking for machine ID: ' + JSON.stringify(data));
    var id = "";
    var server = "";
    for (i in data) {
        if (typeof(data[i]) == "object") {
            //console.log(i, data[i]);
            //console.log(data[i].id);
            id = data[i].id;
            server = data[i].server;
        }
    }

    var Schema = mongoose.Schema;

    var deviceDataSchema = new Schema({
        id: String,
        _id: String,
        //created_at: Date,
        data: Schema.Types.Mixed
    }, { collection: 'deviceData' });

    var str = ""; // Will store the contents of the file
    var parser = new xml2js.Parser();
    console.log("getting machine from FTP id: " + id);
    console.log(server);
    var serverNum = (server == "Europe") ? "internet@M2MBriot" : "internetUS@M2MBriot";
    console.log(serverNum);

    var ftp = new JSFtp({
        host: "91.212.157.71",
        user: serverNum, // defaults to "anonymous"
        pass: "Qc6T5a" // defaults to "@anonymous"

    });

    var oldUPLdate = 0;
    var oldUPL = false;

    var foundDirectory = false;

    ftp.ls(".", function (err, res) {
        if (err) {
            self.postMessage("404");
            return;
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
            addTodoFile();
        }
        else {
            self.postMessage("404");
            return;
        }

    });


    function addTodoFile() {
        fs.readFile('./TODO', function (err, buffer) {
            if (err) {
                console.error(err);
                callback(err);
            }
            else {
                var UPL = id.concat("/UPL");

                console.log("read fikle!");
                console.log("deleting UPL if exists");
                //TODO - check the the folder actualy exists!
                ftp.ls(id, function (err, res) {
                    if (err) {
                        console.log("machine not found");
                    }
                    else {
                        //console.log("looking for files in folder");
                        res.forEach(function (file) {

                            if (file.name == "UPL") {
                                console.log("found old UPL file. ")
                                oldUPL = true;
                                oldUPLdate = new Date(file.time);

                            }
                        });


                        var TODO = id.concat("/TODO");
                        //console.log("TODO: " + TODO);
                        try {
                            ftp.put(buffer, TODO, function (hadError) {
                                if (!hadError) {
                                    console.log("File transferred successfully!");
                                    getUPL(new Date());
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


    var foundUPL = false;
    var CallCounter = 0;

    function getUPL(callDate) {
        if (!foundUPL) {
//console.log("looking for UPL");

            //console.log("calldate is: " + callDate);
            ftp.ls(id, function (err, res) {
                if (err) {
                    console.log("machine not found");
                    response.status(404).end();
                }
                else {
                    //console.log("looking for files in folder");
                    res.forEach(function (file) {
                        //console.log(file.name);
                        //
                        var date = new Date(file.time);
                        //if (file.name == "UPL") {
                        //    console.log("found UPL! date is: "+date);
                        //}
                        //if (file.name == "UPL") {
                        if (file.name == "UPL" && date > oldUPLdate) {
                            foundUPL = true;
                            console.log("found new UPL FILE!");

                            //console.log("called on date: " + callDate + " , file mod: " + file.lastModifiedDate);
                            //console.log("file uploaded successfully! getting file..");
                            var UPL = id.concat("/UPL");

                            setTimeout(function () {
                                ftp.get(UPL, function (err, socket) {
                                    if (err) {
                                        throw err;
                                    }

                                    socket.on("data", function (d) {
                                        //console.log("got data!");
                                        str += d.toString();

                                    });
                                    socket.on("close", function (hadErr) {
                                        if (hadErr)
                                            console.error('There was an error retrieving the file.');
                                        console.log("finished uploading file")

                                        console.log("got data, looking for XML head..");
                                        var index = (server == "Europe") ? str.search("<Eeprom><ALTA_PRO>") : str.search("<Settings>");

                                        //var index = str.search("<Eeprom><ALTA_PRO>");
                                        if (index > -1) {
                                            console.log("found xml at index: " + index + ". cutting it from rest of text.");
                                            if(server == "USA")
                                            {
                                                var endIdx = str.search("</Eeprom>");
                                                var XML = str.slice(index, endIdx);
                                                var head = "<Eeprom><ALTA_PRO>";
                                                var end = "</ALTA_PRO></Eeprom>";
                                                XML = head.concat(XML);
                                                XML = XML.concat(end);
                                            }
                                            else
                                            {
                                                var XML = str.slice(index, str.length);

                                            }
                                            console.log("cut the XML.");

                                            parser.parseString(XML, function (err, result) {
                                                if (err) {
                                                    console.log("xml parse error!");
                                                    throw err.message;
                                                }
                                                else {
                                                    // save result to DB:

                                                    console.log("trying to save to db");

                                                    mongoose.connect(mongodbUri, options);
                                                    var db = mongoose.connection;
                                                    db.on('error', console.error.bind(console, 'connection error:'));

                                                    db.once('open', function callback() {


                                                        console.log("connected to db!");
                                                        console.log("updated!");

                                                        var machine = mongoose.model('machine', deviceDataSchema);
                                                        var date = new Date();

                                                        newMachine = machine({
                                                            id: id,
                                                            _id: token(),
                                                            data: result,
                                                            //created_at:date
                                                        }, {_id: false});

                                                        newMachine.save(function (err) {
                                                            if (err) {
                                                                throw err;
                                                                mongoose.disconnect();
                                                            }
                                                            else {
                                                                console.log("saved to DB!");

                                                                machine.find({id: id}).sort('-created_at').exec(function (err, data) {

                                                                    if (err) {
                                                                        mongoose.disconnect();
                                                                        return console.error(err);

                                                                    }


                                                                    else {
                                                                        console.log("number of machines: " + data.length)
                                                                        if (data.length > MAX_MACHINE_SAVES) {
                                                                            WR = machine.remove({
                                                                                id: id,
                                                                                _id: data[data.length - 1]._id
                                                                            }, true);
                                                                            console.log("removed: " + WR.nRemoved);
                                                                        }
                                                                        mongoose.disconnect();


                                                                    }

                                                                })
                                                            }
                                                        });


                                                    });
                                                    self.postMessage(result);

                                                    //sendResult(result);
                                                }

                                            });
                                            console.log("XML. sent");
                                        }
                                        else {
                                            console.log("XML ERROR! missing Header");

                                        }

                                    });
                                    socket.resume();
                                });
                            }, 1000);

                        }
                        //        console.log(file.name);
                        //
                    })
                    if (!foundUPL) {
                        if (CallCounter >= 100) {
                            self.postMessage("404");
                        }
                        else {
                            console.log("calling again! ("+CallCounter+")");
                            CallCounter++;
                            setTimeout(function () {
                                    getUPL(callDate)
                                }, 5000
                            );
                        }


                    }
                }
            });
        }


    }

    /**
     * create random token:
     * @returns {string}
     */
    var rand = function () {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    var token = function () {
        return rand() + rand(); // to make it longer
    };

};

// Node modules.
var express = require('express');
var fs = require('fs');
var app = express();
var cool = require('cool-ascii-faces');
var xml2js = require('xml2js');
var JSFtp = require("jsftp");
var Worker = require('workerjs');
var mongoose = require('mongoose');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

app.use(express.json());
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.bodyParser({uploadDir:'./updateFiles/updateDNL/'}));

/*
Database variables
 */
var mongodbUri = 'mongodb://admin:Admin!23@ds017193.mlab.com:17193/heroku_jt89c05w';
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };
// user schema:
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    name: String,
    password: String,
    admin: Boolean
}, { collection: 'users' }, { timestamps: { createdAt: 'created_at' } });

var MachinesSchema = new Schema({
    name: String,
    id: String
});

var deviceDataSchema = new Schema({
    id: String,
    _id: String,
    created_at: Date,
    data: Schema.Types.Mixed
}, { collection: 'deviceData' });

var deviceSchema = new Schema({
    _id: String,
    server: String,
    Optician_Shop: String,
    Optician_Name: String,
    Optician_Surname: String,
    Address: String,
    Zip: String,
    City: String,
    Country: String,
    State: String,
    Zone: String,
    Email: String,
    Group: String,
    Phone_Number: String,
    Mobile_Number: String,
    Fax: String
}, { collection: 'devices' });
//{ capped: { size: 5120, max: 500, autoIndexId: false }},
var updateSchema = new Schema({
    date: Date,
    Version: String,
    Comment: String
});

/**
 * For password cryptography.
 */
var prime = crypto.createDiffieHellman(64).getPrime();
var siteKey = crypto.createDiffieHellman(prime);
var logKey = crypto.createDiffieHellman(prime);

/**
 * For temporary login keys.
 */
siteKey.generateKeys();

/**
 * Stores worker fecthing tokens.
 */
var tokens = [];

/**
 * User authentication. Name and password are provided in the request body.
 * The server looks up the name in the database, where the user's password is encrypted and stored.
 * If the server finds a matching user name, it retrieves the associated password, and decrypts it. He then
 * checks to see is the password matches.
 * Returns status 200 in case of a password match, and a 401 o.w.
 */
app.post('/login', function (req, response) {

    // get name and password.
    var name = req.body.name;
    var pass = req.body.pass;

    // connect to user database:
    mongoose.connect(mongodbUri, options);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function callback() {
        console.log("connected to DB!");
        // get user data.
        var User = mongoose.model('User', UserSchema);

        // look for the relevant user.
        User.find({name: name}, function (err, users) {
            if (err){
                response.status(401).send("could not connect to database");
                mongoose.disconnect();
                return console.error(err);
            }
            // if user not found:
            if (users.length === 0) {
                response.status(401).send('Wrong name or password');
                mongoose.disconnect();
            } else { // If user found, check the password.
                // get the password saved in the database.
                var passToCheck = users[0].password;

                // decipher the password.
                var decipher1 = crypto.createDecipher('aes256', 'password');
                var result = decipher1.update(passToCheck);
                result += decipher1.final();

                // check to see if passwords match.
                var match = (result == pass) ? true : false;
                if (match) {
                    console.log("matchine passowrds, connecting user [" + name +"].");
                    // if passwords match, return success response, and create a temporary login key.
                    // This key is given to the user, and is held by the server as well.
                    logKey.generateKeys();
                    response.status(200);
                    response.send(logKey.getPublicKey('hex'));
                } else {
                    // otherwise, send error response and disconnect.
                    response.status(401).send(match);
                }
                mongoose.disconnect();
            }
        })
    });
});

/**
 * Checks the user's temporary login key, and if valid loads the technician area.
 */
app.get('/log/:key/:user', function (req, response) {
    try {
        var key = req.params.key;
        var user = req.params.user;

        // check that the user's key and server key match.
        var secret1 = siteKey.computeSecret(key, 'hex').toString("hex");
        var secret2 = logKey.computeSecret(siteKey.getPublicKey('hex'), 'hex').toString("hex");

        if (secret1 == secret2) {
            // If keys match, load technician area.
            fs.readFile('./public/tech/index.html', function (err, data) {
                if (err) {
                    console.error("error loading file");
                    console.error(err.message);
                    response.status(401).send("Coudln't load techinician area.");
                }
                // if successfully loaded technician area, write it in the response.
                index = data;
                response.set('user', user);
                response.writeHeader(200, {"Content-Type": "text/html"});
                response.write(index);
                response.send()
            });
        } else {
            // in case keys don't match
            response.status(401).send("access denied");
        }
    }
    catch (err) {
        console.log(err.message);
        response.status(401).send(err.message);
    }
});

/**
 * Adds a device to the database. Notice that all the device information is stored in the request.
 */
app.post('/addDevice', function (req, response) {

    // connect to database.

    mongoose.connect(mongodbUri, options);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function callback() {
        // Load the device model.
        var Device = mongoose.model('Device', deviceSchema);

        // Create new device.
        var newDevice = {
            _id: req.body.id,
            server: req.body.deviceServer,
            Optician_Shop: req.body.Optician_Shop,
            Optician_Name: req.body.Optician_Name,
            Optician_Surname: req.body.Optician_Surname,
            Address: req.body.Address,
            Zip: req.body.Zip,
            City: req.body.City,
            Country: req.body.Country,
            State: req.body.State,
            Zone: req.body.Zone,
            Email: req.body.Email,
            Group: req.body.Group,
            Phone_Number: req.body.Phone_Number,
            Mobile_Number: req.body.Mobile_Number,
            Fax: req.body.Fax
        };
        console.log("device: %j", newDevice);
        // Add device. If device id exists, updates it's info to this one.
        Device.create({_id: req.body.id}, newDevice, function (err, data) {
            if (err) {
                console.log("error!")
                console.log(err.message);
                mongoose.disconnect();
                response.status(400);
                response.send();
                return;
            } else {
                mongoose.disconnect();
                console.log("added: " + data._id);
                response.status(200);
                response.send();
            }
        });
        //mongoose.disconnect();
    });
})


// TODO - edit this.
/**
 * Adds a new user to the database. Notice you must be an admin to add new users.
 */
app.get('/newUser/:admin/:adminPass/:newName/:newPassword/:isAdmin', function (req, response) {

        var admin = req.params.admin;
        var adminPass = req.params.adminPass;
        var newName = req.params.newName;
        var newPassword = req.params.newPassword;
        var isAdmin = req.params.isAdmin;
        console.log("adding new user with: name: " + newName + ", pass: " + newPassword);

        mongoose.connect(mongodbUri, options);

        var db = mongoose.connection;
        console.log("var db created!");

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback() {


            console.log("connected to db!")
            var User = mongoose.model('User', UserSchema);


            // first check admin rights:


            User.find({name: admin}, function (err, users) {
                if (err)
                    return console.error(err);
                if (users.length === 0) {
                    console.log("admin not found!");
                    mongoose.disconnect();
                }
                else {

                    // check admin rights:

                    if (!users[0].admin) {
                        console.log("admin rights needed to add new user");
                        mongoose.disconnect();
                    }
                    else {
                        var passToCheck = users[0].password;
                        var decipher1 = crypto.createDecipher('aes256', 'password');
                        var result1 = decipher1.update(passToCheck);
                        result1 += decipher1.final();
                        match = (adminPass == result1) ? true : false;
                        if (!match) {
                            console.log("pass didn't match");
                            mongoose.disconnect();
                        }
                        else {
                            console.log("pass match = " + match);
                            addUser();

                        }
                    }


                }

            });
            function addUser() {
                // make sure new user doesn't exist:
                User.find({name: newName}, function (err, users) {
                    console.log("looking for user: " + newName);

                    if (err)
                        return console.error(err);
                    if (users.length !== 0) {
                        console.log("username alreadyy exists!!");
                        mongoose.disconnect();
                    }
                    else {
                        // cypher password:
                        var cipher1 = crypto.createCipher('aes256', 'password');
                        var cipherText1 = cipher1.update(newPassword, 'ascii', 'binary');
                        cipherText1 += cipher1.final('binary');

                        var newUser = new User({name: newName, password: cipherText1, admin: isAdmin});
                        newUser.save(function (err, newUser) {
                            if (err)
                                return console.error(err);
                            console.log("added: " + newUser.newName + " with encry: " + cipherText1);
                            mongoose.disconnect();
                        })
                    }

                })
            }
            ;


        });


    }
);

/**
 * Loads main page.
 */
app.get('/', function (req, response) {
    response.render('/public/index.html');

});

/**
 * Fetches all machines currently on database.
 */
app.get('/getMachines/', function (req, response) {
    mongoose.connect('mongodb://admin:Admin!23@ds017193.mlab.com:17193/heroku_jt89c05w');
    var db = mongoose.connection;
    db.once('open', function callback() {
        var Device = mongoose.model('Device', deviceSchema);
        Device.find(function (err, data) {
                console.log("found " + data.length + "devices");
                response.status(200);
                response.send(data);
                mongoose.disconnect();
            }
        )
        ;
    });
});

///**
// * Retrieves the update file (DNL) for updating process.
// * Notice that the update file must be stored at a specific location. (currently at '/internet/upgrade').
// */
//app.get('/getUpdateFile/', function (req, response) {
//
//    // create an FTP connection.
//    var ftp = new JSFtp({
//        host: "91.212.157.71",
//        user: "internet@M2MBriot", // defaults to "anonymous"
//        pass: "Qc6T5a" // defaults to "@anonymous"
//
//    });
//
//    var date = 0;
//    // look at the update directory.
//    ftp.ls("/internet/upgrade", function (err, res) {
//        if (err) {
//            response.status(404).send("couldn't load update file.");
//        } else {
//            // look for DNL file.
//            res.forEach(function (file) {
//                if (file.name == "DNL") {
//                    // Save the file creation time.
//                    date = new  Date(file.time);
//                    mongoose.connect('mongodb://127.0.0.1:27017/Updates');
//                    var db = mongoose.connection;
//                    db.once('open', function callback() {
//                        var Update = mongoose.model('Update', updateSchema);
//                        // look for user:
//
//
//                        Update.find({date: date}, function (err, data) {
//
//                                if(err ) {
//                                    console.log("err");
//                                } else {
//                                    if(data.length > 0) {
//                                        console.log("found " + data.length + "devices");
//                                        response.status(200);
//                                        response.send(data);
//                                        mongoose.disconnect();
//                                    }
//                                    else{
//                                        console.log("found 0 devices!");
//
//                                    }
//
//                                }
//
//
//                            }
//                        )
//                        ;
//
//
//                    });
//                }
//            });
//        }
//    });
//
//
////
////
//////    console.log("trying to login with name: " + name + ", pass: " + pass)
//////    console.log("great!");
//////// connect to user database:
//
//
//
//});

/**
 * Fetches machine data for a specific id.
 * Notice that a single id might contain data from few updates, i.e. every time data is added to a specific device,
 * it saves both the new and older data. Each data entry contains a date (see machineSchema).
 */
app.get('/mchDB/:id', function (req, response) {

    var id = req.params.id;
    // Will store the contents of the file
    var str = "";
    var parser = new xml2js.Parser();

    // Connect to database to find machine.
    mongoose.connect(mongodbUri, options);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback() {

        // create a machine model, and look for the machine with the given id.
        var deviceData = mongoose.model('machine', deviceDataSchema);
        deviceData.find({id: id}, function (err, data) {
            if (err) {
                response.status(400).send("DB connection error.");
                return;
            }
            if (data.length === 0) {
                response.status(400).send("Couldn't find a machine matching the id.");
                mongoose.disconnect();
            } else {
                response.status(200);
                response.json(data);
                mongoose.disconnect();
            }
        });
    });
});



/**
 * Fetch data from a device with a specific device ID.
 * Notice this fetches the data from the actual device, and not from the database.
 * The actual fetching is done by a worker (see worker.js), and does not block the server.
 * Every request for data creates a new worker.
 * The worker adds the fetched data to the db automatically.
 * If the worker receives no answer from the device after 5 minutes, it closes the connection.
 * Once a request is sent, the id of the device is kept until the worker is done. This is done to ensure only one
 * request is sent each time per device.
 * Parameters:
 * id - device id.
 * server - the server to get the data from (Europe or USA)
 */
app.get('/XML/:id/:server', function (req, response) {

    // Use the device id as a token.
    var token = req.params.id;

    // Make sure there isn't a request for the device at the moment.
    if (tokens.indexOf(token) == -1) {
        tokens.push(token);
        // Get a worker:
        var w = new Worker('worker.js');
        // Get the id and server info.
        var id = req.params.id;
        var server = req.params.server;
        // Give worker the machine id and server:
        w.postMessage({id:id , server:server});

        // Wait for worker response.
        w.onmessage = function (msg) {
            // Erase the token
            var index = tokens.indexOf(token);
            if (index > -1) {
                tokens.splice(index, 1);
            }
            // Make sure there was no worker error.
            if (msg.data == "404") {
                sendError();
            } else {
                // Send the result
                sendResult(msg.data);
            }
        };
    }

    // Sends the worker result back to the client.
    function sendResult(data) {
        response.status(200);
        response.send(data);
        //response.end();
    }

    // Sends an error in case of failure.
    function sendError() {
        response.status(404);
        response.send();
        //response.end();
    }
});


/**
 * send update request to device.
 * the method creates an updateRequest worker, which send a request file to the device
 * and waits for a response.
 * the method returns the response.
 * id - device id.
 * token - is added to queue, to make sure there is only one request per machine
 *         at a time.
 * server - the server to get the data from (Europe or USA)
 */
app.get('/updateRequest/:id/:server/:filePath', function (req, response) {

    console.log("started update request")
    var token = req.params.id;

    console.log("token: " + token);
    if (tokens.indexOf(token) == -1) {
        tokens.push(token);
        // get a worker:
        var w = new Worker('workerUpdateRequest.js');
        var filePath = './updateFiles/' + req.params.filePath + '/';


        var id = req.params.id;
        var server = req.params.server;
        //id = id.concat("/");
        console.log("calling worker with: " + id);
        console.log("calling worker with: " + server);

        // give worker the machine ID:
        w.onmessage = function (msg) {
            console.log('got back from worker!');
            console.log('from worker: '+ msg.data);
            try {
                tokens.splice(tokens.indexOf(token), 1);
            }
            catch (err) {
                console.log("error while splicing: " + err.message);
            }
            if (msg.data == "404") {
                sendError();
            }
            else {

                sendResult(msg.data);
            }

        };
        w.postMessage({id:id, server:server, filePath:filePath});

        function sendResult(data) {
            console.log("sending result.");
            response.status(200);
            response.send(data);
            console.log("ftp results send *-*-*-*-*-*-*-*-*-*-.");
            //response.end();

        }

        function sendError() {
            console.log("sending error result");
            response.status(404);
            response.send();
            //response.end();

        }
    } else {
        console.log("machine update in progress.");
        response.status(400);
        response.send("machine update in progress!");
        //response.end();
    }

});


//app.get('/deviceInfo/:id', function (req, response) {
//
//    var id = req.params.id;
//
//    mongoose.connect('mongodb://127.0.0.1:27017/Devices');
//    var db = mongoose.connection;
//    db.on('error', console.error.bind(console, 'connection error:'));
//
//    db.once('open', function callback() {
//
//
//        console.log("connected to db!");
//        console.log("looking for machine in DB with id: " + id);
//
//        var device = mongoose.model('machine', deviceSchema);
//        device.find({id: id}, function (err, data) {
//            if (err)
//                return console.error(err);
//            if (data.length === 0) {
//                response.status(404);
//                response.end();
//                console.log("device not found!");
//                mongoose.disconnect();
//            }
//            else {
//                console.log("device found!");
//                response.status(200);
//                response.json(data);
//                mongoose.disconnect();
//            }
//
//        })
//
//
//    });
//
//
//});

/**
 * Receives the DNL file and saves it locally. Creates a new directory with the file name and renames the file "DNL".
 */
app.post('/file-upload-DNL', function(req, res, next) {
    // get the temporary location of the file
    var tmp_path = req.files.DNLfile.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var fileName =  req.files.DNLfile.name.split(".")[0];
    // New directory path.
    var target_path = './updateFiles/' + fileName + '/';
    // Create new directory.
    mkdirp(target_path, function (err) {
        if (err) {
            console.error("couldn't create folder");
            res.send({copied: false, path: "", unlinked: false, error: "couldn't create folder"});
        } else {
            var filePath = target_path + '/DNL';
            console.log("target path: " + target_path);
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, filePath, function(err) {
                if ( err ) {
                    console.log('ERROR: ' + err);
                    res.send({copied: false, path: "", unlinked: false, error: err});
                } else {
                    console.log("file added, deleting temp file");
                    // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                    fs.unlink(tmp_path, function() {
                        if (err) {
                            console.log('ERROR: ' + err);
                            res.send({copied: true, path: fileName, unlinked: false, error: "was not able to delete temp file"});
                        }
                        console.log("deleted old file");
                        res.send({copied: true, path: fileName, unlinked: true, error: ""});
                    });
                }
            });
        };
    });
});


/**
 * Starts the server.
 */
app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'));
})



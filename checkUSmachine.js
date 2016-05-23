var JSFtp = require("jsftp");
//var mongoose = require('mongoose');
//var xml2js = require('xml2js');
var fs = require("fs");


console.log('workerd initiated');
var fileList = [];
var counter = 0;
var addedFiles = 0;
var BUFFER;
var ftp = new JSFtp({
    host: "91.212.157.71",
    user: "internetUS@M2MBriot", // defaults to "anonymous"
    pass: "Qc6T5a" // defaults to "@anonymous"

});

fs.readFile('./TODO', function (err, buffer) {
    if (err) {
        console.error(err);
        callback(err);
    }
    else {
        console.log("read fikle!");
        try {

            BUFFER = buffer;
            getList();


        }
        catch (err) {
            console.log(err.message);
        }


    }
});

function addTODO() {
    var success = false;
    if (addedFiles < counter) {
        try{
            ftp.put(BUFFER, fileList[addedFiles], function (hadError) {
                if (!hadError) {
                    console.log("File transferred successfully!");
                    addedFiles++;
                    addTODO();
                    success = true;

                }
                else console.log("error putting TODO file: " + hadError.message);
            });
        }
        catch (err)
        {
            if (!success)
            {
                addedFiles++;
                addTODO();
            }
            console.log(err.message);
        }

    }


}

function getList() {
    ftp.ls(".", function (err, res) {
        if (err) {
            console.log("machine not found");
        }
        else {
            for (file in res) {
                if (!isNaN(res[file].name[0])) {
                    console.log("addong gile!");

                    var path = res[file].name + '/TODO';
                    fileList[counter] = path;
                    counter++;
                    //console.log("adding to: " +path)
                    //ftp.put(buffer, path, function (hadError) {
                    //                    if (!hadError) {
                    //                        console.log("File transferred successfully!");
                    //                    }
                    //                    else console.log("error putting TODO file: " + hadError.message);
                    //                });
                }


            }
            addTODO(0);
            //for (file in fileList) {
            //    console.log(fileList[file]);
            //}

        }
    });
}



var JSFtp = require("jsftp");
//var mongoose = require('mongoose');
//var xml2js = require('xml2js');
var fs = require("fs");


//console.log('workerd initiated');
var fileList = [];
var counter = 0;
var addedFiles = 0;
var BUFFER;
var ftp = new JSFtp({
    host: "91.212.157.71",
    user: "internetUS@M2MBriot", // defaults to "anonymous"
    pass: "Qc6T5a" // defaults to "@anonymous"

});
getList();

function getList() {
    ftp.ls(".", function (err, res) {
        if (err) {
            //console.log("machine not found");
        }
        else {
            for (file in res) {
                if (!isNaN(res[file].name[0])) {

                    //console.log("checking folder: " + res[file].name);
                    var path = res[file].name;
                    getUPL(path);

                }


            }
        }
    });
}
function getUPL(id) {
    //console.log("id: " +id);
    ftp.ls(id, function (err, res) {
        if (err) {
            //console.log("machine not found");
        }
        else {
            res.forEach(function (file) {
                var date= new  Date(file.time);
                if (file.name == "UPL"  && date.getFullYear()>=2015 && date.getMonth()>=5 && date.getDate()>=29) {
                    console.log(id);

                }
            });
        }
    });
}

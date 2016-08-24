/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

var techApp = angular.module('techApp', ['ngTable', 'ngAnimate']);

techApp.controller('MachineListCtrl', function ($scope, $filter, $q, ngTableParams) {


    // ----------------------------------------------
    // ----------    variables       ----------------
    // ----------------------------------------------

    $scope.machineTable = false;
    $scope.machineLoaded = false;
    $scope.tableName = "";
    $scope.dateOfData = "";

    // for table parameters:
    $scope.currentData = null;
    $scope.showDevices = [];
    $scope.selectExisting = false;

    // ----------------------------------------------
    // ---------- machine search box ----------------
    // ----------------------------------------------

    // status of search
    $scope.status = '';
    // boolean - 'is in search mode?'
    $scope.fetching = false;

    // show search box
    $scope.searchBox = false;
    $scope.devicesTable = false;


    //// TODO delete:
    $('#updateButton').on('click', function () {

        //var updating = "";
        var selectedUpdate = $('#deviceListTable').bootstrapTable('getSelections');
        var selectedCount = 0;
        for (var deviceToUpdate in selectedUpdate) {
            selectedCount++;
        }
        if (selectedCount == 1)  {
            return true;
        } else if (selectedCount == 0){
            alert("You must select a machine");
            return false;
        } else if (selectedCount > 1) {
            alert("Only single machine update is currently supported.");
            return false;
        }
        //alert("sending update to: \n" + updating);
        //getLatestUpdate();
    });



    $scope.devices = {};
    function getDeviceList() {
        //alert("fetching machines!!!");
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: "../../getMachines/",
            success: function (dataDB, textStatus, jqXHR) {

                //alert("came back with " + dataDB.length + "machines!")
                //alert(JSON.stringify(dataDB[0]));


                $('#deviceListTable').bootstrapTable({
                    columns: [{
                        field: 'state',
                        checkbox: 'true'
                    },
                        {
                            title: '<i class="glyphicon glyphicon-cloud-download"></i>',
                            title: '<i class="glyphicon glyphicon-cloud-download"></i>',
                            events: "actionEvents",
                            field: 'action',
                            formatter: actionFormatter
                        },
                        {
                            field: '_id',
                            title: 'Device ID',
                            sortable: 'true',
                        }, {
                            field: 'Country',
                            title: 'Country',
                            sortable: 'true'
                        },
                        {
                            field: 'State',
                            title: 'State',
                            sortable: 'true'
                        },
                        {
                            field: 'City',
                            title: 'City',
                            sortable: 'true'
                        }, {
                            field: 'Optician_Name',
                            title: 'Optician Name',
                            sortable: 'true'
                        },
                        {
                            field: 'Optician_Surname',
                            title: 'Optician Surame',
                            sortable: 'true'
                        }, {
                            field: 'Optician_Shop',
                            title: 'Optician Shop',
                            sortable: 'true'
                        },
                        {
                            field: 'Address',
                            title: 'Address',
                            sortable: 'true'
                        }, {
                            field: 'Zip',
                            title: 'Zip',
                            sortable: 'true'
                        },
                        {
                            field: 'Zone',
                            title: 'Zone',
                            sortable: 'true'
                        }, {
                            field: 'Phone_Number',
                            title: 'Phone Number',
                            sortable: 'true'
                        },
                        {
                            field: 'Mobile_Number',
                            title: 'Mobile Number',
                            sortable: 'true'
                        }, {
                            field: 'Fax',
                            title: 'Fax'
                        },
                        {
                            field: 'Email',
                            title: 'Email'
                        }, {
                            field: 'server',
                            title: 'Server',
                            sortable: 'true'
                        },
                        {
                            field: 'Group',
                            title: 'Group',
                            sortable: 'true'
                        }

                    ],
                    data: dataDB
                });


                $scope.$apply(function () {
                    $scope.devices = dataDB;
                    $scope.devicesTable = true;
                });
                //$(function () {
                //    $('#deviceTable').bootstrapTable({
                //        data: dataDB
                //    });
                //});


            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert('returned error with text: ' + errorThrown);
                //alert('returned text status: ' + textStatus);

            }
        });
    }
    getDeviceList();


    /**
     * get device from list:
     */
    function actionFormatter(value, row, index) {

        return [
            '<a class="cloudUpload" href="javascript:void(0)">',
            '<i class="glyphicon glyphicon-cloud-download"></i>',
            '</a>'
        ].join('');
    }


    window.actionEvents = {
        'click .cloudUpload': function (e, value, row, index) {
            //alert('You click like icon, row: ' + JSON.stringify(row._id));
            $('#searchTab').addClass("active");
            $('#listTab').removeClass("active");
            $('#searchMachine').addClass("active");
            $('#machineList').removeClass("active");
            changeStaus('getting machine ID: ' + row._id + "      ", "#000000");

            $scope.$apply(function () {
                $scope.searchBox = true;
                $scope.machineLoaded = false;
                $scope.fetching = true;

            });
            $scope.getMachine(row._id, row.server);
        }
    };


    /**
     * prepare seach machine tab:
     */

    $scope.searchMachineTab = function () {

        //alert("dsd")
        $scope.searchBox = true;
        changeStaus('');
        $scope.fetching = false;
        $scope.machineTable = false;
    }

    /**
     * function which is called when 'connect' button is pressed.
     * @param machine  the id of the machine to get.
     */
    $scope.getMachine = function (machine, server) {
        $scope.tableName = machine;
        // change fetching status text
        changeStaus('getting machine ID: ' + machine + "      ", "#000000");
        // change fetching status boolean
        $scope.fetching = true;
        // call helper function which returns machine data data:

        getMachineDB(machine, server, function (success) {
            if (success) {
                $scope.$apply(function () {
                    changeStaus('');
                    $scope.machineTable = true;
                    $scope.machineLoaded = true;
                });
            }
            else {
                $scope.$apply(function () {
                    changeStaus('machine not found in data base. Trying to fetch from server', "#980000");
                    $scope.fetching = false;
                });
            }
            getMachineFTP(machine, server, function (success) {
                if (success) {
                    $scope.$apply(function () {
                        changeStaus('');
                        $scope.machineTable = true;
                        $scope.machineLoaded = true;

                    });
                }
                else {
                    $scope.$apply(function () {
                        changeStaus('machine not found. make sure you have entered the correct ID', "#980000");
                        $scope.fetching = false;

                    });

                }
            });
        });

    };

    //$scope.fetching = false;


    /**
     * This function changes the text and color of the "status text"
     * @param text text to change too
     * @param color optional, color of text
     */
    function changeStaus(text, color) {

        //alert("chaing! \n" + text );
        if (color) {
            document.getElementById("fetchStaus").style.color = color;

        }
        $scope.status = text;

    }

    /**
     * This function changes the current category selected.
     * @param selected num of catefgory to select
     */
    $scope.setSelected = function (selected) {
        $scope.selectedCategory = selected;
    };


    /**
     * this function
     * @param selected
     * @param category
     */
    $scope.setSubSelected = function (selected, category) {
        $scope.selectedSubCategory = selected;
        $scope.subCatResults = category;

        //alert(JSON.stringify($scope.checkboxes.items[1]))
        //alert("selected: " + selected);
        //var data = [];
        //var counterData = 0;
        //for (var key in category) {
        //    if (category.hasOwnProperty(key)) {
        //        data[counterData] = {type: key , value: category[key]};
        //        counterData++;
        //        //alert(key + " -> " + category[key]);
        //    }
        //}
        //
        //$scope.tableParams = new ngTableParams({
        //    page: 1,            // show first page
        //    count: 3           // count per page
        //}, {
        //    total: 100,
        //    data: data
        //});


    };


    $scope.ftpReturned = false;
    /**
     * This function performs the request from the server and handles the result
     * @param machine id of machine
     * @param callback callback to perform once results received.
     */
    function getMachineFTP(machine, server, callback) {
        //alert("getting: " +machine);
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: "../../XML/" + machine + "/" + server,
            success: function (data, textStatus, jqXHR) {

                //alert("got back with status: " + textStatus + " , " + jqXHR.status);
                // parsing of the received data:
                $scope.dateOfData = "current data";
                var myData;
                for (var i in data) {
                    //alert(i);
                    var newData = data[i];
                    //alert(newData);
                    for (var j in newData) {
                        myData = newData[j];
                        //alert(JSON.stringify(myData));
                    }
                }
                //alert(JSON.stringify(data));
                //$scope.rawData = JSON.stringify(data.Eeprom[ALTA_NX]);
                //$scope.$apply();

                myData = myData[0];
                //var propertyIndex = 0;
                $scope.machineCategoriesFTP = {};
                //$scope.machineCategories = [];
                //$scope.machineSubCategories = {};

                var categories = {};
                for (var category in myData) {
                    //alert(category);
                    var tempCategory = myData[category][0];
                    //// object to hold all the data for the subcategories:
                    var subCatObject = {};
                    for (var subCategory in tempCategory) {
                        //alert(subCategory);
                        var tempCategoryValues = myData[category][0][subCategory][0];
                        // object to hold all the values for the subcategories:
                        var subValuesObject = {};
                        for (var subCategoryValues in tempCategoryValues) {
                            //alert(subCategoryValues);

                            var label = (getLabel(subCategoryValues) == undefined) ? subCategoryValues : getLabel(subCategoryValues);

                            subValuesObject[label] = tempCategoryValues[subCategoryValues][0];
                            //alert( tempCategoryValues[subCategoryValues][0]);
                        }
                        subCatObject[subCategory] = subValuesObject;
                        //break;
                    }
                    categories[category] = subCatObject;
                    //break;
                }
                $scope.machineCategoriesFTP = categories;

                //
                //alert(JSON.stringify($scope.machineCategoriesFTP));
                //$scope.$apply();

                $scope.ftpReturned = true;
                callback(true);

            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert('returned error with text: ' + errorThrown);
                //alert('returned text status: ' + textStatus);
                $scope.fetching = false;
                callback(false);
            }
        });
        // alert("clicked!");

    };


    $scope.numberOfEntries = 0;

    /**
     * This function performs the request from the DB
     * @param machine id of machine
     * @param callback callback to perform once results received.
     */
    function getMachineDB(machine, server, callback) {
        //alert("getting: " +machine);
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: "../../mchDB/" + machine,
            success: function (dataDB, textStatus, jqXHR) {

                $scope.numberOfEntries = dataDB.length;
                //alert("adding devices: " + dataDB.length);

                //alert("got back with status: " + textStatus + " , " + jqXHR.status);
                // parsing of the received data:
                //alert("data is from: " + dataDB.date);


                //alert("got back with status: " + textStatus + " , " + jqXHR.status);
                // parsing of the received data:
                //alert("data is from: " + dataDB.date);

                /*
                 for each data entrty (diff date)
                 */
                $scope.entryCounter = [];
                $scope.dataEntriesDates = [];
                var entryCounter = 0;
                for (var entry = 0; entry < dataDB.length; entry++) {
                    var date = {};
                    date.day = (new Date(dataDB[entry].created_at)).toLocaleDateString();
                    date.time = (new Date(dataDB[entry].created_at)).toLocaleTimeString();
                    $scope.dataEntriesDates[entry] = date;
                    $scope.entryCounter[entry] = entry;
                    $scope.showDevices[entry] = false;
                }
                createDateModal($scope.dataEntriesDates);

                $('#deviceDateModal').on('show.bs.modal', function (e) {

                    /**
                     * update devices from modal
                     */
                    $('#addSelectedDates').click(function (event) {

                        var selectedUpdate = $('#deviceDateTable').bootstrapTable('getSelections');
                        $scope.dataEntriesDates = selectedUpdate;
                        //alert(JSON.stringify(selectedUpdate))
                        //alert(selectedUpdate[0].day);
                        var data2 = [];
                        var deviceInsertIdx = 0;
                        for (var entry = 0; entry < dataDB.length; entry++) {
                            var date = {};
                            date.day = (new Date(dataDB[entry].created_at)).toLocaleDateString();
                            date.time = (new Date(dataDB[entry].created_at)).toLocaleTimeString();
                            //alert("looking for:" + date.day + " - " + date.time);
                            var foundDevice = false;
                            for (var dateIndex in selectedUpdate) {
                                //alert(date);
                                if (selectedUpdate[dateIndex].day == date.day && selectedUpdate[dateIndex].time == date.time) {
                                    foundDevice = true;
                                }
                            }
                            if (foundDevice) {
                                data2[deviceInsertIdx] = dataDB[entry];
                                deviceInsertIdx++;
                            }

                        }
                        dataDB = data2;
                        //alert(deviceInsertIdx);
                        var myData;
                        var data = dataDB[0].data;
                        //alert(JSON.stringify(data));
                        var P1;
                        var P2;
                        //if (entryCounter == 0) {
                        for (var prop in dataDB[0].data) {
                            if (typeof data[prop] == "object" && data[prop]) {
                                dataDB[0].data[prop];
                                for (var prop2 in dataDB[0].data[prop]) {
                                    if (typeof (dataDB[0].data[prop])[prop2] == "object" && (dataDB[0].data[prop])[prop2]) {


                                        //alert(JSON.stringify(((dataDB[entry].data[prop])[prop2])));
                                        P1 = prop;
                                        P2 = prop2;
                                    }
                                }
                            }
                        }
                        //}
                        for (var i in data) {
                            //alert(i);
                            var newData = data[i];
                            //alert(newData);
                            for (var j in newData) {
                                myData = newData[j];
                                //alert(JSON.stringify(myData));
                            }
                        }
                        //alert(JSON.stringify(data));
                        //$scope.rawData = JSON.stringify(data.Eeprom[ALTA_NX]);
                        //$scope.$apply();

                        myData = myData[0];
                        //var propertyIndex = 0;
                        //$scope.machineCategories = {};
                        //$scope.machineCategories = [];
                        //$scope.machineSubCategories = {};

                        var categories = {};
                        for (var category in myData) {
                            //alert(category);
                            var tempCategory = myData[category][0];
                            //// object to hold all the data for the subcategories:
                            var subCatObject = {};
                            for (var subCategory in tempCategory) {

                                //alert(subCategory);
                                var tempCategoryValues = myData[category][0][subCategory][0];
                                // object to hold all the values for the subcategories:
                                var subValuesObject = {};
                                for (var subCategoryValues in tempCategoryValues) {
                                    //alert("subCategoryValues: " + subCategoryValues);
                                    var entries = [];

                                    if (category == "History" && (subCategoryValues == "LabelEvent" || subCategoryValues == "Event")) {

                                        for (var event in (dataDB[0].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0]) {
                                            //alert(event);
                                            for (var entry = 0; entry < dataDB.length; entry++) {
                                                entries[entry] = (dataDB[entry].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0][event][0];
                                            }
                                            var label = (getLabel(event) == undefined) ? event : getLabel(event);
                                            //alert(label);

                                            subValuesObject[label] = entries;
                                        }
                                    }
                                    else {
                                        for (var entry = 0; entry < dataDB.length; entry++) {
                                            entries[entry] = (dataDB[entry].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0];
                                        }
                                        var label = (getLabel(subCategoryValues) == undefined) ? subCategoryValues : getLabel(subCategoryValues);
                                        //alert(label);

                                        subValuesObject[label] = entries;

                                    }


                                    //alert(subCategoryValues);

                                    //subValuesObject[label] = tempCategoryValues[subCategoryValues][0];
                                    //if (entryCounter == 0) {
                                    //    alert(JSON.stringify(entries));
                                    //
                                    //}
                                    entryCounter++;

                                    //alert( tempCategoryValues[subCategoryValues][0]);
                                }
                                subCatObject[subCategory] = subValuesObject;
                                //break;
                            }
                            categories[category] = subCatObject;
                            //break;
                        }
                        //$scope.dataEntries[entry] = categories;
                        $scope.machineCategories = categories;

                        //}

                        $('#deviceDateModal').modal('hide');

                        callback(true);
                    });

                });
                $('#deviceDateModal').modal();

                //var myData;
                //var data = dataDB[0].data;
                ////alert(JSON.stringify(data));
                //var P1;
                //var P2;
                ////if (entryCounter == 0) {
                //for (var prop in dataDB[0].data) {
                //    if (typeof data[prop] == "object" && data[prop]) {
                //        dataDB[0].data[prop];
                //        for (var prop2 in dataDB[0].data[prop]) {
                //            if (typeof (dataDB[0].data[prop])[prop2] == "object" && (dataDB[0].data[prop])[prop2]) {
                //
                //
                //                //alert(JSON.stringify(((dataDB[entry].data[prop])[prop2])));
                //                P1 = prop;
                //                P2 = prop2;
                //            }
                //        }
                //    }
                //}
                ////}
                //for (var i in data) {
                //    //alert(i);
                //    var newData = data[i];
                //    //alert(newData);
                //    for (var j in newData) {
                //        myData = newData[j];
                //        //alert(JSON.stringify(myData));
                //    }
                //}
                ////alert(JSON.stringify(data));
                ////$scope.rawData = JSON.stringify(data.Eeprom[ALTA_NX]);
                ////$scope.$apply();
                //
                //myData = myData[0];
                ////var propertyIndex = 0;
                ////$scope.machineCategories = {};
                ////$scope.machineCategories = [];
                ////$scope.machineSubCategories = {};
                //
                //var categories = {};
                //for (var category in myData) {
                //    //alert(category);
                //    var tempCategory = myData[category][0];
                //    //// object to hold all the data for the subcategories:
                //    var subCatObject = {};
                //    for (var subCategory in tempCategory) {
                //
                //        //alert(subCategory);
                //        var tempCategoryValues = myData[category][0][subCategory][0];
                //        // object to hold all the values for the subcategories:
                //        var subValuesObject = {};
                //        for (var subCategoryValues in tempCategoryValues) {
                //            //alert("subCategoryValues: " + subCategoryValues);
                //            var entries = [];
                //
                //            if (category == "History" && (subCategoryValues == "LabelEvent" || subCategoryValues == "Event")) {
                //
                //                for (var event in (dataDB[0].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0]) {
                //                    //alert(event);
                //                    for (var entry = 0; entry < dataDB.length; entry++) {
                //                        entries[entry] = (dataDB[entry].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0][event][0];
                //                    }
                //                    var label = (getLabel(event) == undefined) ? event : getLabel(event);
                //                    //alert(label);
                //
                //                    subValuesObject[label] = entries;
                //                }
                //            }
                //            else {
                //                for (var entry = 0; entry < dataDB.length; entry++) {
                //                    entries[entry] = (dataDB[entry].data[P1])[P2][0][category][0][subCategory][0][subCategoryValues][0];
                //                }
                //                var label = (getLabel(subCategoryValues) == undefined) ? subCategoryValues : getLabel(subCategoryValues);
                //                //alert(label);
                //
                //                subValuesObject[label] = entries;
                //
                //            }
                //
                //
                //            //alert(subCategoryValues);
                //
                //            //subValuesObject[label] = tempCategoryValues[subCategoryValues][0];
                //            //if (entryCounter == 0) {
                //            //    alert(JSON.stringify(entries));
                //            //
                //            //}
                //            entryCounter++;
                //
                //            //alert( tempCategoryValues[subCategoryValues][0]);
                //        }
                //        subCatObject[subCategory] = subValuesObject;
                //        //break;
                //    }
                //    categories[category] = subCatObject;
                //    //break;
                //}
                ////$scope.dataEntries[entry] = categories;
                //$scope.machineCategories = categories;
                //
                ////}
                //
                //
                //callback(true);

            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert('returned error with text: ' + errorThrown);
                //alert('returned text status: ' + textStatus);
                $scope.fetching = false;
                callback(false);
            }
        });
        // alert("clicked!");

    };


    /**
     * create modal to choose device dates:
     */
    function createDateModal(deviceDates) {
        $('#deviceDateTable').bootstrapTable({
            columns: [{
                field: 'state',
                checkbox: 'true'
            },

                {
                    field: 'day',
                    title: 'Date',
                    sortable: 'true',
                },
                {
                    field: 'time',
                    title: 'Time',
                    sortable: 'true',
                }
            ],
            data: deviceDates
        });
    }


    /**
     * Checkboxes
     */
        //$scope.checkboxes = { 'checked': false, items: {} };
    $(document).ready(function () {
        $("body").tooltip({selector: '[data-toggle=tooltip]'});
    });
    /**
     * This function changes the current category selected.
     * @param selected num of catefgory to select
     */
    $scope.selectedDevices = function (selected) {
        $scope.showDevices[selected] = !$scope.showDevices[selected];
        //$scope.checkboxes.times[selected] = true;
        //if($scope.checkboxes.times[selected])
        //{
        //    alert(selected + " - " + $scope.showDevices[selected]);

        //}

    };

    //// watch for check all checkbox
    //$scope.$watch('checkboxes.checked', function(value) {
    //    angular.forEach($scope.devices, function(item) {
    //        if (angular.isDefined(item.id)) {
    //            $scope.checkboxes.items[item.id] = value;
    //        }
    //    });
    //});

    // watch for data checkboxes
    //$scope.$watch('checkboxes.items', function(values) {
    //    alert("hello!" + JSON.stringify(values));
    //    if (!$scope.devices) {
    //        return;
    //    }
    //    var checked = 0, unchecked = 0,
    //        total = $scope.devices.length;
    //    angular.forEach($scope.devices, function(item) {
    //        checked   +=  ($scope.checkboxes.items[item.id]) || 0;
    //        unchecked += (!$scope.checkboxes.items[item.id]) || 0;
    //    });
    //    if ((unchecked == 0) || (checked == 0)) {
    //        $scope.checkboxes.checked = (checked == total);
    //    }
    //    // grayed checkbox
    //    angular.element(document.getElementById("select_all")).prop("indeterminate", (checked != 0 && unchecked != 0));
    //}, true);


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


    /**
     * parameters for the device data table
     */


    /**
     * Add new Device
     */

    $scope.addDeviceSuccess = true;

    $(document).on("click", "#addDeviceSubmit", function() {
        event.preventDefault()

        //alert(
        //    "clicked!"
        //);
        var id = $('#deviceId').val();
        var deviceServer = $('#deviceServer').val();
        var Optician_Shop = $('#Optician_Shop').val();
        var Optician_Name = $('#Optician_Name').val();
        var Optician_Surname = $('#Optician_Surname').val();
        var Address = $('#Address').val();
        var Zip = $('#Zip').val();
        var City = $('#City').val();
        var Country = $('#Country').val();
        var State = $('#State').val();
        var Zone = $('#Zone').val();
        var Email = $('#Email').val();
        var Group = $('#Group').val();
        var Phone_Number = $('#Phone_Number').val();
        var Mobile_Number = $('#Mobile_Number').val();
        var Fax = $('#Fax').val();

        if (id == "" || deviceServer == "" || !IsEmail(Email)) {
            //alert("missing stuff");
            return;
        }
        ////alert("id: " + id + ", deviceServer: " + deviceServer +", Optician_Shop: " + Optician_Shop +", Optician_Name: " + Optician_Name +
        //", Optician_Surname: " + Optician_Surname +", Address: " + Address +", Zip: " + Zip +", City: " + City +
        //", Country: " + Country +", State: " + State +", Zone: " + Zone +", Email: " + Email +", Group: " + Group +
        //", Phone_Number: " + Phone_Number +", Mobile_Number: " + Mobile_Number +", Fax: " + Fax);
        $scope.addDeviceSuccess = false;
////      alert("Zip: " + name + ", and pass: " + pass);
//
        $.ajax({
            type: 'POST',
            data: JSON.stringify({
                id: id,
                deviceServer: deviceServer,
                Optician_Shop: Optician_Shop,
                Optician_Name: Optician_Name,
                Optician_Surname: Optician_Surname,
                Address: Address,
                Zip: Zip,
                City: City,
                Country: Country,
                State: State,
                Zone: Zone,
                Email: Email,
                Group: Group,
                Phone_Number: Phone_Number,
                Mobile_Number: Mobile_Number,
                Fax: Fax,
            }),
            contentType: 'application/json',

            url: "./../../addDevice",
            success: function (data, textStatus, jqXHR) {
                //alert('returned textStatus: ' + textStatus);
                getDeviceList();
//            alert('returned public key: ' + data);


            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert("wtf?");

                alert('returned error with text: ' + errorThrown);
                alert('returned text status: ' + textStatus);
            }
        });

    });
//    $('#addDeviceSubmit').click(function (event) {
//        event.preventDefault()
//
//        //alert(
//        //    "clicked!"
//        //);
//        var id = $('#deviceId').val();
//        var deviceServer = $('#deviceServer').val();
//        var Optician_Shop = $('#Optician_Shop').val();
//        var Optician_Name = $('#Optician_Name').val();
//        var Optician_Surname = $('#Optician_Surname').val();
//        var Address = $('#Address').val();
//        var Zip = $('#Zip').val();
//        var City = $('#City').val();
//        var Country = $('#Country').val();
//        var State = $('#State').val();
//        var Zone = $('#Zone').val();
//        var Email = $('#Email').val();
//        var Group = $('#Group').val();
//        var Phone_Number = $('#Phone_Number').val();
//        var Mobile_Number = $('#Mobile_Number').val();
//        var Fax = $('#Fax').val();
//
//        if (id == "" || deviceServer == "" || !IsEmail(Email)) {
//            //alert("missing stuff");
//            return;
//        }
//        ////alert("id: " + id + ", deviceServer: " + deviceServer +", Optician_Shop: " + Optician_Shop +", Optician_Name: " + Optician_Name +
//        //", Optician_Surname: " + Optician_Surname +", Address: " + Address +", Zip: " + Zip +", City: " + City +
//        //", Country: " + Country +", State: " + State +", Zone: " + Zone +", Email: " + Email +", Group: " + Group +
//        //", Phone_Number: " + Phone_Number +", Mobile_Number: " + Mobile_Number +", Fax: " + Fax);
//        $scope.addDeviceSuccess = false;
//////      alert("Zip: " + name + ", and pass: " + pass);
////
//        $.ajax({
//            type: 'POST',
//            data: JSON.stringify({
//                id: id,
//                deviceServer: deviceServer,
//                Optician_Shop: Optician_Shop,
//                Optician_Name: Optician_Name,
//                Optician_Surname: Optician_Surname,
//                Address: Address,
//                Zip: Zip,
//                City: City,
//                Country: Country,
//                State: State,
//                Zone: Zone,
//                Email: Email,
//                Group: Group,
//                Phone_Number: Phone_Number,
//                Mobile_Number: Mobile_Number,
//                Fax: Fax,
//            }),
//            contentType: 'application/json',
//
//            url: "./../../addDevice",
//            success: function (data, textStatus, jqXHR) {
//                //alert('returned textStatus: ' + textStatus);
//                getDeviceList();
////            alert('returned public key: ' + data);
//
//
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                //alert("wtf?");
//
//                alert('returned error with text: ' + errorThrown);
//                alert('returned text status: ' + textStatus);
//            }
//        });
//
//    });


    /**
     * send update file to selected device.
     * The process is at follows:
     *  - create worker which will ask device if it wants the update.
     *  - wait for response. if responds yes under 10 mins, send update, o.w
     *    erase request.
     */
    $('#sendUpdate').click(function (event) {
        event.preventDefault()
        alert("updating");

        var selectedUpdate = $('#deviceListTable').bootstrapTable('getSelections');
        var id = "";
        var deviceServer = "";
        for (var deviceToUpdate in selectedUpdate) {
            var id = selectedUpdate[deviceToUpdate]._id;
            var deviceServer = selectedUpdate[deviceToUpdate].server;

            alert( "[Id: " + id+ ", Server: "+deviceServer
            +" ] , ");
        }
        //to notify user the file is being uploaded
        var file = $('#updateInputFile').get(0).files[0];
        // get the selected files
        var fdata = new FormData();
        // Form Data check the above bullet for what it is
        var error = 0;
        // Flag to notify in case of error and abort the upload
        alert(file.name);
        fdata.append('DNLfile', file, file.name);
        $.ajax({
            type: 'POST',
            url: '../../file-upload-DNL',
            data:fdata,
            contentType: false,
            processData: false,
            success: function(response) {
                if(response["copied"] == true) {
                    sendRequest(response["path"]);
                } else {
                    alert("returned with error: "+ response["error"]);
                }
            }
        });
        return false;

        function sendRequest(filePath) {
            var fdata = new FormData();
            alert("uploaded file!");
            $.ajax({
                type: 'GET',
                contentType: 'application/json',
                url: "../../updateRequest/" + id + "/" + deviceServer + "/" + filePath,
                success: function (data, textStatus, jqXHR) {
                    alert('returned from update request with machine answer: ' +data );
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert('returned from update request with text: ' + errorThrown);
                    alert('returned text status: ' + textStatus);

                }
            });
        }


    });



    /**
     * validate email
     * @param email
     * @returns {boolean}
     * @constructor
     */
    function IsEmail(email) {
        if (email == "") {
            return true;
        }
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email);
    }


    /**
     * returns the latest update in the server
     */

    function getLatestUpdate() {
        alert("getting update");
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: "../../getUpdateFile/",
            success: function (latestUpdate, textStatus, jqXHR) {

                alert("came back with " + JSON.stringify(latestUpdate));


                //$scope.$apply(function () {
                $('#latestUpdateTable').bootstrapTable({
                    columns: [{
                        field: 'state',
                        checkbox: 'true'
                    },
                        {
                            field: 'Version',
                            title: 'Version'
                        },
                        {
                            field: 'Comment',
                            title: 'Comment',
                        }
                    ],
                    data: latestUpdate
                });
                //});
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('returned error with text: ' + errorThrown);
                alert('returned text status: ' + textStatus);
            }
        });
    }



})
;
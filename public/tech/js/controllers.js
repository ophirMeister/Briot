/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

var techApp = angular.module('techApp', ['ngTable', 'ngAnimate']);

techApp.controller('MachineListCtrl', function ($scope, $filter, $q, ngTableParams) {


    alert("started!");
    var d = new Date();
    var timeStart = d.getTime();
//    get machine json:
    $scope.subCatResults = "";
    $scope.subCatResultsSplice = "";

    $scope.tableName = 'Machines';
    $scope.curMacCntrs;
    $scope.curMacCntrsSplc;
    $scope.curMacStg;
    $scope.curMacStgSplc;
    $scope.currentMachineSettings;
    $scope.numOfMachines = 7;
    $scope.machineTable = true;
    $scope.machines = "";
    $scope.machinesSplc = "";
    $scope.rawData = "pre";
    $scope.setSelected = function (selected) {
        $scope.selectedCategory = selected;
    };

    $scope.setSubSelected = function (selected, category) {
        $scope.selectedSubCategory = selected;
        $scope.subCatResults = category;
        $scope.subCatResultsSplice = category.slice(0, 10);
        //setResults();
        //alert(JSON.stringify(category));

    };

    var machineTemp;




    //alert("getting machines");
    try {

        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            url: "../../machines/0",
            success: function (data, textStatus, jqXHR) {
//
                alert("got machines!");
                $scope.machines = data;
                $scope.machinesSplc = data.slice(0, 10);
                $scope.currentData = data;
                $scope.$apply();
                //alert(JSON.stringify($scope.machines));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("wtf?asssa");
                alert('returned error with text: ' + errorThrown);
                alert('returned text status: ' + textStatus);
            }
        });
    }
    catch (err) {
        alert(err.message);
    }

// getting the xml file:
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: "../../XML",
        success: function (data, textStatus, jqXHR) {

            alert("got temp machine");
            //machineTemp = data;
            ////alert(JSON.stringify(machineTemp.Eeprom.ALTA_NX));
            var myData;
            for( var i in data)
            {
                //alert(i);
                var newData = data[i];
                //alert(newData);
                for (var j in newData)
                {
                    myData = newData[j];
                    //alert(JSON.stringify(myData));
                }
            }
            //alert(JSON.stringify(data));
            //$scope.rawData = JSON.stringify(data.Eeprom[ALTA_NX]);
            //$scope.$apply();

            myData = myData[0];
            //var propertyIndex = 0;
            $scope.machineCategories = {};
            //$scope.machineCategories = [];
            //$scope.machineSubCategories = {};

            var categories = {};
            for( var category in myData)
            {
                //alert(category);
                var tempCategory = myData[category][0];
                //// object to hold all the data for the subcategories:
                var subCatObject = {};
                for(var subCategory in tempCategory)
                {
                    //alert(subCategory);
                    var tempCategoryValues= myData[category][0][subCategory][0];
                    // object to hold all the values for the subcategories:
                    var subValuesObject={};
                    for(var subCategoryValues in tempCategoryValues)
                    {
                        //alert(subCategoryValues);
                        subValuesObject[subCategoryValues] = tempCategoryValues[subCategoryValues][0];
                        //alert( tempCategoryValues[subCategoryValues][0]);
                    }
                    subCatObject[subCategory] = subValuesObject;
                    //break;
                }
                categories[category]=subCatObject;
                //break;
            }
            $scope.machineCategories = categories;
            var e = new Date();
            var timeEnd = e.getTime();
            var totalTime = (timeEnd - timeStart)/1000;
            alert("loaded! it took " + totalTime + " seconds.");

            //alert(JSON.stringify($scope.machineCategories));
            $scope.$apply();



        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("sdjskd")
            alert('returned error with text: ' + errorThrown);
            alert('returned text status: ' + textStatus);
        }
    });


    //var transform = {'tag':'li','html':'${name} (${age})'};
    //
    //
    //
    //json2html.transform(data,transform);

    // get machine back up:
    $scope.getMachine = function (machine) {
        // alert("clicked!");
        $scope.tableName = "Machines - " + machine.name;
        $scope.currentMachine = machine;
        $scope.curMacCntrs = $scope.currentMachine.counters.counters1;


        $scope.curMacCntrsSplc = $scope.curMacCntrs.slice(0, 10);
        $scope.curMacStg = $scope.currentMachine.settings.settings1;

        $scope.curMacStgSplc = $scope.curMacStg.slice(0, 10);
        $scope.$apply();

        //alert(JSON.stringify(machine));
        // alert(JSON.stringify(machine));
        $scope.machineTable = !$scope.machineTable;
    };

    //$scope.getMachine = function(machine){
    //
    //    $.ajax({
    //        type: 'GET',
    //        contentType: 'application/json',
    //        url: "../../XML",
    //        success: function(data,textStatus,jqXHR ){
    //
    //            alert('got temp machine ' + textStatus);
    //            machineTemp = data;
    //            //alert(JSON.stringify(machineTemp.Eeprom.ALTA_NX));
    //            var obj = machineTemp.Eeprom.ALTA_NX;
    //            var i = 1;
    //
    //            // give machine data to scope:
    //            $scope.tableName = "Machines - " + machine.name;
    //            $scope.currentMachine = machine;
    //            $scope.Settings = obj.[0].Settings
    //            $scope.curMacCntrs = $scope.currentMachine.counters.counters1;
    //
    //
    //            $scope.curMacCntrsSplc = $scope.curMacCntrs.slice(0, 10);
    //            $scope.curMacStg =$scope.currentMachine.settings.settings1;
    //
    //            $scope.curMacStgSplc = $scope.curMacStg.slice(0, 10);
    //            $scope.$apply();
    //
    //            //alert(JSON.stringify(machine));
    //            // alert(JSON.stringify(machine));
    //            $scope.machineTable = !$scope.machineTable;
    //
    //
    //        },
    //        error: function( jqXHR, textStatus, errorThrown ){
    //            alert('returned error with text: ' + errorThrown);
    //            alert('returned text status: ' + textStatus);
    //        }
    //    });
    //    // alert("clicked!");
    //
    //};


//    different tables parameters:

    $scope.machineTableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,
        filter: {
            // initial filter
        }// count per page

    }, {
        total: 10, // length of data
        getData: function ($defer, params) {

            var orderedData = params.filter() ?
                $filter('filter')($scope.machines, params.filter()) :
                $scope.machines;


            $scope.machinesSplc = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
            params.total(orderedData.length);
            $defer.resolve($scope.machinesSplc);


        }
    });

    //$scope.resultTable = new ngTableParams({
    //    page: 1,            // show first page
    //    count: 10,
    //    filter: {
    //        // initial filter
    //    }// count per page
    //
    //}, {
    //    total: 10, // length of data
    //    getData: function ($defer, params) {
    //
    //        //var orderedData = params.filter() ?
    //        //    $filter('filter')($scope.subCatResults, params.filter()) :
    //        //    $scope.subCatResults;
    //
    //        $scope.subCatResultsSplice = $scope.subCatResults.slice((params.page() - 1) * params.count(), params.page() * params.count());
    //        params.total($scope.subCatResultsSplice.length);
    //        $defer.resolve($scope.subCatResultsSplice);
    //
    //
    //    }
    //});



    //$scope.counterTableParams = new ngTableParams({
    //    page: 1,            // show first page
    //    count: 10,          // count per page
    //    filter: {
    //        // initial filter
    //    }
    //}, {
    //    total: 59, // length of data
    //    getData: function ($defer, params) {
    //
    //        var orderedData = params.filter() ?
    //            $filter('filter')($scope.curMacCntrs, params.filter()) :
    //            $scope.curMacCntrs;
    //        //alert(JSON.stringify(orderedData));
    //
    //        $scope.curMacCntrsSplc = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
    //        params.total(orderedData.length);
    //        $defer.resolve($scope.curMacCntrsSplc);
    //
    //    }
    //});
    //$scope.settingsTableParams = new ngTableParams({
    //    page: 1,            // show first page
    //    count: 10,
    //    filter: {
    //        // initial filter
    //    }// count per page
    //}, {
    //    total: 60, // length of data
    //    getData: function ($defer, params) {
    //        var orderedData = params.filter() ?
    //            $filter('filter')($scope.curMacStg, params.filter()) :
    //            $scope.curMacStg;
    //        //alert(JSON.stringify(orderedData));
    //
    //        $scope.curMacStgSplc = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
    //        params.total(orderedData.length);
    //        $defer.resolve($scope.curMacStgSplc);
    //
    //    }
    //});

});
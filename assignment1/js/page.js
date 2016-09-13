/*global $, KINOME, glob, google*/

(function () {
    'use strict';
    var createPage, page, mean, variance, runSimulation, max, min, bin, round,
            printSimulationResults, createTable;

    mean = function (arr) {
        return arr.reduce(function (x, y) {
            return x + y;
        } ) / arr.length;
    };
    round = function (num, digs) {
        return Math.round(num * Math.pow(10, digs)) / 
                Math.pow(10, digs);
    };

    max = function (arr) {
        return Math.max.apply(null, arr);
    };

    min = function (arr) {
        return Math.min.apply(null, arr);
    };

    variance = function (arr) {
        var me = mean(arr);
        return arr.map(function (x) {
            return Math.pow(x - me, 2);
        }).reduce(function (x,y) {
            return x + y;
        }) / (arr.length - 1); 
    };

    runSimulation = function (perSet, sets, randomNumberGen, min, max) {
        var i, j, solutions = [[], []], miniArr;
        for (i = 0; i < sets; i += 1) {
            miniArr = [];
            for (j = 0; j < perSet; j += 1) {
                miniArr.push(randomNumberGen());
            }
            solutions[0].push(mean(miniArr));
            solutions[1].push(variance(miniArr));
        }
        return {
            means: solutions[0],
            variances: solutions[1],
            simulations: sets,
            trialsPerSim: perSet,
            min: min,
            max: max
        };
    };

    bin = function (dataArr) {
        // var wind = (max - min) / (nbins - 1), i, bins = [['Bin', 'Count']];
        // for (i = 0; i < nbins; i += 1) {
        //     bins.push([round(min + wind * i,2) + "-" + round(max + wind * i, 2), 1*0]);
        // }
        // for (i = 0; i < dataArr.length; i += 1) {
        //     bins[Math.floor(dataArr[i] / wind)][1] += 1;
        // }
        // return bins;
        var i, bins = [['label', 'value']];
        for (i = 0; i < dataArr.length; i += 1) {
            bins.push(['d'+i, dataArr[i]]);
        }
        return bins;
    };

    createTable = function (arr, parent) {
        var table, temp, i, j;
        table = $('<table />', {'class': 'table table-striped'});
        parent.append(table);
        table = $('<tbody />').appendTo(table);
        temp = $('<tr />');
        //Do header
        for (i = 0; i < arr[0].length; i += 1) {
            temp.append($('<th />', {html:arr[0][i]}));
        }
        table.append(temp);
        for (i = 1; i < arr.length; i += 1) {
            temp = $('<tr />');
            for (j = 0; j < arr[i].length; j += 1) {
                temp.append($('<td />', {html:arr[i][j]}));
            }
            table.append(temp);
        }
    };

    printSimulationResults = function (simulation) {
        page = $('#page');
        page.append('<h3>' + simulation.simulations + ' total simulations with ' + simulation.trialsPerSim + ' samples per simulation.</h3>');
        createTable([
            ['', 'Mean', 'Variance'],
            [
                'Mean of Trials',
                round(mean(simulation.means), 5),
                round(variance(simulation.means), 5)
            ],[
                'Variance of Trials',
                round(mean(simulation.variances), 5),
                round(variance(simulation.variances), 5)
            ]
        ], page);

        //Make Figure 1
        var id = "fig" + (Math.random()).toString().replace('0.','');
        page.append('<div id="' + id + '"></div>');
        var options = {
            legend: { position: 'none' },
            chartArea: { width: 400 },
            bar: { gap: 0 },
            histogram:{
                minValue: simulation.min,
                maxValue: simulation.max
            }
        };
        var myBins = bin(simulation.means);
        var data = google.visualization.arrayToDataTable(myBins);
        var chart = new google.visualization.Histogram(document.getElementById(id));
        chart.draw(data, options);
    };

    createPage = function () {
        var simulation;
        simulation = runSimulation(25, 5000, Math.random, 0, 1);
        printSimulationResults(simulation);
        simulation = runSimulation(50, 5000, Math.random, 0, 1);
        printSimulationResults(simulation);
        simulation = runSimulation(25, 10000, Math.random, 0, 1);
        printSimulationResults(simulation);
        simulation = runSimulation(50, 10000, Math.random, 0, 1);
        printSimulationResults(simulation);
    };

    google.charts.setOnLoadCallback(createPage);

}());
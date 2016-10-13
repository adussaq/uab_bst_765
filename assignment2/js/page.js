/*global $, KINOME, glob, google*/
var glob, globWork;
(function () {
    'use strict';
    var createPage, page, mean, variance, runSimulation, max, min, bin, round, runSimulationCompare,
            printSimulationResults, createTable, simRunnerNorm, simRunnerMixedNorm;

    simRunnerNorm = amd_ww.startWorkers({filename: 'js/math/normal_dist.min.js'});
    simRunnerMixedNorm = amd_ww.startWorkers({filename: 'js/math/mixed_norm.min.js'});
    globWork = simRunnerNorm;
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

    runSimulation = function (sets, simmer, params, min, max) {
        var i, solutions = [[], []], miniArr, ps = [];

        console.log('running sim', params);

        for (i = 0; i < sets; i += 1) {
            ps.push(simmer.submit(params).then(function (res) {
                solutions[0].push(res.mean);
                solutions[1].push(res.stdev);
            }));
        }
        return Promise.all(ps).then(function () {
            return {
                means: solutions[0],
                variances: solutions[1],
                simulations: sets,
                trialsPerSim: params.samples,
                min: min,
                max: max
            };
        });
    };

    runSimulationCompare = function (sets, simmer, params1, params2) {
        var i, solutions = [[], [], [], [], [], []], miniArr, ps = [], p1, p2;

        console.log('running sim compare', params1, params2);

        for (i = 0; i < sets; i += 1) {
            p1 = simmer.submit(params1);
            p2 = simmer.submit(params2);
            ps.push(Promise.all([p1, p2]).then(function (res) {
                var meanDiff = res[0].mean - res[1].mean;
                var pooledStdev = (res[0].stdev * (params1.samples - 1) + res[1].stdev * (params2.samples - 1))/ (params1.samples + params2.samples - 2);
                solutions[0].push(meanDiff);
                solutions[1].push(pooledStdev);
                solutions[2].push(globalObject.t.dist(meanDiff / Math.sqrt(2 * pooledStdev / params1.samples), params1.samples + params2.samples - 2, true));
                if (params1.hasOwnProperty('stdev')) {
                    solutions[3].push(globalObject.t.dist(meanDiff / Math.sqrt(2 * params1.stdev / params1.samples), params1.samples + params2.samples - 2, true));
                }
            }));
        }
        return Promise.all(ps).then(function () {
            return {
                means: solutions[0],
                variances: solutions[1],
                simulations: sets,
                sigs: solutions[2],
                sigs_std: solutions[3],
                trialsPerSim: params1.samples,
                min:0,
                max:0
            };
        });
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
        table = $('<table />', {class: 'table table-striped'});
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
        var page, numOfTrials = 20000, samplesPerTrial = 5;
        page = $('#page');

        page.append('<p>So the goals here are to look at common lab practices of comparing two small groups and to show that I can simulate data utilizng the browser. These analyses will focus on comparing groups of 5 to each other, which is often a rather generous comparison.</p>');
        page.append('<h2>Show that the normal distribution simulation works n(0,1)</h2>')
        runSimulation(numOfTrials, simRunnerNorm, {samples: samplesPerTrial, mean: 0, stdev: 1},-1, 1).then(function (simulation) {
            printSimulationResults(simulation);
            page.append('<h2>Show what a mixed normal distribution simulation looks like 50/50 n(-0.5,1) / n(0.5,1)</h2>');
            return runSimulation(numOfTrials, simRunnerMixedNorm, {samples: samplesPerTrial, uniform: 0.5, mean1: -0.5, stdev1: 1, mean2: 0.5, stdev2: 1}, -1, 1);
        }).then(function (simulation) {
            printSimulationResults(simulation);
            page.append('<h2>Show what a mixed normal distribution simulation looks like 80/20 n(0,1) / n(5,1)</h2>');
            return runSimulation(numOfTrials, simRunnerMixedNorm, {samples: samplesPerTrial, uniform: 0.8, mean1: 0, stdev1: 1, mean2: 5, stdev2: 1}, -1, 1);
        }).then(function (simulation) {
            printSimulationResults(simulation);
            page.append('<h2>Begin comparing 2 groups.</h2>');
            page.append('<p>The goal here is to look at the small sample sizes used in many wet labs. I will be comparing two groups and looking at the success rate of using a normally distributed test and a t-test to compare these small groups.</p>');
            page.append('<h3>Mean difference of a n(-.5,1) and n(.5, 1).</h3>');
            return runSimulationCompare(numOfTrials, simRunnerNorm, {samples: samplesPerTrial, mean: 0.5, stdev: 1}, {samples: samplesPerTrial, mean: -0.5, stdev: 1});
        }).then(function (simulation) {
            var sig1, sig2, sig3, sig4, power, tpower;
            console.log(simulation);
            printSimulationResults(simulation);
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });

            sig2 = 0;
            simulation.sigs_std.map(function (x) {
                sig2 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length
            sig2 = sig2 / simulation.means.length;

            glob = simulation;

            power = globalObject.norm.dist(1 / (1 / Math.sqrt(samplesPerTrial)) + globalObject.norm.inv(0.05, 0, 1), 0, 1, 1);
            tpower = globalObject.t.dist(1 / (Math.sqrt(2 / samplesPerTrial)) + globalObject.t.inv(0.05, samplesPerTrial * 2 - 2,1), samplesPerTrial * 2 - 2, 1);

            console.log(power,tpower, sig1, sig2, sig3, sig4);

            page.append('<p>Assuming a normal distribution we would expect that ' + (0.4214483 * 100).toFixed(2) + '% of these simulations would produce significant (&alpha; < 0.05) differences. In this simulation we produced ' + (sig1 * 100).toFixed(2) + '% significant differences calculating a pooled standard deviation for each trial and ' + (sig2 * 100).toFixed(2) + '% assuming a standard deviation of one.</p>');
            page.append('<p>This shows a bit how R generates is an overestimate. Or I am calculating this wrong. Just to check, lets look at 5,000 groups of 30 which should have 98.55% significant.</p>');

            return runSimulationCompare(numOfTrials / 4, simRunnerNorm, {samples: 30, mean: 0.5, stdev: 1}, {samples: 30, mean: -0.5, stdev: 1});
        }).then(function (simulation) {
            printSimulationResults(simulation);
            var sig1, sig2;
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });

            sig2 = 0;
            simulation.sigs_std.map(function (x) {
                sig2 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length * 100;
            sig2 = sig2 / simulation.means.length * 100;

            console.log(sig1, sig2);
            page.append('<p>This produces ' + sig1.toFixed(2) + '% significant without assuming the standard deviation and ' + sig2.toFixed(2) + '% with assuming it to be 1. (98.55% expected). I am not sure how close I should be getting with these values.</p>');
            page.append('<p>Finally I want to look at the difference of the power analyses of mixed normally distributed data and regular normal distributions assuming the same overall variance.</p>');
            page.append('<h2>Show what a mixed normal distribution simulation looks like 50/50 n(-0.5,1) / n(0.5,1) with a mean difference of 1.</h2>');
            return runSimulationCompare(numOfTrials, simRunnerNorm, {samples: samplesPerTrial, mean: 0.5, stdev: Math.sqrt(1.25)}, {samples: samplesPerTrial, mean: -0.5, stdev: Math.sqrt(1.25)});
        }).then(function (simulation) {
            //Normal with std 1.25
            printSimulationResults(simulation);
            var sig1, sig2;
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });

            sig2 = 0;
            simulation.sigs_std.map(function (x) {
                sig2 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length * 100;
            sig2 = sig2 / simulation.means.length * 100;

            console.log(sig1, sig2);

            page.append('<p>This produces ' + sig1.toFixed(2) + '% significant without assuming the variance and ' + sig2.toFixed(2) + '% with assuming it to be 1.25. The expected power is 36.30%.</p>');
            page.append('<p>Now let us look at a the same mixed distribution as above with a mean difference of 1.</p>');
            
            return runSimulationCompare(numOfTrials, simRunnerMixedNorm, {samples: samplesPerTrial, uniform: 0.5, mean1: 0.5, stdev1: 1, mean2: 1.5, stdev2: 1}, {samples: samplesPerTrial, uniform: 0.5, mean1: -0.5, stdev1: 1, mean2: 0.5, stdev2: 1}, -1, 1);
        }).then(function (simulation) {
            //Mix 1 50/50
            printSimulationResults(simulation);
            console.log(simulation);
            var sig1, sig2;
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length * 100;

            console.log(sig1, sig2);

            page.append('<p>This produces ' + sig1.toFixed(2) + '% significant without assuming the standard deviation.</p>');
            page.append('<h2>Show what a mixed normal distribution simulation looks like 80/20 n(0,1) / n(5,1) with a mean difference of 1.</h2>');
            return runSimulationCompare(numOfTrials, simRunnerNorm, {samples: samplesPerTrial, mean: 1, stdev: Math.sqrt(5)}, {samples: samplesPerTrial, mean: 2, stdev: Math.sqrt(5)});
        }).then(function (simulation) {
            //Normal variance 5, mean 1
            printSimulationResults(simulation);
            var sig1, sig2;
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });

            sig2 = 0;
            simulation.sigs_std.map(function (x) {
                sig2 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length * 100;
            sig2 = sig2 / simulation.means.length * 100;

            console.log(sig1, sig2);

            page.append('<p>This produces ' + sig1.toFixed(2) + '% significant without assuming the variance and ' + sig2.toFixed(2) + '% with assuming it to be 5. The expected power is 15.95%.</p>');
            page.append('<p>Now let us look at a the same mixed distribution as above with a mean difference of 1.</p>');
            
            return runSimulationCompare(numOfTrials, simRunnerMixedNorm, {samples: samplesPerTrial, uniform: 0.8, mean1: 1, stdev1: 1, mean2: 6, stdev2: 1}, {samples: samplesPerTrial, uniform: 0.8, mean1: 0, stdev1: 1, mean2: 5, stdev2: 1}, -1, 1);
        }).then(function (simulation) {
            //Hopefully mixed 80/20 with higher second mean.
            printSimulationResults(simulation);
            var sig1, sig2;
            sig1 = 0;
            simulation.sigs.map(function (x) {
                sig1 +=  x > 0.95 ? 1 : 0;
            });


            sig1 = sig1 / simulation.means.length * 100;

            console.log(sig1, sig2);

            page.append('<p>This produces ' + sig1.toFixed(2) + '% significant without assuming the standard deviation.</p>');
        });

    };

    google.charts.setOnLoadCallback(createPage);

}());
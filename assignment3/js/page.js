/*global $, KINOME, glob, google*/
var glob, globWork, createPage, globRunner;
(function () {
    'use strict';
    var page, mean, variance, runSimulation, max, min, bin, round, runSimulationCompare, a_createPage,
            printSimulationResults, createTable, simRunnerNorm, simRunnerMixedNorm, bootstrapRunner,
            createDataForIntervalGraph, compareAndColor;

    bootstrapRunner = amd_ww.startWorkers({filename: 'js/math/bootstrap_worker.js'});
    globRunner = bootstrapRunner;

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



    a_createPage = function () {
        var page, timePointList, timeGroups, theseGroups, chart, res, numOfTrials = 20000, samplesPerTrial = 5, dGroups, specificData, timeGroups;
        page = $('#page1');
        dGroups = drugGroups(data);
        specificData = calcAvgs(dGroups);
        theseGroups = ["dilaudid", "morphine", "ketamine"];
        timePointList = ["0 Minutes","5 Minutes","10 Minutes","15 Minutes","20 Minutes","30 Minutes","40 Minutes","50 Minutes","60 Minutes","75 Minutes","90 Minutes","105 Minutes","120 Minutes"];

        timeGroups = theseGroups.map(function (group) { 
            return timePointList.map(function(time) {
                return specificData[group].points[time].map(function (val) {
                    return [time.replace(/\D+/g, '') * 1, val];
                });
            }).reduce(function (a, b) {
                return a.concat(b);
            });
        });

        console.log('Here on the page...');

        page.append('<div class="col-xs-12"><p><strong>Basic information:</strong> Group 0 (Dilaudid) has 31 patients, group 1 (Morphine) has 82 patients, and group 2 (Ketamine) has 46 patients. 4 patients were excluded from the subsequent study due to recieving multiple drugs.</p></div>' +
                '<div class="col-sm-10 col-sm-offset-1"><p><strong>154844.4286</strong> Has a history of abdominal chronic pain being treated with opiods, was given both morphine and ketamine, it is unclear when the morphine was given. This patient was eventually admitted.<p>' +
                '<p><strong>174096.8571</strong> Has a history of chronic sickle cell and back pain being treated chroniclly with opoids, was given both ketamine and dilaudid at various uncertian times, the patient was eventually admitted.</p>' +
                '<p><strong>270304</strong> Has a history of chronic pain, crohn\'s disease, chronic pancreatitis and is being treated chroniclly with methodone. The pateint was treated acutely with dilaudid, Lorazepam, and morphine and was discharged.</p>' +
                '<p><strong>333010.5714</strong> Has no history of chronic pain, is in for painful skin abscesses. The patient was given ketamine then dilaudid at 14 and 15 minute time points possibly due to a spontaneous subjective experience and was eventually admitted.</p></div>'
            );  

        //Add in the boxplot of data...
        console.log(timeGroups);

        // var bigGroups = timeGroups[0].map(function(x) {
        //     return [x[0] - 1, x[1]];
        // }).concat(timeGroups[1].map(function (x) {
        //     return [x[0], x[1]];
        // }), timeGroups[2].map(function (x) {
        //     return [x[0] + 1, x[1]]; 
        // }));

        res = boxplotscatterdata(timeGroups[0].map(function (x) {return x[0]}), timeGroups[0].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot1"></div></div>');
        chart = new google.visualization.ComboChart(document.getElementById('bplot1'));
        res.google_options.title = "Dilaudid Pain Scores, 31 patients, box and wisker plot where the box represents the quartiles and the wiskers are the maximum and minimum. The red point is the averate at each time point.";
        chart.draw(res.google_data, res.google_options);

        res = boxplotscatterdata(timeGroups[1].map(function (x) {return x[0]}), timeGroups[1].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot2"></div></div>');
        chart = new google.visualization.ComboChart(document.getElementById('bplot2'));
        res.google_options.title = "Morphine Pain Scores, 82 patients, box and wisker plot where the box represents the quartiles and the wiskers are the maximum and minimum. The red point is the averate at each time point.";
        chart.draw(res.google_data, res.google_options);

        res = boxplotscatterdata(timeGroups[2].map(function (x) {return x[0]}), timeGroups[2].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot3"></div></div>');
        chart = new google.visualization.ComboChart(document.getElementById('bplot3'));
        res.google_options.title = "Ketamine Pain Scores, 46 patients, box and wisker plot where the box represents the quartiles and the wiskers are the maximum and minimum. The red point is the averate at each time point.";
        chart.draw(res.google_data, res.google_options);

        page.append('<div class="col-xs-12"><p>So, we can see the same sort of pattern just looking at the means, the dose rather quickly decreases the average pain, then levels off over the two hours of recording pain scores. The interesting point here comes from looking at the medians. They respond similarly to the means, but lower less quickly. This is likely due to the number of 10\'s artificially inflating the early mean. Most interestingly of all, the ketamine eventual drops off to no pain at all for 50% of the pateints. This indicates that for the patients that Ketamine works, it works well.</p><p>From here lets look at the change in pain scores from time 0.</p></div>');
        page = $('#page2');

        var delta = calcChangeFromStart(dGroups);

        timeGroups = theseGroups.map(function (group) { 
            return timePointList.map(function(time) {
                return delta[group].points[time].map(function (val) {
                    return [time.replace(/\D+/g, '') * 1, val];
                });
            }).reduce(function (a, b) {
                return a.concat(b);
            });
        });
        res = boxplotscatterdata(timeGroups[0].map(function (x) {return x[0]}), timeGroups[0].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot4"></div></div>');
        chart = new google.visualization.ComboChart(document.getElementById('bplot4'));
        res.google_options.title = "Change in Dilaudid Pain Scores from Time 0";
        chart.draw(res.google_data, res.google_options);

        res = boxplotscatterdata(timeGroups[1].map(function (x) {return x[0]}), timeGroups[1].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot5"></div></div>');
        chart = new google.visualization.ComboChart(document.getElementById('bplot5'));
        res.google_options.title = "Change in Morphine Pain Scores from Time 0";
        chart.draw(res.google_data, res.google_options);

        res = boxplotscatterdata(timeGroups[2].map(function (x) {return x[0]}), timeGroups[2].map(function (x) {return x[1]}));
        console.log(res);
        page.append('<div class="text-center col-xs-12"><div id="bplot6"></div></div>');
        res.google_options.title = "Change in Ketamine Pain Scores from Time 0";
        chart = new google.visualization.ComboChart(document.getElementById('bplot6'));
        chart.draw(res.google_data, res.google_options);

        page.append('<div class="col-xs-12"><p>Looking at this data we see a slow trend downward in median pain score changes for Dilaudid and Morphine. However Ketamine presents an odd difference. It appears to trend identically to the other drug choices before plummeting to -7/-8 region in the end. Bootstrapping will give us an idea of the confidence we can place in these measures.</p><p>Now we are going to attempt to bootstrap these parameters to define confidence intervals for the Q1, Q2, Q3, and the mean. We will use 2000 bootstrap distributions, all sampled at 100% for each time point and each condition.</p></div>');





        //Below is stuff for absolute pain score
                //Go through and generate data for all of the time points for each drug
        (function () {
            var i, j, d_group, t_pnt, t_pnts, allData = [];
            for (i = 0; i < theseGroups.length; i += 1) {
                d_group = specificData[theseGroups[i]].points;
                allData[i] = [];
                console.log('working on pain score conf intervals', d_group);
                t_pnts = timePointList;
                for (j = 0; j < t_pnts.length; j += 1) {
                    t_pnt = d_group[t_pnts[j]];
                    bootstrapRunner.submit({
                        data: t_pnt,
                        straps: 5000,
                        start: {time_point: j, drug: i},
                        p_val: 0.2,
                        p_val2: 0.05
                    }).then(function (result) {
                        allData[result.start.drug][result.start.time_point] = result.CI;
                    });
                }
            }
            //Show the figures
            $('.hidden_here').show();
            bootstrapRunner.all().then(function () {
                var page, fig;
                page = $('#page3');

                // Means
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.mean;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="meanPain" class="text-center col-xs-12"><div id="plot10"></div></div>');
                fig.google_options.vAxis = {viewWindow: {min: 0, max:10}};
                fig.google_options.title = "Comparison of Mean Pain Scores. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart = new google.visualization.ComboChart(document.getElementById('plot10'));
                chart.draw(fig.google_data, fig.google_options);
                $('#meanPain').append(fig.table);
                $('#meanPain').append('<p>This figure shows us that from start to finish the patients given ketamine have lower pain scores, reaching some level of significant both early on and late in the experiment. We have an interesting early dip in pain that produces a 95% confidence of rejecting the null hypothesis that the pain scores are identical.</p>');

                //Medians
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q2;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval2" class="text-center col-xs-12"><div id="plot11"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot11'));
                fig.google_options.vAxis = {viewWindow: {min: 0, max:10}};
                fig.google_options.title = "Comparison of Median Pain Scores. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval2').append(fig.table);
                $('#interval2').append('<p>In order to make values slightly different to deal with the integer nature of this data, a uniform random [-0.05, 0.05) is added to each sample during each bootstrap process. This allows us to deal with what would otherwise be segments ending on the same integer value and in theory will give us an idea of where we are in a block of equal values. We can see that this measure rejects the null towards the end of the time period.</p>');

                //Q1 and Q3
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q3;})}).concat(allData.map(function (x) {return x.map(function (y) {return y.Q1;})})) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval3" class="text-center col-xs-12"><div id="plot12"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot12'));
                fig.google_options.vAxis = {viewWindow: {min: 0, max:10}};
                fig.google_options.title = "Comparison of First and Third Quartile Pain Scores. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval3').append(fig.table);
                $('#interval3').append('<p>The point here is to look at how well "responders" versus "non-responders" react to the treatment. This is being modeled by looking at the quartiles Q1 and Q3. Q3, the "non-responders" reject the null in the middle of the experiment for a comparison of dilaudid and morphine, but otherwise all differences are non-significant. Q1, or the "responders" rejects the null when comparing ketamine to other choices early on post treatment, then again towards the end of the time frame. This pattern distinguishes ketamine from dilaudid.</p>');

                console.log('All Done!', allData);
            });
        }());
        



        //Below is stuff for change in pain score
        (function () {
            //Go through and generate data for all of the time points for each drug
            var i, j, d_group, t_pnt, t_pnts, allData = [];
            for (i = 0; i < theseGroups.length; i += 1) {
                d_group = delta[theseGroups[i]].points;
                allData[i] = [];
                console.log(d_group);
                t_pnts = timePointList;
                for (j = 0; j < t_pnts.length; j += 1) {
                    t_pnt = d_group[t_pnts[j]];
                    bootstrapRunner.submit({
                        data: t_pnt,
                        straps: 5000,
                        start: {time_point: j, drug: i},
                        p_val: 0.2,
                        p_val2: 0.05
                    }).then(function (result) {
                        allData[result.start.drug][result.start.time_point] = result.CI;
                        console.log(result);
                    });
                }
            }
            //Show the figures
            $('.hidden_here').show();
            bootstrapRunner.all().then(function () {
                var page, fig;
                page = $('#page3');

                page.append('<h4>To look more closely patient by patient we compare the change in self reported pain from the first recorded values.</h4>');

                // Means
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.mean;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval4" class="text-center col-xs-12"><div id="plot7"></div></div>');
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Comparison of Mean Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart = new google.visualization.ComboChart(document.getElementById('plot7'));
                chart.draw(fig.google_data, fig.google_options);
                $('#interval4').append(fig.table);
                $('#interval4').append('<p>We can see the middle section of this analysis ketamine is being out performed by the other two drug choices. This observation is repeated in the median value.</p>')

                //Medians
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q2;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval5" class="text-center col-xs-12"><div id="plot8"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot8'));
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Comparison of Median Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval5').append(fig.table);

                //Q1 and Q3
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q3;})}).concat(allData.map(function (x) {return x.map(function (y) {return y.Q1;})})) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval6" class="text-center col-xs-12"><div id="plot9"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot9'));
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Comparison of First and Third Quartile Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval6').append(fig.table);
                $('#interval6').append('<p>In this figure I think we see why the drug response is what it is. Our non-responders are either getting worse or not improving on ketamine. In contrast our responder group rejects the null towards the end of the experiment with ketamine response out performing both diaudid and morphine at various points.</p>')


                page.append('<h3>---Below is a work in progress.---</h3>');
                page.append('<h4>We can bias correct these confidence intervals</h4>');


                //Add in the bias corrected stuff

                // Means
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.mean.BiasCorrect;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval4_b" class="text-center col-xs-12"><div id="plot7_b"></div></div>');
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Bias corrected comparison of Mean Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart = new google.visualization.ComboChart(document.getElementById('plot7_b'));
                chart.draw(fig.google_data, fig.google_options);
                $('#interval4_b').append(fig.table);

                //Medians
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q2.BiasCorrect;})}) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval5_b" class="text-center col-xs-12"><div id="plot8_b"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot8_b'));
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Bias corrected comparison of Median Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval5_b').append(fig.table);

                //Q1 and Q3
                fig = createDataForIntervalGraph(allData.map(function (x) {return x.map(function (y) {return y.Q3.BiasCorrect;})}).concat(allData.map(function (x) {return x.map(function (y) {return y.Q1.BiasCorrect;})})) ,timePointList.map(function (x) {return x.replace(/\D+/g, '') * 1}), theseGroups);
                page.append('<div id="interval6_b" class="text-center col-xs-12"><div id="plot9_b"></div></div>');
                chart = new google.visualization.ComboChart(document.getElementById('plot9_b'));
                fig.google_options.vAxis = {viewWindow: {min: -10, max:1}};
                fig.google_options.title = "Bias corrected comparison of First and Third Quartile Change in Pain Scores from Time 0. Utilizes a 5000 repitition bootstrap to generate an 80% confidence intervals.";
                chart.draw(fig.google_data, fig.google_options);
                $('#interval6_b').append(fig.table);


                console.log('All Done!', allData);
            });
        }());
        

    };

    createDataForIntervalGraph = function (array, times, treatments) {
        var c1, c2, i, id, j, k, data, trueData = [], scount, tArr, tableSet = [], htmlTable, header, row, tbody, dtest, v1, v2, v3, v4;
        data = new google.visualization.DataTable();
        data.addColumn('number', 'time');
        //Add in columns
        tableSet[0] = ['</th><th>CI'];
        for (i = 0; i < array.length; i += 1) {
            scount = 0;
            data.addColumn('number', treatments[i % treatments.length]);
            tableSet.push([treatments[i % treatments.length]]);
            scount += 1;
            // for (j = 0; j < 4; j += 1) {
            for (j = 0; j < 2; j += 1) {
                data.addColumn({id:'i' + j + i * 2, type:'number', role:'interval'});
                scount += 1;
            }
        }

        //Add in real data
        for (i = 0; i < array.length; i += 1) {
            for (j = 0; j < times.length; j += 1) {
                // tArr = [times[j] + ( i % treatments.length - 1 ) / 1];
                tArr = [times[j]];
                tableSet[0][j + 1] = times[j];
                for (k = 0; k < scount * i; k += 1) {
                    tArr.push(null);
                }
                tArr.push(array[i][j].median);
                tArr.push(array[i][j].CI_min);
                // tArr.push(array[i][j].CI2_min);
                // tArr.push(array[i][j].CI2_max);
                tArr.push(array[i][j].CI_max);
                for (k = tArr.length - 1; k < scount * array.length; k += 1) {
                    tArr.push(null);
                }
                trueData.push(tArr);
                tableSet[i + 1][j + 1] = [[array[i][j].CI_min, array[i][j].CI_max], [array[i][j].CI2_min, array[i][j].CI2_max]];
            }
        }
        data.addRows(trueData);
        var options_lines = {
            curveType: 'linear',
            intervals: { style: 'area'},
            // intervals: { style: 'bars', 'lineWidth':3},
            height:400,
            // 'legend':'left',
            // 'lineWidth':1,
            'lineWidth':2
        };

        //Build html table
        htmlTable = $('<table>', {class: 'table table-striped'});
        //Header
        htmlTable.append($('<thead>').append($('<tr>').append($(tableSet.shift().map(function (x) {return '<th>' + x + ' min</th>'}).join('')))));
        tbody = $('<tbody>');
        htmlTable.append(tbody);
        dtest = {'80': [], '95': [], '80s': [], '95s': []};
        for (i = 0; i < tableSet.length; i += 1) {
            c1 = '80';
            c2 = '95';
            if (i > treatments.length - 1) {
                c1 = '80s';
                c2 = '95s';
            }
            header = tableSet[i].shift();
            row = $('<tr>');
            row.append($('<th>' + header + '</th>'));
            row.append($('<th>80%<br />95%</th>'));
            for (j = 0; j < tableSet[i].length; j += 1) {
                id = Math.random().toString().replace('0.', '');
                dtest[c1][j] = dtest[c1][j] || [];
                dtest[c2][j] = dtest[c2][j] || [];
                v3 = $('<td>');
                // console.log(tableSet[i][j], array[i][j]);
                v1 = $('<div>', {text: '(' + tableSet[i][j][0][0].toFixed(2) + "," + tableSet[i][j][0][1].toFixed(2) + ')'});
                v2 = $('<div>', {text: '(' + tableSet[i][j][1][0].toFixed(2) + "," + tableSet[i][j][1][1].toFixed(2) + ')'});
                v3.append(v1);
                v3.append(v2);
                row.append(v3);
                (function (v1, v2){
                    dtest[c1][j].push([tableSet[i][j][0][0] + 15, tableSet[i][j][0][1] + 15, v1]);
                    dtest[c2][j].push([tableSet[i][j][1][0] + 15, tableSet[i][j][1][1] + 15, v2]);
                }(v1, v2));
            }
            tbody.append(row);
        }

        Object.keys(dtest).map(function (x) {dtest[x].map(function(y) {compareAndColor(y);})})

        return {google_data: data, google_options: options_lines, table: htmlTable};
    };

    compareAndColor = function (arr) {
        var i, j;
        for (i = 0; i < arr.length; i += 1) {
            for (j = i + 1; j < arr.length; j += 1) {
                // If min 1 < max 2 OR max 1 > min 2 then there is overlap
                if (!(arr[i][0] < arr[j][1] && arr[j][0] < arr[i][1])) {
                    arr[i][2].css('color', 'red');
                    arr[j][2].css('color', 'red');
                }
            }
        }

    };

    createPage = function () {
        google.charts.setOnLoadCallback(a_createPage);
    };

}());
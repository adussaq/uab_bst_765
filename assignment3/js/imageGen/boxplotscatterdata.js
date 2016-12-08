/*global google, KINOME*/
boxplotscatterdata = (function () {
    'use strict';
    var getBoxPlotValues, add, getMedian, main, numsort;

    numsort = function (a, b) {
        return a - b;
    };

    add = function (a, b) {
        return a + b;
    };

    getBoxPlotValues = function (array) {
        var i, j, retArr = [], outliers, mean, maxOutliers = 0, arr, max, min, median, slicePoint, firstQuartile, thirdQuartile;
        for (i = 0; i < array.length; i += 1) {
            retArr[i] = [];
            outliers = [];
            arr = array[i].slice(1).sort(numsort);

            mean = arr.reduce(add) / arr.length;

            max = arr[arr.length - 1];
            min = arr[0];
            median = getMedian(arr);
            slicePoint = Math.floor((arr.length + 1) / 2);

            // First Quartile is the median from lowest to overall median.
            firstQuartile = getMedian(arr.slice(0, slicePoint));

            // Third Quartile is the median from the overall median to the highest.
            thirdQuartile = getMedian(arr.slice(slicePoint));

            //remove outliers
            j = 1;
            while (max > thirdQuartile + 2 * (thirdQuartile - firstQuartile)) {
                outliers.push(arr[arr.length - j]);
                j += 1;
                max = arr[arr.length - j];
            }
            j = 0;
            while (min < firstQuartile - 2 * (thirdQuartile - firstQuartile)) {
                outliers.push(arr[j]);
                j += 1;
                min = arr[j];
            }

            //Correct for small amounts of data
            if (arr.length === 1) {
                min = arr[0];
                max = arr[0];
                firstQuartile = arr[0];
                median = arr[0];
                thirdQuartile = arr[0];
                outliers = [];
            }

            //Determine max outliers
            maxOutliers = outliers.length > maxOutliers
                ? outliers.length
                : maxOutliers;

            retArr[i][0] = array[i][0];
            retArr[i][1] = max;
            retArr[i][2] = min;
            retArr[i][3] = firstQuartile;
            retArr[i][4] = median;
            retArr[i][5] = thirdQuartile;
            retArr[i][6] = max;
            retArr[i][7] = min;
            retArr[i][8] = firstQuartile;
            retArr[i][9] = median;
            retArr[i][10] = thirdQuartile;
            retArr[i][11] = mean;
            retArr[i] = retArr[i].concat(JSON.parse(JSON.stringify(outliers)));
        }
        for (i = 0; i < retArr.length; i += 1) {
            while (retArr[i].length < 12 + maxOutliers) {
                retArr[i].push(null);
            }
        }
        return retArr;
    };

    getMedian = function (array) {
        var length = array.length, sol;

        if (length % 2 === 0) {
            var midUpper = length / 2;
            var midLower = midUpper - 1;

            sol = (array[midUpper] + array[midLower]) / 2;
        } else {
            sol = array[Math.floor(length / 2)];
        }
        return sol;
    };

    main = function (category, value) {
        var options, data, i, tkey, boxplot = {}, boxplotdata, boxplotArr;

        //Convert to category lists
        for (i = 0; i < category.length; i += 1) {
            tkey = (1 * category[i]);
            // tkey = tkey.toFixed(0) * 1;
            if (boxplot.hasOwnProperty(tkey)) {
                boxplot[tkey].push(value[i]);
            } else {
                boxplot[tkey] = [tkey, value[i]];
            }
        }

        //Convert to the correct format
        boxplotArr = Object.keys(boxplot).map(function (x) {
            return boxplot[x];
        });

        boxplotdata = getBoxPlotValues(boxplotArr);

        // Create data object and add in contant parts
        data = new google.visualization.DataTable();
        data.addColumn('number', 'x');
        data.addColumn('number', 'maximum');
        data.addColumn('number', 'minimum');
        data.addColumn('number', '1st Quartile');
        data.addColumn('number', 'Median');
        data.addColumn('number', '3rd Quartile');
        data.addColumn({id: 'max', type: 'number', role: 'interval'});
        data.addColumn({id: 'min', type: 'number', role: 'interval'});
        data.addColumn({id: 'firstQuartile', type: 'number', role: 'interval'});
        data.addColumn({id: 'median', type: 'number', role: 'interval'});
        data.addColumn({id: 'thirdQuartile', type: 'number', role: 'interval'});
        data.addColumn('number', 'mean');

        //Add in outliers
        for (i = 12; i < boxplotdata[0].length; i += 1) {
            data.addColumn('number', 'Outlier');
        }

        

        data.addRows(boxplotdata);

        //create options object
        options = {
            height: 400,
            legend: {position: 'none'},
            hAxis: {gridlines: {color: '#fff'}},
            lineWidth: 0,
            intervals: {
                barWidth: 1,
                boxWidth: 1,
                lineWidth: 2,
                style: 'boxes'
            },
            series: {},
            interval: {
                max: {
                    style: 'bars',
                    fillOpacity: 1,
                    color: '#777'
                },
                min: {
                    style: 'bars',
                    fillOpacity: 1,
                    color: '#777'
                }
            }
        };

        // Add in outlier options
        options.series[11 - 6] = {color: '#FF0000', enableInteractivity: true, type: "scatter", pointSize: 5};
        for (i = 12; i < boxplotdata[0].length; i += 1) {
            options.series[i - 6] = {color: '#FF0000', type: "scatter", enableInteractivity: false, pointSize: 3};
        }
        

        //Retrun them
        return {google_data: data, google_options: options};
    };

    return main;

}());
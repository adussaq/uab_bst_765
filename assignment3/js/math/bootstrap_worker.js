/*global self*/
(function () {
    'use strict';
    var getMedian, numsort, add, getKeyValues, randomDist, findCIs, pull_val;

    self.onmessage = function (event) {
        //variable declarations
        var data, num_straps, i, results = [], p_val, p_val2;
        // self.postMessage(JSON.parse(JSON.stringify(event.data)));
        // return;

        //variable definitions
        data = event.data.data;
        num_straps = event.data.straps;
        p_val = event.data.p_val;
        p_val2 = event.data.p_val2;

        //Start making populations
        for (i = 0; i < num_straps; i += 1) {
            results.push(getKeyValues(randomDist(data)));
        }

        //return result
        self.postMessage({start: event.data.start, CI: findCIs(results, p_val, p_val2)});
    };

    randomDist = function (array) {
        var retArr = [], i;
        for (i = 0; i < array.length; i += 1) {
            retArr.push(array[Math.floor(Math.random() * array.length)] + 0.1 * (Math.random() - 0.5));
        }
        return retArr;
    };

    numsort = function (a, b) {
        return a - b;
    };

    add = function (a, b) {
        return a + b;
    };

    getKeyValues = function (array) {
        var arr, mean, median, slicePoint, firstQuartile, thirdQuartile;

        mean = array.reduce(add) / array.length;
        arr = array.sort(numsort);
        median = getMedian(arr);
        slicePoint = Math.floor((arr.length + 1) / 2);

        // First Quartile is the median from lowest to overall median.
        firstQuartile = getMedian(arr.slice(0, slicePoint));

        // Third Quartile is the median from the overall median to the highest.
        thirdQuartile = getMedian(arr.slice(slicePoint));

        return {mean: mean, Q1: firstQuartile, Q2: median, Q3: thirdQuartile};
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

    findCIs = function (results, p_val, p_val2) {
        var i, stats = Object.keys(results[0]), CIs = {}, t_arr, pull;

        for (i = 0; i < stats.length; i += 1) {
            pull = pull_val(stats[i]);
            t_arr = results.map(pull);
            t_arr = t_arr.sort(numsort);
            // mean, median, min CI, max CI
            CIs[stats[i]] = {
                mean: t_arr.reduce(add) / t_arr.length,
                median: getMedian(t_arr),
                CI_min: t_arr[Math.round(t_arr.length * p_val / 2)],
                CI_max: t_arr[Math.round(t_arr.length * (1 - p_val / 2))]
            };
            if (p_val2) {
                CIs[stats[i]].CI2_min = t_arr[Math.round(t_arr.length * p_val2 / 2)];
                CIs[stats[i]].CI2_max = t_arr[Math.round(t_arr.length * (1 - p_val2 / 2))];
            }
        }
        return CIs;
    };

    pull_val = function (i) {
        return function (x) {
            return x[i];
        };
    };
}());
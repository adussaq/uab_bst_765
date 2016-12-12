/*global self*/
(function () {
    'use strict';
    var randomNormal, getMedian, numsort, add, getKeyValues, randomDist, findCIs, pull_val, smallRand, getBiasCorrected, globalObject = {};

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
        self.postMessage({start: event.data.start, CI: findCIs(results, p_val, p_val2, getKeyValues(data.map(function (x) {
            return x + smallRand(data.length);
        })))});
    };

    randomDist = function (array) {
        var retArr = [], i;
        for (i = 0; i < array.length; i += 1) {
            retArr.push(array[Math.floor(Math.random() * array.length)] + smallRand(array.length));
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

    smallRand = function (len) {
        return randomNormal(0, 1 / Math.sqrt(len));
    };

    findCIs = function (results, p_val, p_val2, dataStats) {
        var i, stats = Object.keys(results[0]), CIs = {}, t_arr, pull, temp;

        for (i = 0; i < stats.length; i += 1) {
            pull = pull_val(stats[i]);
            t_arr = results.map(pull);
            t_arr = t_arr.sort(numsort);
            // mean, median, min CI, max CI
            CIs[stats[i]] = {
                mean: t_arr.reduce(add) / t_arr.length,
                median: getMedian(t_arr),
                CI_min: t_arr[Math.round(t_arr.length * p_val / 2)],
                CI_max: t_arr[Math.round(t_arr.length * (1 - p_val / 2))],
                // BiasCorrect: getBiasCorrected(t_arr, dataStats[stats[i]], p_val)
            };
            if (p_val2) {
                CIs[stats[i]].CI2_min = t_arr[Math.round(t_arr.length * p_val2 / 2) - 1];
                CIs[stats[i]].CI2_max = t_arr[Math.round(t_arr.length * (1 - p_val2 / 2)) - 1];
                // temp = getBiasCorrected(t_arr, dataStats[stats[i]], p_val2);
                // CIs[stats[i]].BiasCorrect.CI2_min = temp.CI_min;
                // CIs[stats[i]].BiasCorrect.CI2_max = temp.CI_max;
                // CIs[stats[i]].BiasCorrect.adjusted_pvals2 = temp.adjusted_pvals;
            }
        }
        return CIs;
    };

    getBiasCorrected = function (bootstrapStats, originalDataStat, p_val) {
        var len, i, pos, adj_pval_min, adj_pval_max, pos_norm, p_val_norm;

        len = bootstrapStats.length;
        i = 0;
        while (i < len && bootstrapStats[i] < originalDataStat) {
            i += 1;
        }

        if (bootstrapStats[i] === originalDataStat) {
            pos = (i + 0.5) / len;
        } else {
            pos = i / len;
        }

        pos_norm = globalObject.norm.inv(pos, 0, 1);
        p_val_norm = globalObject.norm.inv(p_val / 2, 0, 1);
        adj_pval_min = globalObject.norm.dist(2 * pos_norm + p_val_norm, 0, 1, true);
        adj_pval_max = globalObject.norm.dist(2 * pos_norm - p_val_norm, 0, 1, true);

        return {
            originStat: originalDataStat,
            position: pos,
            adjusted_pvals: [adj_pval_min, adj_pval_max],
            CI_min: bootstrapStats[Math.max(Math.round(len * adj_pval_min) - 1, 0)],
            CI_max: bootstrapStats[Math.min(Math.round(len * adj_pval_max) - 1, len - 1)],
            median: bootstrapStats[Math.round(len * (adj_pval_max + adj_pval_min) / 2) - 1],
            mean: bootstrapStats.reduce(add) / len
        };
    };

    pull_val = function (i) {
        return function (x) {
            return x[i];
        };
    };

    /* ------------------- *
    * Normal Distribution *
    * ------------------- */
    
    // Objects containing Normal distribution methods
    globalObject.norm = {};

    /**
     * Calculates the probability of getting the value x in an observation or the probability of x and anything less (cumulative)
     * Based on the formula (1/(sigma*sqrt(2*pi)))*e^((-1/(2*sigma^2))*(x-mu)^2)
     * Integration of the above function results in the cumulative distribution function
     *
     * See https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function and 
     *      https://en.wikipedia.org/wiki/Error_function
     *      for how this works
     * 
     * @param Float x
     * @param Float mean
     * @param Float stdev
     * @param Boolean cumulative (optional)
     */
    globalObject.norm.dist = function(x, mean, stdev, cumulative) {
        // Set default cumulative to true as this is the expected behavior for this function
        cumulative = typeof cumulative === "undefined" ? true : cumulative;

        var errors = [];

        // Sanitize the data
        if (isNaN(x)) {
            errors.push("norm.dist: the x value " + x + " is not a number");
        }

        if (isNaN(mean)) {
            errors.push("norm.dist: the mean " + mean + " is not a number");
        }

        if (isNaN(stdev)) {
            errors.push("norm.dist: the standard deviation " + stdev + " is not a number");
        }

        if(errors.length > 0) {
            throw new Error(errors.join("; "));
        }

        // based on integration of normal distribution probability mass function
        var errorFuncInput = ((x-mean)/stdev)/Math.sqrt(2),    // input of error function for normal cdf
            value = errorFuncInput,                            // storing original input for checking javascript rounding error
            sum = errorFuncInput,                              // initializing sum as starting with the input of the error function
            lastSum,                                           // remember the last sum for error tolerance
            error = 2.0e-10,                                   // error threshhold set to be equal to gamma function
            n = 1,                                             // start at n = 1 since the 0th term of the sum has laready been calculated
            maxIter = 1000,                                    // good enough
            prob;                                              // Proability, either cumulative or pdf

        // Integrate the pmf of the normal distribution
        if (cumulative === true) {

            // Calculating sum to error threshhold or maxIter -- (sum from(n = 0) to(infinity) (((-1)^n)*z^(2n+1))/(n * (2n+1)))
            do {
                // save last sum before recalculating it for error analysis
                lastSum = sum;

                // Change the previous term in the sum to the current term by multiplying the previous value by the change
                value *= (-1 * Math.pow(errorFuncInput, 2) * (2*n - 1))/(n * (2*n + 1));
                sum += value;

                // increment n
                n++;
            } while (Math.abs((sum - lastSum)/sum) > error && n < maxIter);

            // Error function value of cumulative probability distribution
            var errorFunction = 2 / Math.sqrt(Math.PI) * sum;

            // handling javascript rounding problem and large number problem
            if ((Math.abs(errorFunction) > 1 && x > mean) || Math.abs(errorFunction) === Infinity) {
                prob = 1;
            } else if ((Math.abs(errorFunction) > 1 && x < mean)) {
                prob = 0;
            } else {
                // cumulative probability
                prob = 1 / 2 * (1 + errorFunction);
            }

        // Probability based on pmf of normal distribution
        } else {
            prob = (1 / (stdev * Math.sqrt(2 * Math.PI))) * Math.pow(Math.E, (-1 / (2 * Math.pow(stdev, 2)) * Math.pow((x - mean), 2)));
        }

        // return [prob, n];    // for debugging
        return prob;
    };

    /**
     * Calculates the smallest x value that will give a cumulative probability equal to user input
     * Function provided by adussaq (https://github.com/adussaq)
     * 
     * @param Float prob
     * @param Float mean
     * @param Float stdev
     */
    globalObject.norm.inv = function(prob, mean, stdev) {
        var errors = [];

        if (prob <= 1e-10) {
            prob = 1e-10;
        } else if (prob >= 1 - 1e-10) {
            prob = 1 - 1e-10;
        }

        // Sanitize the data
        if (isNaN(prob)) {
            errors.push("norm.inv: the probability " + prob + " is not a number");
        }

        if (prob > 1 || prob < 0) {
            errors.push("norm.inv: the probability " + prob + " should be between 0 and 1 including the bounds");
        }

        if (isNaN(mean)) {
            errors.push("norm.inv: the mean " + mean + " is not a number");
        }

        if (isNaN(stdev)) {
            errors.push("norm.inv: the standard deviation " + stdev + " is not a number");
        }

        if (!isNaN(stdev) && stdev < 0) {
            errors.push("norm.inv: the standard deviation " + stdev + " should be positive");
        }

        if(errors.length > 0) {
            throw new Error(errors.join("; "));
        }

        var z,                  // value for standard normal distribution (mean = 0, stdev = 1)
            diff,               // difference between guessed probability and user submitted probability
            error = 1e-10,      // allowed error between guessed probability and user submitted probability
            maxIter = 1000,     // after 1000 iterations, it's close enough
            step = 0.25,        // gives faster convergence on diff
            stepInc = 1.2,      // increase step to converge faster
            stepDec = 0.5,      // decreases step for after overshoot
            iter = 0,           // counts number of iterations
            direction = 1,      // determines direction of alternation
            lastDiff = 1;       // used to calculate overshooting

        // Make some intelligent guesses based on knowing that, for a standard normal distribution,
        // a probability < 0.5 must be from a negative z and a probability > 0.5 must be from a positive z
        if (prob < 0.5) {
            z = -0.5;
        } else if (prob > 0.5) {
            z = 0.5;
        } else {
            z = 0;
        }

        // Guess until gone for too many iterations or arrived within error
        do {
            // Check the guess
            diff = prob - globalObject.norm.dist(z, 0, 1, true);

            // Change direction on number line based on whether still above or below actual value
            if (diff > 0) {
                direction = 1;
            } else if (diff < 0) {
                direction = -1;
            } else {
                direction = 0;
            }

            // Increase step rate until overshoot
            if (lastDiff * diff > 0) {
                step *= stepInc;

            // Decrease step rate immediately after overshooting to narrow in
            } else {
                step *= stepDec;
            }

            // create another guess
            z += direction * step;

            // save last diff to check for overshooting
            lastDiff = diff;

            // Maintain count of iterations thus far
            iter++;
        } while (Math.abs(diff) > error && iter < maxIter);

        // return value back based on user-select normal distribution
        //return [z * stdev + mean, globalObject.norm.dist(z, 0, 1, true), iter]; // (for debugging)
        return z * stdev + mean;
    };

    var randomNormal, E_0_25, E_1_35;

    E_0_25 = 4 * Math.exp(0.25);
    E_1_35 = 4 * Math.exp(-1.35);

    randomNormal = function (mean, stdev) {
        var u1, u2, ans, u1_2, u2_2, repeat;

        //Generates a random normal based on the ratio of two uniforms.
        // When mean and stdev are not given, they default to n(0,1)

        repeat = true;
        while (repeat) {
            u1 = Math.random();
            u2 = Math.random();
            u2 = (2 * u2 - 1) * Math.sqrt(2 / Math.E);
            u1_2 = u1 * u1;
            u2_2 = u2 * u2;
            if (u2_2 < u1_2 * (5 - E_0_25 * u1)) {
                repeat = false;
                ans = u2 / u1;
            } else if (u2_2 >= E_1_35 * u1 + 1.4 * u1_2
                    || u1_2 >= Math.exp(-0.5 * u2_2 / u1_2)) {
                repeat = true;
            } else {
                repeat = false;
                ans = u2 / u1;
            }
        }

        if (typeof stdev === "number") {
            ans = ans * stdev;
        }
        if (typeof mean === "number") {
            ans = ans + mean;
        }
        return ans;
    };
}());
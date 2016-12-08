    /* ------------------- *
     * Normal Distribution *
     * ------------------- */
     globalObject = {};
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
        if (prob <= 1e-10) {
            prob = 1e-10;
        } else if (prob >= 1 - 1e-10) {
            prob = 1 - 1e-10;
        }
        var errors = [];

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

    self.onmessage = function (event) {
        //variable declarations
        var i, result, runCond, total, length, sam, sams, mean, stdev, stdevMean;

        //variable definitions
        length = event.data.samples;
        total = 0;
        sams = [];
        stdevMean = 0;
        stdev = 0;

        for (i = 0; i < length; i += 1) {
            sam = globalObject.norm.inv(Math.random(), event.data.mean, event.data.stdev);
            total += sam;
            stdevMean += Math.pow(sam - event.data.mean, 2);
            sams.push(sam);
        }

        mean = total / length;

        for (i = 0; i < length; i += 1) {
            stdev += Math.pow(sams[i] - mean, 2);
        }

        
        //return result
        self.postMessage({mean: mean, stdev: stdev / (length - 1), stdevCalc: stdevMean / (length - 1)});
    };



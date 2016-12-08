var KINOME = (function () {

    var main;

    main = {};

    //Temporary to load in files for analysis

    //Start google tables
    // Load the Visualization API and the corechart package.
    google.charts.load('current', {'packages':['corechart']});

    // Set a callback to run when the Google Visualization API is loaded.
    //google.charts.setOnLoadCallback(drawChart);


    return main;
}()), glob;

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
        if (cumulative) {

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

        /**
     * Calculates the natural log of the gamma function
     * The log calculation is made to avoid arithmetic overflow
     * The gamma function can easily be retrieved by Math.exp(lnGamma(z))
     * Algorithm comes from http://www.rskey.org/CMS/index.php/the-library/11
     * Form of the algorithm: Γ(z)=[(√(2π)/z)(p_0+∑ from(n=1..6) (p_n/(z+n))](z+5.5)^(z+0.5) * e^−(z+5.5)
     * 
     * @param Int z > 0
     */
    var lnGamma = function(z) {
        if (isNaN(z)) {
            throw new Error("lnGamma: the argument of this function must be a positive number");
        }
        
        if (z < 0) {
            throw new Error("lnGamma: the argument of this function must be positive");
        }
        
        // Pre-derived parameters based on site providing algorithm
        var params = [1.000000000190015, 76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 1.208650973866179e-3, -5.395239384953e-6],
            sum = params[0],
            answer;
            
        // Calculates the summation term of the algorithm
        for (var i = 1; i < params.length; i++) {
            sum += params[i]/(z + i);
        }
        
        // Replace constants for faster calculation
        // answer = (1/2) * Math.log(2 * Math.PI) - Math.log(z) + Math.log(sum) + (z + 0.5) * Math.log(z + 5.5) - (z + 5.5);
        answer = 0.9189385332046727 - Math.log(z) + Math.log(sum) + (z + 0.5) * Math.log(z + 5.5) - (z + 5.5);
        return answer;
    };
    
    /**
     * Calculates the lower incomplete gamma function
     * Return the natural log to avoid arithmetic overflow in future calculations
     * Lower Incomplete Gamma function can be achieved by Math.exp(lnGammaIncomplete)
     * Algorithm from (http://www.rskey.org/CMS/index.php/the-library/11)
     * 
     * @param Float a
     * @param Float x
     */
    var lnGammaIncomplete = function(a, x) {
        var errors = [];

        // sanitize the data
        if (isNaN(a)) {
            errors.push("lnGammaIncomplete: the a parameter must be a number");
        }

        if (isNaN(x)) {
            errors.push("lnGammaIncomplete: the x parameter must be a number");
        }

        var sum = 1/a,          // initialize sum and set to sum of first two terms of series
            value = 1/a,        // stores the previous value
            lastSum,            // store value of last sum for error estimation
            error = 2.0e-10,    // tolerated error (same as gamma function)
            n = 1,              // start loop at 1 as 0th term has already been calculated
            maxIter = 1000;     // good enough (also avoiding arithmetic overflow in this case)

        // Keep going until reach error threshhold or run out of iterations
        do {
            // Save last sum before calculation
            lastSum = sum;
            
            // Multiply last value by change in term
            value *= x/(a + n);

            // Add value to continually growing sum
            sum += value;

            // increment count
            n++;
        } while (Math.abs((sum - lastSum)/sum) > error && n < maxIter);

        // return [Math.exp(a * Math.log(x) - x + Math.log(sum)), n];    // for debugging
        return a * Math.log(x) - x + Math.log(sum);
    };

    /**
     * Calculates the natural log of the incomplete beta function
     * The log is taken to avoid arithmetic overflow
     * The incomplete beta function can easily be retrieved by Math.exp(lnBetaIncomplete(x, a, b))
     * 
     * Credit for the algorithm: http://dlmf.nist.gov/8.17#v
     * Credit for continuous fraction implementation: 
     *         https://en.wikipedia.org/wiki/Continued_fraction#Infinite_continued_fractions
     *         and adussaq (https://github.com/adussaq)
     * 
     * @param Float x where 0 < x < 1
     * @param Float a
     * @param Float b
     */
    var lnBetaIncomplete = function(x, a, b) {
        var errors = [];
        
        if (isNaN(x)) {
            errors.push("lnBetaIncomplete: the parameter x: " + x + " must be a number");
        }
        
        if (!isNaN(x) && (x > 1 || x < 0)) {
            errors.push("lnBetaIncomplete: the parameter x: " + x + " must be between 0 and 1");
        }
        
        if (isNaN(a)) {
            errors.push("lnBetaIncomplete: the parameter a: " + a + " must be a number");
        }
        
        if (isNaN(b)) {
            errors.push("lnBetaIncomplete: the parameter b: " + b + " must be a number");
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join("; "));
        }
        
        // A brief explanation of this function is in order:
        // From the algorithm website, the formula is given as I_x (a,b) = x^a * (1−x)^b /a * (1/(1+d_1/(1+d_2/(1+d_3/(1+...
        // For the continuous faction component (1/(1+d1/(1+d2/(1+d3/(1+... ) the following general solution can be shown
        //     (a_0 + a_1/(1 + a_2/(1 + a_3/(1 + a_4...
        //     the evaluation of the first n terms is given by h_n / k_n
        //     where h_n = a_n * h_(n-2) + h_(n-1)
        //     and k_n = a_n * k_(n-2) + k_(n-1)
        //     NOTE: the current term and TWO previous terms must be remembered
        
        // For the incomplete beta function's partial fraction, the following 2 initial states exist
        var h_0 = 0,            // no term in front added to the partial fraction
            k_0 = 1,            // denominators are always 1 with a whole number (or 0) on top
            h_1 = 1,            // the second numerator (a_0 + a_1) must be 1 given the partial fraction
            k_1 = 1,            // denominators are always 1 with a whole number (or 0) on top
            s_0 = h_0 / k_0,    // first proposed solution
            s_1 = h_1 / k_1,    // second proposed solution
            n = 1,              // this initiates d_1 NOT a_1
            error = 2.0e-10,    // set error to same tolerance as gamma function
            maxIter = 50,       // if answer is not found in 50 iterations, good enough
            m,                  // n is a function of m in the incomplete beta function
            d_n;                // used in the partial fraction of the incomplete beta function
            
        // Iterate until the difference between proposed solutions is within error tolerance
        while (Math.abs((s_1 - s_0)/s_1) > error && n < maxIter) {
            // Calculate m for odd n
            m = (n - 1)/2;
            
            // Calculate odd d_n
            d_n = -(a + m) * (a + b + m) * x / (a + 2*m) / (a + 2*m + 1);
            
            // Create new  initial numerator and denominator in set
            // based on general partial fraction solution
            h_0 = d_n * h_0 + h_1;
            k_0 = d_n * k_0 + k_1;
            
            // Next term
            n++;       // even n
            m = n/2;   // Calculate m for even n
            
            // Calculate even d_n
            d_n = m * (b - m) * x / (a + 2*m -1) / (a + 2*m);
            
            // Create new secondary numerator and denominator in set
            // base on general partial fraction solution
            h_1 = d_n * h_1 + h_0;
            k_1 = d_n * k_1 + k_0;
            
            // Propose new solutions
            s_0 = h_0 / k_0;
            s_1 = h_1 / k_1;
            
            // Keep all numbers small (same as multiplying numerators and denominators by (1/k_1)/(1/k_1))
            h_0 = h_0 / k_1;
            k_0 = k_0 / k_1;
            h_1 = s_1;  // s_1 = h_1/k_1
            k_1 = 1;     // k_1/k_1
            
            // Increment for next loop
            n++;
        }
        
        // Log tranform everything to keep everything as small as possible for future calculations
        return a * Math.log(x) + b * Math.log(1 - x) - Math.log(a) + Math.log(s_1);
    };


    /* -------------- *
     * T Distribution *
     * -------------- */

    // Object containing T distribution methods
    globalObject.t = {};

    /**
     * Calculates the cumulative t distribution
     * Algorithm from (https://en.wikipedia.org/wiki/Student%27s_t-distribution#Cumulative_distribution_function)
     * 
     * @param Float t
     * @param Int df
     * @param Boolean cumulative
     */
    globalObject.t.dist = function(tValue, df, cumulative) {
        // set cumulative default to true as this is typically expected behavior of this function
        cumulative = typeof cumulative === "undefined" ? true : cumulative;

        var errors = [];
        
        // Error checking
        if (isNaN(tValue)) {
            errors.push("t.dist: The t value: " + tValue + " must be a number");
        }
        
        if (isNaN(df)) {
            errors.push("t.dist: The degrees of freedom: " + df + " must be a number");
        }
        
        if (df < 0) {
            errors.push("t.dist: The degrees of freedom: " + df + " must be positive");
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join("; "));
        }

        // parameters for beta functions
        var x = df / (Math.pow(tValue, 2) + df),    // x parameter of beta function
            a = df / 2,                             // a parameter of beta function
            b = 1 / 2,                              // b parameter of beta function
            lnRegBetaInc,                           // natural log of regularized incomplete beta function (B(x; a, b)/B(a, b))
            regBetaInc,                             // regularized incomplete beta function
            prob;                                   // probability of given tValue

        if (cumulative) {

            // Calculate lnBeta function using gamma function
            // Beta(a, b) = Gamma(a) * Gamma(b) / Gamma(a + b)
            // var lnBeta = lnGamma(df/2) + lnGamma(1/2) - lnGamma((df+1)/2);
            var lnBeta = lnGamma(df/2) + 0.572364942924743 - lnGamma((df+1)/2);

            // Optimized convergence based on (http://dlmf.nist.gov/8.17#v)
            if (x < (a + 1) / (a + b + 2)) {
                lnRegBetaInc = lnBetaIncomplete(x, a, b) - lnBeta;
                regBetaInc = Math.exp(lnRegBetaInc);
            } else {

                // Note that Beta(a, b) = Beta(b, a), allowing same value for lnBeta to be used as above
                lnRegBetaInc = lnBetaIncomplete(1 - x, b, a) - lnBeta;
                regBetaInc = 1 - Math.exp(lnRegBetaInc);
            }

            // Final step based on whether tValue > 0
            if (tValue < 0) {
                prob = regBetaInc / 2;
            } else {
                prob = 1 - regBetaInc / 2;
            }
        } else {

            // Equation from (wiki article)
            prob = Math.exp(lnGamma((df + 1) / 2) - (1/2) * Math.log(df * Math.PI) - lnGamma(df / 2) - ((df + 1) / 2) * Math.log(1 + (Math.pow(tValue, 2)/df)));
        }

        return prob;
    };


    /**
     * Calculates the smallest t value that will give a cumulative probability equal to user input
     * Function provided by adussaq (https://github.com/adussaq)
     * 
     * @param Float prob
     * @param Int df
     */
    globalObject.t.inv = function(prob, df) {
        var errors = [];

        // Sanitize the data
        if (isNaN(prob)) {
            errors.push("t.inv: the probability " + prob + " is not a number");
        }

        if (prob > 1 || prob < 0) {
            errors.push("t.inv: the probability " + prob + " should be between 0 and 1 including the bounds");
        }

        if (isNaN(df)) {
            errors.push("t.inv: the degrees of freedom " + df + " is not a number");
        }

        if (!isNaN(df) && df < 1) {
            errors.push("t.inv: the degrees of freedom " + df + " should be a positive number greater than or equal to 1");
        }

        if(errors.length > 0) {
            throw new Error(errors.join("; "));
        }

        var t,                  // t value that will be associated with user-submitted probability
            diff,               // difference between guessed probability and user submitted probability
            error = 1e-10,      // allowed error between guessed probability and user submitted probability
            maxIter = 1000,     // after 1000 iterations, it's close enough
            step = 0.25,        // gives faster convergence on diff
            stepInc = 1.2,      // increase step to converge faster
            stepDec = 0.5,      // decreases step for after overshoot
            iter = 0,           // counts number of iterations
            direction = 1,      // determines direction of alternation
            lastDiff = 1;       // used to calculate overshooting

        // Make some intelligent guesses based on knowing that, for a t distribution,
        // a probability < 0.5 must be from a negative z and a probability > 0.5 must be from a positive z
        if (prob < 0.5) {
            t = -0.5;
        } else if (prob > 0.5) {
            t = 0.5;
        } else {
            t = 0;
        }

        // Guess until gone for too many iterations or arrived within error
        do {
            // Check the guess
            diff = prob - globalObject.t.dist(t, df, true);

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
            t += direction * step;

            // save last diff to check for overshooting
            lastDiff = diff;

            // Maintain count of iterations thus far
            iter++;
        } while (Math.abs(diff) > error && iter < maxIter);

        // return value back based on user-select normal distribution
        //return [t, globalObject.t.dist(t, df, true), iter]; // (for debugging)
        return t;
    };

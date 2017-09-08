/* #########
 * ui/cmd.js */

/* Verifies that @err array is empty then runs @fun. */
exports.verify = (logger, err, fun) => err.length > 0 ? logger.log('warn', ...err) : fun()

/* Checks through @args for failing @args.pred predicates and
 * returns array with the @args.msg of the first failure. */
exports.checker = (...args) => args.reduce((err, check) => {
    if (!check.pred && err.length === 0)
        return check.msg;
    return err;
}, [])

/* Uses @predFun predicate and @msgFun error message functions to create
 * a validator function that receives arguments for validation. */
exports.validator = (predFun, msgFun) => (...args) => (
    { pred: predFun(...args), msg: msgFun(...args) }
)

/* A quick validator function for specific one-time conditions. As opposed
 * to predicates, it returns a failed pred on true @cond conditions. */
exports.checkCond = (cond, msg) => cond ? { pred: false, msg } : { pred: true }

/* Array.prototype.length that returns 0 on invalid/undefined arrays. */
exports.arrLen = arr => arr ? arr.length : 0

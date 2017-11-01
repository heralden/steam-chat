/* #########
 * ui/cmd.js */

/* Verifies that @err array is empty then runs @fun. Returns value 
 * of halt which is usually undefined but can be set to true to
 * halt readInput in case a different box requires input. If halt
 * is used, make sure to run inputbar read method somewhere in the
 * body of @fun. */
exports.verify = (logger, err, fun, halt) => {
  if (err.length > 0) logger.log('warn', ...err)
  else fun();
  return halt;
}

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

/* Returns an object where each key-value pair is equal to each @args element */
exports.createActions = (...args) => {
    var obj = {};
    args.forEach((e) => obj[e] = e);
    return obj;
}

/* #####
 * Steam */

const Steam = require('steam');

exports.eresultMsg = (eres) => {
    for (var errmsg in Steam.EResult) {
        if (Steam.EResult[errmsg] == eres)
            return errmsg;
    }
    return undefined;
}

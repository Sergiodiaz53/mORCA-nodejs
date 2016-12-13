/**
 * Created by Yeyo on 13/10/16.
 */

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var user_schema = new Schema({
    userName            :   String,
    jobList             :   [{ type: Schema.Types.ObjectId, ref: 'Job' }]
});

module.exports = mongoose.model('User', user_schema);

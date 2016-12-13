var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var job_schema = new Schema({
    user              : { type: String, ref: 'User' },
    jobName           :   String,
    outputFile        :   String,
    nameFile          :   String,
    status            :   String,
    date              : { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', job_schema);
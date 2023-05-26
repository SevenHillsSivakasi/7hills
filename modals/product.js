var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: {type:String, required:true},
    bf:{type:Number, required:true},
    GSM:{type:String, required:true},
    Size:{type:String, required:true},
    rate:{type:String},
});

module.exports = mongoose.model('Product', schema);
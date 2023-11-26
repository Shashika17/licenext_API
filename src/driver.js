const mongoose = require('mongoose');

const comment = new mongoose.Schema({
    pid:
    {
       type: String,
       required: true
    },
    comment:
    {
        type: String,
        required: true
    },
    date:
    {
        type: Date,
        required: true
    },
    location:
    {
        type: String,
        required: true
    }

});

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    nic: {
        type: String,
        required: true
    },
    lid: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    validity:
    {
        type: String,
        required: true
    },
    reasons:[comment]
});

module.exports = mongoose.model('driver', driverSchema);

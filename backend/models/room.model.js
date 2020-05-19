const mongoose = require('mongoose');


const roomSchema = new mongoose.Schema({
    roomID: String,
    messages: [{
        username: String,
        text: String,
        time: {
            type: Date,
            default: Date.now
        }
    }]
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
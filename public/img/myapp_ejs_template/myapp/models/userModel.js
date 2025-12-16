const { default: mongoose } = require("mongoose")
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contactNo: {
        type: Number
    },
    gender: {
        type: String
    }
},{
    collection: "users"
})
module.exports = mongoose.model("users", userSchema)
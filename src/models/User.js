import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 4
    },
    profileImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });


// Pre-Hook = Hook that OCCURS before a User.SCHEMA METHOD
// common EVENTS =
// save: runs before a document is saved
// validate: runs before a document is validated
// remove: runs for a document is removed
// updateOne: runs before updated operation
// findOneAndUpdate: runs before an find-update operation


// Runs b4 - the doc is SAVED
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next(); // DONT hash the PWD if user UPDATES their information

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
})


// Create METHOD - function that is only associated with this SChema
userSchema.methods.checkPassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
}



const User = mongoose.model('User', userSchema);

export default User;
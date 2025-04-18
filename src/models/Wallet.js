import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    totalIncome: {
        type: Number,
        default: 0,
    },
    totalExpense: {
        type: Number,
        default: 0,
    },
    image: {
        type: String, // icon name
        default: null,
    },
    uid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;
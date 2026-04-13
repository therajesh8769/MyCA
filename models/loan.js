const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loanSchema = new Schema({
    type: {
        type: String,
        enum: ['borrow', 'lend'],
        required: true
    },
    borrower: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    lender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    borrowerMobile: {
        type: String,
        required: true
    },
    lenderMobile: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'settled'],
        default: 'pending'
    },
    dueDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['with_interest', 'without_interest'],
        default: 'without_interest'
    },
    interestRate: {
        type: Number,
        default: 0
    },
    interestType: {
        type: String,
        enum: ['simple', 'compound', 'none'],
        default: 'none'
    },
    requestDate: {
        type: Date,
        default: Date.now
    }
});

const Loan = mongoose.model("Loan", loanSchema);
module.exports = Loan;

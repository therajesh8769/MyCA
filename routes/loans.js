const express = require("express");
const router = express.Router();
const Loan = require("../models/loan");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/middleware");
const wrapAsync = require("../utils/wrapAsync");

// Helper to determine role based on request
function determineRoles(currentUser, targetMobile, type) {
    if (type === 'borrow') {
        return {
            borrower: currentUser._id,
            borrowerMobile: currentUser.mobileNo,
            lenderMobile: targetMobile
        };
    } else {
        return {
            lender: currentUser._id,
            lenderMobile: currentUser.mobileNo,
            borrowerMobile: targetMobile
        };
    }
}

// 1. Dashboard for Loans
router.get("/", isLoggedIn, wrapAsync(async (req, res) => {
    const mobileNo = req.user.mobileNo;
    if (!mobileNo) {
        req.flash('error', 'Please update your mobile number in your profile to use the Loans feature.');
        return res.redirect('/account');
    }

    // Pending requests sent BY me
    const sentRequests = await Loan.find({
        $or: [
            { borrower: req.user._id, type: 'borrow', status: 'pending' },
            { lender: req.user._id, type: 'lend', status: 'pending' }
        ]
    }).populate('borrower lender');

    // Pending requests received BY me (requires me to accept)
    const receivedRequests = await Loan.find({
        $or: [
            { lenderMobile: mobileNo, type: 'borrow', status: 'pending' },
            { borrowerMobile: mobileNo, type: 'lend', status: 'pending' }
        ]
    }).populate('borrower lender');

    // Active Borrowings
    const activeBorrowings = await Loan.find({
        $or: [
            { borrower: req.user._id, status: 'accepted' },
            { borrowerMobile: mobileNo, status: 'accepted' } // fallback
        ]
    }).populate('borrower lender');

    // Active Lendings
    const activeLendings = await Loan.find({
        $or: [
            { lender: req.user._id, status: 'accepted' },
            { lenderMobile: mobileNo, status: 'accepted' } // fallback
        ]
    }).populate('borrower lender');

    res.render("loans/index.ejs", { sentRequests, receivedRequests, activeBorrowings, activeLendings });
}));

// 2. Render Form to Create New Loan
router.get("/new", isLoggedIn, (req, res) => {
    if (!req.user.mobileNo) {
        req.flash('error', 'Please update your mobile number in your profile first.');
        return res.redirect('/account');
    }
    res.render("loans/new.ejs", { user: req.user });
});

// 3. Create Loan Request
router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
    const { type, targetMobile, amount, dueDate, category, interestRate, interestType } = req.body;

    if (!req.user.mobileNo) {
        req.flash('error', 'You must have a mobile number to create a request.');
        return res.redirect('/account');
    }

    if (targetMobile === req.user.mobileNo) {
        req.flash('error', 'You cannot send a request to yourself.');
        return res.redirect('/loans/new');
    }

    const roles = determineRoles(req.user, targetMobile, type);

    // Find if target user exists to populate their reference
    const targetUser = await User.findOne({ mobileNo: targetMobile });
    if (targetUser) {
        if (type === 'borrow') roles.lender = targetUser._id;
        if (type === 'lend') roles.borrower = targetUser._id;
    }

    const loan = new Loan({
        type,
        ...roles,
        amount,
        dueDate,
        category,
        interestRate: category === 'with_interest' ? interestRate : 0,
        interestType: category === 'with_interest' ? interestType : 'none'
    });

    await loan.save();
    req.flash('success', `${type === 'borrow' ? 'Borrow' : 'Lend'} request sent successfully.`);
    res.redirect('/loans');
}));

// 4. Accept a Loan Request
router.post("/:id/accept", isLoggedIn, wrapAsync(async (req, res) => {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
        req.flash('error', 'Loan request not found.');
        return res.redirect('/loans');
    }

    // Verify current user is the target of the request
    const isTarget = (loan.type === 'borrow' && loan.lenderMobile === req.user.mobileNo) ||
                     (loan.type === 'lend' && loan.borrowerMobile === req.user.mobileNo);

    if (!isTarget) {
        req.flash('error', 'Not authorized to accept this request.');
        return res.redirect('/loans');
    }

    // Link the current user to the loan if not already linked
    if (loan.type === 'borrow') loan.lender = req.user._id;
    if (loan.type === 'lend') loan.borrower = req.user._id;

    loan.status = 'accepted';
    await loan.save();

    req.flash('success', 'Request accepted.');
    res.redirect('/loans');
}));

// 5. Reject a Loan Request
router.post("/:id/reject", isLoggedIn, wrapAsync(async (req, res) => {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
        req.flash('error', 'Loan request not found.');
        return res.redirect('/loans');
    }

    // Ensure the current user is involved in the loan request
    const isTarget = (loan.type === 'borrow' && loan.lenderMobile === req.user.mobileNo) ||
                     (loan.type === 'lend' && loan.borrowerMobile === req.user.mobileNo);

    if (!isTarget) {
        req.flash('error', 'Not authorized to reject this request.');
        return res.redirect('/loans');
    }

    loan.status = 'rejected';
    await loan.save();

    req.flash('success', 'Request rejected.');
    res.redirect('/loans');
}));

// 6. Settle a Loan
router.post("/:id/settle", isLoggedIn, wrapAsync(async (req, res) => {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
        req.flash('error', 'Loan not found.');
        return res.redirect('/loans');
    }

    loan.status = 'settled';
    await loan.save();

    req.flash('success', 'Loan marked as settled.');
    res.redirect('/loans');
}));

module.exports = router;

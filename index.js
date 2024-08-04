const express = require('express');
const app = express();

const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const flash = require('connect-flash');     
const passport=require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { isLoggedIn } = require('./middleware/middleware.js');
const trans = require('./models/trans');
const User = require('./models/user');
const userRouter = require('./routes/user.js');
require('dotenv').config();


const port = 8080;

// Middleware Setup
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
    secret: 'mysupersecretstring',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}));


const dbUrl=process.env.ATLAS;

main()
.then((res)=>
{
    console.log("connection success");

})
.catch((err)=>console.log(err));

async function main()
{
    await mongoose.connect(dbUrl);

};
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Flash Middleware to make messages available in views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser=req.user;

    next();
});

app.listen(port, () => {
    console.log(`listening to port ${port}`);
});
app.use("/",userRouter);

app.get('/home', (req, res) => {
    res.render('index.ejs');
});

app.post('/home',isLoggedIn, async(req, res) => {
    let { type, currency, ammount, date, mode, comment, customCat } = req.body;
    let cat = customCat ? customCat : req.body.cat;
  
    
    const newEntry = {
        type,
        currency,
        ammount: parseFloat(ammount), // Ensure amount is a number
        cat,
        date,
        mode,
        comment,
        user: req.user._id
    };
 console.log(newEntry);

    try {
        const entry=new trans(newEntry);
       let result=await entry.save(); 
         console.log(result);
        
         
            req.flash('success', 'Transaction saved successfully');
            res.redirect('/home');
    
    } catch (err) {
        
        req.flash('error', 'Failed to save transaction');
        res.redirect('/home');
    }
});
app.get('/account',isLoggedIn,(req,res)=>
{
    res.render("profile.ejs");
});

app.get("/home/report",async(req,res)=>
    {  
        try{
            let allTrans=await trans.find({user:req.user._id});
                
                    let index=0;
                    res.render("report.ejs",{allTrans,index});
            
        }
        catch(err)
        {
            req.flash("error","Can not find reports");
            res.redirect("/home");
        }
       
        
    }
);
app.get("/home/income",async(req,res)=>
    {
        
        try{
            const result = await trans.find({ type: "income",user:req.user._id });

                    
                    let index=0;
                    res.render("income.ejs",{result,index});
                
        }
        catch(err)
        {
            req.flash("error","Can not find reports");
            res.redirect("/home");
            
        }
       
        
    }
);
app.get("/home/expense",async(req,res)=>
    {
        
        try{
            const result = await trans.find({ type: "spend",user:req.user._id });
            
                  
                    let index=0;
                    res.render("expense.ejs",{result,index});
                
        }
        catch(err)
        {
            req.flash("error","Can not find reports");
            res.redirect("/home");
            
        }
    }
);
app.get("/home/privacy",(req,res)=>
{
    res.render('privacy.ejs');
});
app.get("/home/terms",(req,res)=>
    {
        res.render('terms.ejs');
    });
 app.get("/home/contact",(req,res)=>
        {
            res.render('contact.ejs');
        });




        const query = (q) => {
            return new Promise((resolve, reject) => {
                connection.query(q, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }; 
        app.get("/home/dashboard",isLoggedIn, async (req, res) => {
            try {
                const totalIncomeResult = await trans.aggregate([
                    { $match: { type: 'income',user:req.user._id } },
                    { $group: { _id: null, totalIncome: { $sum: '$ammount' } } }
                ]);
                const totalExpenseResult = await trans.aggregate([
                    { $match: { type: 'spend',user:req.user._id } },
                    { $group: { _id: null, totalExpense: { $sum: '$ammount' } } }
                ]);
                const count = await trans.countDocuments({ user: req.user._id});
                const recent = await trans.find({ user: req.user._id}).sort({ date: -1 }).limit(10);
                const category = await trans.aggregate([
                    { $match: { type: 'spend',user:req.user._id } },
                    { $group: { _id: '$cat', total: { $sum: '$ammount' } } }
                ]);
                const totalIncome = totalIncomeResult.length > 0 ? totalIncomeResult[0].totalIncome : 0;
                const totalExpense = totalExpenseResult.length > 0 ? totalExpenseResult[0].totalExpense : 0;
                const netBalance = totalIncome - totalExpense;
             
                

                res.render("dashboard.ejs", {
                    totalIncome,
                    totalExpense,
                    netBalance,
                    count,
                    recent,
                    category,
                    
                });
            } catch (err) {
                res.send(err);
            }
        });
        
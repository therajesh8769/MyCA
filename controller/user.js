const User=require("../models/user.js");
module.exports.signupForm=async(req,res)=>
    {
        res.render('signup.ejs');
    };
    module.exports.signup=async(req,res)=>
        {
           try{
            const user=req.body.user;
        
           if(!user)
            {
                throw new ExpressError(400,"Error! send valid data");
            }
            const {username,email,password}=user;
            if (!username || !email || !password) {
                throw new ExpressError(400, "Error! Username, email, and password are required");
            }
    
        
            const newUser= new User({username,email});
            
          const res5=  await User.register(newUser,password);
          console.log(res5);
            req.login(res5,(err)=>
            {
                if(err)
                    {
                       return next(err);
                    }
                    req.flash("success","Welcome to MyCA!");

                    res.redirect("/home");
    
                })  
                
               }
                catch(e)
                {
                    req.flash("error",e.message);
                    res.redirect("/signup");
                }
             
             
            };
            module.exports.loginForm=(req,res)=>
                {
                    res.render("login.ejs");
                };
            module.exports.login=async(req,res)=>
                {   
                    req.flash("success","welcome to MyCA you are logged in! ");
                    if(!res.locals.redirectUrl)
                        {
                            return res.redirect("/home")
                        } 
                    res.redirect(res.locals.redirectUrl);
                };
                module.exports.logout=(req,res,next)=>
                    {
                        req.logout((err)=>
                        {
                            if(err)
                                {
                                   return  next(err);
                                }
                                req.flash("success","you are logged out");
                                res.redirect("/home");
                        });
                    };
    

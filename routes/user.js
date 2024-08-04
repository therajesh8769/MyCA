const express=require("express");
const wrapAsync = require("../utils/wrapAsync");

const router = express.Router();

const passport=require("passport");
const { saveRedirectUrl } = require("../middleware/middleware.js");

const UserController=require("../controller/user.js");

router.route("/signup")
.get(UserController.signupForm)
.post(wrapAsync(UserController.signup));

router.route("/login")
.get(UserController.loginForm)
   
.post(saveRedirectUrl,passport.authenticate('local',{failureRedirect:'/login',failureFlash:true}), UserController.login);

    //Logout user
    router.get("/logout",UserController.logout);

module.exports=router;

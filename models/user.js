const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");
 const userSchema=new Schema({
    email:
    {
        type:String,
        required:true,
    },
    username:
    {
        type:String,
        required:true,
        
    },
    mobileNo: {
        type: String,
        sparse: true,
        unique: true
    },
    upiId: {
        type: String
    },
    defaultInterestRate: {
        type: Number,
        default: 0
    }

 });
 userSchema.plugin(passportLocalMongoose);
 module.exports=mongoose.model("User",userSchema);
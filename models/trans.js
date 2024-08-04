const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const moment = require('moment-timezone');

const transSchema=new Schema(
    {
      type:
        {
            type:String,
            required: true
        },
        currency:
        {
            type:String,
            
        },
        ammount:
        {
            type:Number,
            required: true
        },
        date:
        {
         type:String,
         required: true
        },
        mode:
        {
            type:String,
        },
        comment:
        {
            type:String,
        },
        cat:
        {
            type:String
        },
        user: {  
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
          }
    }
);
const trans=mongoose.model("trans",transSchema);
module.exports=trans;


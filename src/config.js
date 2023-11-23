const mongoose = require("mongoose");
const connect =mongoose.connect("mongodb+srv://shashigakavinda:NissanGTR@cluster0.jukvicp.mongodb.net/?retryWrites=true&w=majority");


//check database connected or not
connect.then(()=>{
    console.log("\x1b[32m%s\x1b[0m", "Database connected Successfully");
})
.catch(()=>{
    console.log("\x1b[31m%s\x1b[0m","Database cannot be connected");
});

//create a schema
 const LoginSchema = new mongoose.Schema({
   name:{
    type:String,
    required:true

   },
   password:{
    type:String,
    required:true
   },
   email:{
    type:String,
    required:true
   }
 });

 const collection =new mongoose.model("users",LoginSchema);
 module.exports = collection;


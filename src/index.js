const express =require('express');
const pasth = require("path");
const bcrypt = require("bcryptjs");
const collection = require("./config")
const driver = require("./driver")
const cors = require('cors');
const { Collection } = require('mongoose');


const app = express();
//convert data to json format

app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  }));

//--------------------------------
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');

app.get("/",(req,res) => {
    res.render("login");
});

app.get("/signup",(req,res)=>{
    res.render("signup");
});

//Register User
app.post("/signup",async(req,res)=>{

    const data ={
        name: req.body.username,
        password: req.body.password,
        email: req.body.email
    }

//check if the user already exists in the database
const existingUser =await collection.findOne({name: data.name})

if(existingUser)
{
    res.send(`<script>
        alert("User already exists. Please choose a different username.");
        window.location.href = "/signup"; // Redirect to the home page or another appropriate page
      </script>`);
}
else
{  
    //hash the password using bcrypt
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(data.password, saltRounds)

    data.password = hashPassword; //Replace the hash password with original password

    const userdata = await collection.insertMany(data);
    console.log(userdata);
    if(userdata)
    {
        res.send(`<script>
            alert("Successfully Registerd.");
            window.location.href = "/"; // Redirect to the home page or another appropriate page
          </script>`);
    }
    }
  
});

//Login user
app.post("/login",async (req,res)=>{

    try{
    const check =await collection.findOne({name: req.body.username});
    if(!check)
    {
        res.send("user name cannot be found");
    }
    else{
    //compare the hash password from the database with the plain text
    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if(isPasswordMatch)
    {
        //res.render("home");
        res.send("go to home");
        
    }
    else
    {
        res.send("wrong password");
    }
    }
    }
    catch
    {
      res.send("Wrong Details");
    }

});

app.post("/check",async(req,res)=>{
    const info =await driver.findOne({nic: req.body.nic});
    if(!info)
    {
        res.send("user not existing in system")
    }
    else{

        res.redirect(info.image);
    }

});

// Update route
app.put('/update', async (req, res) => {
    const data = { name: req.body.username,
                   password: req.body.password,
                   email: req.body.email } 
const saltRounds = 10;
const hashPassword = await bcrypt.hash(data.password, saltRounds)
data.password = hashPassword;             
  
    try {
      // Find the user by username and password and update
      const updatedUser = await collection.findOneAndUpdate(
        {name:data.name},
        {password:data.password,
         email:data.email},
        {new: true} // Return the updated document
      );
  
      if (updatedUser) {
        res.status(200).json({ message: 'User updated successfully', updatedUser });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
//---------------------------------------------------------------  

const port = 5000;
app.listen(port,()=>{
    console.log("\x1b[32m%s\x1b[0m","Server running on port:" +port);
});

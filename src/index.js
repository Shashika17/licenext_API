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
     //   res.render("home");
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
//-------------------------------------------------------------
app.post("/check",async(req,res)=>{
    const info =await driver.findOne({nic: req.body.nic});
    if(!info)
    { 
        res.send("user not existing in system")
    }
    else{

        //res.redirect(info.image);
       // res.send(info.image);
        res.send(
          {image:info.image,
          validity:info.validity,
          nic:info.nic});
    }

});
//---------------------------------------------------------------
//add reason for block
app.post("/comment", async (req,res)=>{

 try{ 
  
  const userNIC = req.body.nic;
  const newReason = {
    pid: req.body.pid,
    comment: req.body.comment,
    location : req.body.location,
    date: new Date(),
  };
  
  const user = await driver.findOne({ nic: req.body.nic });
  
 if (user) {

   user.reasons.push(newReason);
   await user.save();
   res.send("New reason added successfully.");
   console.log('New reason added successfully.');

 } 
 else {
   
  // res.send(userNIC);
  // res.send('user not found');
   console.log('User not found.'+newReason.pid);

 }
 }
 catch(error)
 {
    res.send(error);
    console.log(error);
 } 
 
});
//---------------------------------to retrive comments and other info------------
app.get('/getReasons/:nic', async (req, res) => {
  const UserNIC = req.params.nic; // Use req.params to get the 'nic' parameter

  try {
    const user = await driver.findOne({ nic: UserNIC }, 'reasons');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.reasons);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' }); // Return a generic error response
  }
});

//---------------for delete comments------------------
app.delete('/delete', async(req,res) => {

  const nic = req.body.nic;
  const commentID = req.body._id;
  try
  {
    const updateUser = await driver.findOneAndUpdate(
      {nic},
      {$pull:{reasons:{ _id:commentID}}},
      {new: true}
    );
    if(!updateUser)
    {
      return res.status(404).json({ error: 'User not found ' });
    }
    res.send('Comment deleted successfully');
  }
  catch(error)
  {
     res.send(error);
  }

});

//---------------------------------
// Update 
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
//---change validities----------------------------------------
app.put("/validity", async (req,res) => {

  const data=
  {
    nic: req.body.nic,
    validity: req.body.validity
  }
  try
  {
     const updateDriver = await driver.findOneAndUpdate({nic : data.nic},
      {validity : data.validity},
      {new: true}
      );
      if (updateDriver) {
        res.status(200).json({ message: 'User updated successfully', updateDriver });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
  }
  catch(error)
  {
     console.log(error);
     res.send(error);
     res.status(500).json({ error: 'Internal server error' });
  }

});


const port = 5000;
app.listen(port,()=>{
    console.log("\x1b[32m%s\x1b[0m","Server running on port:" +port);
});

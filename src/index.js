const express =require('express');
const path = require("path");
const bcrypt = require("bcryptjs");
const collection = require("./config")
const driver = require("./driver")
const cors = require('cors');
const { Collection } = require('mongoose');
const nodemailer = require("nodemailer");


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

//defineing  authorization information for  email service
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "mr.decemberdevil@gmail.com",
    pass: "uvza wcsp teak jepf",
  },
})



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
app.delete('/delete/:nic', async(req,res) => {

  const nic = req.params.nic;

  try
  {
    const updateUser = await driver.findOneAndUpdate(
      {nic},
      { $unset: { reasons: '' } },
      {new: true}
    );
    if(!updateUser)
    {
      return res.status(404).json({ error: 'User not found ' });
    }
    res.send('Comments deleted successfully');
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

//########################################################################
//---password rest functions -and mailing functions-----------------------

function generateRandomNumber() {
  // Math.floor(Math.random() * (max - min + 1)) + min
  const min = 100000; // Minimum 6-digit number
  const max = 999999; // Maximum 6-digit number

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.post ("/mailing",async (req,res)=>
{

  try {
    const user = await collection.findOne({ name: req.body.pid });

    if (!user || !user.email) {
      return res.status(404).send("User not found or email not available");
    }

  console.log(user);
   const OTP = generateRandomNumber(); 

  // create a mail object with the user email and a confirmation message
  let mail = {
    from: "Licenext",
    to:`${user.email}`,
    subject: "Licenext Password recovery OTP",
    text: `Hello ${user.name}, this your OTP .`,
    html: `<p>${user.name} this is your OTP number please don't share this number with anyone</p></br>
             <h1>${OTP}</h1>`,
  };

  // send the mail using the transporter object 
  transporter.sendMail(mail, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Something went wrong");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send({OTP});
    }
  });
}
catch (error) {
  console.error(error);
  res.status(500).send("Internal Server Error");
}
})

//########################################################################
//------------------------------------------------------------------------



const port = 5000;
app.listen(port,()=>{
    console.log("\x1b[32m%s\x1b[0m","Server running on port:" +port);
});


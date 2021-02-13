var express=require('express');
var nodemailer = require("nodemailer");
var app=express();
/*
    Here we are configuring our SMTP Server details.
    STMP is mail server which is responsible for sending and recieving email.
*/

var http = require("http");

//create a server object:
http
  .createServer(function(req, res) {

    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "anikettikone44@gmail.com",
            pass: "9011869840"
        }
    });

    link="http:///verify?id=link"
    mailOptions={
       // to : req.query.to,
       to: "Anikettikone9@gmail.com",
        subject : "Please confirm your Email account",
        html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function(error, response){
     if(error){
            console.log(error);
       
     }else{
            console.log("Message sent: " + response.message);
       
         }
});

  }).listen(8085)

var rand,mailOptions,host,link;
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/


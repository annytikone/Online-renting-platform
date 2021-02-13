const express = require('express');
const lodash = require('lodash')
const jwt = require('jsonwebtoken');

//error handler
const { ErrorHandler } = require("../ErrorHandler/error")

const bcrypt = require('bcrypt')
const DbConnection = require('../Database/DbConnection')
const router = express.Router();
const authorizeUser = require('../Authorization/Authorization')
//accessToken to athenticate server
const accessTokenSecret = 'youraccesstokensecret';

//refresh tokens
const refreshTokenSecret = 'yourrefreshtokensecrethere';
const refreshTokens = [];

//lodash
const isEmpty = require("lodash/isEmpty")
const isNil = require("lodash/isNil")

//email configs
const emailUtil = require('../Email-Config/email-utils');
const { sendEmail } = emailUtil;
const mailcomposer = require("mailcomposer")

//nodemailer config's
const nodeMailerUtils = require('../Email-Config/nodeMailer-utils')

const { sendEmailByNodemailer } = nodeMailerUtils;

//Email Authorization
const EmailAuthorization = require("../Authorization/EmailAuthorization")
//check whether email is authorized or not
const { verifyToken } = EmailAuthorization

//Url for internal api accessing
const url = require("url")

//to fetch json of other apis
const fetch = require('node-fetch');
const axios = require('axios')

const { verifyFacebookToken } = require('../TokenVerification/facebookTokenVerification')
const { verifyGoogleToken } = require('../TokenVerification/googleTokenVerification')

const { GenerateGenericToken } = require('../Authorization/GenerateGenericToken')

const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')



router.get('/test', (req, res) => {
  res.send("router working fine")
})

/* testing of ejs forgotpassword file
router.get('/forgotPasswordForm', (req, res) => {
  console.log(__dirname)
  let username = "Aniket "
  let setNewPasswordLink = "form submitted"
  let bearer = "bearer"
  res.render("ForgotPassword.ejs", { username, setNewPasswordLink, bearer })
})
*/


router.get('/dbtest', (req, res) => {
  DbConnection.query("select * from userAuthentication", async (err, row) => {
    if (err) console.log(err);
    else
      console.log(await row)
    //  res.json( await row);
    res.json({
      "status": 0,
      "message": "DATABASE TEST",
      "data": [await row]
    })
  })
});

//1.user login
router.post("/login", async (req, res, next) => {
  // let fbValidationUrl='https://graph.facebook.com/userId?access_token='
  let activateAccountMsg = "";
  try {

    const { username, password } = req.body;
    if (![username, password].every(Boolean))
      throw new ErrorHandler(403, "Bad Request:Empty Values")
    else
      var ActivateAccountSql = "update userAuthentication SET accountStatus = 1 where userName='" + username + "' OR emailId='" + username + "';"
    DbConnection.query("SELECT password,accountStatus FROM userAuthentication WHERE userName=" + "'" + username + "' OR emailId='" + username + "';",
      async function (error, results, fields) {
        if (error) {
          console.log(error)
          throw new ErrorHandler(403, "Internal server error")
        } else {
          if (results.length > 0) {
            const comparision = await bcrypt.compare(password, results[0].password)
            //    const user = users.find(u => { return u.username === username && u.password === password });
            // const user = results.find(u=>{ return bcrypt.compare(password,u.password)});
            //console.log(user);
            if (comparision) {

              const accessToken = jwt.sign({ username }, accessTokenSecret, { expiresIn: '10000s' })

              const refreshToken = jwt.sign({ username }, refreshTokenSecret, { expiresIn: '10000s' })

              refreshTokens.push(refreshToken);
              console.log("Account Status: " + results[0].accountStatus);


              //Now Update User Account Status to active if his account was deactivated
              if (!results[0].accountStatus == 1)
                activateAccountMsg = ":Account is Re-Activated"
              DbConnection.query(ActivateAccountSql, (err, results) => {
                if (err) console.log(err)
                else
                  console.log("Account is Re-Activated")
              })
              console.log("ActiveMsg:" + activateAccountMsg)
              res.json({
                "status": 0,
                "message": "login successful" + activateAccountMsg,
                "data": [{ accessToken, refreshToken }]
              })
              next()
            }
            else {
              res.json({
                "status": 403,
                "message": "INTERNAL SERVER ERROR:Invalid Username or password",
                "data": [null]
              })
              // throw new ErrorHandler(403, "Internal Server Error:Invalid Username or password")
            }
          }
          else {
            res.json({
              "status": 403,
              "message": "INTERNAL_ERROR:Invalid User",
              "data": []
            })
          }
        }
      })
  }
  catch (err) {
    next(err)
  }
})
/*
//2.new user registration
router.post('/register', function (req, res, next) {
  let saltRounds = 3;
  const { username, password, firstname, lastname, emailid, gender, birthdate } = req.body;

  if (![username, password, firstname, lastname, emailid, gender, birthdate].every(Boolean)) {
    throw new ErrorHandler(403, "Bad Request:Invalid Values")
  }
  else
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) {
        console.log(password);
        console.log(hash);
        console.log(username);
        res.json({
          "status": 403,
          "message": "INTERNAL_ERROR:Internal server error",
          "data": [err]
        })
      }
      else {
        try {
          //removed mobile number attribute
          DbConnection.query("insert into userAuthentication(userName,password,accountStatus,numberOfAttempts,firstName,lastName,emailId,lastLoggedIn,gender,birthDate) values('" + req.body.username + "','" + hash + "','" + 1 + "','" + 3 + "','" + req.body.firstname + "','" + req.body.lastname + "','" + req.body.emailid + "','" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "','" + req.body.gender + "','" + req.body.birthdate + "')",
            async (err, result, fields) => {
              if (err) {
                console.log("Registration error", err)
                res.json({
                  "status": 403,
                  "message": "INTERNAL SERVER ERROR: " + ((err.sqlMessage.includes("emailId")) ? "USER ALREADY EXIST WITH SAME EMAIL" : (err.sqlMessage.includes("mobileNumber")) ? "USER ALREADY EXIST WITH SAME NUMBER" : "User already exists, Please try with different username"),
                  "data": [null]
                })
              }
              else {
                console.log(result);
                next()
                res.json({
                  "status": 0,
                  "message": "Registration successful.",
                  "data": [null]
                })
              }
            })
        }
        catch (err) {
          console.log("Catch log:" + err)
          next(err)
        }
      }
    })
})
*/

//2.new user registration
async function loginUsingFacebookOrGoogle(req, res, firstname, lastname, emailid, gender, birthdate, userid, logintype, imageurl, accesstoken, loginWith, next) {
  console.log("Generic Function")
  try {
    DbConnection.query("select userId,emailId from userAuthentication where userId = ? or accessToken = ?", [userid, accesstoken],
      async (err, result, fields) => {
        if (err) {
          console.log("error in db", err)
        }
        else {
          console.log("db result", result)

          if (result.length > 0) {

            console.log("userid and token present ,generate token for them", result)

            const { accessToken, refreshToken } = await GenerateGenericToken(req, res, emailid)
            refreshTokens.push(refreshToken)
            res.json({
              "status": 0,
              "message": "login successful using " + loginWith,
              "data": [{ accessToken, refreshToken }]
            })


          } else {
            console.log("user does not exist with these creds,creating new user")
            let sql = "insert into userAuthentication(accountStatus,numberOfAttempts,firstName,lastName,emailId,lastLoggedIn,gender,birthDate,userId,loginType,imageUrl,accessToken) values( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            DbConnection.query(sql, [1, 3, firstname, lastname, emailid, currentTime, gender, birthdate, userid, logintype, imageurl, accesstoken], async (err, result, fields) => {
              if (err) {
                //if user already exists in system with same emailid then merge its account by updating his/her userId loginType and access token
                if (err.sqlMessage.includes(emailid)) {
                  console.log("inside same merging account account ")
                  let sqlUpdate = "update userAuthentication SET accountStatus=1,loginType = ?, userId = ?,accessToken = ? where emailId = ?"

                  DbConnection.query(sqlUpdate, [logintype, userid, accesstoken, emailid], async (err, result) => {
                    if (err) {
                      console.log("error while murging account", err)
                    }
                    else if (result) {
                      console.log("after merging generate token for email id", result)
                      const { accessToken, refreshToken } = await GenerateGenericToken(req, res, emailid)
                      refreshTokens.push(refreshToken)
                      res.json({
                        "status": 0,
                        "message": "Account Merged and login successful using " + loginWith,
                        "data": [{ accessToken, refreshToken }]
                      })
                    }
                  })
                }
              } else {
                console.log("new user created ,now generate token for them", result)
                const { accessToken, refreshToken } = await GenerateGenericToken(req, res, emailid)
                refreshTokens.push(refreshToken)
                res.json({
                  "status": 0,
                  "message": "SignUp & login successful using " + loginWith,
                  "data": [{ accessToken, refreshToken }]
                })
              }
            })
          }
        }
      })
  }
  catch (err) {
    next(err)
    console.log("something went wrong in loginusingFbAndGoogle", err)
  }
}



router.post('/register', async (req, res, next) => {
  const saltRounds = 3;
  const { username, password, firstname, lastname, mobilenumber, emailid, gender, birthdate, userid, logintype, imageurl, accesstoken, emergencymobilenumber, emergencyemailid } = req.body;
  try {
    //facebook login
    if (logintype === 2) {
      const loginWith = "Facebook !"
      if (![firstname, lastname, emailid, gender, birthdate, userid, accesstoken].every(Boolean)) {
        throw new ErrorHandler(403, "Bad Request:Invalid Values")
      }
      const { data } = await verifyFacebookToken(req, res, userid, accesstoken)
      if (data) {
        console.log("token verified for ", data)
        loginUsingFacebookOrGoogle(req, res, firstname, lastname, emailid, gender, birthdate, userid, logintype, imageurl, accesstoken, loginWith, next);
      } else {
        throw new ErrorHandler(404, "Something Went Wrong While loggin using facebook");
      }
    }
    //google login
    else if (logintype === 3) {
      const loginWith = "Google !"

      if (![firstname, lastname, emailid, gender, birthdate, userid, accesstoken].every(Boolean)) {
        throw new ErrorHandler(403, "Bad Request:Invalid Values While google login")
      }
      const { data } = await verifyGoogleToken(req, res, accesstoken)
      console.log("verifygoogle token data", data)

      const { user_id } = data
      console.log("verified userid from google access token:", user_id, "& user id which is passed from android is:", userid)


      if (data && user_id === userid) {
        console.log(data.email + " is authorized user")
        loginUsingFacebookOrGoogle(req, res, firstname, lastname, emailid, gender, birthdate, userid, logintype, imageurl, accesstoken, loginWith, next);

      } else {
        console.log("userid doesnt match")
        throw new ErrorHandler(404, "Unauthorized user or token expired");
      }
    }
    //system login
    else {
      if (![password, firstname, lastname, emailid, gender, birthdate].every(Boolean)) {
        throw new ErrorHandler(403, "Bad Request:Invalid Values")
      } else
        bcrypt.hash(password, saltRounds, function (err, hash) {
          if (err) {
            res.json({
              "status": 403,
              "message": "INTERNAL_ERROR:Internal server error",
              "data": [err]
            })
          }
          else {
            try {
              let sql = "insert into userAuthentication(userName,password,accountStatus,numberOfAttempts,firstName,lastName,mobileNumber,emailId,lastLoggedIn,gender,birthDate,emergencyMobileNumber,emergencyEmailId) values(?,?,?,?,?,?,?,?,?,?,?,?,?)"
              DbConnection.query(sql, [username, hash, 1, 3, firstname, lastname, mobilenumber, emailid, currentTime, gender, birthdate, emergencymobilenumber, emergencyemailid],
                async (err, result, fields) => {
                  if (err) {
                    console.log("Registration error", err)
                    res.json({
                      "status": 403,
                      "message": "INTERNAL SERVER ERROR: " + ((err.sqlMessage.includes("emailId")) ? "USER ALREADY EXIST WITH SAME EMAIL" : "User already exists, Please try with different username"),
                      "data": [null]
                    })
                  }
                  else {
                    console.log(result);
                    next()
                    const { accessToken, refreshToken } = await GenerateGenericToken(req, res, emailid)
                    refreshTokens.push(refreshToken)
                    res.json({
                      "status": 0,
                      "message": "SignUp & login successful ",
                      "data": [{ accessToken, refreshToken }]
                    })
                  }
                })
            }
            catch (err) {
              console.log("Catch log:" + err)
              next(err)
            }
          }
        })
    }
  }
  catch (err) {
    console.log(err)
    next(err)
  }

})

//3.view profile after login
router.post('/viewProfile', authorizeUser, async (req, res, next) => {
  //console.log("req:", req)
  try {
    console.log("req.user:", await req.user)
    const { username, emailId } = await req.user;
    console.log("user:", username)
    console.log("emailId:", emailId)

    DbConnection.query("select userName,firstName,lastName,mobileNumber,emailId,gender,birthDate,emergencyMobileNumber,emergencyEmailId from userAuthentication where userName=" + "'" + username + "' OR emailId=" + "'" + username + "'", async (err, row) => {
      if (err) {
        console.log(err);
        res.json({
          "status": 404,
          "message": "INTERNAL_ERROR:Invalid User",
          "data": [err(err.sqlMessage.includes("userName")) ? "USER DOES NOT EXIST" : "INVALID USER"]
        })
      }
      else
        console.log(await row)
      //res.json( await row);
      next()
      res.json({
        "status": 0,
        "message": "View Profile successful.",
        "data": [await row]
      })
    })
  }
  catch (err) {
    next(err)
    //res.json("Something went wrong in view profile");
    res.json({
      "status": 403,
      "message": "INTERNAL_ERROR:Internal server error",
      "data": [err]
    })
  }
})


//4.refresh token adding after expiry
router.post('/token', (req, res, next) => {
  try {
    const { refreshtoken } = req.body;
    if (![refreshtoken].every(Boolean))
      //res.send( JSON.stringify( {"status": 403,"error":"NULL VALUES","response":null}));
      res.json({
        "status": 403,
        "message": "INTERNAL_ERROR:Null Values",
        "data": [null]
      })
    else
      console.log(req.body)
    if (!refreshtoken) {
      return res.sendStatus(401);
    }

    if (!refreshTokens.includes(refreshtoken)) {
      return res.sendStatus(403);
    }

    jwt.verify(refreshtoken, refreshTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      console.log("user:")
      console.log(user.username)
      const username = user.username;
      const accessToken = jwt.sign({ username }, accessTokenSecret, { expiresIn: '180m' });

      next()
      res.json({
        "status": 0,
        "message": "Tokens Generated successfully.",
        "data": [{ accessToken }]
      })
    });
  }
  catch (err) {
    next(err)
    /*res.json({
      "status": 403,
      "message": "INTERNAL_ERROR:Internal server error",
      "data": [{err}]
     })*/
  }
});


//5.Dynamic update profile
router.post('/updateProfile', authorizeUser, async (req, res, next) => {
  let saltRounds = 3, count = 1;
  let objects = { username, firstname, lastname, mobilenumber, gender, emailid, birthdate, emergencymobilenumber, emergencyemailid } = await req.body
  try {
    if (isEmpty(objects) || isNil(objects)) {
      throw new ErrorHandler(403, "Bad Request:Empty Values")
    }
    else if (objects.username || objects.firstname || objects.lastname || objects.mobilenumber || objects.gender || objects.emailid || objects.birthdate || objects.emergencymobilenumber || objects.emergencyemailid) {
      console.log(objects)
      let dynamicSql = "update userAuthentication SET accountStatus=1"

      let response = ""

      if (objects.username) {
        dynamicSql += ",userName=" + "'" + username + "'"
        response += "Re-loging with your updated username:"
        count++;
        if (count > 1)
          response = "Cannot Update,please login again"
      }
      /*
      Password Update:Created another API for same
        if(objects.password)
        bcrypt.hash(password , saltRounds,(err,hash)=>{
          if(err) throw err
          else
          dynamicSql+=",password="+"'"+hash+"'"
        })
        */
      if (objects.firstname)
        dynamicSql += ",firstName=" + "'" + firstname + "'"

      if (objects.lastname)
        dynamicSql += ",lastName=" + "'" + lastname + "'"

      if (objects.mobilenumber)
        dynamicSql += ",mobileNumber=" + "'" + mobilenumber + "'"

      if (objects.gender)
        dynamicSql += ",gender=" + "'" + gender + "'"

      if (objects.emailid) {
        dynamicSql += ",emailId=" + "'" + emailid + "'"
        response = "Re-loging with your updated emailid:"
        count++;
        if (count > 1)
          response = "Cannot Update Email again,please login again with new email"
      }

      if (objects.birthdate)
        dynamicSql += ",birthDate=" + "'" + birthdate + "'"

      if (objects.emergencymobilenumber)
        dynamicSql += ",emergencyMobileNumber=" + "'" + emergencymobilenumber + "'"

      if (objects.emergencyemailid)
        dynamicSql += ",emergencyEmailId=" + "'" + emergencyemailid + "'"



      console.log(req.user.username)
      // const{ userName }=await req.user;
      dynamicSql += " where userName=" + "'" + req.user.username + "' OR emailId='" + req.user.username + "';"
      console.log(dynamicSql)

      DbConnection.query(dynamicSql,
        async (err, result, fields) => {
          if (err) {
            // res.send( JSON.stringify( {"status": 403,"error":err,"response":null}));
            console.log("update query error:", err)
            res.json({
              "status": 403,
              "message": "INTERNAL_ERROR:" + ((err.sqlMessage.includes("emailId")) ? "USER ALREADY EXIST WITH SAME EMAIL" : (err.sqlMessage.includes("mobileNumber")) ? "USER ALREADY EXIST WITH SAME NUMBER" : "User already exists, Please try with different username or DB failure"),
              "data": [null]
            })
          }
          console.log(result);
          next()
          res.json({
            "status": 0,
            "message": "User Updated Successfully:" + response,
            "data": []
          })
        })
    }
    else {
      res.json({
        "status": 403,
        "message": "BAD_REQUEST : Null request",
        "data": ["Null Request"]
      })
    }
  }
  catch (err) {
    next(err)
  }
})

//6.Update Password
router.post("/newPassword", authorizeUser, async (req, res, next) => {
  try {
    let saltRounds = 3;
    const username = req.user.username;
    const { oldpassword, newpassword } = req.body
    if (![oldpassword, newpassword].every(Boolean))
      throw new ErrorHandler(403, "Bad Request:Empty Values")
    else
      DbConnection.query("SELECT password from userAuthentication where username=" + "'" + username + "'OR emailId='" + username + "';", async (err, results) => {
        if (err) {
          throw new ErrorHandler(403, "Internal Server Error")
        }
        else {
          if (results.length > 0) {
            const comparision = await bcrypt.compare(oldpassword, results[0].password)
            console.log(comparision)
            if (comparision) {
              bcrypt.hash(newpassword, saltRounds, (err, hash) => {
                if (err) throw err
                else
                  DbConnection.query("Update userAuthentication SET password=" + "'" + hash + "' where userName='" + username + "'OR emailId='" + username + "';", (err, result) => {
                    if (err) console.log(err)
                    else
                      next()
                    res.json({
                      "status": 0,
                      "message": "Password Updated Successfully",
                      "data": [null]
                    })
                  })
              })
            }
            else
              res.json({
                "status": 403,
                "message": "INTERNAL SERVER ERROR:Old Password Does not match",
                "data": [null]
              })
          }
          else
            res.json({
              "status": 403,
              "message": "INTERNAL SERVER ERROR:Old Password Does not match.",
              "data": [null]
            })
        }
      })
  }
  catch (err) {
    console.log(err)
    next(err)
  }
})

//7.delete profile
router.post("/deleteProfile", authorizeUser, (req, res) => {
  const username = req.user.username;
  if (isEmpty(username))
    res.send(403)
  else
    try {
      DbConnection.query("update userAuthentication SET accountStatus = 0 where userName='" + username + "' OR emailId='" + username + "';", (err, results) => {
        if (err)
          res.json({
            "status": 403,
            "message": "INTERNAL SERVER ERROR:Database Failure",
            "data": []
          })
        else
          res.json({
            "status": 0,
            "message": "account deleted successfully",
            "data": [null]
          })
      })
    }
    catch (err) {
      console.log(err)
      res.json({
        "status": 403,
        "message": "INTERNAL SERVER ERROR",
        "data": [null]
      })
    }
})

//test mail using mailgun
router.post('/mail', async (req, res, next) => {
  const { recipient, message } = req.body;

  const msg = {
    subject: "Subject Given in const msg Object",
    text: message
  }

  try {
    await sendEmail(recipient, msg);
    res.json({ message: 'Your query has been sent' });
    await next();
  } catch (e) {
    await next(e);
  }
});

//8.verify email id x forgot password
router.post('/forgotPassword', async (req, res, next) => {
  try {
    const emailid = req.body.emailid;
    if (isEmpty(emailid) || isNil(emailid))
      throw new ErrorHandler(403, "Bad Request:Empty Values")
    else
      console.log("EmailID :" + emailid)
    let SQL = "select emailId from userAuthentication where emailId = ?"
    DbConnection.query(SQL, [emailid], async (err, results) => {
      if (err) console.log(err)
      else {
        if (!isEmpty(results[0])) {
          console.log(results[0].emailId)

          const emailId = results[0].emailId
          console.log(emailId)

          const token = jwt.sign({ emailId }, accessTokenSecret, { expiresIn: '7200s' })

          //let hidden="<form id='myHiddenFormId' action='myAction.php' method='post' style='display: none'>    <input type='hidden' name='myParameterName' value='myParameterValue></form>"
          //let HtmlLink = `<a href="http://172.31.2.83:3000/user/v1/resetPassword/${token}">here</a>`

          let link = "http://" + req.get('host') + "/user/v1/resetPassword";


          console.log("hyperlink:" + link)
          let formHtmlPostLink = "Click on <form method='post' action='" + link + "'>    <input type='hidden' name='bearer' value='" + token + "'> <button type='submit' name='submit_param' value='submit_value' class='link-button'>      Reset Password         </button>       </form> for new password"

          let hrefLink = link + "?token=" + token

          var message = {
            subject: 'Forgot Account Link',
            //cc: 'anikettikone99@gmail.com',
            html: "Hello  " + emailId.slice(0, emailId.length - 10) + '<br></br> Please click below to reset your password for Samsung Health <br></br>' + hrefLink,
            text: '<br></br>This link will expire in 30 mins'
          }


          try {
            const recipient = results[0].emailId;
            //await sendEmail(recipient, message); mailgun
            await sendEmailByNodemailer(recipient, message) //nodemailer
            next()
          }
          catch (err) {
            console.log("ERROR::" + err)
            next(err)
          }
          res.json({
            "status": 0,
            "message": "Email Sent successfully",
            "data": [null]
          })
        }
        else
          res.json({
            "status": 403,
            "message": "INTERNAL SERVER ERROR: Email not found",
            "data": []
          })
      }
    })
  }
  catch (err) {
    console.log(err)
    next(err)
  }

})


//9.using this as a resetPassword Link inside of mail in forgotPasswordApi
router.get("/resetPassword", async (req, res, next) => {
  console.log(req)
  const bearer = req.query.token
  console.log("Bearer:" + req.query.token)
  console.log(bearer)
  let user
  let emailid;
  try {
    if (bearer) {

      user = await verifyToken(bearer, accessTokenSecret)//EmailAuthorization Promise
      console.log("Authorised USer:" + user.emailId)
      console.log(user)

      let setNewPasswordLink = "http://" + req.get('host') + "/user/v1/setNewPasswordForm";

      let setNewPasswordForm = "<form method='post' action='" + setNewPasswordLink + "'>   <input type='text' name='password'> <input type='hidden' name='bearer' value='" + bearer + "' style='display: none';> <button type='submit' name='submit_param' class='link-button'>      Set New Password         </button>       </form>"
      next()
      let emailidSlice = user.emailId
      console.log("Email SLice", emailidSlice)

      // let username = await emailidSlice.slice(0, emailidSlice - 10)
      let username = emailidSlice
      console.log("Username set", username)

      await res.render("ForgotPassword.ejs", { username, setNewPasswordLink, bearer })

    }
    else {
      res.send("not submitted")
    }
  }
  catch (err) {
    console.log(err)
    next(err)
  }
})
//10. after setting up new password from email form,verify that links athentication and save password
router.post("/setNewPasswordForm", async (req, res, next) => {
  const saltRounds = 3
  const bearer = req.body.bearer
  const newpassword = req.body.password
  try {
    if (newpassword && bearer) {
      user = await verifyToken(bearer, accessTokenSecret)

      bcrypt.hash(newpassword, saltRounds, (err, hash) => {
        if (err) throw err
        else
          DbConnection.query("Update userAuthentication SET password=" + "'" + hash + "' where emailId='" + user.emailId + "';", (err, result) => {
            if (err) console.log(err)
            else
              res.send("new password is set,please login again with new password")
            next()
          })
      })
    }
    else {
      res.json({
        "status": 403,
        "message": "Internal Server Error",
        "data": [null]
      })
    }
  }
  catch (err) {
    console.log("ERROR::" + err)
    next(err)
  }
})

//11.to send emergency email to emergency contacts
router.post("/emergencyCall", authorizeUser, async (req, res, next) => {
  try {
    const { message, location } = req.body
    const { username } = req.user
    if (isEmpty(message) || isNil(message)) {
      throw new ErrorHandler(403, "Internal Servr Error:Bad Request")
    }
    try {
      DbConnection.query("select firstName,lastName,emailId,mobileNumber,emergencyMobilenumber,emergencyEmailId from userAuthentication where userName = ? OR emailId = ?", [username, username], async (err, results, fields) => {
        if (err) {
          console.log("DB Error:", err)
          //throw new ErrorHandler(403, "Internal Server Error " + err)
        }
        else if (!isEmpty(results) || !isNil(results)) {
          let mailBody = {
            subject: 'Alert !! Im in Emergency',
            cc: results[0].emailId,
            html: "ALERT !! Hey Im " + results[0].firstName + " " + results[0].lastName + " I'm in Emergency Reach me ASAP !!<br>My Contact Number: " + results[0].mobileNumber + "<br> Reason:" + message,
            //text: '<br></br>You can reach me here at this location: ' + location
            text: location ? "<br>My Current Location:" + location : "<br>My Current Location:NA"
          }
          try {
            const recipient = results[0].emergencyEmailId;
            console.log("Emergency Email sent to:", recipient)
            let isMailSent = await sendEmailByNodemailer(recipient, mailBody) //nodemailer
            //console.log("Line 839", results)
            if (isMailSent) {
              next()
              res.json({
                "status": 0,
                "message": "Email Sent successfully",
                "data": [null]
              })
            } else throw ErrorHandler(403, "Connection error")
          }
          catch (err) {
            console.log("ERROR::" + err)
            next(err)
          }
        }
      })
    } catch (err) { next(err) }
    // res.json(await req.user)
  } catch (err) {
    console.log("emergency call error", err)
    next(err)
  }
})



module.exports = router;
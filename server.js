const express = require('express');
const app = express();
const path = require('path');


const { handleError } = require("./ErrorHandler/error")

//const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

//database module 
const DbConnection = require('./Database/DbConnection')

//user routes
const userRoutes = require('./Routes/UserRoutes');

//sometimes post body is undefined hence
const cors = require('cors');
app.use(cors())

//accessToken to athenticate server
//const accessTokenSecret = 'youraccesstokensecret';

//refresh tokens
//const refreshTokenSecret = 'yourrefreshtokensecrethere';
//const refreshTokens = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.set('view engine', 'ejs');

// Require static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set 'views' directory for any views 
// being rendered res.render()
app.set('views', path.join(__dirname, 'views'));

// Set view engine as EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


app.use("/user/v1/", userRoutes);

app.listen(3000, () => {
    console.log('Authentication service started on port 3000');
});

//middleware for api consol-log
app.use(async (err, req, res, next) => {
    console.log("Fired this api:->: %s %s ", await req.url, await req.meth)
    handleError(err, res);
    // next()

})


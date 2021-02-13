const express = require("express")
const app   =   express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

//sometimes post body is undefined hence
const cors = require('cors');
app.use(cors())

app.listen(3000, () => {
    console.log('Authentication service started on port 3000');
});



app.get("/link",(req,res)=>{
    let token = 124578
   let link="http://"+req.get('host')+"/postmethod";
    console.log("hyperlink:"+link)
    let formHtmlPostLink="<!DOCTYPE html><html><body><form method='post' action='"+link+"'>    <input type='text' name='bearer'><button type='submit' name='submit_param' value='submit_value' class='link-button'>      Reset Password         </button>       </form></body></html>"
    res.send(formHtmlPostLink)
})
app.post("/postmethod",(req,res)=>{
    console.log(req.body.bearer)
    console.log(req.body.test)
    res.send(req.body)
})
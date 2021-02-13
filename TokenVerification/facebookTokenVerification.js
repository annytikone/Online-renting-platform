//to verify facebook token ,when user logs in from facebook sdk

const axios = require('axios');
const { response } = require('express');
exports.verifyFacebookToken = async (req, res, userId, fbToken) => {
    let settings = { method: "GET" };
    let fburl = "https://graph.facebook.com/" + userId + "?access_token=" + fbToken

    // console.log("URL is", fburl)

    return axios(fburl,
        settings)
        .then(response => {
            //  console.log("Facebook response", response)
            return response
        }).catch(err => {
            res.json({
                "status": 404,
                "message": "Unauthorized user or Token expired",
                "data": [null]
            })
            console.log("Facebook error", err)
        })
};
//module.export = verifyFacebookToken;
// to verify login using googl's access token
const axios = require('axios')

exports.verifyGoogleToken = (req, res, googleAccessToken) => {
    let googleUrl = "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + googleAccessToken
    let settings = { method: "GET" };

    return axios(googleUrl, settings).then(response => {
        console.log("google token response", response)
        return response;
    }).catch(err => {
        res.json({
            "status": 404,
            "message": "Unauthorized user or Token expired",
            "data": [null]
        })

    })
}

const jwt = require('jsonwebtoken')
//accessToken to athenticate server
const accessTokenSecret = 'youraccesstokensecret';
//refresh tokens
const refreshTokenSecret = 'yourrefreshtokensecrethere';

exports.GenerateGenericToken = (req, res, username) => {

    const accessToken = jwt.sign({ username }, accessTokenSecret, { expiresIn: '10000s' })

    const refreshToken = jwt.sign({ username }, refreshTokenSecret, { expiresIn: '10000s' })

    return { accessToken, refreshToken }
    /*
    res.json({
        "status": 0,
        "message": "login successful",
        "data": [{ accessToken, refreshToken }]
    })*/

}
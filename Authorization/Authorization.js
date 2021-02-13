const jwt = require('jsonwebtoken');
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Auth header: " + authHeader)
    const accessTokenSecretAuthorization = 'youraccesstokensecret';
    if (authHeader) {

        const token = authHeader.split(' ')[1];

        jwt.verify(token, accessTokenSecretAuthorization, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            console.log("authenticating :", user)
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};
module.exports = authenticateJWT;
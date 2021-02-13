const jwt=require('jsonwebtoken');

exports.verifyToken = (token,accessTokenSecret)=>
    new Promise((resolve,reject)=>{

        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                return reject(err)
            }
        
            console.log("Authenticating user:")
            console.log(user)
            return resolve(user)
        });

    })
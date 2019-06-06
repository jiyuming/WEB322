// setting up mongoose
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

// defining userSchema
var userSchema = new Schema ({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String 
    }] 
});

let User;

// Iitialize()
module.exports.Initialize = () => {
    return new Promise((resolve, reject) => {
        let pass1 = encodeURIComponent("pa$$word1");
        let db = mongoose.createConnection("***");
        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open', ()=>{
            User = db.model("users", userSchema);
            resolve("Connection Successfull");
        });
    });
}

module.exports.RegisterUser = (userData) => {
    return new Promise((resolve, reject) => {
        if(userData.password != userData.password2) {
            reject("Passwords do not match");}
        else{
            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(userData.password, salt, function(err, hash) {
                    if(err) {reject("There was an error encrypting the password");}
                    else{
                        userData.password = hash;
                        let newUser = new User(userData);
                        newUser.save((err) => {
                            if(err){
                                if(err === 11000){reject("User Name already taken");}
                                else if (err != null && err != 11000){reject("There was an error creating the user: " +err)}
                            }
                            else{resolve()}
                        })
                    }
                });
            });
        }
    });
}

module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({userName: userData.userName}).exec()
            .then((users) =>{
                if(users.length == 0){
                    reject("Unable to find user: "+userData.userName);
                }
                else{
                    bcrypt.compare(userData.password, users[0].password).then((res) => {
                        if(res === true){   
                            users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                            User.update(
                                {userName: users[0].userName},
                                {$set: {loginHistory: users[0].loginHistory}},
                                {multi: false}
                            ).exec()
                            .then(() => {resolve(users[0])})
                            .catch((err) => {reject("There was an error verifying the user: " +err)})
                        }
                        else{
                            reject("Incorrect Password for user: " +userData.userName); 
                        }
                    });
                }
            })
            .catch(() => { 
                reject('Unable to find user: '+userData.userName); 
            }) 
    });
}
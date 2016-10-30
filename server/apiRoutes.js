import express from 'express'
var studentController = require('../modules/studentController');
var User   = require('../modules/user'); // get our mongoose model
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens


module.exports = function(app) {
    var apiRoutes = express.Router();

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
    apiRoutes.post('/authenticate', function (req, res) {
        // find the user
        User.findOne({
            name: req.body.name
        }, function (err, user) {
            if (err) throw err;

            if (!user) {
                res.json({success: false, message: 'Authentication failed. User not found.'});
            } else if (user) {

                // check if password matches
                if (user.password != req.body.password) {
                    res.json({success: false, message: 'Authentication failed. Wrong password.'});
                } else {

                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn: 1440 // expires in 24 hours
                    });

                    //add cookie to header
                    //res.writeHead(200);
                    res.cookie('access_token', token, {maxAge: 300000});

                    //TO DO: for logout route make: 'Set-Cookie': ////

                    // return the information including token as JSON
                    res.end(JSON.stringify({
                        username: user.username,
                        success: true,
                        message: 'Enjoy your token!',
                        token: token,
                        user: req.body.name
                    }));
                }
            }
        });
    });

//logout route


//apiRoutes.delete('/deleteStudents', studentController.deleteStudent);
//apiRoutes.get('/findStudents', studentController.findStudent);
//apiRoutes.put('/updateStudents', studentController.updateStudent);

//route middleware to verify a token
    apiRoutes.use(function (req, res, next) {
        console.log('testing')
        // check header or url parameters or post parameters for token
        var token = req.cookies.access_token || req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, app.get('superSecret'), function (err, decoded) {
                if (err) {
                    return res.json({success: false, message: 'Failed to authenticate token.'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    req.username = decoded._doc.name
                    next();
                }
            });

        } else {

            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });

        }
    });

    apiRoutes.get('/authenticated', function (req, res) {
        res.json({
            loggedIn: true,
            user: req.username
        })
    })

    apiRoutes.post('/logout', function (req, res) {
        //add cookie to header
        res.writeHead(200, {'Set-Cookie': ""});
        // return the information including token as JSON
        res.end(JSON.stringify({
            success: false,
            message: 'Logged out!'
        }));
    });

    apiRoutes.post('/newStudents', studentController.newStudent);
    apiRoutes.get('/showAllStudents', studentController.showAllStudents);


// route to show a random message (GET http://localhost:8080/api/)
    apiRoutes.get('/', function (req, res) {
        res.json({message: 'Welcome to the coolest API on earth!'});
    });

// route to return all users (GET http://localhost:8080/api/users)
    apiRoutes.get('/users', function (req, res) {
        User.find({}, function (err, users) {
            res.json(users);
        });
    });

    return apiRoutes;

}
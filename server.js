var express = require('express');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var fs = require("fs");
var moment = require('moment');

var app = express();
var sessionMap = {};
var exiryTime = 60*1000; // 60 seconds Time in milliseconds
// must use cookieParser before expressSession
app.use(cookieParser());

app.use(expressSession({secret:'yoursecret', cookie:{maxAge:60000}}));

app.use(bodyParser());

app.get('/listUsers', function (req, res) {
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       console.log( data );
       res.end( data );
   });
})

app.get('/', function(req, res){

var html = "<h1>How to use the query params::</h1><br/><br/>" + 
			"<h2> Check for login:: usage :: http://localhost/doLogin?user=garima&password=bhatia <br/>" +
			"Check if session is active :: usage :: http://localhost/isSessionActive?user=garima <br/>" + 
			"To logout the user :: usage :: http://localhost/doLogout?user=garima<br/>";
  
if (req.session.userName) {
    html += '<br>Your username from your session is: ' + req.session.userName;
    if (req.session.password) {
	    html += '<br>Your password from your session is: ' + req.session.password;
	}
}
res.send(html);
});

app.get('/doLogin', function(req, res){
  req.session.userName = req.query.user;
  req.session.password = req.query.password;
  if (req.session.userName) {
    if (req.session.password) {
    	const uuidV1 = require('uuid/v1');
    	var username = req.session.userName;
	    var user = {"userName": req.session.userName,
	    			"password" : req.session.password,
	    			"sessionId": uuidV1(), 
	    			"currentTime" : new Date()
	    		   };
	   	console.log("user data:: " + JSON.stringify(user));
	    fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
	       console.log("Reading file");
	       if(data){
	       	data = JSON.parse( data );
	       } else {
	       	data = {};
	       	data[username] = user;
	       }
	       if(data[req.session.userName]){
	       	res.status(409).send('User already exist');
	       } else {
	       	data[req.session.userName] = user;
	       }
	       //data = user;
	       console.log("data to write to file ::" + JSON.stringify(data));
	       res.end( JSON.stringify(data));
	       fs.writeFile('users.json', JSON.stringify(data), function (err) {
			    if (err) 
			        return console.log(err);
			});
	    });
	}
  }
  res.redirect('/doLogin');
});

app.get('/isSessionActive', function(req, res){
	var user = req.query.user;
	console.log(req.query);
	
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
	       console.log("Reading file");
	       if(data){
	       	data = JSON.parse( data );
	       	console.log("Data read :: " + data);
	       	console.log("User ::" + user);
	       	if(data[user]){
	       		console.log("User is available:: Need to determine its session time");
	       		var userTime = data[user].currentTime;
	       		var then = moment(userTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ");
				var now = moment();

				var diff = moment.duration(then.diff(now));
				if (diff < 0) {
				    diff = Math.abs(diff);
				}
				if(diff > exiryTime){
					res.status(404).send('Not Found')
				}
				var d = moment.utc(diff).format("HH:mm:ss:SSS");
				console.log("Difference: " + d);
	       	} else {
	       		res.status(404).send('Not Found');
	       	}
	       } else {
	       	console.log("File not found");
	       }
	    });
  	//res.status(200).send('Ok');
});

app.get('/doLogout', function(req, res){
	var user = req.query.user;
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       console.log("Reading file");
        if(data){
	        data = JSON.parse( data );
	        if(data[user]){
		       	delete data[user];
		       	req.session.destroy();
		        fs.writeFile('users.json', JSON.stringify(data), function (err) {
				    if (err) {
						res.status(500).send('Internal Server Error');    	
				    	return console.log(err);
					} else{
						console.log("Success");
						res.status(200).send('You have been logged out');
					}
				});
	    	} else {
	    		console.log("Success");
	    		res.status(200).send('You have been logged out');
	    	}
   		} else {
   			console.log("Success");
	       	res.status(200).send('ok');
   		}
    });
	
  	//res.send(html);
});

app.listen(80);
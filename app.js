'use strict';

var express = require('express'),
  app = express(),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend,
  fs = require('fs'),
  meetup = require("meetup-api") ({
      key: '<YOUR-KEY>'
  }),
  traitsMap = fs.readFileSync('personality traits_op.txt');
  traitsMap = JSON.parse(traitsMap);

var path = require('path');
var swig = require("swig");

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'swig');

// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var credentials = extend({
    version: 'v2',
    url: 'https://gateway.watsonplatform.net/personality-insights/api',
    username: '<YOUR-USERNAME>',
    password: '<YOUR-PASSWORD>'
}, bluemix.getServiceCreds('personality_insights')); // VCAP_SERVICES

// Create the service wrapper
var personalityInsights = watson.personality_insights(credentials);

// render index page
app.get('/', function(req, res) {
  res.render('index.html', { content: ""});
});

app.post('/', function(req, res) {
  personalityInsights.profile(req.body, function(err, profile) {
    if (err) {
      if (err.message){
        err = { error: err.message };
      }
      return res.status(err.code || 500).json(err || 'Error processing the request');
    }
    else {
        var perArr = profile['tree']['children'][0]['children'][0]['children'][0]['children'];
        perArr.sort(function(a, b) {
            return b['percentage'] - a['percentage'];
        });
        var traits = [];
        for(var i = 0; i < 3; i++) {
            traits.push(perArr[i]["name"]);
        }
        getMeetupRecos(traits,traitsMap,res);
    }
  });
  //  var profile = JSON.parse(fs.readFileSync('sampleip.txt'));
  //  var perArr = profile['tree']['children'][0]['children'][0]['children'][0]['children'];
  //  perArr.sort(function(a, b) {
  //      return b['percentage'] - a['percentage'];
  //  });
  //  var traits = [];
  //  for(var i = 0; i < 3; i++) {
  //      traits.push(perArr[i]["name"]);
  //  }
  //  getMeetupRecos(traits,traitsMap,res);
});

function getMeetupRecos(traits, traitsMap, res) {
    var categories = "";
    for(var i = 0; i < traits.length; i++) {
        if(traitsMap[traits[i]])
            categories = categories + traitsMap[traits[i]] + ",";
    }
    categories = categories.substring(0,categories.length - 1);
    meetup.getOpenEvents({category: '2'}, function(err, resp) {
        if(err) {
            if (err.message){
                err = { error: err.message };
            }
            console.log(err);
            return res.status(err.code || 500).json(err || 'Error processing the request');
        }
        else {
            console.log(resp);
            res.json(resp.results);
        }

    });
}

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);

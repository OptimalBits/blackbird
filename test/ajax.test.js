var express = require('express');
var http = require('http');
var request = require('request');

var app = express();
app.use(express.bodyParser());

var listeners = [];
app.post('/msg', function(req, res){
  var data = req.body.data;
  listeners.forEach(function(listener){
    listener.call(null, data);
  });
  res.end();
});

var transport = {
  send: function(data){
    request.post({
      uri:'http://localhost:8999/msg',
      headers: {'content-type' : 'application/json'},
      body:    JSON.stringify({data: data})
    });
  },
  listen: function(fn){
    listeners.push(fn);
  }
};

before(function(done){
  http.createServer(app).listen(8999, done);
});

beforeEach(function(){
  listeners = [];
});

var tests = require('./test-cases');
tests(transport);

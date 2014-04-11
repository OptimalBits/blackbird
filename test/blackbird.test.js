var express = require('express');
var http = require('http');
var request = require('request');

var listeners = [];
function emit(data){
  listeners.forEach(function(listener){
    listener.call(null, data);
  });
}

var transport = {
  send: function(data){
    setTimeout(function(){
      emit(data);
    },0);
  },
  listen: function(fn){
    listeners.push(fn);
  }
};

beforeEach(function(){
  listeners = [];
});

var tests = require('./test-cases');
tests(transport);

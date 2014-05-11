var blackbird = require('../lib/blackbird');
var should = require('chai').should();
var express = require('express');
var _ = require('underscore');
var http = require('http');
var request = require('request');
var Promise = require('bluebird');

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


describe('Promises', function () {
  it('resolved promise', function(done) {
    var targetItf = {
      fn1: function(){
        return new Promise(function(resolve){
          resolve();
        });
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(){
      done();
    });
  });

  it('resolved promise with value', function(done) {
    var targetItf = {
      fn1: function(){
        return new Promise(function(resolve){
          resolve(1);
        });
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      val.should.equal(1);
      done();
    });
  });

  it('rejects promise', function(done) {
    var targetItf = {
      fn1: function(){
        return new Promise(function(resolve, reject){
          reject('dummy');
        });
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      true.should.equal(false);
    }, function(err){
      err.should.be.defined;
      done();
    });
  });

  it('rejects promise without content', function(done) {
    var targetItf = {
      fn1: function(){
        return new Promise(function(resolve, reject){
          reject();
        });
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      done('should be rejected');
    }, function(err){
      done();
    });
  });

  it('missing fn should reject promise', function(done) {
    var targetItf = {
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      true.should.equal(false);
    }, function(err){
      err.should.be.defined;
      done();
    });
  });

  it('thrown exception should reject promise', function(done) {
    var targetItf = {
      fn1: function(){
        throw new Error('dummy');
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      true.should.equal(false);
    }, function(err){
      err.should.equal('dummy');
      done();
    });
  });

  it('should promisify returned values', function(done) {
    var targetItf = {
      fn1: function(){
        return 'test';
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      val.should.equal('test');
      done();
    });
  });

  it('should work for returned promises', function(done) {
    var targetItf = {
      fn1: function(){
        return new Promise(function(resolve){
          setTimeout(_.partial(resolve, 'test'), 1);
        });
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      val.should.equal('test');
      done();
    });
  });

  it('should work for promises returning promises', function(done) {
    var targetItf = {
      fn1: function(){
        return Promise.all([
          Promise.delay('delayed', 2),
          Promise.delay('delayed2', 1),
          new Promise(function(resolve){
            Promise.delay('xxx', 3).then(resolve);
          }).then(function(){
            return 'delayed3';
          })
        ]);
      }
    };
    var sourceItf = {
      fn1: function(){}
    };

    blackbird({}, sourceItf, transport);
    blackbird(targetItf, {}, transport);
    sourceItf.fn1().then(function(val){
      val.length.should.equal(3);
      val[2].should.equal('delayed3');
      done();
    });
  });

  it('should work for complex flows', function(done) {
    var inItf1 = {
      fn2: function(){
        return Promise.delay('fn2', 2);
      }
    };
    var outItf1 = {
      fn1: function(){}
    };

    var inItf2 = {
      fn1: function(){
        return Promise.delay(1).then(function(){
          return outItf2.fn2(); // call back to other endpoint
        });
      }
    };
    var outItf2 = {
      fn2: function(){}
    };

    blackbird(inItf1, outItf1, transport);
    blackbird(inItf2, outItf2, transport);
    outItf1.fn1().then(function(val){
      val.should.equal('fn2');
      done();
    });
  });

  it('should work with interfaces with many functions', function(done) {
    var inItfPerson = {
      getName: function(){
        return this._name;
      },
      setName: function(name){
        this._name = name;
        return true; // indicates that were done
      }
    };
    var outItfPerson = {
      getName: function(){},
      setName: function(){}
    };


    blackbird({}, outItfPerson, transport);
    blackbird(inItfPerson, {}, transport);
    outItfPerson.setName('Adam').then(function(){
      outItfPerson.getName().then(function(name){
        name.should.equal('Adam');
        done();
      });
    });
  });
});

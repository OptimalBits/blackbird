var blackbird = require('../lib/blackbird');
var should = require('chai').should();

module.exports = function(transport){
  describe('blackbird', function () {
    it('remote function called', function(done) {
      var targetItf = {
        fn: function(){
          done();
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn();
    });

    it('remote function call one arg', function(done) {
      var targetItf = {
        fn: function(a){
          a.should.equal(1);
          done();
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(1);
    });

    it('remote function call many args', function(done) {
      var targetItf = {
        fn: function(a, b, c, d){
          a.should.equal(1);
          b.should.equal('2');
          c.x.should.equal(3);
          d.should.equal(true);
          if(a === 1 && b === '2' && c.x === 3 && d === true) done();
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(1, '2', {x:3}, true);
    });

    it('callback is called after remote ack', function(done) {
      var called = false;
      var targetItf = {
        fn: function(cb){
          called = true;
          cb();
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(){
        called.should.equal(true);
        done();
      });
    });

    it('callback is called after remote nack', function(done) {
      var called = false;
      var targetItf = {
        fn: function(cb){
          called = true;
          cb('error');
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(err){
        called.should.equal(true);
        err.should.equal('error');
        done();
      });
    });

    it('callback with one arg', function(done) {
      var targetItf = {
        fn: function(cb){
          cb(null, 1);
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(err, a){
        a.should.equal(1);
        done();
      });
    });

    it('callback with many args', function(done) {
      var targetItf = {
        fn: function(cb){
          cb(null, 1,'2', {x:3});
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(err, a, b, c){
        a.should.equal(1);
        b.should.equal('2');
        c.x.should.equal(3);
        done();
      });
    });

    it('returned value should be shorthand for calling callback', function(done) {
      var targetItf = {
        fn: function(cb){
          return {a: 1, b: '2'};
        }
      };
      var sourceItf = {
        fn: function(){}
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(err, val){
        val.a.should.equal(1);
        val.b.should.equal('2');
        done();
      });
    });

    it('right function is called in right order', function(done) {
      var str = '';
      var targetItf = {
        fn: function(cb){
          str += '1';
          cb();
        },
        fn2: function(cb){
          str += '2';
          cb();
        },
        fn3: function(cb){
          str += '3';
          cb();
        },
      };
      var sourceItf = {
        fn: function(){},
        fn2: function(){},
        fn3: function(){},
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(){
        sourceItf.fn2(function(){
          sourceItf.fn3(function(){
            str.should.equal('123');
            done();
          });
        });
      });
    });

    it('undefined function call should generate error', function(done) {
      var targetItf = {
        fn2: function(cb){
          cb();
        },
      };
      var sourceItf = {
        fn: function(){},
        fn2: function(){},
      };

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);
      sourceItf.fn(function(err){
        should.exist(err);
        sourceItf.fn2(function(err){
          should.not.exist(err);
          done();
        });
      });
    });

    it('circular json should generate an error', function(done) {
      var targetItf = {
        fn: function(a, cb){
          true.should.equal(false);
        },
      };
      var sourceItf = {
        fn: function(){},
      };

      var circular = {};
      circular.x = circular;

      blackbird({}, sourceItf, transport);
      blackbird(targetItf, {}, transport);

      sourceItf.fn(circular, function(err){
        should.exist(err);
        done();
      });
    });

    it('should work for complex flows', function(done) {
      var inItf1 = {
        fn2: function(prefix, cb){
          outItf1.fn3(prefix, cb); // call back to other endpoint
        },
        fn4: function(prefix, cb){
          return prefix+'-fn4';
        }
      };
      var outItf1 = {
        fn1: function(){},
        fn3: function(){}
      };

      var inItf2 = {
        fn1: function(prefix, cb){
          outItf2.fn2(prefix, cb); // call back to other endpoint
        },
        fn3: function(prefix, cb){
          outItf2.fn4(prefix, cb); // call back to other endpoint
        }
      };
      var outItf2 = {
        fn2: function(){},
        fn4: function(){}
      };

      blackbird(inItf1, outItf1, transport);
      blackbird(inItf2, outItf2, transport);
      outItf1.fn1('pref', function(err, val){
        val.should.equal('pref-fn4');
        done();
      });
    });
  });
};

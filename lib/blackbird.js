(function(){
  'use strict';

// Minimal Promise implementation
  function Promise (fn){
    var thens = [];
    var compleated = false;

    var promise = {
      then: function(resolve, reject){
        thens.push({resolve: resolve, reject: reject});
      }
    };

    function resolver(val){
      if(compleated) throw new Error('Promise was already resolved or rejected');
      compleated = true;
      promise.then = function(resolve, reject){
        resolve && resolve(val);
      };
      thens.forEach(function(then){
        then.resolve && then.resolve(val);
      });
      thens = [];
    }

    function rejecter(err){
      if(compleated) throw new Error('Promise was already resolved or rejected');
      compleated = true;
      promise.then = function(resolve, reject){
        reject && reject(err);
      };
      thens.forEach(function(then){
        then.reject && then.reject(err);
      });
      thens = [];
    }
    fn(resolver, rejecter);

    return promise;
  }
  
  function guid(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function toArray(args){
    return Array.prototype.slice.apply(args);
  }

  function Blackbird(inbound, outbound, transport){
    var _id = guid();
    var _cbs = {};

    function sendObj(obj){
      try{
        var jsonStr = JSON.stringify(obj);
        transport.send(jsonStr);
      }catch(err){
        // calling handleMessage is as if the remote end sent something
        handleMessage({ack: true, origin: '*', id: obj.id, args: [err]});
        return;
      }
    }

    function ack(id, args){
      args = args || [];
      sendObj({ack: true, origin: _id, id: id, args: args});
    }
    function nack(id, err){
      sendObj({ack: true, origin: _id, id: id, args: [err || 'Error']});
    }

    function send(msg, cb){
      return new Promise(function(resolve, reject){
        var id = guid();
        _cbs[id] = function(){
          var err = arguments[0];
          var ret = arguments[1];
          if(err){
            reject(err);
          }else{
            resolve(ret);
          }
          cb.apply(null, arguments);
        };
        msg.id = id;
        msg.origin = _id;
        sendObj(msg);
      });
    }

    function handleMessage(msg){
      // Don't process your own messages
      if(msg.origin === _id) return;

      if(msg.ack){ // ack
        var ackCb = _cbs[msg.id];
        if(ackCb){
          delete _cbs[msg.id];
          ackCb.apply(null, msg.args);
        }
      }else if(msg.fn){ // function call
        var fn = inbound[msg.fn];
        if(fn){
          var cb = function(){
            var args = toArray(arguments);
            ack(msg.id, args);
          };
          try{
            var promise = fn.apply(inbound, msg.args.concat(cb));
            if(promise){
              if(promise.then && typeof promise.then === 'function'){
                promise.then(function(ret){
                  cb(null, ret);
                }, function(err){
                  cb(err || 'Error');
                });
              }else{
                cb(null, promise);
              }
            }
          }catch(err){
            var errStr = err.message ? err.message : err;
            cb(errStr);
          }
        }else{
          return nack(msg.id, 'Function "'+msg.fn+'" not implemented');
        }
      }
    }

    function handler(data){
      try{
        var msgObj = JSON.parse(data);
        return handleMessage(msgObj);
      }catch(err){
        return;
      }
    }

    function createOutboundProxyFn(name){
      return function(){
        var args = toArray(arguments);
        var cb = args.pop();
        if(typeof cb !== 'function'){
          args.push(cb);
          cb = function(){};
        }
        return send({fn:name, args: args}, cb);
      };
    }

    function setupOutboundProxy(outbound){
      for(var key in outbound){
        if(outbound.hasOwnProperty(key)){
          outbound[key] = createOutboundProxyFn(key);
        }
      }
    }
    setupOutboundProxy(outbound);

    // subscribe to transport messages
    transport.listen(handler);
  }

  // Transport templates
 
  var transports = {
    iframe: function(targetWindow, sourceWindow, domain){
      if(!targetWindow) throw new Error('No targetWindow specified');
      sourceWindow = sourceWindow || window;
      domain = domain || '*';
      return {
        send: function(data){
          targetWindow.postMessage(data, domain);
        },
        listen: function(fn){
          sourceWindow.addEventListener('message', function(e) {
            fn(e.data);
          });
        }
      };
    }
  };

  function blackbird(inbound, outbound, transport){
    return new Blackbird(inbound, outbound, transport);
  }

  blackbird.transports = transports;

  // Expose blackbird as node module, amd module or global
  if(typeof module !== 'undefined' && module.exports){
    module.exports = blackbird;
  }else{
    if(typeof define === 'function' && define.amd) {
      define([], function() {
        return blackbird;
      });
    }else{
      window.blackbird = blackbird;
    }
  }
})();


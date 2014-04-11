#Blackbird
![blackbird](doc/img/blackbird.png)

Blackbird provides easy-to-use proxy objects that let you call methods across event
based transports such as websockets, iframe postMessage etc. Any message based
communication channel can be used so only your imagination sets the limit.

##Why?
Consider this code for requesting data from one endpoint to the other:

    // Endpoint A
    var name;
    window.addEventListener('message', function(e) {
      name = e.data;
      console.log(name);
    });
    
    window.postMessage('getName', '*');
    
    // Endpoint B
    window.addEventListener('message', function(e) {
      window.postMessage('Paul', '*');
    });

Now compare it with this:

    // Endpoint A
    blackbird.getName(function(name){
      console.log(name);
    });

    // Endpoint B
    blackbird.getName = function(){
      return Paul;
    }

Or if you prefer promises over callback:

    // Endpoint A
    blackbird.getName(function(name){
      console.log(name);
    });

    // Endpoint B
    blackbird.getName = function(){
      return Paul;
    }

Blackbird can be used in node, in the browser per script tag and as an AMD module.

Follow [@AronKornhall](http://twitter.com/AronKornhall) for news and updates
regarding this library.

##Example (iframe postMessage)
###Embedding iframe
The embedding iframe exposes a method getName

    // Define a transport
    var transport = {
      send: function(data){
        window.parent.postMessage(data, '*');
      },
      listen: function(fn){
        window.addEventListener('message', function(e) {
          fn(e.data);
        });
      }
    };

    // Inbound interface (will be called from remote)
    var inbound = {
      getName: function(){
        return 'Paul';
      }
    };

    // Setup blackbird
    blackbird(inbound, {}, transport);

###Embedded iframe
The embedded iframe calls getName on embedding iframe

    var iframe = document.getElementById('iframe');

    // Define transport
    var transport = {
      send: function(data){
        iframe.contentWindow.postMessage(data, '*');
      },
      listen: function(fn){
        window.addEventListener('message', function(e) {
          fn(e.data);
        });
      }
    };

    // Outbound interface (will be proxied to remote end)
    var outbound = {
      getName: function(){ }
    };

    // Setup blackbird
    blackbird({}, outbound, transport);

    // Call getName on remote
    outbound.getName(function(err, name){
      alert(name);
    });

For a complete running example see `examples/iframe/index.html`

##Install
Node
    npm install blackbird

Browser
    download blackbird.js and include it in a script tag or load it using AMD

##Test
    npm test

##Reference

    blackbird(inbound, outbound, transport)

Setup blackbird with the inbound interface `inbound`, outbount interface `outbound`
and transport `transport`.

__Arguments__
 
    inbound   {Object} inbound interface containing method implementations that will
              be called by remote endpoint
 
    outbound  {Object} outbound interface with functions that will be called on remote
              endpoint. The functions shouldn't be implemented, only defined
 
    transport {Object} transport interface that should implement the following functions:
        send(data)
            data {String} the data to be sent to the remote endpoint
        listen(fn)
            fn {Function} registers fn as a listener for remote messages. fn accepts
                          a single {String} as input parameter

##License 

(The MIT License)

Copyright (c) 2014 Aron Kornhall <aron@optimalbits.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

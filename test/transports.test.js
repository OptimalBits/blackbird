var blackbird = require('../lib/blackbird');
var should = require('chai').should();

describe('Transports', function () {
  describe('iframe', function () {
    var mockTargetWindow, mockSourceWindow;

    beforeEach(function(){
      mockTargetWindow = {
        postMessage: function(data, domain){ }
      };
      mockSourceWindow = {
        addEventListener: function(event, fn){ }
      };
    });
    it('should validate mandatory targetWindow', function() {
      should.throw(function(){
        blackbird.transports.iframe();
      });
    });

    it('should add event listener to source window', function(done) {
      mockSourceWindow.addEventListener = function(event, fn){
        event.should.equal('message');
        fn.should.be.a('function');
        done();
      };

      var transport = blackbird.transports.iframe(mockTargetWindow, mockSourceWindow);
      transport.listen(function(){});
    });

    it('should call postMessage on targetwindow when send is called', function(done) {
      var msg = 'asdf_1234';
      mockTargetWindow.postMessage = function(data, domain){
        data.should.equal(msg);
        done();
      };

      var transport = blackbird.transports.iframe(mockTargetWindow, mockSourceWindow);
      transport.send(msg);
    });

    it('should default domain to "*"', function(done) {
      mockTargetWindow.postMessage = function(data, domain){
        domain.should.equal('*');
        done();
      };

      var transport = blackbird.transports.iframe(mockTargetWindow, mockSourceWindow);
      transport.send('dummy');
    });
  });
});

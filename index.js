module.exports = function (app) {
  var plugin = {};

  plugin.id = 'signalk-ecowitt';
  plugin.name = 'SignalK Ecowitt GW1000';
  plugin.description = 'This plugin allows you to receve data from Ecowitt GW1000 wireless gateways';

  function inhg2pascal(inhg) {
    return (inhg*3386);
  }

  function fahrenheit2kelvin(f) {
    return ((f - 32) * 5/9 + 273.15);
  }

  plugin.start = function (options, restartPlugin) {
    var http = require('http');
    var qs = require('querystring');

    http.createServer(function (req, res) {
      if (req.method === "POST") {
        var body = "";
        req.on("data", function (chunk) {
          body += chunk;
        });

        req.on("end", function(){
          var q = qs.parse(body);
          app.error(JSON.stringify(q));
          res.end();

          var tempin = fahrenheit2kelvin (parseFloat (q.tempinf));
          var humidityin = parseFloat(q.humidityin);
          var pressure = inhg2pascal (parseFloat (q.baromabsin));
          var values = [
            {
              path: 'environment.outside.temperature',
              value: tempin
            },
            {
              path: 'environment.inside.humidity',
              value: humidityin
            },
            {
              path: 'environment.outside.pressure',
              value: pressure
            }
          ];

          app.handleMessage('signalk-ecowitt', {
            updates: [
              {
                values: values
              }
            ]
          });
        });
      } else {
        res.end(); 
      }
    }).listen(1923); //the server object listens on port 8080
  };

  plugin.stop = function () {
    app.debug('Plugin stopped');
  };

  plugin.schema = {
    // The plugin schema
  };

  return plugin;
};

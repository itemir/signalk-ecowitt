/*
 * Copyright 2020 Ilker Temir <ilker@ilkertemir.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function (app) {
  var plugin = {};
  var server;

  plugin.id = 'signalk-ecowitt';
  plugin.name = 'SignalK Ecowitt GW1000';
  plugin.description = 'This plugin allows you to receve data from Ecowitt GW1000 wireless gateways';

  function inhg2pascal(inhg) {
    return (Math.round(inhg*3386));
  }

  function fahrenheit2kelvin(f) {
    return (Math.round((f - 32) * 5/9 + 273.15));
  }

  function degrees2radians(d) {
    return (Math.round(d*0.01745*100)/100);
  }

  function mph2mps(s) {
    return (Math.round(s*0.44704*100)/100);
  }

  // convert inches to mm as a float
  function in2mm(inches) {
    return (Math.round(inches*25.4*100)/100);
  }

  plugin.start = function (options, restartPlugin) {
    var http = require('http');
    var qs = require('querystring');

    server = http.createServer(function (req, res) {
      if (req.method === "POST") {
        var body = "";
        req.on("data", function (chunk) {
          body += chunk;
        });

        req.on("end", function(){
          var q = qs.parse(body);
          res.end();

          var tempin = fahrenheit2kelvin (parseFloat (q.tempinf));
          var humidityin = parseFloat(q.humidityin)/100;
          var pressure = inhg2pascal (parseFloat (q.baromabsin));

          var values = [
            {
              path: 'environment.inside.temperature',
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

          for (let i=1;i<=3;i++) {
            let tempKey = 'temp' + i.toString() + 'f';
            let humidityKey = 'humidity' + i.toString();
            if (tempKey in q) {
              var temp = fahrenheit2kelvin(parseFloat(q[tempKey]));
              eval ('var key=options.temp' + i.toString());
              if (key) {
                values.push ({
                  path: key,
                  value: temp
                });
              }
            }
            if (humidityKey in q) {
              var humidity = parseFloat (q[humidityKey])/100;
              eval ('var key=options.humidity' + i.toString());
              if (key) {
                values.push ({
                  path: key,
                  value: humidity
                });
              }
            }
          }


          // GW2000/Wittboy specific stuff

          if ( 'solarradiation' in q) {
            values.push({
              path: "environment.outside.solarRadiation",
              value: parseFloat(q.solarradiation),
            });
          }
          if ('uv' in q) {
            values.push({
              path: "environment.outside.uvIndex",
              value: parseInt(q.uv),
            });
          }

          var rain_params = [
            "rate",
            "event",
            "daily",
            "weekly",
            "monthly",
            "yearly",
          ];

          for (let i = 0; i < rain_params.length; i++) {
            let key = rain_params[i][0] + "rain_piezo";
            if (key in q) {
              values.push({
                path: "environment.outside.rain." + rain_params[i],
                value: in2mm(parseFloat(q[key])),
              });
            }
          }

          // end of Wittboy specific stuff

          if ("windspeedmph" in q) {
            var windSpeed = mph2mps(parseFloat(q.windspeedmph));
            var path = "environment.wind.speedTrue";
            if (options.windTrue == false)
              path = "environment.wind.speedApparent";
            values.push({
              path: path,
              value: windSpeed,
            });
          }

          if ("windgustmph" in q) {
            var windGust = mph2mps(parseFloat(q.windgustmph));
            var path = "environment.wind.gustTrue";
            if (options.windTrue == false)
              path = "environment.wind.gustApparent";
            values.push({
              path: path,
              value: windGust,
            });
          }

          if ('winddir' in q) {
            var windDirection = degrees2radians (parseFloat (q.winddir));
            var path = 'environment.wind.directionTrue';
            if (options.windTrue == false)
              path = 'environment.wind.angleApparent';;
            values.push ({
              path: path,
              value: windDirection
            });
          }

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
    });
    server.listen(options.port); 
  };

  plugin.stop = function () {
    server.close();
  };

  plugin.schema = {
    type: 'object',
    required: ['port'],
    properties: {
      port: {
        type: 'number',
        title: 'Server Port',
        default: 1923
      },
      windTrue: {
        type: 'boolean',
        title: 'Use true wind speed and direction (as opposed to apparent)',
        default: true
      },
      temp1: {
        type: 'string',
        title: 'SignalK key for Channel-1 temperature',
        default: 'environment.outside.temperature'
      },
      humidity1: {
        type: 'string',
        title: 'SignalK key for Channel-1 humidity',
        default: 'environment.outside.humidity'
      },
      temp2: {
        type: 'string',
        title: 'SignalK key for Channel-2 temperature',
        default: 'environment.mainCabin.temperature'
      },
      humidity2: {
        type: 'string',
        title: 'SignalK key for Channel-2 humidity',
        default: 'environment.mainCabin.humidity'
      },
      temp3: {
        type: 'string',
        title: 'SignalK key for Channel-3 temperature',
        default: 'environment.refrigerator.temperature'
      },
      humidity3: {
        type: 'string',
        title: 'SignalK key for Channel-3 humidity',
        default: 'environment.refrigerator.humidity'
      }
    }
  };

  return plugin;
};

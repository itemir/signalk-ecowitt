# Signal K plugin for Ecowitt GW1000 Gateway

This plugin integrates [Ecowitt GW1000 Wifi Gateway](http://www.ecowitt.com/wifi_weather/80.html) into a Signal K network. It currently supports inside temperature, humity, outside pressure and three additional temperature and humidity sensors that can be configured for outside, refrigerator, main cabin etc. 

Plugin starts an HTTP server in the specified port (default 1923). You need to configure GW1000 for a customized server. Choose the IP address of the Signal K server, set the port to your specified port and "Protocol Type" to Ecowitt. Path will not matter. HTTP server is not secured nor does it require authentication, so it is highly recommended to only use it on a local network.

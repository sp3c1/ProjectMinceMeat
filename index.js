/** *** *** **/
/** CONFIG  **/
/** *** *** **/
var app = require('express')();
var fs = require('fs');
var pem = fs.readFileSync('./cert/wildcard.pem');
var credentials = { key: pem, cert: pem };
var server = require('https').Server(credentials, app);
var io = require('socket.io')(server);
var config = require('./config')();
var _ = require('lodash');


/** *** **/
/** APP **/
/** *** **/
var users = {};
var orders = {};
var softkillTriggered = false;
var connections = {};


//Currently support softkill over socket and http, neither are protected by any auth
app.post('/process', function(req, res) {

});

server.listen(config.socket.port, config.socket.hostname, function() {
    console.log('server starts...');
});
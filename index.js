/** *** *** **/
/** CONFIG  **/
/** *** *** **/
var app = require('express')();
var fs = require('fs');
var pem = fs.readFileSync('./cert/wildcard.pem');
var credentials = {key: pem, cert: pem};
var server = require('https').Server(credentials, app);
var io = require('socket.io')(server);
var proxyCaps = require('./splitter');
var config = require('./config');
var bodyParser = require('body-parser');
config.seleniumClients = proxyCaps;

var _ = require('lodash');

var mng = require('./mng')(config);


/** *** **/
/** APP **/
/** *** **/

app.use(bodyParser.json());

//Currently support softkill over socket and http, neither are protected by any auth
app.post('/process', function (req, res) {
    mng.addJob(req.body.page, res);
});

server.listen(config.socket.port, config.socket.hostname, function () {
    console.log('server starts...');
});

process.on('SIGINT', ()=> {
    setTimeout(()=> {
        process.exit(1);
    }, 1000);
});
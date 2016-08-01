var fs = {};
var By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until,
    chrome = require('selenium-webdriver/chrome');
var events = require('events');
var _ = require('lodash');
var pm = require('ps-node');

var cp = require('child_process');



var Orderer = function(config, page, res) {
    var self = this;
    self.acceptNewJobs = true;

    self.jobs = [];

    self.cpList = []; //process
    self.cpQues = []; //page
    self.browserPid = []; //pid
    self.responseQue = []; //assinged response for rest


    self.config = config;

    self.intervalTry = setInterval(function() {
        self.emit('try');
    }, 1000);


    _.each(config.seleniumClients, function(configPage, keyPage) {
        var n = cp.fork('./chp/selenium.js');

        self.cpList[keyPage] = n;
        self.cpQues[keyPage] = "-1"; //page
        self.browserPid[keyPage] = 0;
        self.responseQue[keyPage] = null;

        var registerHandler = function() {

            n.on('message', function(m) {
                switch (m.action) {
                    case 'initiated':
                        //ready for work client browser is initiated
                        self.cpQues[keyPage] = "-1";
                        self.browserPid[keyPage] = m.browserPid;
                        self.emit('try');
                        break;
                    case 'result':
                        self.responseQue[keyPage].send(m.data);

                        self.cpQues[keyPage] = "-1";
                        self.responseQue[keyPage] = null;
                        self.emit('try');
                        break;

                }
            });

            n.on('error', function(err) {
                console.log('PARENT kid died!');
                //try to restart
                self.killBrowser(keyPage);
                n = cp.fork('./chp/selenium.js');

                self.cpList[keyPage] = n;
                self.cpQues[keyPage] = "-1";
                self.browserPid[keyPage] = 0;

                registerHandler();

                n.send({
                    "action": "config",
                    "config": configPage
                });

            });

            n.on('exit', function(err) {
                console.log('PARENT kid exited!');

                self.killBrowser(keyPage);
                //try to restart
                n = cp.fork('./chp/selenium.js');

                self.cpList[keyPage] = n;
                self.cpQues[keyPage] = "-1";
                self.browserPid[keyPage] = 0;

                registerHandler();

                n.send({
                    "action": "config",
                    "config": configPage
                });

            });

        };

        registerHandler();
        //init the browser
        n.send({
            "action": "config",
            "config": configPage
        });

    });



    self.on('try', function() {
        //get a new job and try to see if we can schedule something

        //for each
        //try 
        //schedule job
    });
};


Orderer.prototype.__proto__ = events.EventEmitter.prototype;

Orderer.prototype.killBrowser = function(indexClient, resolve) {
    var self = this;
    var tmpPid = self.browserPid[indexClient];
    if (tmpPid) {
        pm.kill(tmpPid, function(err) {
            if (err) {
                console.log('%%%%%%%%%%%%%%%%%%%% Could not kill driver browser');
                console.log(err);
            } else {
                console.log('%%%%%%%%%%%%%%%%%%%% Process [' + tmpPid + '] has been killed!');
            }
            if (resolve !== undefined) {
                resolve(true);
            }
        });
    } else {
        console.log('%%%%%%%%%%%%%%%%%%%% Can not kill process of id [' + tmpPid + ']');
        if (resolve !== undefined) {
            resolve(true);
        }
    }
};

Orderer.prototype.addJob = function([page, res]) {
    var self = this;
    self.jobs.unshift([page, res]);
    self.emit('try');
}


module.exports = function(config) {
    return new Orderer(config);
};
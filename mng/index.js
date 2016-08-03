'use strict';

var events = require('events');
var _ = require('lodash');
var pm = require('ps-node');

var cp = require('child_process');

var OFLM = require('ordered-fast-lookup-map');


var Orderer = function (config, page, res) {
    var self = this;
    self.acceptNewJobs = true;

    self.jobs = [];

    self.cpList = []; //process
    self.cpQues = []; //page
    self.browserPid = []; //pid
    self.responseQue = []; //assinged response for rest
    self.timeActed = []; //time when next avaible
    self.raiseTime = []; //proxy rotation
    self.configIndex = 1;
    self.configMod = config.seleniumClients.length;
    self.killTime = Date.now();

    self.rotationModel = new OFLM();
    self.config = config;

    self.intervalTry = setInterval(function () {
        self.emit('try');
    }, 1000);

    self.intervalSwitchProxy = setInterval(function () {
        self.configIndex++;
        self.killTime = Date.now();
        if (self.configIndex % self.configMod) {
            self.configIndex = 1;
        }
    }, config.settings.proxyRotationInterval);


    _.each(config.seleniumClients[0], function (configPage, keyPage) {
        var n = cp.fork('./chp/selenium.js');

        self.cpList[keyPage] = n;
        self.cpQues[keyPage] = ""; //page
        self.browserPid[keyPage] = 0;
        self.responseQue[keyPage] = null;
        self.timeActed[keyPage] = Date.now();
        self.raiseTime[keyPage] = null;

        var registerHandler = function () {

            n.on('message', function (m) {
                switch (m.action) {
                    case 'initiated':
                        //ready for work client browser is initiated
                        self.cpQues[keyPage] = "";
                        self.browserPid[keyPage] = m.browserPid;
                        self.timeActed[keyPage] = Date.now();
                        self.raiseTime[keyPage] = Date.now();
                        self.emit('try');

                        //insert into  self.rotationModel
                        self.rotationModel.unshift(keyPage, [keyPage, self.timeActed[keyPage]]);
                        break;
                    case 'result':
                        self.responseQue[keyPage].send(m.data);

                        self.timeActed[keyPage] = Date.now() * 1 + config.settings.requestCoolDown;
                        self.cpQues[keyPage] = "";
                        self.responseQue[keyPage] = null;

                        //rotate the proxy
                        if (self.rotationModel.has(keyPage)) {
                            self.rotationModel.remove(keyPage);
                        }

                        if (self.killTime > self.raiseTime[keyPage]) {
                            self.cpList[keyPage].kill();
                        } else {
                            self.rotationModel.unshift(keyPage, [keyPage, self.timeActed[keyPage]]);
                            self.emit('try');
                        }
                        break;

                }
            });

            n.on('error', function (err) {
                console.log('PARENT kid died!');
                //try to restart
                self.killBrowser(keyPage);
                if (self.responseQue[keyPage] !== null) {
                    self.responseQue[keyPage].statusCode(500);
                    self.responseQue[keyPage].send('error');
                }

                //remove from self.rotationModel
                if (self.rotationModel.has(keyPage)) {
                    self.rotationModel.remove(keyPage)
                }
                n = cp.fork('./chp/selenium.js');

                self.cpList[keyPage] = n;
                self.cpQues[keyPage] = "-1";
                self.browserPid[keyPage] = 0;
                self.timeActed[keyPage] = Date.now() * 1;

                registerHandler();

                n.send({
                    "action": "config",
                    "config": config.seleniumClients[self.configIndex % self.configMod][keyPage]
                });

            });

            n.on('exit', function (err) {
                console.log('PARENT kid exited!');

                self.killBrowser(keyPage);
                if (self.responseQue[keyPage] !== null) {
                    self.responseQue[keyPage].statusCode(500);
                    self.responseQue[keyPage].send('error');
                }

                //try to restart
                //remove from self.rotationModel
                if (self.rotationModel.has(keyPage)) {
                    self.rotationModel.remove(keyPage)
                }
                n = cp.fork('./chp/selenium.js');

                self.cpList[keyPage] = n;
                self.cpQues[keyPage] = "-1";
                self.browserPid[keyPage] = 0;

                registerHandler();

                n.send({
                    "action": "config",
                    "config": config.seleniumClients[self.configIndex % self.configMod][keyPage]
                });

            });

        };

        registerHandler();
        //init the browser
        n.send({
            "action": "config",
            "config": config.seleniumClients[self.configIndex % self.configMod][keyPage]
        });

    });

    self.on('try', function () {
        //get a new job and try to see if we can schedule something
        let index = self.rotationModel._array.length - 1;
        if (index >= 0) {
            let entry = self.rotationModel.get(index);
            if (entry && entry[1] <= Date.now() && self.cpQues[entry[0]] == "") {
                if (self.jobs.length) {
                    let job = self.jobs.pop();
                    self.cpQues[entry[0]] = job[0];
                    self.responseQue[entry[0]] = job[1];
                    self.cpList[entry[0]].send({action: "attempt", url: job[0]});

                    self.rotationModel.remove(index);
                    self.emit('try');
                }
            }
        }

    });
};

Orderer.prototype.__proto__ = events.EventEmitter.prototype;

Orderer.prototype.killBrowser = function (indexClient, resolve) {
    var self = this;
    try {
        var tmpPid = self.browserPid[indexClient];
        if (tmpPid) {
            pm.kill(tmpPid, function (err) {
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
    } catch (e) {
        //ignore
    }
};

Orderer.prototype.addJob = function (page, res) {
    var self = this;
    self.jobs.unshift([page, res]);
    self.emit('try');
}


module.exports = function (config) {
    return new Orderer(config);
};

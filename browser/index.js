/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var events = require('events');
var _ = require('lodash');
var fs = require('fs');


var BaseSelenium = function () {

};

BaseSelenium.prototype.init = function (fs, By, Until, Browser, promise, config, handler) {
    var self = this;
    this.fs = fs;

    this.handler = handler;
    this.By = By;
    this.promise = promise;
    this.Until = Until;
    this.browser = Browser;

    this.driver = new this.browser.Driver(config.capabilities);

    var initInterval = setInterval(function () {
        try {
            var pid = self.driver.session_.value_.caps_.get('pid');
            self.log("@chrome pid: " + pid);
            process.send({action: "initiated", browserPid: pid});
            clearInterval(initInterval);
        } catch (e) {
            self.log('Pid unavaibale');
        }
    }, 5000);

    this.driver.manage().window().setSize(200, 200);
    this.driver.manage().timeouts().pageLoadTimeout(10000); //30000
    this.driver.manage().timeouts().setScriptTimeout(10000); //30000
    this.driver.manage().timeouts().implicitlyWait(3500);

    this.config = config;
    return this;
};

BaseSelenium.prototype.log = function (msg) {
    console.log(msg);
}


BaseSelenium.prototype.goToTargetItem = function (page, response) {
    var self = this;
    //page = page;

    if (page !== null && page !== undefined && page.indexOf("http://") !== 0 && page.indexOf("https://") !== 0 && page.indexOf("file://") !== 0) {
        self.log('Warning: Missing http [' + page + '], attempting to add to url', 1);
        page = 'http://' + page;
        self.statusUpdate('Attempting to fix url');
    } else {
        if (page === null || page === undefined) {
            self.criticalLog('Invalid page link');
        }
    }

    this.driver.get(page).then(function () {
        if (response) {
            self.driver.findElements(self.By.xpath('//html')).then(function (elements) {
                if (elements.length) {
                    elements[0].getAttribute("innerHTML").then(
                        function (html) {
                            self.handler.send({action: "result", data: html});
                        },
                        function () {
                            self.handler.send({action: "result", data: "error-html"});
                        }
                    )
                } else {
                    self.handler.send({action: "result", data: "error-body"});
                }
            }, function (err) {
                self.handler.send({action: "result", data: "error-page"});
            });
        }

    }, function () {
        if (response) {
            self.handler.send({action: "result", data: "error"});
        }
    });

};

// Functions which will be available to external callers
module.exports = function (fs, By, Until, Browser, promise, config, handler) {
    return new BaseSelenium().init(fs, By, Until, Browser, promise, config, handler);
};
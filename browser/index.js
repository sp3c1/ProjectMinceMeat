/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var events = require('events');
var _ = require('lodash');
var fs = require('fs');


var BaseSelenium = function(fs, By, Until, Browser, promise, config) {
    this.init(fs, By, Until, Browser, promise, config);
};

/**
 *  @brief provides shared way of initiating module
 *
 *  @param fs referebce to fs module
 *  @param By ChromeDriver module to fetch elements
 *  @param Until ChromeDriver module for timeout functions
 *  @param Browser ChromeDriver module to spawn browser
 *  @param config the json configuration for given module
 *  @param parent Module that provides handle to communication module, so there is no back communication between those 2
 *  @param pgHandler Handler to database module
 *
 *  @todo clear fs
 */
BaseSelenium.prototype.init = function(fs, By, Until, Browser, promise, config, handler) {
    var self = this;
    this.fs = fs;

    this.handler = handler;
    this.By = By;
    this.promise = promise;
    this.Until = Until;
    this.browser = Browser;

    this.driver = new this.browser.Driver(config.capabilities);

    var initInterval = setInterval(function() {
        try {
            var pid = self.driver.session_.value_.caps_.get('pid');
            self.log("@chrome pid: " + pid);
            process.send({ action: "initiated", browserPid: pid });
            clearInterval(initInterval);
        } catch (e) {
            self.log('Pid unavaibale');
        }
    }, 5000);

    this.driver.manage().window().setSize(1200, 1000);
    this.driver.manage().timeouts().pageLoadTimeout(15000);
    this.driver.manage().timeouts().setScriptTimeout(15000);
    this.driver.manage().timeouts().implicitlyWait(3500);

    this.config = config;
};

BaseSelenium.prototype.__proto__ = events.EventEmitter.prototype;

BaseSelenium.prototype.log = function(msg) {
    console.log(msg);
}


BaseSelenium.prototype.goToTargetItem = function(page) {
    var self = this;
    page = page;

    if (page !== null && page !== undefined && page.indexOf("http://") !== 0 && page.indexOf("https://") !== 0 && page.indexOf("file://") !== 0) {
        self.log('Warning: Missing http [' + page + '], attempting to add to url', 1);
        page = 'http://' + page;
        self.statusUpdate('Attempting to fix url');
    } else {
        if (page === null || page === undefined) {
            self.criticalLog('Invalid page link');
        }
    }


    this.driver.get(page);

};

// Functions which will be available to external callers
module.exports = BaseSelenium;
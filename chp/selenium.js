var config = null;
var browser = null;
var promise = null;
var pgHandler = null;

var fs = {};
var By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until,
    chrome = require('selenium-webdriver/chrome'),
    promise = require('selenium-webdriver').promise;
//var events = require('events');


process.on('message', function(m) {
    //console.log('CHILD got message:', m);

    switch (m.action) {
        case "config":

            config = m.config;
            browser = require('../browser')(fs, By, until, chrome, promise, config,process);

            break;
        case "attempt":

            break;

        case "kill":
            console.log('parent send kill');
            browser.setCancel(m.crc);
            break;
    }
});
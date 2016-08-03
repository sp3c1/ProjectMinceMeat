//shuffle maybe
var proxyList = require('./splitter.list');

var proxyPerBatch = 3;
var maxProxyBatch = 3;

var arr = [];

var proxyInBatch = 0
var proxyBatchCnt = 0;
var mainIndex = 0;
var maxIndexCnt = proxyList.length;

for (proxyBatchCnt; proxyBatchCnt < maxProxyBatch; proxyBatchCnt++) {

    proxyInBatch = 0;
    var tmpArr = []
    for (proxyInBatch; proxyInBatch < proxyPerBatch; proxyInBatch++) {
        tmpArr.push(
            {
                "capabilities": {
                    "proxy": {
                        "proxyType": "manual",
                        "httpProxy": proxyList[mainIndex],
                        "sslProxy": proxyList[mainIndex],
                    }
                }
            }
        );
        mainIndex++;
    }

    if (tmpArr.length == proxyPerBatch) {
        arr.push(tmpArr);
    } else {
        break;
    }
}

if (arr.length && arr[0].length) {
    console.log("Proxy Split", "Batches [" + arr.length + "]", "Batch Size [" + arr[0].length + "]");
} else {
    console.log('=====================NO PROXIES EXPORTED=====================================');
    process.exit(1);
}

module.exports = arr;

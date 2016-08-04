var conf = {
    "socket": {
        "port": 3004,
        "hostname": "127.0.0.1"

    },
    settings: {
        proxyRotationInterval: 1000 * 60,
        requestCoolDown: 1000 * 2
    },
    "seleniumClients": [
        [
            {
                "capabilities": {
                    "proxy": {
                        "proxyType": "manual",
                        "httpProxy": "23.19.34.138:8800",
                        "sslProxy": "23.19.34.138:8800",
                    }
                }
            }

        ],
        [

            {
                "capabilities": {
                    "proxy": {
                        "proxyType": "manual",
                        "httpProxy": "173.208.103.109:8800",
                        "sslProxy": "173.208.103.109:8800",
                    }
                }
            }
        ]
    ]
};

module.exports = conf;

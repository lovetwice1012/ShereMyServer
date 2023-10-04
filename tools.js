const readline = require('readline/promises');

(async () => {
    console.log("ShareMyServer(by yussy)")
    console.log(`このソフトウェアはポート開放をせずに、外部からの接続を受け付けるためのソフトウェアです。`);
    console.log(`spatial thanks: \njayu's tcp-local-tunnel(https://github.com/jayu/tcp-local-tunnel/)`)
    const readInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    var modecheck = false;
    var mode;
    while (!modecheck) {
        mode = await readInterface.question("モードを選択してください(1:サーバー,2:クライアント):");
        //check mode is number or not
        if (isNaN(mode)) {
            console.log("モードは数字で入力してください。");
            continue;
        }
        //check mode is 1 or 2
        if (mode != 1 && mode != 2) {
            console.log("モードは1か2で入力してください。");
            continue;
        }
        modecheck = true;
    }
    mode = parseInt(mode);
    switch (mode) {
        case 1:
            mode1();
            break;
        case 2:
            mode2();
            break;
        default:
            console.log("このメッセージは出ないはず....");
            break;
    }

    async function mode1() {
        var incomingportcheck = false;
        var incomingport;
        while (!incomingportcheck) {
            incomingport = await readInterface.question("ユーザーからの接続を受けたいポートを入力してください:");
            //check port is number or not
            if (isNaN(incomingport)) {
                console.log("ポート番号は数字で入力してください。");
                continue;
            }
            //check port is 0~65535
            if (incomingport < 0 || incomingport > 65535) {
                console.log("ポート番号は0~65535で入力してください。");
                continue;
            }
            incomingportcheck = true;
        }
        var tunnelportcheck = false;
        var tunnelport;
        while (!tunnelportcheck) {
            tunnelport = await readInterface.question("トンネルからの接続を受けるポートを入力してください:");
            //check port is number or not
            if (isNaN(tunnelport)) {
                console.log("ポート番号は数字で入力してください。");
                continue;
            }
            //check port is 0~65535
            if (tunnelport < 0 || tunnelport > 65535) {
                console.log("ポート番号は0~65535で入力してください。");
                continue;
            }
            tunnelportcheck = true;
        }
        const server = require('./server/server');
        server({
            proxyPort: incomingport,
            tunnelPort: tunnelport
        });
    }

    async function mode2() {
        var portcheck = false;
        var port;
        while (!portcheck) {
            port = await readInterface.question("公開したいポートを入力してください:");
            //check port is number or not
            if (isNaN(port)) {
                console.log("ポート番号は数字で入力してください。");
                continue;
            }
            //check port is 0~65535
            if (port < 0 || port > 65535) {
                console.log("ポート番号は0~65535で入力してください。");
                continue;
            }
            portcheck = true;
        }
        var tunnelportcheck = false;
        var tunnelport;
        while (!tunnelportcheck) {
            tunnelport = await readInterface.question("トンネルサーバーのポートを入力してください:");
            //check port is number or not
            if (isNaN(tunnelport)) {
                console.log("ポート番号は数字で入力してください。");
                continue;
            }
            //check port is 0~65535
            if (tunnelport < 0 || tunnelport > 65535) {
                console.log("ポート番号は0~65535で入力してください。");
                continue;
            }
            tunnelportcheck = true;
        }
        const client = require('./client/proxy');

        client(
            {
                host: 'xy.f5.si',
                port: tunnelport
            },
            {
                host: '127.0.0.1',
                port: port
            }
        );
    }
})();
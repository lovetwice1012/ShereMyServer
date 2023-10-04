const readline = require('readline/promises');

(async () => {
    console.log("ShareMyServer(by yussy)")
    console.log(`このソフトウェアはポート開放をせずに、外部からの接続を受け付けるためのリレーサーバーを構築するソフトウェアです。`);
    console.log(`サーバーを公開したい人はtools_client.exeを使用してください。`)
    console.log(`spatial thanks: \njayu's tcp-local-tunnel(https://github.com/jayu/tcp-local-tunnel/)\nthbaumbach's node-udp-tunnel-cli(https://github.com/thbaumbach/node-udp-tunnel-cli/)`)
    const readInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    var protocolcheck = false;
    var protocol;
    while (!protocolcheck) {
        protocol = await readInterface.question("プロトコルを選択してください(1:TCP,2:UDP):");
        //check protocol is number or not
        if (isNaN(protocol)) {
            console.log("プロトコルは数字で入力してください。");
            continue;
        }
        //check protocol is 1 or 2
        if (protocol != 1 && protocol != 2) {
            console.log("プロトコルは1か2で入力してください。");
            continue;
        }
        protocolcheck = true;
    }
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
    protocol = parseInt(protocol);
    switch (protocol) {
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
        const server = require('./server/server');
        server({
            proxyPort: incomingport,
            tunnelPort: tunnelport
        });
    }
    async function mode2() {
        const helper = require('./udp/helper');

        const udp = require('dgram');

        const port_listen = parseInt(incomingport),
            port_tunnel = parseInt(tunnelport),
            server_listen = udp.createSocket('udp4'),
            server_tunnel = udp.createSocket('udp4');

        // the tunnel connection (=unicorn)
        var unicorn = null,
            unicorn_buf = null;

        // SERVER LISTEN
        server_listen.on('error', (err) => {
            console.log(`listen-server error:\n${err.stack}`);
            server_listen.close();
        });
        server_listen.on('message', (msg, rinfo) => {
            if (!unicorn) {
                console.log(`error: no tunnel connection set while listen-server contacted by ${rinfo.address}:${rinfo.port}`);
            }
            else {
                let rinfo_buf = helper.rinfo2buffer(rinfo),
                    new_msg = Buffer.concat([rinfo_buf, msg], rinfo_buf.length + msg.length);
                server_tunnel.send(new_msg, 0, new_msg.length, unicorn.port, unicorn.address, (err) => { if (err) throw err; });
            }
            //console.log(`listen server got: ${msg} from ${helper.rinfo2buffer(rinfo).toString('hex')}`);
        });
        server_listen.on('listening', () => {
            var address = server_listen.address();
            console.log(`listen-server listening ${address.address}:${address.port}`);
        });
        server_listen.bind(port_listen);

        // SERVER TUNNEL
        server_tunnel.on('error', (err) => {
            console.log(`tunnel-server error:\n${err.stack}`);
            server_tunnel.close();
        });
        server_tunnel.on('message', (msg, rinfo) => {
            if (!unicorn) {
                console.log(`tunnel connection set for ${rinfo.address}:${rinfo.port}`);
                unicorn = rinfo;
                unicorn_buf = helper.rinfo2buffer(rinfo);
            }
            else {
                let rinfo = helper.buffer2rinfo(msg);
                server_listen.send(msg.slice(6), 0, msg.length - 6, rinfo.port, rinfo.address, (err) => { if (err) throw err; });
            }
            //console.log(`tunnel server got: ${msg} from ${helper.rinfo2buffer(rinfo).toString('hex')}`);
        });
        server_tunnel.on('listening', () => {
            var address = server_tunnel.address();
            console.log(`tunnel-server listening ${address.address}:${address.port}`);
        });
        server_tunnel.bind(port_tunnel);
    }

})();
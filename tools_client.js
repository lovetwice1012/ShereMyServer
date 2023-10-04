const readline = require('readline/promises');

(async () => {
    console.log("ShareMyServer(by yussy)")
    console.log(`このソフトウェアはポート開放をせずに、外部からの接続を受け付けるためのソフトウェアです。`);
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
    async function mode2() {
        const helper = require('./udp/helper');

        const udp = require('dgram');

        const tunnel_addr = '127.0.0.1',
            tunnel_port = parseInt(tunnelport),
            local_addr = '127.0.0.1',
            local_port = parseInt(port),
            client_tunnel = udp.createSocket('udp4'),
            clients = {};

        // CLIENT TUNNEL
        client_tunnel.on('error', (err) => {
            console.log(`tunnel-client error:\n${err.stack}`);
            client_tunnel.close();
        });
        client_tunnel.on('message', (msg, rinfo) => {
            let client_rinfo = helper.buffer2rinfo(msg),
                client_rinfo_buf = msg.slice(0, 6),
                client_rinfo_str = `${client_rinfo.address}:${client_rinfo.port}`;
            if (!(client_rinfo_str in clients)) {
                console.log(`new client connected from ${client_rinfo_str}`)
                clients[client_rinfo_str] = udp.createSocket('udp4');
                clients[client_rinfo_str].client_rinfo_buf = client_rinfo_buf;
                clients[client_rinfo_str].on('error', (err) => {
                    console.log(`client error:\n${err.stack}`);
                    //server_tunnel.close(); //?
                });
                clients[client_rinfo_str].on('message', (msg, rinfo) => {
                    let new_msg = Buffer.concat([clients[client_rinfo_str].client_rinfo_buf, msg], clients[client_rinfo_str].client_rinfo_buf.length + msg.length);
                    client_tunnel.send(new_msg, 0, new_msg.length, tunnel_port, tunnel_addr, (err) => { if (err) throw err; });
                    //console.log(`client got: ${msg} from ${helper.rinfo2buffer(rinfo).toString('hex')}`);
                });
            }
            clients[client_rinfo_str].send(msg.slice(6), 0, msg.length - 6, local_port, local_addr, (err) => { if (err) throw err; });
            //console.log(`tunnel client got: ${msg} from ${helper.rinfo2buffer(rinfo).toString('hex')}`);
        });
        client_tunnel.send(new Buffer(1), 0, 1, tunnel_port, tunnel_addr, (err) => { if (err) throw err; }); // say hello
    }

})();
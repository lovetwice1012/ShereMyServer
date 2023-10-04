const { exit } = require('process');

(async () => {
    
    //read args
    if (process.argv.length != 5) {
        console.log("引数が足りません。");
        process.exit(1);
    }

    setTimeout(() => {
        exit(0);
    }, 1000 * 60 * 60 * 24 * 3);
    
    var protocol = parseInt(process.argv[2]);
    var incomingport = parseInt(process.argv[3]);
    var tunnelport = parseInt(process.argv[4]);
    
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
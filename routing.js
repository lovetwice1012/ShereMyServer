const len = 9999;
let can_allocation_port_tcp = new Array(len)
    .fill(null)
    .map((_, i) => i + 61000);
let allocated_port_tcp = [];

let can_allocation_port_udp = new Array(len)
    .fill(null)
    .map((_, i) => i + 61000);
let allocated_port_udp = [];

const express = require('express');
const app = express();

const exec = require('child_process').exec;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/allocate_tcp', (req, res) => {
    const port = can_allocation_port_tcp.shift();
    allocated_port_tcp.push(port);
    exec(`node server.js 1 ${port} ${port+2000}`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(stdout);
    }).on('exit', (code) => {
        allocated_port_tcp = allocated_port_tcp.filter((p) => p !== port);
        can_allocation_port_tcp.push(port);
    });
    res.send(port.toString());
});

app.get('/allocate_udp', (req, res) => {
    const port = can_allocation_port_udp.shift();
    allocated_port_udp.push(port);
    exec(`node server.js 2 ${port} ${port+2000}`, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(stdout);
    }).on('exit', (code) => {
        allocated_port_udp = allocated_port_udp.filter((p) => p !== port);
        can_allocation_port_udp.push(port);
    })
    res.send(port.toString());
});

const server = app.listen(8010, () => {
    console.log('port allocater listening on port 8010!');
});
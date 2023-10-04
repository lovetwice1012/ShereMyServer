module.exports.rinfo2buffer = (rinfo) => {
    let ip = rinfo.address.split('.'),
        buf = Buffer.alloc(6);
    if (ip.length !== 4) {
        throw new Error('Invalid IP address format');
    }
    for (let i = 0; i < 4; i++) {
        const octet = parseInt(ip[i]);
        if (isNaN(octet) || octet < 0 || octet > 255) {
            throw new Error('Invalid IP address component');
        }
        buf.writeUInt8(octet, i);
    }
    const port = parseInt(rinfo.port);
    if (isNaN(port) || port < 0 || port > 65535) {
        throw new Error('Invalid port number');
    }
    buf.writeUInt16BE(port, 4);
    return buf; 
}

module.exports.buffer2rinfo = (buf) => {
    return {
        address : `${buf.readUInt8(0)}.${buf.readUInt8(1)}.${buf.readUInt8(2)}.${buf.readUInt8(3)}`,
        port : buf.readUInt16BE(4)
    }; 
}
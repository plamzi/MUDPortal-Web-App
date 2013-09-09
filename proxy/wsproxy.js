/*  
 	Lightweight Websocket<->Telnet Proxy
 	
 	Author: plamzi - bedlam@eyecandid.com 
 	MIT license
 	
 	Requires https://github.com/Worlize/WebSocket-Node
 	In your project root: npm install websocket
 	
 	Supports client setting any host and port prior to connect.
 	Example:
 	
 		if (WebSocket) {
			var ws = new WebSocket('ws://mywsproxyserver:6200/');
			ws.onopen = function(e) { 
				ws.send('{ host: "localhost", port: 7000, connect: 1 }');
			};
		}
	
	Note:
		
		The server waits to receive { connect: 1 } so you have to send it
		even if you are not passing it host and port from the client.
	
*/

var u = require('util');
var net = require('net');
var http = require('http');
var zlib = require('zlib');
var ws = require('websocket').server;

srv = {

	ws_port: 6200, /* this websocket proxy port */
	
	tn_host: "localhost", /* default telnet host */
	
	tn_port: 9000, /* default telnet/target port */
	
	debug: false, /* enable additional debugging */
	
	compress: true, /* use node zlib (different from mccp) - you want this turned off unless your client can inflate data */
	
	open: true, /* set to false while server is shutting down */
	
	ttype: {
		enabled: 1,		
		portal:	["mudportal.com", "ANSI-256COLOR", "MTTS 141"],
		bedlam: ["WEB 2.0"]
	},
	
	gmcp: {
		enabled: 1,
		portal: ['client mudportal.com', 'client_version 1.0'],
		bedlam: ['client Web', 'client_version 2.0']
	},
	
	prt: {
		CAN_ATCP: 		new Buffer([ 255, 251, 200 ]),
		CAN_GMCP: 		new Buffer([ 255, 251, 201 ]),
		CAN_MCCP: 		new Buffer([ 255, 253, 86 ]),
		DO_MSDP: 		new Buffer([ 255, 253, 69 ]),
		DO_MXP: 		new Buffer([ 255, 253, 91 ]),
		START: 			new Buffer([ 255, 250, 201 ]),
		STOP:   		new Buffer([ 255, 240 ]),
		TTYPE:  24,
		MCCP2:	86,
		MSDP:	69,
		MXP:	91,
		WILL:	251,
		ATCP:	200,
		SE:		240,
		SB:		250,
		WONT:	252,
		DO:		253,
		DONT:	254,
		IAC:	255,
		IS:		0,
		REQUEST:	1,
		ACCEPTED:	2,
		REJECTED:	3,
		CHARSET: 42,
		ESC:	33,
		WILL_CHARSET:	new Buffer([ 255, 251, 42 ]),
		WILL_UTF8:		new Buffer([ 255, 250, 42, 2, "UTF-8", 255, 240 ])
	},
	
	newSocket: function (s) {
	
		if (!srv.open) { /* server is going down */
			s.destroy?s.destroy():s.socket.destroy();
			return;
		}

		server.sockets.push(s);
		
		s.on('data', function(d) 	{ srv.forward(s, d) });
		s.on('end',  function() 	{ srv.closeSocket(s) });
		s.on('error', function(err) { srv.closeSocket(s) });
	
		srv.initT(s);
		srv.log(' (rs): new connection');
	},

	forward: function(s, d) {
		if (s.ts) {
			if (s.debug)
				srv.log('forward: ' + d, s);
			s.ts.write(d);
		}
	},

	// Executed when client disconnects from the proxy server
	closeSocket: function(s) {
		if (s.ts) 
			s.ts.destroy();
		var i = server.sockets.indexOf(s);
		if (i != -1) 
			server.sockets.splice(i, 1);
		srv.log('killing socket: ' + s.remoteAddress);
		if (s.destroy) 
			s.destroy();
		else 
			s.socket.destroy();
		srv.log('active sockets: ' + server.sockets.length);
	},

	// Server boot
	init: function() {

		server = {
			sockets: []
		};
		
		var webserver = http.createServer(function(request, response) {
			response.writeHead(404);
			response.end();
		});

		webserver.listen(srv.ws_port, function() {
			srv.log('(ws) websocket server listening: port '+srv.ws_port);
		});

		wsServer = new ws({
			httpServer: webserver,
			autoAcceptConnections: false
		})
		.on('request', function(request) {

			if (!srv.open || !srv.originAllowed(request.origin)) {
				request.reject();
				srv.log(' (ws): connection from ' + request.origin + ' rejected');
				return;
			}

			var s = request.accept(null, request.origin);

			srv.log(' (ws): new connection');
			server.sockets.push(s);
	
			s.on('message', function(msg) {
				if (msg.type === 'utf8') {  
					msg = msg.utf8Data;
					//srv.log('(ws) msg (utf8): ' + msg);
					if (!srv.parse(s, msg))
						srv.forward(s, msg);
				}
			})
			.on('close', function(reasonCode, description) {
				srv.log((new Date()) + '(ws) peer ' + s.remoteAddress + ' disconnected.');
				srv.closeSocket(s);
			})
			.on('error', function(err) {
				srv.log((new Date()) + '(ws) peer ' + s.remoteAddress + ' error: ' + err);
				srv.closeSocket(s);
			});
			
		});

	}, 
 
	parse: function(s, d) {
		
		if (d[0] != '{') 
			return 0;
		
		try { var req = eval('('+d+')') }
		catch(err) { srv.log(err) };

		if (req.host) {
			s.host = req.host;
			srv.log('Target host set to ' + s.host, s);
		}
		
		if (req.port) {
			s.port = req.port;
			srv.log('Target port set to ' + s.port, s);
		}
		
		if (req.ttype) {
			s.ttype = req.ttype;
			srv.log('Client ttype port set to ' + s.ttype, s);
		}
		
		if (req.mxp) {
			s.mxp = req.mxp;
			srv.log('Client wants MXP DO.', s);		
		}
		
		if (req.mccp) {
			s.mccp = req.mccp;
			srv.log('Client wants MCCP.', s);		
		}
		
		if (req.utf8) {
			s.utf8 = req.utf8;
			srv.log('Client wants UTF-8.', s);		
		}
		
		if (req.debug)
			s.debug = req.debug;
		
		if (req.bedlam)
			s.bedlam = 1;
		
		if (req.chat)
			srv.chat(s, req);
	
		
		if (req.connect)
			srv.initT(s);
			
		return 1;
	},
	
	sendTTYPE: function (s, msg) {
		var p = srv.prt;
		
		s.ts.write(new Buffer([p.IAC, p.WILL, p.TTYPE]));
		
		s.ts.write(new Buffer([p.IAC, p.SB, p.TTYPE, p.IS]));
			s.ts.write(msg);
		s.ts.write(new Buffer([p.IAC, p.SE]));	
	},
	
	sendGMCP: function (s, msg) {
		s.ts.write(srv.prt.START);
			s.ts.write(msg);
		s.ts.write(srv.prt.STOP);
	},

	sendMXP: function (s, msg) {
		var p = srv.prt;
		
		s.ts.write(new Buffer([p.ESC, '[1z']));
			s.ts.write(msg);
		s.ts.write(new Buffer([p.ESC, '[7z']));	
	},
	
	initT: function(so, d) {
		
		var s = so;
		var host = s.host||srv.tn_host;
		var port = s.port||srv.tn_port;
		
		s.ts = null;
		
		s.ts = net.createConnection(port, host, function () {
			srv.log('new connection routed to ' + host + ':' + port + ' for ' + s.remoteAddress);
			if (d)
				s.ts.write(d);
		});
		
		s.ts
		.on("connect", function() {

			var p = srv.prt;

				
				if (srv.gmcp.enabled) {
							
					s.ts.write(p.CAN_GMCP);
					
					if (s.bedlam)
						for (var t = 0; t < srv.gmcp.bedlam.length; t++)
							srv.sendGMCP(s, srv.gmcp.bedlam[t]);
					else
						for (var t = 0; t < srv.gmcp.portal.length; t++)
							srv.sendGMCP(s, srv.gmcp.portal[t]);
					
					srv.sendGMCP(s, 'client_ip ' + s.remoteAddress);
				}
				
				if (srv.ttype.enabled) {
					
					if (s.ttype)
						srv.sendTTYPE(s, s.ttype);
					
					if (s.bedlam)
						for (var t = 0; t < srv.ttype.bedlam.length; t++)
							srv.sendTTYPE(s, srv.ttype.bedlam[t]);
					else
						for (var t = 0; t < srv.ttype.portal.length; t++)
							srv.sendTTYPE(s, srv.ttype.portal[t]);
					
					srv.sendTTYPE(s, 'client_ip ' + s.remoteAddress);
				}
				
				s.ts.write(p.DO_MSDP);
				
				if (s.mxp) {
					setTimeout(function() {
						s.ts.write(p.DO_MXP);
					}, 1000)
				}
				
				if (s.utf8) {
					setTimeout(function() {
						s.ts.write(p.WILL_CHARSET);
					}, 1000);
					setTimeout(function() {
						s.ts.write(p.WILL_UTF8);
					}, 1500);
				}
				
				if (s.mccp) {
					setTimeout(function() {
						s.ts.write(p.CAN_MCCP);
					}, 3000);
				}
		})
		.on("data", function (data) {
			srv.sendClient(s, data);
		})
		.on("timeout", function () { 
			srv.log('telnet socket timeout: '+s);
			s.write(new Buffer("Timeout: server port is down.\r\n").toString('base64'));
			srv.closeSocket(s);
		})
		.on("close", function () { 
			srv.log('telnet socket closed: '+s.remoteAddress);
			srv.closeSocket(s);
		})
		.on("error", function (err) { 
			s.write(new Buffer(err).toString('base64'));
			srv.closeSocket(s);
		});
	},
	
	sendClient: function(s, data) {
		
		var p = srv.prt;
		
		if (s.mxp) {
		  for (i = 0; i < data.length; i++)	
			if (data[i] == p.IAC && data[i+2] == p.MXP) {
				if (s.debug) {
					srv.log('received IAC * MXP', s);
				}
				if (!s.sentMXP) {
					s.ts.write(p.DO_MXP);
					s.sentMXP = 1;
				}
			}
			//if (data.toString().indexOf('<VERSION>') != -1) {
				//srv.sendMXP(s, '<VERSION MXP=0.1 STYLE=1 CLIENT=mudportal.com VERSION=1.0>');
			//}
		}
		
		if (s.mccp) {
		  for (i = 0; i < data.length; i++)	
			if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.MCCP2) {
				
				if (i)
					srv.sendClient(s, data.slice(0, i));
				
				data = data.slice(i+5);
				s.compressed = 1;
				if (!data.length)
					return;
			}
		}
		 
		if (s.debug) {
			srv.log('raw: '+data);
		}
		
		if (!srv.compress || (s.mccp && s.compressed)) {
			s.write(data.toString('base64'));
			return;
		}
			
		/* Compression */
		zlib.deflateRaw(data, function(err, buffer) {
			if (!err) {
				s.write(buffer.toString('base64'));
				/*if (s.debug) {
					srv.log('to client: ' + buffer.toString('base64'));
					srv.log(JSON.stringify(buffer));
				}*/
			}
			else 
				srv.log('zlib error: ' + err);
		});	
	},
	
	chat: function(s, req) {
		
		if (!req.name) {
			return;
		}
		
		if (req.quit) {
		  var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				srv.sendClient(ss[i], srv.prt.START);
					srv.sendClient(ss[i], JSON.stringify({ sitechat: 1, msg: req.name+' has quit chat.' }));
				srv.sendClient(ss[i], srv.prt.STOP);
			}
		  	s.chat = 0;
			return;
		}
		
		if (!s.chat) {
		  var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				srv.sendClient(ss[i], srv.prt.START);
					srv.sendClient(ss[i], JSON.stringify({ sitechat: 1, msg: req.name+' has joined chat.' }));
				srv.sendClient(ss[i], srv.prt.STOP);
			}
		  s.chat = 1;
		}
		
		if (req.text && req.name) {
		  var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				srv.sendClient(ss[i], srv.prt.START);
					srv.sendClient(ss[i], JSON.stringify(req));
				srv.sendClient(ss[i], srv.prt.STOP);
			}
		}
	},
	
	originAllowed: function(o) {
		return 1;
	},

	log: function(msg, s) {
		if (!s) 
			s = { remoteAddress: 'server' };
		console.log(u.format((new Date()) + ' %s: %s', s.remoteAddress, msg));
	},
	
	die: function(core) {
		srv.log("Dying gracefully in 3 sec.");
		var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				ss[i].write('Proxy server is going down...'); /* inform clients so they can hop to another instance faster */
				setTimeout(srv.closeSocket, 10, ss[i]);
			}
		//db.end();
		setTimeout(process.exit, 3000, core?3:0); /* send SIGQUIT if core dump */
	}
}

process.stdin.resume();

process
.on( 'SIGINT', function () {
	srv.log('Got SIGINT.');
	srv.die();
})
.on('SIGABRT', function () {
	srv.log('Got SIGABRT.');
	srv.die();
})
.on('SIGSEGV', function () {
	srv.log('Got SIGSEGV.');
	srv.die(true);
})
.on('SIGTERM', function () {
	srv.log('Got SIGTERM.');
	srv.die();
});

srv.init();
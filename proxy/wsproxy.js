/*  
 	Lightweight Websocket <-> Telnet Proxy
 	
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
var ug = require("uglify-js");
var ws = require('websocket').server;
var fs = require('fs');

var first = (typeof srv == 'undefined');

srv = {

	path: '/home/plamen/BEDLAM_CODER/src/',
	
	ws_port: 6200, /* this websocket proxy port */
	
	tn_host: "localhost", /* default telnet host */
	
	tn_port: 9000, /* default telnet/target port */
	
	debug: false, /* enable additional debugging */
	
	compress: true, /* use node zlib (different from mccp) - you want this turned off unless your client can inflate data */
	
	open: true, /* set to false while server is shutting down */
	
	ttype: {
		enabled: 1,		
		portal:	["mudportal.com", "XTERM-256color", "MTTS 141"],
		bedlam: ["WEB 2.0"]
	},
	
	gmcp: {
		enabled: 1,
		portal: ['client mudportal.com', 'client_version 1.0'],
		bedlam: ['client Web', 'client_version 2.0']
	},
	
	prt: {
		WILL_ATCP: 		new Buffer([ 255, 251, 200 ]),
		WILL_GMCP: 		new Buffer([ 255, 251, 201 ]),
		DO_MCCP: 		new Buffer([ 255, 253, 86 ]),
		DO_MSDP: 		new Buffer([ 255, 253, 69 ]),
		DO_MXP: 		new Buffer([ 255, 253, 91 ]),
		WILL_MXP: 		new Buffer([ 255, 251, 91 ]),
		START: 			new Buffer([ 255, 250, 201 ]),
		STOP:   		new Buffer([ 255, 240 ]),
		WILL_TTYPE:		new Buffer([ 255, 251, 24 ]),
		WILL_NEW:		new Buffer([ 255, 251, 39 ]),
		WONT_NAWS:		new Buffer([ 255, 252, 31 ]),
		SGA:	3,
		NEW:	39,
		TTYPE:  24,
		MCCP2:	86,
		MSDP:	69,
		MSDP_VAR: 1,
		MSDP_VAL: 2,
		MXP:	91,
		ATCP:	200,
		GMCP:	201,
		SE:		240,
		SB:		250,
		WILL:	251,
		WONT:	252,
		DO:		253,
		DONT:	254,
		IAC:	255,
		IS:		0,
		REQUEST:	1,
		ECHO:		1,
		VAR:		1,
		ACCEPTED:	2,
		REJECTED:	3,
		CHARSET: 42,
		ESC:	33,
		NAWS: 	31,
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
		srv.log('(rs): new connection');
	},

	forward: function(s, d) {
		if (s.ts) {
			if (s.debug)
				srv.log('forward: ' + d, s);
			s.ts.send(d);
		}
	},

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

	init: function() {
		
		server = {
			sockets: []
		};
		
		var webserver = http.createServer(function(request, response) {
			response.writeHead(404);
			response.end();
		}, function(err) {
			srv.log(err);
		});

		webserver.listen(srv.ws_port, function() {
			srv.log('(ws) server listening: port ' + srv.ws_port);
		});

		wsServer = new ws({
			httpServer: webserver,
			autoAcceptConnections: false
		})
		.on('request', function(request) {

			if (!srv.open || !srv.originAllowed(request.origin)) {
				request.reject();
				srv.log('(ws) connection from ' + request.origin + ' rejected');
				return;
			}

			var s = request.accept(null, request.origin);

			srv.log('(ws) new connection');
			server.sockets.push(s);
			
			srv.log('(ws) connection count: '+server.sockets.length);
	
			s.on('message', function(msg) {
				if (msg.type === 'utf8') {  
					msg = msg.utf8Data;
					if (!srv.parse(s, msg))
						srv.forward(s, msg);
				}
				else {
					srv.log('unrecognized msg type: ' + msg.type);
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
			
		})
		.on('error', function(err) {
			srv.log(err);
		});

		fs.watch(srv.path+'wsproxy.js', function (e, f) {
			if (srv['update-'+f]) 
				clearTimeout(srv['update-'+f]);
			srv['update-'+f] = setTimeout(function() { srv.loadF(f) }, 1000);
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
			srv.log('Client ttype set to ' + s.ttype, s);
		}
		
		if (req.mccp)
			s.mccp = req.mccp;
		
		if (req.utf8)
			s.utf8 = req.utf8;		
		
		if (req.debug)
			s.debug = req.debug;

		
		if (req.chat)
			srv.chat(s, req);
		
		if (req.connect) {
			if (req.bedlam)
				s.bedlam = 1;
			srv.initT(s);
		}
		
		if (req.bin && s.ts) {
			try {
				srv.log('Attempt binary send: '+req.bin);
				s.ts.send(new Buffer(req.bin));
			}
			catch(ex) {
				srv.log(ex);
			}
		}
		
		return 1;
	},
	
	sendTTYPE: function (s, msg) {
		if (msg) {
			var p = srv.prt;
			s.ts.send(p.WILL_TTYPE);
				s.ts.send(new Buffer([p.IAC, p.SB, p.TTYPE, p.IS]));
					s.ts.send(msg);
				s.ts.send(new Buffer([p.IAC, p.SE]));
			srv.log(msg);
		}
	},
	
	sendGMCP: function (s, msg) {
		s.ts.send(srv.prt.START);
			s.ts.send(msg);
		s.ts.send(srv.prt.STOP);
	},

	sendMXP: function (s, msg) {
		var p = srv.prt;
		s.ts.send(new Buffer([p.ESC]));
			s.ts.send('[1z' + msg);
		s.ts.send(new Buffer([p.ESC]));
			s.ts.send('[7z');	
	},
	
	sendMSDPPair: function (s, key, val) {
		var p = srv.prt;
		srv.log('sendMSDPPair '+key+'='+val, s);
		s.ts.send(new Buffer([p.IAC, p.SB, p.MSDP, p.MSDP_VAR]));
			s.ts.send(' '+key+' ');
		s.ts.send(new Buffer([p.MSDP_VAL]));
			s.ts.send(' '+val+' ');
		s.ts.send(new Buffer([p.IAC, p.SE]));
	},
	
	initT: function(so) {
		
		var s = so;
		var host = s.host||srv.tn_host;
		var port = s.port||srv.tn_port;
		
		if (s.bedlam)
			s.ttype = srv.ttype.bedlam.slice(0);
		else
			s.ttype = srv.ttype.portal.slice(0);
		
		s.ttype.push(s.remoteAddress);
		s.ttype.push(s.remoteAddress);
			
		s.compressed = 0;
		
		s.ts = net.createConnection(port, host, function () {
			srv.log('new connection to ' + host + ':' + port + ' for ' + s.remoteAddress);
		});
		
		s.ts.send = function(data) {
			if (s.debug) {
				var raw = [];
					for (var i = 0; i < data.length; i++)
						raw.push(u.format('%d', data[i]));
				srv.log('write bin: '+raw, s);
			}
			s.ts.write(data);
		};
		
		s.ts
		.on("connect", function() {

			var p = srv.prt;

			srv.log('new telnet socket connected'); 

			setTimeout(function() {
				s.utf8_negotiated = s.mccp_negotiated = s.mxp_negotiated = s.gmcp_negotiated = 1;
				s.new_negotiated = s.new_handshake = s.sga_negotiated = s.echo_negotiated = s.naws_negotiated = 1;
			}, 12000);
		
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
			//srv.initT(s);
		})
		.on("error", function (err) { 
			s.write(new Buffer(err).toString('base64'));
			srv.closeSocket(s);
		});
	},
	
	sendClient: function(s, data) {
		
		var p = srv.prt;
		
		if (!s.mccp_negotiated && !s.compressed) {
			for (i = 0; i < data.length; i++) {
				
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.MCCP2) {
					setTimeout(function() {
						srv.log("IAC DO MCCP2", s);
						s.ts.send(p.DO_MCCP);
					}, 6000);
				}
				else
				if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.MCCP2) {
				
					if (i)
						srv.sendClient(s, data.slice(0, i));
					
					data = data.slice(i+5);
					s.compressed = 1;
					srv.log('MCCP compression started', s);
					
					if (!data.length)
						return;
				}
			}
		}
		
		if (s.ttype.length) {
			  for (i = 0; i < data.length; i++)	{
					if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.TTYPE) {
						srv.log('IAC DO TTYPE <- IAC FIRST TTYPE', s);
						srv.sendTTYPE(s, s.ttype.shift());
						/*
						 * s.ts.send(p.WILL_TTYPE);
						for (i = 0; i < s.ttype.length; i++)	{
							srv.sendTTYPE(s, s.ttype.shift());
						}*/
					}
					else
					if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.TTYPE && data[i+3] == p.REQUEST) {
						srv.log('IAC SB TTYPE <- IAC NEXT TTYPE');
						srv.sendTTYPE(s, s.ttype.shift());
					}
			  }
		}
		
		if (!s.gmcp_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.GMCP) {
					
					srv.log('IAC DO GMCP', s);
					
					s.ts.send(p.WILL_GMCP);
					srv.log('IAC DO GMCP <- IAC WILL GMCP', s);
					
					if (s.bedlam) 
						for (var t = 0; t < srv.gmcp.bedlam.length; t++)
							srv.sendGMCP(s, srv.gmcp.bedlam[t]);
					else
						for (var t = 0; t < srv.gmcp.portal.length; t++)
							srv.sendGMCP(s, srv.gmcp.portal[t]);
					
					srv.sendGMCP(s, 'client_ip ' + s.remoteAddress);
					s.gmcp_negotiated = 1;
					
					if (s.host == 'mud.playbedlam.com') {
						if (s.bedlam) 
							for (var t = 0; t < srv.gmcp.bedlam.length; t++)
								srv.sendGMCP(s, srv.gmcp.bedlam[t]);
						else
							for (var t = 0; t < srv.gmcp.portal.length; t++)
								srv.sendGMCP(s, srv.gmcp.portal[t]);
						srv.sendGMCP(s, 'client_ip ' + s.remoteAddress);
					}
				}
			}	
		}

		if (!s.msdp_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.MSDP) {
					s.ts.send(p.DO_MSDP);
					srv.log("IAC WILL MSDP <- IAC DO MSDP", s);
					srv.sendMSDPPair(s, "CLIENT_ID", "mudportal.com");
					srv.sendMSDPPair(s, "CLIENT_VERSION", "1.0");
					srv.sendMSDPPair(s, "CLIENT_IP", s.remoteAddress);
					srv.sendMSDPPair(s, "XTERM_256_COLORS", "1");
					srv.sendMSDPPair(s, "MXP", "1");
					srv.sendMSDPPair(s, "UTF_8", "1");
					s.msdp_negotiated = 1;
				}
			}
		}
		
		if (!s.mxp_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.MXP) {
					s.ts.send(new Buffer([p.IAC, p.WILL, p.MXP]));
					srv.log("IAC DO MXP <- IAC WILL MXP", s);
					s.mxp_negotiated = 1;
				}
			}
		}
		
		if (!s.new_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.NEW) {
					s.ts.send(new Buffer([p.IAC, p.WILL, p.NEW]));
					srv.log("IAC WILL NEW-ENV", s);
					s.new_negotiated = 1;
				}
			}
		}
		else 
		if (!s.new_handshake) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.NEW && data[i+3] == p.REQUEST) {
					s.ts.send(new Buffer([p.IAC, p.SB, p.NEW, p.IS, p.IS]));
					s.ts.send(' "IPADDRESS" ');
					s.ts.send(new Buffer([p.REQUEST]));
					s.ts.send(' "' + s.remoteAddress + '" ');
					s.ts.send(new Buffer([p.IAC, p.SE]));
					srv.log("IAC NEW-ENV IP VAR SEND");
					s.new_handshake = 1;
				}
			}
		}
		
		if (!s.echo_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.ECHO) {
					s.ts.send(new Buffer([p.IAC, p.WILL, p.ECHO]));
					srv.log("IAC WILL ECHO <- IAC WONT ECHO");
					s.echo_negotiated = 1;
				}
			}
		}
		
		if (!s.sga_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.SGA) {
					s.ts.send(new Buffer([p.IAC, p.WONT, p.SGA]));
					srv.log("IAC WILL SGA <- IAC WONT SGA");
					s.sga_negotiated = 1;
				}
			}
		}
		
		if (!s.naws_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.NAWS) {
					s.ts.send(new Buffer([p.IAC, p.WONT, p.NAWS]));
					srv.log("IAC WILL SGA <- IAC WONT NAWS");
					s.naws_negotiated = 1;
				}
			}
		}
		
		if (!s.utf8_negotiated) {
			for (i = 0; i < data.length; i++) {
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.CHARSET) {
					s.ts.send(p.WILL_CHARSET);
					s.ts.send(p.WILL_UTF8);
					s.utf8_negotiated = 1;
					srv.log("IAC DO CHARSET <- IAC WILL CHARSET (UTF-8)", s);
				}
			}
		}
		
		if (s.debug) {
			/*var raw = [];
			for (i = 0; i < data.length; i++)
				raw.push(u.format('%d', data[i]));
			srv.log('bin: '+raw, s);*/
			srv.log('raw: '+data, s);
		}
		
		if (!srv.compress || (s.mccp && s.compressed)) {
			s.write(data.toString('base64'));
			return;
		}
			
		/* Client<->Proxy only Compression */
		zlib.deflateRaw(data, function(err, buffer) {
			if (!err) {
				s.write(buffer.toString('base64'));
			}
			else 
				srv.log('zlib error: ' + err);
		});	
	},
	
	loadF: function(f) {
		try {
			var fl = ug.minify(srv.path + f).code;
			eval(fl + '');
			srv.log('dyn.reload: ' + f); 
		} 
		catch(err) { 
			srv.log(f); 
			srv.log("Minify/load error: " + err);
			return;
		} 
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
				srv.sendClient(ss[i], srv.prt.START, JSON.stringify({ sitechat: 1, msg: req.name+' has joined chat.' }), srv.prt.STOP);
			}
		  s.chat = 1;
		}
		
		if (req.text && req.name) {
		  var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				srv.sendClient(ss[i], srv.prt.START, JSON.stringify(req), srv.prt.STOP);
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

if (first) {

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
}

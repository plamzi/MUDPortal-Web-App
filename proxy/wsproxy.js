/*  
 	Lightweight Websocket <-> Telnet Proxy
 	v1.3 - 2/27/2014
 	
 	Author: plamzi - plamzi@gmail.com 
 	MIT license
 	
 	Requires https://github.com/Worlize/WebSocket-Node
 	In your project root: npm install websocket
 	
 	Supports client setting any host and port prior to connect.
 	
 	Example (client-side JS):
 	
 		if (WebSocket) {
			var ws = new WebSocket('ws://mywsproxyserver:6200/');
			ws.onopen = function(e) { 
				ws.send('{ host: "localhost", port: 7000, connect: 1 }');
			};
		}
	
	Usage Notes:
		
		The server waits to receive { "connect": 1 } to begin connecting to
		a telnet client on behalf of the user, so you have to send it
		even if you are not passing it host and port from the client.
		
		JSON requests with { "chat": 1 } will be intercepted and handled
		by the basic in-proxy chat system.
	
*/

var u = require('util');
var net = require('net');
var http = require('http');
var zlib = require('zlib');
var fs = require('fs');

var ug = require("uglify-js");
var ws = require('websocket').server;
var iconv = require('iconv-lite');
iconv.extendNodeEncodings();

var first = (typeof srv == 'undefined');

process.chdir(__dirname);

stringify = function(A) {
	var cache = [];
	var val = JSON.stringify(A, function(k, v) {
	    if (typeof v === 'object' && v !== null) {
	        if (cache.indexOf(v) !== -1)
	            return;
	        cache.push(v);
	    }
	    return v;
    });
    return val;
}

dump = function(o) {
	console.log(stringify(o));
}

srv = {

	path: __dirname,
	
	ws_port: 6200, /* this websocket proxy port */
	
	tn_host: "localhost", /* default telnet host */
	
	tn_port: 9000, /* default telnet/target port */
	
	debug: false, /* enable additional debugging */
	
	compress: true, /* use node zlib (different from mccp) - you want this turned off unless your server can't do MCCP and your client can inflate data */
	
	open: true, /* set to false while server is shutting down */
	
	ttype: {
		enabled: 1,		
		portal:	["mudportal.com", "XTERM-256color", "MTTS 141"]
	},
	
	gmcp: {
		enabled: 1,
		portal: ['client mudportal.com', 'client_version 1.0']
	},
	
	prt: {
		WILL_ATCP: 		new Buffer([ 255, 251, 200 ]),
		WILL_GMCP: 		new Buffer([ 255, 251, 201 ]),
		DO_GMCP: 		new Buffer([ 255, 253, 201 ]),
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
		WILL_UTF8:		new Buffer([ 255, 250, 42, 2, 85, 84, 70, 45, 56, 255, 240 ]),
		ACCEPT_UTF8:	new Buffer([ 255, 250, 2, 34, 85, 84, 70, 45, 56, 34, 255, 240 ]),
		//WILL_UTF8:		new Buffer([ 255, 250, 42, 2, "UTF-8", 255, 240 ])
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

	init: function() {
		
		server = {
			sockets: []
		};
		
		chatlog = require(__dirname + '/chat.json');
		
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
			autoAcceptConnections: false,
			keepalive: true
		})
		.on('request', function(request) {

			if (!srv.open || !srv.originAllowed(request.origin)) {
				request.reject();
				srv.log('(ws) connection from ' + request.origin + ' rejected');
				return;
			}

			var s = request.accept(null, request.origin);
			s.ttype = [];
			
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
				//srv.closeSocket(s);
			});
			
		})
		.on('error', function(err) {
			srv.log(err);
		});

		fs.watch(srv.path+'/wsproxy.js', function (e, f) {
			if (srv['update-'+f]) 
				clearTimeout(srv['update-'+f]);
			srv['update-'+f] = setTimeout(function() { srv.loadF(f) }, 1000);
		});
		
	}, 
 
	parse: function(s, d) {
		
		if (d[0] != '{') 
			return 0;
		
		try { var req = eval('('+d+')') }
		catch(err) { srv.log('parse: '+err); return 0; };

		if (req.host) {
			s.host = req.host;
			srv.log('Target host set to ' + s.host, s);
		}
		
		if (req.port) {
			s.port = req.port;
			srv.log('Target port set to ' + s.port, s);
		}
		
		if (req.ttype) {
			s.ttype = [req.ttype];
			srv.log('Client ttype set to ' + s.ttype, s);
		}
		
		if (req.name)
			s.name = req.name;
		
		if (req.client)
			s.client = req.client;
		
		if (req.mccp)
			s.mccp = req.mccp;
		
		if (req.utf8)
			s.utf8 = req.utf8;		
		
		if (req.debug)
			s.debug = req.debug;

		if (req.chat)
			srv.chat(s, req);
		
		if (req.connect) 
			srv.initT(s);
		
		if (req.bin && s.ts) {
			try {
				srv.log('Attempt binary send: '+req.bin);
				s.ts.send(new Buffer(req.bin));
			}
			catch(ex) {
				srv.log(ex);
			}
		}
		
		if (req.msdp && s.ts) {
			try {
				srv.log('Attempt msdp send: '+stringify(req.msdp));
				srv.sendMSDP(s, req.msdp);
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
			s.ts.write(p.WILL_TTYPE);
				s.ts.write(new Buffer([p.IAC, p.SB, p.TTYPE, p.IS]));
					s.ts.send(msg);
				s.ts.write(new Buffer([p.IAC, p.SE]));
			srv.log(msg);
		}
	},
	
	sendGMCP: function (s, msg) {
		s.ts.write(srv.prt.START);
			s.ts.write(msg);
		s.ts.write(srv.prt.STOP);
	},

	sendMXP: function (s, msg) {
		var p = srv.prt;
		s.ts.write(new Buffer([p.ESC]));
			s.ts.write('[1z' + msg);
		s.ts.write(new Buffer([p.ESC]));
			s.ts.write('[7z');	
	},
	
	sendMSDP: function (s, msdp) {
	
		var p = srv.prt;
		srv.log('sendMSDP '+ stringify(msdp), s);
		
		if (!msdp.key || !msdp.val)
			return;
		
		s.ts.write(new Buffer([p.IAC, p.SB, p.MSDP, p.MSDP_VAR]));
		s.ts.write(msdp.key);
		
		msdp.val = msdp.val.pop?msdp.val:[msdp.val];
		
		for (var i = 0; i < msdp.val.length; i++) {
			s.ts.write(new Buffer([p.MSDP_VAL]));
				s.ts.write(msdp.val[i]);
		}
		
		s.ts.write(new Buffer([p.IAC, p.SE]));
	},
	
	sendMSDPPair: function (s, key, val) {
		var p = srv.prt;
		srv.log('sendMSDPPair '+key+'='+val, s);
		s.ts.write(new Buffer([p.IAC, p.SB, p.MSDP, p.MSDP_VAR]));
			s.ts.write(key);
		s.ts.write(new Buffer([p.MSDP_VAL]));
			s.ts.write(val);
		s.ts.write(new Buffer([p.IAC, p.SE]));
	},
	
	initT: function(so) {
		
		var s = so;
		var host = s.host||srv.tn_host;
		var port = s.port||srv.tn_port;
		
		if (!s.ttype)
			s.ttype = [];
		
		s.ttype = s.ttype.concat(srv.ttype.portal.slice(0));
		s.ttype.push(s.remoteAddress);
		s.ttype.push(s.remoteAddress);
			
		s.compressed = 0;
		
		s.ts = net.createConnection(port, host, function () {
			srv.log('new connection to ' + host + ':' + port + ' for ' + s.remoteAddress);
		});
		
		//s.ts.setEncoding('binary');
		
		s.ts.send = function(data) {
			
/*		
			if (s.debug) {
				var raw = [];
					for (var i = 0; i < data.length; i++)
						raw.push(u.format('%d', data[i]));
				//srv.log('write bin: '+raw, s);
			}
*/
			
			try {
				data = iconv.encode(data, 'latin1');
				//console.log(data);
			} catch(ex) {
				console.log(ex);
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
			
			srv.chatUpdate();
		})
		.on("data", function (data) {
			srv.sendClient(s, data);
		})
		.on("timeout", function () { 
			srv.log('telnet socket timeout: '+s);
			s.sendUTF(new Buffer("Timeout: server port is down.\r\n").toString('base64'));
			srv.closeSocket(s);
		})
		.on("close", function () { 
			srv.log('telnet socket closed: '+s.remoteAddress);
			srv.closeSocket(s);
			srv.chatUpdate();
			//srv.initT(s);
		})
		.on("error", function (err) { 
			s.sendUTF(new Buffer(err).toString('base64'));
			srv.closeSocket(s);
		});
	},
	
	closeSocket: function(s) {
		
		if (s.ts) {
			srv.log('closing telnet socket: ' + s.host||srv.tn_host + ':' + s.port||srv.tn_port);
			s.ts.destroy();
		}
		
		var i = server.sockets.indexOf(s);
		if (i != -1) 
			server.sockets.splice(i, 1);
		
		srv.log('closing socket: ' + s.remoteAddress);
		
		if (s.destroy) 
			s.destroy();
		else 
			s.socket.destroy();
		
		srv.log('active sockets: ' + server.sockets.length);
	},
	
	sendClient: function(s, data) {
		
		var p = srv.prt;
		
		if (s.mccp && !s.mccp_negotiated && !s.compressed) {
			for (i = 0; i < data.length; i++) {
				
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.MCCP2) {
					setTimeout(function() {
						srv.log("IAC DO MCCP2", s);
						s.ts.write(p.DO_MCCP);
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
				if (data[i] == p.IAC && ( data[i+1] == p.DO || data[i+1] == p.WILL ) && data[i+2] == p.GMCP) {
					
					srv.log('IAC DO GMCP', s);
					
					if (data[i+1] == p.DO)
						s.ts.write(p.WILL_GMCP);
					else
						s.ts.write(p.DO_GMCP);
					
					srv.log('IAC DO GMCP <- IAC WILL GMCP', s);
					
					s.gmcp_negotiated = 1;
					
					for (var t = 0; t < srv.gmcp.portal.length; t++) {
						
						if (t == 0 && s.client) {
							srv.sendGMCP(s, 'client ' + s.client);
							continue;
						}
						
						srv.sendGMCP(s, srv.gmcp.portal[t]);
					}

					srv.sendGMCP(s, 'client_ip ' + s.remoteAddress);
				}
			}	
		}

		if (!s.msdp_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.MSDP) {
					s.ts.write(p.DO_MSDP);
					srv.log("IAC WILL MSDP <- IAC DO MSDP", s);
					srv.sendMSDPPair(s, "CLIENT_ID", s.client||"mudportal.com");
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
					s.ts.write(new Buffer([p.IAC, p.WILL, p.MXP]));
					srv.log("IAC DO MXP <- IAC WILL MXP", s);
					s.mxp_negotiated = 1;
				}
				else
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.MXP) {
					s.ts.write(new Buffer([p.IAC, p.DO, p.MXP]));
					srv.log("IAC WILL MXP <- IAC DO MXP", s);
					s.mxp_negotiated = 1;
				}
			}
		}
		
		if (!s.new_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.NEW) {
					s.ts.write(new Buffer([p.IAC, p.WILL, p.NEW]));
					srv.log("IAC WILL NEW-ENV", s);
					s.new_negotiated = 1;
				}
			}
		}
		else 
		if (!s.new_handshake) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.NEW && data[i+3] == p.REQUEST) {
					s.ts.write(new Buffer([p.IAC, p.SB, p.NEW, p.IS, p.IS]));
					s.ts.write('IPADDRESS');
					s.ts.write(new Buffer([p.REQUEST]));
					s.ts.write(s.remoteAddress);
					s.ts.write(new Buffer([p.IAC, p.SE]));
					srv.log("IAC NEW-ENV IP VAR SEND");
					s.new_handshake = 1;
				}
			}
		}
		
		if (!s.echo_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.ECHO) {
					//s.ts.send(new Buffer([p.IAC, p.WILL, p.ECHO]));
					srv.log("IAC WILL ECHO <- IAC WONT ECHO");
					s.echo_negotiated = 1;
				}
			}
		}
		
		if (!s.sga_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.SGA) {
					s.ts.write(new Buffer([p.IAC, p.WONT, p.SGA]));
					srv.log("IAC WILL SGA <- IAC WONT SGA");
					s.sga_negotiated = 1;
				}
			}
		}
		
		if (!s.naws_negotiated) {
			for (i = 0; i < data.length; i++)	{
				if (data[i] == p.IAC && data[i+1] == p.WILL && data[i+2] == p.NAWS) {
					s.ts.write(new Buffer([p.IAC, p.WONT, p.NAWS]));
					srv.log("IAC WILL SGA <- IAC WONT NAWS");
					s.naws_negotiated = 1;
				}
			}
		}
		
		if (!s.utf8_negotiated) {
			for (i = 0; i < data.length; i++) {
				
				if (data[i] == p.IAC && data[i+1] == p.DO && data[i+2] == p.CHARSET) {
					s.ts.write(p.WILL_CHARSET);
					srv.log("IAC DO CHARSET <- IAC WILL CHARSET", s);
				}
				
				if (data[i] == p.IAC && data[i+1] == p.SB && data[i+2] == p.CHARSET) {
					s.ts.write(p.ACCEPT_UTF8);
					srv.log("UTF-8 negotiated", s);
					s.utf8_negotiated = 1;
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
			s.sendUTF(data.toString('base64'));
			return;
		}
		
		/* Client<->Proxy only Compression */
		zlib.deflateRaw(data, function(err, buffer) {
			if (!err) 
				s.sendUTF(buffer.toString('base64'));
			else 
				srv.log('zlib error: ' + err);
		});
			
	},
	
	loadF: function(f) {
		try {
			var fl = ug.minify(srv.path + '/' + f).code;
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
		
		srv.log("chat: "+stringify(req), s);
		s.chat = 1;
		
		var ss = server.sockets;
		
		if (!chatlog)
			chatlog = [];

		if (req.channel && req.channel == 'op') {

			//chatlog = chatlog.filter(function(l) { return (l[1].channel == 'status')?0:1 });
			var temp = chatlog.concat().slice(-300), users = [];
			
			for (var i = 0; i < ss.length; i++) {

				if (!ss[i].ts && ss[i].name)
					continue;

				if (ss[i].ts)
					//var u = '\x1b<span style="color: #01c8d4"\x1b>' + (ss[i].name||'Guest') + '\x1b</span\x1b>@'+ss[i].host;
					var u = (ss[i].name||'Guest') + '@'+ss[i].host;
				else 
					var u = (ss[i].name||'Guest') + '@chat';
				
				if (users.indexOf(u) == -1)
					users.push(u);
			}

			temp.push([new Date(), { channel: 'status', name: 'online:', msg: users.join(', ')}]);
			var t = stringify(temp);
			t = this.chatCleanup(t);
			
			s.sendUTF("portal.chatlog " + t);
			//fs.writeFileSync("./chat.json", stringify(chatlog));
			return;
		}
		
		delete req.chat;
		chatlog.push([new Date(), req]);
		req.msg = this.chatCleanup(req.msg);
		
		for (var i = 0; i < ss.length; i++) {
			if (ss[i].chat)
				ss[i].sendUTF("portal.chat " + stringify(req));
		}
		
		var res = fs.writeFileSync("./chat.json", stringify(chatlog));
	},
	
	chatUpdate: function() {
		var ss = server.sockets;
		for (var i = 0; i < ss.length; i++)
			if (ss[i].chat)
				srv.chat(ss[i], { channel: 'op' });
	},
	
	chatCleanup: function(t) {
		t = t.replace(/([^\x1b])</g,'$1&lt;');
		t = t.replace(/([^\x1b])>/g,'$1&gt;');
		t = t.replace(/\x1b>/g,'>');
		t = t.replace(/\x1b</g,'<');
		return t;
	},
	
	originAllowed: function(o) {
		return 1;
	}, 

	log: function(msg, s) {
		if (!s)
			s = { remoteAddress: '[]' };
		console.log(u.format((new Date()) + ' %s: %s', s.remoteAddress, msg));
	},
	
	die: function(core) {
		srv.log("Dying gracefully in 3 sec.");
		var ss = server.sockets;
			for (var i = 0; i < ss.length; i++) {
				ss[i].write('Proxy server is going down...'); /* inform clients so they can hop to another instance faster */
				setTimeout(srv.closeSocket, 10, ss[i]);
			}
		setTimeout(process.exit, 3000, core?3:0); /* send SIGQUIT if core dump */
	}
}

if (first) {

	chatlog = [];
	
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

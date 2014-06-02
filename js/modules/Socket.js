var Socket = function(o) {
	
	var self = this, ws = {}, out = o.out||Config.ScrollView, connected = 0;	
	var proxy = o.proxy||'ws://www.cloudgamer.org:6200/';
	o.type = o.type||'telnet';
	var host = o.host, port = o.port;
	var buff = '';
	var z_lib, z_stream, z_raw, utf8;
	var colorize = new Colorize();
	var cmds = [], cmdi = 0, echo = 1;
	var keepcom = (Config.getSetting('keepcom') == null || Config.getSetting('keepcom') == 1);
	
	var prot = {
		IS:			0,
		REQUEST:	1,
		ACCEPTED:	2,
		REJECTED:	3,
		TTYPE:  	24,		
		ESC:		33,
		CHARSET: 	42,
		MCCP2:		86,
		MSDP:		69,
		MXP:		91,
		WILL:		251,
		ATCP:		200,
		GMCP:		201,
		SE:			240,
		SB:			250,
		WONT:		252,
		DO:			253,
		DONT:		254,
		IAC:		255
	};
	
	var onOpen = function(evt) {
		
		log('Socket: connected');
		
		connected = 1;
		
		if (!o.proxy && o.type == 'telnet') {
			ws.send(stringify({
				host: o.host,
				port: o.port,
				utf8: 1,
				mxp: 1,
				connect: 1,
				mccp: Config.device.mobile?0:1,
				debug:	Config.debug,
				client: o.client,
				ttype: o.ttype,
				name: user.username||'Guest'
			}));
		}

		if (o.onOpen)
			o.onOpen(evt);
		
		Event.fire('socket_open', self);
		
		setInterval(function() {
			ws.send('{ "ping": 1 }');
		}, 10000);
		
	}
	
	var onClose = function(evt) {
		
		Event.fire('socket_before_close', self);

		ws.close();
		
		connected = z_lib = 0;
		
		if (z_stream)
			ZLIB.inflateEnd(z_stream);
		
		if (out)
			out.add('<span style="color: green;">Remote server has disconnected. Refresh page to reconnect.<br></span>');
		
		if (o.onClose)
			o.onClose(evt);
		
		Event.fire('socket_close', self);
		
		log('Socket: closed');
	}

	var onMessage = function (e) {
		
		if (Event.q['socket_data']) {
			var raw = e.data;
			raw = Event.fire('socket_data', raw, self);
			//log('after socket_data raw is '+raw);
			if (!raw)
				return;
		}
		
		if (!z_lib) {
			try {
				var bits = new Base64Reader(e.data);
				var inflator = new Inflator(bits);
				var translator = new Utf8Translator(inflator);
				var reader = new TextReader(translator);
				buff += reader.readToEnd();
			}
			catch(ex) {
				z_lib = 1;
				console.log('Attempting zlib stream decompression (MCCP).');
			}
		}

		if (z_lib) {
			var bits = new Base64Reader(e.data);
			z_raw = '';
			
			while ((b = bits.readByte()) != -1)
				z_raw += String.fromCharCode(b);
			
			if (!z_stream)
				z_stream = ZLIB.inflateInit();
			
			z_raw = z_stream.inflate(z_raw);
			
			var char = new CharReader(z_raw);
			var translator = new Utf8Translator(char);
			var reader = new TextReader(translator);
			buff += reader.readToEnd();
		}
		
		process();
	}
  
	var	onError = function(evt) {
		out.add('<span style="color: red;">Error: telnet proxy may be down.<br></span>');
	}

	var getHistory = function() {
		//log(cmds);
		return cmds;	
	}
	
	var send = function(msg) {

		console.log('Socket.send');
		
		log(msg);
		
		msg = msg.trimm();
		msg = Event.fire('before_send', msg, self);
		
		if (!msg.has('macro') && !msg.has('alias') && !msg.has('trig') && Config.separator.length) {
			var re = new RegExp(Config.separator, 'g');
			msg = msg.replace(re, '\r\n');
		}
		
		if (ws.send && connected)
			ws.send(msg + '\r\n');
		else 
			if (out)
				out.add('<span style="color: green;">WARNING: please connect first.<br></span>');
		if (out)
			out.echo(msg);
	}
	
	var sendBin = function(msg) {
		log('Socket.sendBin: ' + msg);
		ws.send(stringify({ bin: msg }));
	}
	/*
	var multiprocess = function()  {
		var i = 0, limit = 100, processing = 0, busy = 0;
		var processor = setInterval(function() {
			if(!busy) {  
				busy = 1;
					process();
						if(++i == limit)
							clearInterval(processor);
				busy = 0;
			}
		}, 100);
	}*/
	
	var process = function() {

		if (!buff.length) 
			return;
			
		var B = buff;
		buff = '';
		B = prepare(B);
			out.add(B);
		
		Event.fire('after_display', B);
	}
	
	var prepare = function(t) {
		
		log(t);
		
		/* prevent splitting ansi escape sequences & MXP */
		if (t.match(/(\x1b|\x1b\[|\x1b[^mz>]+?[^mz>])$/)) {
			log('Code split protection is waiting for more input.');
			buff = t;
			return '';
		}
		
		t = Event.fire('before_process', t);

		/*
		 if (t.has('\x01') && Config.debug)
			for (var i = 0; i < t.length; i++)
				log(t[i] + ': ' + String.charCodeAt(t[i]));
		 */
		
		/* msdp */
		if (t.has('\xff\xfaE')) { 
			var m = t.match(/\xff\xfaE([^]+?)\xff\xf0/gm);
			//log('MSDP from server');
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					log(m[i]);
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('msdp', d);
					t = t.replace(m[i], '');
				}
			}
		}

		t = Event.fire('internal_mxp', t);

		if (!utf8 && t.has('ÿú* UTF-8ÿð')) {
			utf8 = 1;
			log('UTF-8 enabled.');
			t = t.replace(/ÿú.. UTF-8../, '');
		}
		
		/* gmcp */
		if (t.has('\xff\xfa\xc9')) {
			var m = t.match(/\xff\xfa\xc9([^]+?)\xff\xf0/gm);
			//log('GMCP from server');
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('gmcp', d);
					log("gmcp: "+d);
					t = t.replace(m[i], '');
				}
			}
			/* avoid splitting gmcp */
			if (t.has('\xff\xfa\xc9')) {
				buff = t;
				return '';
			}
		}
		
		/* atcp */					
		if (t.has('\xff\xfa\xc8')) {
			var m = t.match(/\xff\xfa\xc8([^]+?)\xff\xf0/gm);
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('atcp', d);
					t = t.replace(m[i], '');
				}
			}
		}
		
		t = Event.fire('after_protocols', t, self);
		
		t = t.replace(/([^\x1b])</g,'$1&lt;');
		t = t.replace(/([^\x1b])>/g,'$1&gt;');
		t = t.replace(/\x1b>/g,'>');
		t = t.replace(/\x1b</g,'<');

		if (t.has('\xff\xfb\x01')) {
			
			log('IAC WILL ECHO');
	
			if (Config.ScrollView)
				Config.ScrollView.echoOff();

			t = t.replace(/\xff.\x01/g,'');
		}
		
		if (t.has('\xff\xfc\x01')) {
			
			log('IAC WONT ECHO');

			if (Config.ScrollView)
				Config.ScrollView.echoOn();

			t = t.replace(/\xff.\x01/g,'');
		}
		
		if (t.has('\x07'))
			new Audio('/app/sound/ding.mp3').play();
		
		t = Event.fire('before_html', t, self);
		t = t.replace(/([^"'])(http.*:\/\/[^\s\x1b"']+)/g,'$1<a href="$2" target="_blank">$2</a>');
		t = Event.fire('internal_colorize', t, self);
		
		t = t.replace(/\xff\xfa.+\xff\xf0/g,'');
		t = t.replace(/\xff(\xfa|\xfb|\xfc|\xfd|\xfe)./g,'');
		t = t.replace(/\x07/g,''); //bell
		t = t.replace(/\x1b\[1;1/g,''); //clear screen
		t = t.replace(/ÿ(ù|ï)/g,'');
		t = t.replace(/\x1b\[[A-Z0-9]/gi,''); //erase unsupported ansi control data
		t = t.replace(';0;37',''); //erase unsupported ansi control data
		//t = t.replace(/\x1b/g,'');
		
		 /* orphaned escapes still possible during negotiation */
		if (t.match(/^\x1b+$/))
			return '';
		
		t = t.replace(/\uFFFF/gi,''); /* utf-8 non-character */

		//console.log('before_display: '+t);

		t = t.replace(/\r/g,'');
		t = t.replace(/\n/g,'<br>');
		
		t = Event.fire('before_display', t);

		return t;
	}
	
	var connect = function() {
		log('Socket: connecting');
		ws = new WebSocket(proxy);
		ws.onopen = function(e) { onOpen(e) };
		ws.onclose = function(e) { onClose(e) };
		ws.onmessage = function(e) { onMessage(e) };
		ws.onerror = function(e) { onError(e) };
	}
	
	var echo = function(msg) {
		out.echo(msg);
	}

	if (o.proxy && out)
		out.add('<span style="color: green;">Setting websocket proxy to '+o.proxy+'.<br></span>');

	var self = {
		send: send,
		sendBin: sendBin,
		echo: echo,
		write: function(d) { if (connected) { ws.send(d + '\r\n'); log('Socket.write: '+d) } },
		getProxy: function() { return proxy },
		getSocket: function() { return ws },
		connected: function() { return connected }
	}
	
	connect();

	Config.socket = Config.Socket = self;
	return self;
	
}
var Socket = function(o) {
	
	var self, ws = {}, out = o.out, connected = 0;	
	var proxy = param('ws')?('ws://'+param('ws')+'/'):'ws://www.bedlambrawl.com:6200/';
	var host = o.host, port = o.port;
	var buff = '';
	var cmds = [], cmdi = 0;
	var z_lib, z_stream, z_raw, utf8;
	var colorize = new Colorize();
	
	var onOpen = function(evt) {
		
		connected = 1;
		
		var opt = {
			host: o.host,
			port: o.port,
			utf8: 1,
			mxp: 1,
			connect: 1,
			mccp: 1,
			debug:	Config.debug
		};
		
		ws.send(stringify(opt));
		
		out.title(host + ':' + port);
	}
	
	if (param('ws'))
		out.add('<br><span style="color: green;">Setting websocket proxy to '+param('ws')+'.</span><br>');
	
	var onClose = function(evt) {
		ws.close();
		connected = z_lib = 0;
		out.add('<br><span style="color: green;">Remote server has disconnected.</span><br>');
		setTimeout(function() { connect() }, 3000);
	}

	var onMessage = function (e) {
		
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
		
		multiprocess();
	}
  
	var	onError = function(evt) {
		out.add('<span style="color: red;">Error: telnet proxy may be down.</span><br>');
	}

	var send = function(msg) {

		//console.log('Socket.send');
		msg = msg.trimm();
		msg = Event.fire('before_send', msg, self);
		msg = msg.replace(/\;/g, '\r\n');
		
		if (ws.send && connected)
			ws.send(msg + '\r\n');
		else
			out.add('<span style="color: green;">WARNING: please connect first.</span><br>');
		
		out.echo(msg);
		cmds.push(msg);
	}
	
	var sendoob = function(msg) { /* not working yet */
		if (ws.send && connected)
			ws.send(msg);
	}
	
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
	}
	
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
		
		if (console)
			console.log(t);
		
		/* prevent splitting ansi escape sequences */
		if (t.match(/(\033|\033\[|\033[^mz>]+?[^mz>])$/)) {
			console.log('Code split protection is waiting for more input.');
			buff = t;
			return '';
		}
		
		t = t.replace(/\n/g,'');
		
		t = Event.fire('before_process', t, self);
		
		if (t.has('ÿú* UTF-8ÿð')) {
			utf8 = 1;
			console.log('UTF-8 enabled.');
			t = t.replace(/ÿú\* UTF\-8ÿð/, '');
		}
		
		/* gmcp */
		if (t.has('\xc9')) {
			var m = t.match(/\xff\xfa\xc9([\s\S]+?)\xff\xf0/gm);
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('gmcp', d);
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
		if (t.has('\xc8')) {
			var m = t.match(/\xff\xfa\xc8([\s\S]+?)\xff\xf0/gm);
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('atcp', d);
					t = t.replace(m[i], '');
				}
			}
		}
		
		/* msdp */
		if (t.has('\x45')) { 
			var m = t.match(/\xff\xfa\x45([\s\S]+?)\xff\xf0/gm);
			if (m && m.length) {
				for (i = 0; i < m.length; i++) {
					var d = m[i].substring(3, m[i].length-2);
					Event.fire('msdp', d);
					t = t.replace(m[i], '');
				}
			}
		}
		
		t = Event.fire('after_protocols', t, self);
		
		t = t.replace(/([^\x1b])</g,'$1&lt;');
		t = t.replace(/([^\x1b])>/g,'$1&gt;');
		t = t.replace(/\x1b>/g,'>');
		t = t.replace(/\x1b</g,'<');
		
		t = Event.fire('before_html', t, self);
		
		t = Event.fire('colorize', t, self);
		
		//[0;0;37mÿûV[0;0;37mÿþÉ[0;0;37mÿúÿð[0;0;37mÿý[0;0;37mÿý*[0;0;37mÿûE[0;0;37mÿûF[0;0;37mÿýÈ[0;0;37mÿûZ[0;0;37mÿý[[0;0;37mÿúÿð[0;0;37mÿúÿð[0;0;37mÿúÿð[0;0;37mÿúÿð[0;0;37                                    
		
		t = t.replace(/ÿþÉ/g,'');
		t = t.replace(/ÿý./g,'');
		t = t.replace(/ÿû[A-Z]/g,'');
		
		t = t.replace(/\xff./g,'');
		t = t.replace(/\xf0/g,'');
		t = t.replace(/\xfa/g,'');
		t = t.replace(/\xfb/g,'');
		t = t.replace(/\xc9/g,'');
		t = t.replace(/\xc8/g,'');
		t = t.replace(/\007/g,''); //bell
		t = t.replace(/\001/g,''); //secure text entry
		t = t.replace(/\033\[1;1/g,''); //clear screen

		//t = t.replace(/\x1b/g,'');
		//console.log('pre-EF\n'+t);
		t = t.replace(/\*EF[^]+?V/g,'');
		t = t.replace(/\*EFZ\[/g,'');
		t = t.replace(/([^"'])(http?:\/\/[^\s\x1b"']+)/g,'$1<a href="$2" target="_blank">$2</a>');
		
		 /* orphaned escapes still possible during negotiation */
		if (t.match(/^\033+$/))
			return '';
		
		t = t.replace(/\uFFFF/gi,''); /* utf-8 non-character */
		
		//console.log('before_display: '+t);
		
		t = Event.fire('before_display', t);

		return t;
	}
	
	var connect = function() {
		if (WebSocket) {
			ws = new WebSocket(proxy);
			o.ws = ws;
			ws.onopen = function(e) { onOpen(e) };
			ws.onclose = function(e) { onClose(e) };
			ws.onmessage = function(e) { onMessage(e) };
			ws.onerror = function(e) { onError(e) };
		}
	}
	
	var echo = function(msg) {
		out.echo(msg);
	}
	
	connect();
	
	if (Config.Device.touch) {
		j(out.id + ' .send').blur(function() {
			if (j(this).val().length) {
				var v = j(this).val();
				send(v);
				cmdi++;
				//this.setSelectionRange(0, 9999);
				this.select();
			}
			else ws.send('\r\n');
		});
		
		j(out.id + ' .send').focus(function() {
			//this.setSelectionRange(0, 9999);
			this.select();
		});
	}
	
	j(out.id + ' .send').focus().keydown(function(e) {
	
		if (e.which == 13) { /* enter */
			
			e.preventDefault();
			
			if (j(this).val().length) {
				var v = j(this).val();
				send(v);
				cmdi++;
				//this.setSelectionRange(0, 9999);
				this.select();
			}
			else ws.send('\r\n');
			
		}
		else if (e.keyCode == 38) { /* arrow up */
			
			e.preventDefault();
			
			if (cmdi)
				j(this).val(cmds[--cmdi]);
			this.select();
			//this.setSelectionRange(0, 9999);
		}
		else if (e.keyCode == 40) { /* arrow down */
			
			e.preventDefault();
			
			if (cmdi < cmds.length-1)
				j(this).val(cmds[++cmdi]);
			this.select();
			//this.setSelectionRange(0, 9999);
		}
	});
	
	return {
		send: send,
		sendoob: sendoob,
		echo: echo,
		setSelf: function(me) { self = me },
		getHost: function() { return host },
		getPort: function() { return port },
		getProxy: function() { return proxy }
	}
}
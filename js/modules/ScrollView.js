var ScrollView = function(o) {
	
	var self = this, ws = {}, sesslog = '', freeze, mobile = Config.device.mobile, touch = Config.device.touch, multi;
	var cmds = [], cmdi = 0, echo = 1;
	var keepcom = (Config.getSetting('keepcom') == null || Config.getSetting('keepcom') == 1);

	var o = o || {
		css: {
			width: Config.width,
			height: Config.height,
			top: Config.top,
			left: Config.left
		},
		local: 1, /* local echo */
		scrollback: 30 * 1000
	};

	if (Config.kong)
		o.css.height = j(window).height() - 3; 

	var id = '#scroll-view';
	
	o.local = (Config.getSetting('echo') == null || Config.getSetting('echo') == 1);	  
	o.echo = o.echo||1;
	
	var win = new Window({
		id: id,
		css: o.css,
		'class': 'scroll-view nofade',
		master: !Config.notrack,
		closeable: Config.ControlPanel
	});
	
	if (mobile) {

	    j('#page').css({
	        background: 'none no-repeat fixed 0 0 #000000',
	        margin: '0px auto'
	    });
	    
	    j('body').css({
	        width: '100%',
	        height: '100%',
	        overflow: 'auto'
	    });

	    win.maximize();
	}

	if (touch)
		j(id).css({ top: 0, left: 0 });

	win.button({
		title: 'Reconnect.',
		icon: 'icon-refresh',
		click: function() {
			echo('Attempting to reconnect...');
			Config.socket.reconnect();
		}
	});
	
	win.button({
		title: 'Increase the font size.',
		icon: 'icon-zoom-in',
		click: function(e) {
			var v = parseInt(j(id + ' .out').css('fontSize'));
			j(id + ' .out').css({
				fontSize: ++v + 'px',
				lineHeight: (v+5) + 'px'
			});
			j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight'));
			e.stopPropagation();
			return false;
		}
	});
	
	win.button({
		title: 'Decrease the font size.',
		icon: 'icon-zoom-out',
		click: function(e) {
			var v = parseInt(j(id + ' .out').css('fontSize'));
			j(id + ' .out').css({
				fontSize: --v + 'px',
				lineHeight: (v+5) + 'px'
			});
			j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight'));
			e.stopPropagation();
			return false;
		}
	});
	
	win.button({
		title: 'Download a session log.',
		icon: 'icon-download-alt',
		click: function(e) {
			var blob = new Blob(sesslog.split(), {type: "text/plain;charset=utf-8"});
			saveAs(blob, "log-"+Config.host+"-"+(new Date).ymd()+".txt");
			e.stopPropagation();
			return false;
		}
	});
	
	//if (Config.dev)
	win.button({
		title: 'Toggle a freezepane.',
		icon: 'icon-columns',
		click: function(e) {
			if (j(id + ' .freeze').length) {
				try {
					freeze.remove();
					j(id + ' .freeze').remove();
					j(id + ' .out').width('98%');
					j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight'));
				} catch(ex) { log(ex) }
			}
			else {
				j(id + ' .out').after('<div class="freeze">'+j(id + ' .out').html()+'</div>');
				j(id + ' .out').width('52%');
				freeze = j(id + ' .freeze').niceScroll({ 
					cursorwidth: 7,
					cursorborder: 'none'
				});
				j(id + ' .freeze').scrollTop(j(id + ' .freeze').prop('scrollHeight'));
				j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight'));
			}
			e.stopPropagation();
			return false;
		}
	});
	
	j(id + ' .content').append('\
		<div class="out nice"></div>\
		<div class="input">\
			<input class="send" autocomplete="on" autocorrect="off" autocapitalize="off" spellcheck="'+(Config.getSetting('spellcheck')?'true':'false')+'" placeholder="type a command..." aria-live="polite"/></div>\
	');
	
	if (mobile) {
		j(id + ' .out').css({
			'font-family': 'DejaVu Sans Mono',
			'font-size': '11px',
			height: '90%'
		});
	}
	else {
		
		j(id + ' .input').append('<a class="kbutton multiline tip" title="Send multi-line text." style="height: 16px !important; padding: 4px 8px !important; margin-left: 6px; position: relative; top: 3px;"><i class="icon-align-justify"></i></a>');
		
		multi = function(e, text) {
			
			var modal = new Modal({
				
				title: 'Multi-Line Input',
				text: '<textarea class="multitext" autocorrect="off" autocapitalize="off" spellcheck="'+(Config.getSetting('spellcheck')?'true':'false')+'">'+(text||'')+'</textarea>',
				closeable: 1,
				buttons: [
				     {
				    	 text: 'Send',
				    	 click: function() {
				    		 var msg = j('.multitext').val().split('\n');
				    		 var ws = Config.Socket.getSocket();
				    		 for (var i = 0; i < msg.length; i++) {
				    			 var go = function(msg) {
				    				return function() {
				    				 	ws.send(msg + '\r\n');
				    				 	echo(msg);
				    					//cmds.push(msg);
				    					//cmdi = cmds.length;
				    			 	}
				    		 	 }(msg[i]);
				    			 setTimeout(go, 100 * (i+1));
				    		 }
				    	 }
				     },
				     {
				    	 text: 'Cancel'
				     }
				]
			});
			
			j('#modal').on('shown', function() {
				j('.multitext').focus();
				//j('#modal').resizable();
			});
			
			if (e)
				e.stopPropagation();
			return false;
		}
		
		j(id).on('click', '.multiline', multi);
		
		if (!Config.embed && !Config.kong)
			j(id + ' .send').autocomplete({
				appendTo: "body",
				minLength: 2,
				source: function(request, response) {
					var c = cmds.filter(function (v, i, a) { return a.indexOf (v) == i }); 
					var results = j.ui.autocomplete.filter(c, request.term);
					response(results.slice(0, 5));
				}
			});
	}
	
	j(id + ' .out').niceScroll({ 
		cursorwidth: 7,
		cursorborder: 'none',
		railoffset: { top: -2, left: -2 }
	});
	
	/*
	j(id).on('mouseup', '.out, .freeze', function() {
		var t;
		if ((t = getSelText())) {
		
			if (t.match(/\n/) && Config.getSetting('automulti'))
				multi(null, t);
			else
				j(id + ' .send').val(j(id + ' .send').val()+t);
		}
	});
	
	if (!Config.device.touch)
		j(id).on('mouseup', '.out, .freeze', function() {
			if (!j(':focus').is('input, textarea'))
				j(id + ' .send').focus();
		});
	*/
	
	var scroll = function () { j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight')) };
	
	if (Config.device.mobile) {	
		
		j(id + ' .send').focus(function() {
			//this.setSelectionRange(0, 9999);
			//j(this).val('');
			j(id).height('82%');
			scroll();
		});
		
		j(id + ' .send').blur(function() {
			/*if (j(this).val().length) {
				ws.send(j(this).val());
				j(this).val('');
			}
			else ws.send('\r\n');*/
			win.maximize();
			scroll();
		});
		
		document.addEventListener('touchstart', function(e) {
		    scroll();
		    //var touch = e.touches[0];
		    //alert(touch.pageX + " - " + touch.pageY);
		}, false);
		
		j(id + ' .send').keydown(function(e) {
			
			if (e.which == 13) { /* enter */
				
				e.preventDefault();
				
				if (j(this).val().length) {
					ws.send(j(this).val());
					j(this).val('');
				}
				else ws.send('\r\n');
			}
		});
		
		j(id + ' .send').focus();
		setInterval(scroll, 2000);
	}
	else {
		
		j(id + ' .send').focus(function() {
			
			if (!j(this).is(":focus"))
				j(this).select();
		});
		
		j(id + ' .send').focus().keydown(function(e) {
			
			if (e.which == 13) { /* enter */
				
				e.preventDefault();
				
				if (j(this).val().length) {
					var v = j(this).val();
					ws.send(v);
					cmds.push(v);
					cmdi++;
					//this.setSelectionRange(0, 9999);
					if (keepcom)
						this.select();
					else
						j(this).val('');
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
	}
		
    Event.listen('internal_colorize', new Colorize().process);
    
    Event.listen('after_display', function(m) {
		try {
			sesslog += m.replace(/<br>/gi, '\n').replace(/<.+?>/gm, ''); 
		} catch(ex) { log('ScrollView.after_display ', ex); }
    	return m;
    });
    
	var add = function(A) {
		
		var my = j(id + ' .out');
		
		if (my[0].scrollHeight > o.scrollback) {
		
			j(id + ' .out').children().slice(0, 100).remove();
			
			var t = j(id + ' .out').html(), i = t.indexOf('<span');
			
			j(id + ' .out').html(t.slice(i));
		}
		
		my.append('<span>'+A+'</span>');
		scroll();
		
		if (j(id + ' .freeze').length)
			j(id + ' .freeze').append('<span>'+A+'</span>');
			
		Event.fire('scrollview_add', A, self);
	}
	
	var scroll = function() {
		j(id + ' .out').scrollTop(j(id + ' .out').prop('scrollHeight'));
	}
	
	var echo = function(msg) {
		
		if (!msg.length) 
			return;
			
		if (o.local && o.echo) {
			
			msg = msg.replace(/>/g,'&gt;');
			msg = msg.replace(/</g,'&lt;');
			
			add('<span style="font-size: 12px; color: gold; opacity: 0.6">' + msg + '</span><br>');
		}
	}
	
	var title = function(t) {
		win.title(t);
		document.title = t || param('name');
	}
	
	title(param('name') || (param('host') + ':' + param('port')));
	
	var echoOff = function() { o.echo = 0 }
	var echoOn = function() { o.echo = 1 }
	
	var self = {
		add: add,
		echo: echo,
		echoOff: echoOff,
		echoOn: echoOn,
		title: title,
		id: id,
		scroll: scroll,
		win: win
	}

	var ws = new Socket({
		host: param('host'),
		port: param('port'),
		proxy: Config.proxy,
		out: self
	});
	
	if (window.user && user.id) {
	
		Config.MacroPane = new MacroPane({
			socket: ws
		});
		
		if (!Config.nomacros) {
			Event.listen('before_send', Config.MacroPane.sub);
			self.echo('Activating macros.');
		}

		Config.TriggerHappy = new TriggerHappy({
			socket: ws
		});
		
		if (!Config.notriggers) {
			Event.listen('after_display', Config.TriggerHappy.respond);
			self.echo('Activating triggers.');
		}
	}
	
	Config.ScrollView = self;
	Event.fire('scrollview_ready', null, self);

	return self;
}
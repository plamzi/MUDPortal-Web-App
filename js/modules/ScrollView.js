var ScrollView = function(o) {
	
	var self = this, ws = {};
	var o = o||{};
	var id = '#scroll-view';
	
	o.local = (Config.getSetting('echo') == null || Config.getSetting('echo') == 1);	  
	o.echo = o.echo||1;
	
	var win = new Window({
		id: id,
		css: o.css,
		'class': 'nofade',
		max: 1,
		closeable: Config.ControlPanel
	});
	
	j(id + ' .toolbar').append('<i class="icon icon-zoom-in right" style="margin-right: 5px; position: relative; top: -18px" title="Increase the font size."></i>');
	j(id + ' .icon-zoom-in').click(function() {
		var v = parseInt(j(id + ' .out').css('fontSize'));
		j(id + ' .out').css({
			fontSize: ++v + 'px',
			lineHeight: (v+5) + 'px'
		});
	});
	
	j(id + ' .toolbar').append('<i class="icon icon-zoom-out right" style="margin-right: 5px; position: relative; top: -18px" title="Decrease the font size."></i>');
	j(id + ' .icon-zoom-out').click(function() {
		var v = parseInt(j(id + ' .out').css('fontSize'));
		j(id + ' .out').css({
			fontSize: --v + 'px',
			lineHeight: (v+5) + 'px'
		});
	});
	
	j(id + ' .content').append('\
		<div class="out nice"></div>\
		<input class="send" title="Type a command in this field and press \'Enter\' to send it." placeholder="type your command..." aria-live="polite"/>\
	');
	
	j(id + ' .out').niceScroll({ 
		cursorborder: 'none',
		cursorwidth: 0, 
		touchbehavior: 1
	});
	
	j(id).click(function() {
		j(id + ' .send').focus();
	});
	
    Event.listen('internal_colorize', new Colorize().process);
        
	var add = function(A) {
		
		var my = j(id + ' .out');
		/*
		if (my[0].scrollHeight > o.scrollback) {
			echo('Scrollback limit reached. Flushing scrollback history...');
			j(id + ' .out').empty();
		}*/
		
		my.append('<span>'+A+'</span>');
		my.scrollTop(my[0].scrollHeight);

	}
	
	var echo = function(msg) {
		
		if (!msg.length) 
			return;
			
		if (o.local && o.echo) {
			
			msg = msg.replace(/>/g,'&gt;');
			msg = msg.replace(/</g,'&lt;');
			
			add('<span style="color: gold; opacity: 0.6">' + msg + '</span><br>');
		}
			
	}
	
	var title = function(t) {
		if (!Config.Device.lowres) {
			win.title(t);
			document.title = t;
		}
	}
		
	var echoOff = function() { o.echo = 0 }
	var echoOn = function() { o.echo = 1 }
	
	var sv = {
		add: add,
		echo: echo,
		echoOff: echoOff,
		echoOn: echoOn,
		title: title,
		id: id,
		win: win
	}

	var ws = new Socket({
		host: param('host'),
		port: param('port'),
		out: sv
	});
	
	if (user.id) {
		Config.MacroPane = new MacroPane({
			socket: ws
		});
		
		if (!Config.nomacros) {
			Event.listen('before_send', Config.MacroPane.sub);
			sv.echo('Activating macros.');
		}
		
		Config.TriggerHappy = new TriggerHappy({
			socket: ws
		});
		
		if (!Config.notriggers) {
			Event.listen('after_display', Config.TriggerHappy.respond);
			sv.echo('Activating triggers.');
		}
	}
	
	Config.ScrollView = sv;
		
	Event.fire('scrollview_ready', null, sv);

	return sv
}
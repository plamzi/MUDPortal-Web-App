/* Module for handling macros on a Socket. Also draws a panel with quick buttons. */

var MacroPane = function(o) {

	if (Config.nomacros)
		return;
	
	var id = "#macro-pane";
	var socket = o.socket;
	var host = socket.getHost();
	var port = socket.getPort();
	var G = user.pref.sitelist, P = user.pref.profiles, g, p, gMacros, pMacros;

	var vars;
	var first = 1;
	
	var init = function() {

		for (g in G) {
			if (G[g].host == host) {
				gMacros = G[g].macros;
				break;
			}
		}
		
		if (P[param('profile')])
			pMacros = P[param('profile')].macros;
		
		buttons = [];
		
		if (gMacros) 
			for (var n = 0; n < gMacros.length; n++)
				buttons.push(gMacros[n]);

		if (pMacros)
			for (var n = 0; n < pMacros.length; n++)
				buttons.push(pMacros[n]);
		
		socket.echo('Loaded ' + buttons.length + ' macros.');
		
		if (!o.noquickbuttons)
			pane();
		
		first = 0;
	}
	
	var pane = function() {

		j(id).remove();
		
		if (!buttons.length)
			return;

		var win = new Window({
			id: id,
			title: 'Quick Buttons',
			closeable: 1,
			'class': 'nofade', 
			css: {
				width: 200,
				height: 400,
				top: 160,
				left: j(window).width() - 220,
				zIndex: 4
			}
		});
		
		j(id + ' .content').append('<ul class="macro-btns"></ul>');
				
		for (var b = 0; b < buttons.length; b++)
			if (buttons[b][2] && buttons[b][3] && !buttons[b][1].has('$'))
				j(id + ' .content .macro-btns').append('<li class="kbutton macro-btn tip" data="'+buttons[b][1]+'" title="'+buttons[b][1]+'">'+buttons[b][0]+'</li>')
		
		if (first) {
			j(id + ' .content .macro-btns').sortable();
			j('body').on('click', '.macro-btn', function() {
				socket.send(j(this).attr('data'));
			});
		}
	}
	
	var vars = function(msg) {
		
		for (var i = 0; i < buttons.length; i++) {
			if (buttons[i][0][0] == '$' && buttons[i][2]) {
				var re = new RegExp('\\'+buttons[i][0], 'g');
				//console.log(re);
				msg = msg.replace(re, buttons[i][1]);
				console.log('MacroPane: var replacement: '+stringify(buttons[i]));
				console.log(msg);
			}
		}
		
		return msg;
	}
	
	var sub = function(msg) {

		if (Config.nomacros)
			return msg;
		
		for (var b = 0; b < buttons.length; b++) {
			
			var cmd = buttons[b][0], sub = buttons[b][1];

				if (buttons[b][2] && msg.has(cmd)) {	
					
					if (!sub.has('$')) {
						var re = new RegExp('^'+cmd, 'g');
						msg = msg.replace(re, sub);
						return msg;
					}
					
					if (sub.has('$*')) {
						var arg = msg.split(' ');
						arg.shift();
						msg = sub.replace('$*', arg.join(' '));
						return msg;
					}
					
					if (!sub.has(' '))
						continue;

					var arg = msg.split(' ');
					
					if (arg[0] != cmd)
						continue;
					
					for (var i = 1; i < arg.length; i++) {
						sub = sub.replace('$'+i, arg[i], 'g');
						console.log(sub);
					}
					
					return vars(sub);
					
				}
			
		}
		
		return msg;
	}
	
	init();
	
	return {
		init: init,
		pane: pane,
		sub: sub
	}
}
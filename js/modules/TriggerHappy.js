/* Module for handling triggers on a socket. */

var TriggerHappy = function(o) {

	var socket = o.socket;
	var host = socket.getHost();
	var port = socket.getPort();
	var G = user.pref.sitelist, P = user.pref.profiles, g, p, gTriggers, pTriggers;
	var triggers;
	
	var init = function() {

		for (g in G) {
			if (G[g].host == host) {
				gTriggers = G[g].triggers;
				break;
			}
		}
		
		if (P[param('profile')])
			pTriggers = P[param('profile')].triggers;
		
		triggers = [];
		
		if (gTriggers)
			for (var n = 0; n < gTriggers.length; n++)
				triggers.push(gTriggers[n]);

		if (pTriggers)
			for (var n = 0; n < pTriggers.length; n++)
				triggers.push(pTriggers[n]);
		
		for (var t = 0; t < triggers.length; t++)
			triggers[t][3] = triggers[t][0].replace(/\$[0-9]/g, '([A-Za-z0-9\-\'\"]+)');
		
		socket.echo('Loaded ' + triggers.length + ' triggers.');
	}
	
	var respond = function(msg) {
		
		for (var t = 0; t < triggers.length; t++) {
			
			var re = new RegExp(triggers[t][3], 'g');
			var res = re.exec(msg);
			
			if (!res || !res.length)
				continue;

			var cmd = triggers[t][1];
			
			if (res.length > 1) {
				for (var n = 1; n < res.length; n++)
					cmd = cmd.replace('$'+n, res[n], 'g');
			}
			
			socket.send(cmd);
		}
		
		return msg;
	}
	
	init();
	
	return {
		init: init,
		respond: respond
	}
}
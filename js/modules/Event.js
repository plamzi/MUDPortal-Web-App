var Event = {
	
	q: {
		'before_process': [],
		'after_protocols': [],
		'before_html': [],
		'colorize': [],
		'before_display': [],
		'after_display': [],
		'before_send': [],
		'scrollview_ready': [],
		'msdp': [],
		'gmcp': [],
		'atcp': []
	},
	
	fire: function(event, data, caller) {
		if (!this.q[event]) {
			console.log('Event.js: No such event to fire: ' + event);
			return 0;
		}
		for (var i = 0; i < this.q[event].length; i++)
			data = this.q[event][i](data, caller);
		return data;
	},
	
	listen: function(event, cb) {
		if (!this.q[event]) {
			console.log('Event.js: No such event to subscribe to: ' + event);
			return 0;
		}
		this.q[event].push(cb);
		return 1;
	},
	
	drop: function(event, cb) {
		if (!this.q[event]) {
			console.log('Event.js: No such event to drop from: ' + event);
			return;
		}
		for (var i = 0; i < this.q[event].length; i++)
			if (this.q[event][i] == cb) {
				this.q[event].splice(i, 1);
				return 1;
			}
		return 0;
	}
	
}
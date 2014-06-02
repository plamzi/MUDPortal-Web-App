var Event = {
	
	q: {
		'socket_open': [],
		'socket_before_close': [],
		'socket_close': [],
		'socket_data': [],		
		'before_process': [],
		'after_protocols': [],
		'before_html': [],
		'internal_colorize': [],
		'internal_mxp':[],
		'before_display': [],
		'after_display': [],
		'before_send': [],
		'scrollview_ready': [],
		'chatterbox_ready': [],
		'msdp': [],
		'gmcp': [],
		'atcp': [],
	},
	
	fire: function(event, data, caller) {
		if (!this.q[event]) {
			log('Event.js: No such event to fire: ' + event);
			return 0;
		}
		//else
			//log('Event.fire: '+event);
			
		for (var i = 0; i < this.q[event].length; i++)
			data = this.q[event][i](data, caller);
		return data;
	},
	
	listen: function(event, cb) {
		if (!this.q[event]) {
			log('Event.js: No such event to subscribe to: ' + event);
			return 0;
		}
		this.q[event].push(cb);
		return 1;
	},
	
	drop: function(event, cb) {
		if (!this.q[event]) {
			log('Event.js: No such event to drop from: ' + event);
			return;
		}
		for (var i = 0; i < this.q[event].length; i++)
			if (this.q[event][i] == cb) {
				this.q[event].splice(i, 1);
				return 1;
			}
		return 0;
	},
	
	create: function(event) {
		if (this.q[event]) {
			log('Event.js: This event already exists and will not be created: ' + event);
			return;
		}
		q[event] = [];
		log('Event.js: Event created: ' + event);
	},
	
	destroy: function(event) {
		if (!this.q[event]) {
			log('Event.js: This event does not exist and will not be destroyed: ' + event);
			return;
		}
		delete q[event];
		log('Event.js: Event destroyed: ' + event);
	}
}
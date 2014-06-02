var Config = {
	
	debug: window.location.search.has('debug')||0,
	
	host: param('host'),
	
	port: param('port'),
	
	name: param('name'),
	
	profile: param('profile'),
	
	width: param('width')||860,
			
	height: param('height')||540,
	
	clean: window.location.search.has('clean')||0,
	
	solo: window.location.search.has('solo')||0,
	
	nocenter: window.location.search.has('nocenter')||0,
	
	collapse: [],
	
	dev: window.location.search.has('dev')||0,
	
	separator: param('separator')||';',
	
	view: param('host') + ':' + param('port') + ':' + window.screen.width + 'x' + window.screen.height,
	
	device: {
		touch: 'ontouchstart' in window,
		lowres: (j(window).width() <= 640 || j(window).height() <= 640),
		mobile: (j(window).width() <= 640 || j(window).height() <= 640),
		tablet: ('ontouchstart' in window && j(window).width() > 640),
		width: j(window).width(),
		height: j(window).height()
	},
	
	settings: (function() {
		
		var s = [];

		if (!window.user)
			return s;
		
		if (user && user.pref && user.pref.sitelist && user.pref.sitelist[param('name')])
			j.extend(true, s, user.pref.sitelist[param('name')].settings);
		
		if (param('profile') && user && user.pref && user.pref.profiles && user.pref.profiles[param('profile')] && user.pref.profiles[param('profile')].settings)
			j.extend(true, s, user.pref.profiles[param('profile')].settings);
		
		return s;
		
	})(),
	
	getSetting: function(A) {
		
		if (!Config.settings.length)
			return null;

		for (var i = 0; i < Config.settings.length; i++)
			if (Config.settings[i].id == A)
				return Config.settings[i].value;
		
		return null;
	}
}

log(Config);
log(stringify(Config.settings));
var Config = {
	
	debug: param('debug'),
	
	host: param('host'),
	
	port: param('port'),
	
	name: param('name'),
	
	profile: param('profile'),
	
	width: param('width')?param('width'):860,
			
	height: param('height')?param('height'):540,
	
	view: param('host') + ':' + param('port') + ':' + window.screen.width + 'x' + window.screen.height,
	
	clean: param('clean'),
	
	Device: {
		touch: ('ontouchstart' in window || navigator.msMaxTouchPoints),
		lowres: (j(window).width() <= 640),
		width: j(window).width(),
		height: j(window).height()
	},
	
	settings: (function() {
		
		var s = [];

		if (!window.user)
			return s;
		
		if (user && user.pref && user.pref.sitelist && user.pref.sitelist[param('name')])
			s.push(user.pref.sitelist[param('name')].settings);
		
		if (param('profile') && user && user.pref && user.pref.profiles && user.pref.profiles[param('profile')] && user.pref.profiles[param('profile')].settings)
			s.push(user.pref.profiles[param('profile')].settings);
		
		return s;
		
	})(),
	
	getSetting: function(A) {
		
		if (!Config.settings.length)
			return null;

		for (var i = 0; i < Config.settings.length; i++)
			if (Config.settings.id == A)
				return Config.settings.value;
		
		return null;
	}
}

if (Config.debug)
	console.log(Config);
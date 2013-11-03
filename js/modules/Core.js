if (!WebSocket) {
	new Modal({
	    title:'Incompatible Browser',
	    text: 'The portal web app requires a modern browser. If you are using an older Internet Explorer version, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>.',
	    closeText: 'Dismiss'
    });
} 

if (Config.socket)
	window.onbeforeunload = function () {
		return "Are you sure you want to disconnect and leave this page?"
	};

if (j.browser.ie && j.browser.version < 10) {
	new Modal({
	    title:'Browser Warning',
	    text: 'Some app functionality may not work properly in Internet Explorer. If you wish to use this browser, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>.',
	    closeText: 'Dismiss'
    });
}

j(document).ready(function () {


    if (!window.location.search.has('&clean'))
	    window.cp = new ControlPanel();
	
	if (Config.host && Config.port) {
		
		sv = new ScrollView({
			local: 1,
			css: {
				width: Config.width,
				height: Config.height,
				top: 80,
				left: 240,
				zIndex: 2
			},
			scrollback: 40000
		});
		
		j('#control-panel').css('opacity', 0.4);
		j('#header').css('opacity', 0.4);
		j('#header').on('click', function() { j(this).css('opacity', 1) } );
	}

	j('body').on('mouseover', '.tip', function() {
		var self = this;
		j('.tip').tooltip('destroy');
		setTimeout(function() {
			j(self).tooltip({ 
		      	container: 'body',
	    		trigger: 'manual'
			}).tooltip('show');
		}, 300);
	})
	.on('mouseout', '.tip', function() {
		setTimeout(function() {
			j('.tip').tooltip('destroy');
		}, 300);
	});
	
});
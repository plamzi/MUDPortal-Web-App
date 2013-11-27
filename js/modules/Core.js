if (typeof WebSocket == 'undefined') {
	new Modal({
	    title:'Incompatible Browser',
	    text: 'The portal web app requires a modern browser. If you are using an older Internet Explorer version, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>. Or simply install Chrome or Firefox.',
	    closeText: 'Dismiss'
    });
} 

if (j.browser.ie && j.browser.version < 10) {
	new Modal({
	    title:'Browser Warning',
	    text: 'Some app functionality may not work properly in Internet Explorer prior to IE10. If you wish to use this browser, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>. Or simply install Chrome or Firefox.',
	    closeText: 'Dismiss'
    });
}

if (Config.socket)
	window.onbeforeunload = function () {
		return "Are you sure you want to disconnect and leave this page?"
	};

if (Config.host && Config.port)
	j('head').append('<script type="text/javascript" src="http://www.mudportal.com/index.php?option=com_portal&task=get_official&host='+Config.host+':'+Config.port+'"></script>');

if (Config.dev)
	j('head').append('<script type="text/javascript" src="http://www.mudportal.com/index.php?option=com_portal&task=get_dev&host='+Config.host+':'+Config.port+'"></script>');

if (!Config.nocore)
	j(document).ready(function () {
	
		//log(stringify(Config));
		
		if (!Config.nocenter)
			Config.ControlPanel = new ControlPanel();
		
		if (Config.host && Config.port) {
			
			new ScrollView({
				local: 1,
				css: {
					width: Config.width,
					height: Config.height,
					top: 80,
					left: 240,
					zIndex: 103
				},
				scrollback: 40000
			});
			
			j('#header').css({
				opacity: 0.4,
				zIndex: 0
			});
			
			j('#header').on('click', function() { j(this).css('opacity', 1) } );
		}
	
		if (Config.clean)
			j('#header').remove();
		
		
	/*
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
			}, 200);
		});
	*/
	});
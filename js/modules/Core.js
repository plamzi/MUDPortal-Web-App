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

j(document).ready(function () {
	if (Config.clean) {
		j('#header').remove();
		j('#maininner #content').attr('id', 'app-content');
	}
	else {
		j('#header').css({
			opacity: 0.4,
			zIndex: 0
		}).on('click', function() { j(this).css('opacity', 1) } );
	}
});
	
if (Config.host && Config.port)
	j('head').append('<script type="text/javascript" src="http://www.mudportal.com/index.php?option=com_portal&task=get_official&host='+Config.host+':'+Config.port+'"></script>');

if (Config.dev)
	j('head').append('<script type="text/javascript" src="http://www.mudportal.com/index.php?option=com_portal&task=get_dev&host='+Config.host+':'+Config.port+'"></script>');

if (!Config.device.touch && user.guest)
	j('.app').prepend('<a class="right" style="opacity:0.5;margin-right: 8px" href="/component/comprofiler/login" target="_self"><i class="icon-sun"></i> login</a>');
 
if (Config.device.touch) {
	document.ontouchmove = function(e) { e.preventDefault() }
	j('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />\
			<meta name="apple-mobile-web-app-capable" content="yes">');
	
		j('head').append('<link rel="apple-touch-startup-image" sizes="640x1136" href="/images/app-splash-5.png">');
		j('head').append('<link rel="apple-touch-startup-image" sizes="640x960" href="/images/app-splash-4.png">');
}

if (!Config.nocore)
j(document).ready(function () {

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
			scrollback: 40 * 1000
		});
	}
   
	j('body').on('mouseover', '.tip', function() {
		j(this).tooltip({ 
		    position: { my: 'center bottom', at: 'center top' }
		}).tooltip('open');
	})
	.on('mouseout', '.tip', function() {
		try {
			j(this).tooltip('destroy');
		} catch(ex) {}
	});
	
});
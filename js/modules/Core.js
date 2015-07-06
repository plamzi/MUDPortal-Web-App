if (typeof WebSocket == 'undefined') {
	new Modal({
	    title:'Incompatible Browser',
	    html: 'The portal web app requires a modern browser. If you are using an older Internet Explorer version, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>. Or simply install Chrome or Firefox.',
	    closeText: 'Dismiss'
    });
} 

j('body').addClass('app');

if (Config.socket)
	window.onbeforeunload = function () {
		return "Are you sure you want to disconnect and leave this page?"
	};

if (Config.embed)
	j('body#page').css({ background: 'transparent'});
	
j(document).ready(function () {
	
	if (Config.bare || Config.clean) {
		j('#header').remove();
		j('#maininner #content').attr('id', 'app-content');
	}
	else {
		j('#header').css({
			opacity: 0.4,
			zIndex: 0
		}).on('click', function() { j(this).css('opacity', 1) } );
	}
	
	if (Config.embed) {
		Event.listen('scrollview_ready', function() {
			j('.ui-resizable-handle').css({ opacity: 0 });
			j('.icon-minus').remove();
		});
	}
});

if (Config.device.touch) {
	document.ontouchmove = function(e) { e.preventDefault() }
	j('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />\
			<meta name="apple-mobile-web-app-capable" content="yes">');
	
		j('head').append('<link rel="apple-touch-startup-image" sizes="640x1136" href="/images/app-splash-5.png">');
		j('head').append('<link rel="apple-touch-startup-image" sizes="640x960" href="/images/app-splash-4.png">');
}

if (!Config.nocore) {

	if (!Config.nocenter)
		Config.ControlPanel = new ControlPanel();
	
	if (Config.host && Config.port) {
		new ScrollView({
			local: 1,
			css: {
				width: Config.width,
				height: Config.height,
				top: Config.top,
				left: Config.left,
				zIndex: 103
			},
			scrollback: 40 * 1000
		});

		if (!Config.embed && !Config.device.mobile && !Config.kong) {
			Config.Toolbar = new Toolbar().init().update();
		}
	}
	
	if (window.user && user.guest && !Config.kong && !Config.device.touch)
		j('.app').prepend('<a class="right" style="opacity:0.5;margin-right: 8px" \
		href="/component/comprofiler/login" target="_self">\
		<i class="icon-sun"></i> login</a>');
	
	if (Config.kong)
		Config.ScrollView.title('Bedlam');
}

j(document).on('click', 'a[data-toggle="tab"]', function(e) {
	j(this).find('.badge').remove();
});

if (!Config.device.touch)
	j('body').tooltip({ 
		selector: '.tip',
		container: 'body',
		content: function () { return j(this).prop('title'); },
		html: true,
		position: { my: 'center bottom', at: 'center top' }
	});
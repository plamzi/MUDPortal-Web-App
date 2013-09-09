if (!WebSocket) {
	alert('We\'re sorry but the Portal app requires a modern WebSocket-enabled browser.');
} 

if (navigator.userAgent.indexOf('MSIE') != -1) {
	new Modal({
	    title:'Browser Warning',
	    text: 'Some app functionality may not work properly in Internet Explorer. If you wish to use this browser, we recommend installing <a target="_blank" href="http://www.google.com/chromeframe/">the Chrome Frame IE add-on from Google</a>.',
	    closeText: 'Dismiss'
    });
}

j(document).ready(function () {

    if (!window.location.search.has('&clean'))
	    window.cp = new ControlPanel();
	
	if (param('host') && param('port')) {
		
		sv = new ScrollView({
			local: 1,
			css: {
				width: (param('width')?param('width'):'860')+'px',
				height: (param('height')?param('height'):'540')+'px',
				top: 80,
				left: 240,
				zIndex: 2
			},
			scrollback: 40000
		});
		
		j('#header').on('click', function() { j(this).css('opacity', 1) } );
	}
	
	j('.tip').tooltip({ html: 1, container: '.app', placement: 'right' });
	
});
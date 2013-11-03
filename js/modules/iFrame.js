/**
 * v1.0 - 09/08/2013
 * Loads external content in an iFrame inside a UI window
 * Can be used to link to your web-based help files
 * With option to set a timer to poll and refresh the content (e. g. web-based who is online page)
 */

var iFrame = function(o) {
	
	var win, refresh;
	
	var init = function() {
		
		if (j(o.id).length) {
			url();
			j(o.id).toggle();
			return;
		}
		
		win = new Window({
			id: o.id,
			title: o.title,
			closeable: 1,
			'class': 'nofade',
			css: o.css,
			onResize: function() {
				j(o.id + ' iframe').css({
					width: j(o.id + ' .content').width(),
					height: j(o.id + ' .content').height()
				})
			},
			onClose: function() {
				clearInterval(refresh);
			}
		});
		
		j(o.id + ' .content').append('<iframe src="'+o.url+'" class="nice" style="overflow: auto; height: 100%" frameBorder="0"><iframe>');
	
		j(o.id + ' iframe').css({
			width: j(o.id + ' .content').width(),
			height: j(o.id + ' .content').height()
		});
			/*
		j(o.id + ' .nice').niceScroll({ 
			cursorborder: 'none', 
			touchbehavior: 1
		});*/

		
		if (o.refresh) {
			clearInterval(refresh);
			refresh = setInterval(url, o.refresh * 1000);
		}
		
		//win.front();
		return false;
	}
	
	var url = function() {
		j(o.id + ' iframe').attr('src', o.url);
	}
	
	init();
	
	if (o.button && sv) {
        o.button.click = init;
		sv.win.button(o.button);
		o.button = null;
	}
}

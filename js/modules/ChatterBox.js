/* 
 * ChatterBox plugin - v1.0 - 09/07/2013
 * Always included on the app page (this code is just for easy viewing)
 * Creates a tabbed window with configurable tabs.
 * Captures and redirects lines matching regex expressions to one or more tabs.
 * Ideal for comm. channels. 
 * See Bedlam-ChatterBox-Init.js for example use.
*/

var ChatterBox = function(o) {
			
	var self = this;

	/* If you want to see what your config options look like:
	 * console.log(o.tabs);
	 */
	
	o.css.height = o.css.height||360;
	o.css.width = o.css.width||360;
	
	/* Create a window that doesn't fade when other windows are selected (nofade) */
	var win = new Window({
		id: o.id,
		title: o.title,
		'class': 'nofade ui-group',
		css: o.css,
		onResize: function() {
			j('.chat-tab').css({
				width: j(o.id).width() - 10,
				height: j(o.id).height() - 80,
			})
		}
	});
	
	/* Using Twitter Bootstrap markup makes our tabs a breeze to create */
	j('#chat-window .content').prepend('\
		<ul class="chat-tabs nav nav-tabs"></ul>\
		<div class="tab-content"></div>\
	');
	
	/* Build the tabs from the options. See Bedlam-ChatterBox.js */
	for (var i = 0; i < o.tabs.length; i++) {
		j(o.id + ' .chat-tabs').append('<li'+(i==0?' class="active"':'')+'><a class="kbutton" data-toggle="tab" href="#chat-tab-'+i+'">'+o.tabs[i].name+'</a></li>');
		j(o.id + ' .tab-content').append('<div id="chat-tab-'+i+'" class="chat-tab tab-pane nice'+(i==0?' active':'')+'"></div>');
		j('#chat-tab-'+i).niceScroll({ 
			cursorborder: 'none', 
			touchbehavior: 1
		});
		o.tabs[i].re = new RegExp(o.tabs[i].match, 'gi');
	}

	if (o.css)
		j(o.id).css(o.css);

	j('.chat-tab').css({
		width: j(o.id).width() - 10,
		height: j(o.id).height() - 80,
	});
	
	var process = function(msg) {
		
		if (!msg.has(', \''))
			return msg;
		
		/* strip ansi so we can re-color? */
		/* var t = msg.replace(/\033\[[0-9\;]+?m/g,''); 
		console.log('ChatterBox.process:');
		console.log(msg);
		console.log('-------');*/
		
		for (var i = 0; i < o.tabs.length; i++) {
			
			var match = msg.match(o.tabs[i].re);

			if (match && match.length) {
				
				console.log(match[0]);
				var text = match[0];

				if (o.tabs[i].replace)
					text = match[0].replace(o.tabs[i].re, o.tabs[i].replace, 'gi');

				if (o.tabs[i].time)
					text = '<span style="color: DarkGray; opacity: 0.6">'+j.format.date(new Date(), 'hh:mm:ss') + '</span> ' + text;
				
				j('#chat-tab-'+i).append(text+'<br>');
				j('#chat-tab-'+i).scrollTop(j('#chat-tab-'+i)[0].scrollHeight);
				
				if (o.tabs[i].gag) {
					/* we're hiding the output via html so triggers will still work */
					msg = msg.replace(match[0], '\033<span style="display: none"\033>'+match[0]+'\033</span\033>');
				}	
				
			}
			
		}
		
		return msg;
	}
	
	/* Add an icon to the ScrollView window to hide/show the chat box */
    if (sv)
    	sv.win.button({
	        icon: 'icon-comment-alt',
	        title: 'Hide / show the chat box.',
	        click: function() {
	            j(o.id).toggle();
	        }
	    });
    
  	/* We queue up after protocols and colorize so we would get input that's closest to what we want. */
   	Event.listen('before_display', process); 
   
	return {
		process: process /* expose the process() method */
	}
}
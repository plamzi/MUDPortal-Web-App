/* 
 * ChatterBox plugin - v1.1 - 09/25/2014
 * Always included on the app page (this code is just for easy viewing)
 * Creates a tabbed window with configurable tabs.
 * Captures and redirects lines matching regex expressions to one or more tabs.
 * Ideal for comm. channels. 
 * See Bedlam-ChatterBox-Init.js for example use.
*/

var ChatterBox = function(o) {

	var self = this;
	
	o = o || {
		id: '#chat-window',
		title: 'ChatterBox',
		tabs: []
	};
	
	o.css = o.css || {
		width: 400,
		height: 400,
		top: 0,
		left: Config.width
	};

	if (Config.kong) {
		o.css.width = 398;
		o.css.height = j(window).height() - 143;
	}
	
	/* Create a window that doesn't fade when other windows are selected (nofade) */
	var win = new Window({
		id: o.id,
		title: o.title,
		'class': 'nofade ui-group ChatterBox',
		css: o.css || null,
		handle: '.nav-tabs'
	});
	
	var tab = function(t) {
		
		var i = o.tabs.length;
		o.tabs.push(t);

		return win.tab(t);
	};
	
	/* Build the tabs from the options. See Bedlam-ChatterBox.js */
	for (var i = 0; i < o.tabs.length; i++) {
		
		var t = o.tabs[i];
		
		if (t.channels) {
			
			t.html = t.html || '<div class="content"></div>';
			t.html += '<div class="footer dropup" style="position: absolute; bottom: 0px; height: 34px">\
				<a href="#" class="channel dropdown-toggle kbutton" data-toggle="dropdown" style="margin: 0px; width: 140px; position: relative; top: -2px"><span class="text">' + t.channels[0] + '</span> <i class="icon icon-caret-down"></i></a>\
				<ul class="dropdown-menu" role="menu">'
				for (var i = 0; i < t.channels.length; i++)
					t.html += '<li><a href="#" data="' + t.channels[i] + '">' + t.channels[i] + '</a></li>';
			t.html += '</ul><input class="send" type="text" style="margin-left: 6px; margin-top: 2px; width: 260px" placeholder="type your chat message"></div>';
		}
		
		if (!t.target) {
			
			var target = win.tab(t);

			if (t.channels) {
				
				j(target + ' .content').addClass('nice').niceScroll({ 
					cursorborder: 'none'
				});
				
				j(target).on('click', 'ul a', function(e) {
					
					j(target + ' .dropdown-toggle .text').html(j(this).attr('data'));
					
					try {
						j(target + ' .dropdown-toggle').dropdown('toggle');
					}
					catch(ex) {}
					
					e.stopPropagation();
					e.preventDefault();
				});
				
				j(target).on('keydown', 'input', function(e) {
					
					if (e.which == 13 && j(this).val().length) {
						
						var prefix = j(target + ' .dropdown-toggle .text').text();
						Config.Socket.write(prefix + ' ' + j(this).val());
						j(this).val('');
						
						e.stopPropagation();
						e.preventDefault();
					}
				});
			}
		}
		
		if (t.match) {
			try {
				t.re = new RegExp(t.match, 'gi');
				//log(o.tabs[i].re);
			}
			catch(ex) { log(ex); }
		}
	}
	
	//j(o.id + ' .chat-tabs').sortable();

	var process = function(msg) {

		var src = msg;
		//src = src.replace(/([\r\n]|<br>)/g,'');
		
		for (var i = 0; i < o.tabs.length; i++) {
			
			if (!o.tabs[i].re)
				continue;
		
			var match = src.match(o.tabs[i].re);
			
			if (match && match.length) {
				
				log(stringify(match) + ' chan ' + o.tabs[i].name);
				var text = match[0];

				if (o.tabs[i].replace)
					text = match[0].replace(o.tabs[i].re, o.tabs[i].replace, 'gi');

				if (o.tabs[i].time)
					text = '<span style="color: DarkGray; opacity: 0.6">'+j.format.date(new Date(), 'HH:mm') + '</span> ' + text;
				
				text = text.replace(/([^"'])(http?:\/\/[^\s\x1b"']+)/g,'$1<a href="$2" target="_blank">$2</a>');
				text = '<div id="c">' + text +  '</div>';

				if (o.tabs[i].target) {
					
					var t;
					
					if ((t = o.tabs.index('name', o.tabs[i].target)) > -1)
						var target = j(o.id + ' #tab-' + t + ' .content').length ? j(o.id + ' #tab-' + t + ' .content') : j(o.id + ' #tab-'+t);
				}
				else
					var target = j(o.id + ' #tab-' + i + ' .content').length ? j(o.id + ' #tab-' + i + ' .content') : j(o.id + ' #tab-'+t);
				
				target.append(text);
				target.scrollTop(target[0].scrollHeight);
				
				if (o.tabs[i].gag)/* we're hiding the output so triggers can still work */ 
					msg = msg.replace(match[0], '\033<span style="display: none"\033>'+match[0]+'\033</span\033>');
			}
		}
		
		return msg;
	};
	
	/* Add an icon to the ScrollView window to hide/show the chat box 
    if (Config.ScrollView)
    	Config.ScrollView.win.button({
	        icon: 'icon-comment-alt',
	        title: 'Hide / show the communication tabs.',
	        click: function() {
	            j(o.id).toggle();
	        }
	    });*/
    
  	/* We queue up after protocols and colorize so we would get input that's closest to what we want. */
   	Event.listen('before_display', process); 
   
    /* Expose public methods */
   	var self = {
		process: process,
		tab: tab,
		win: win
	};
   	
   	Config.ChatterBox = self;
   	
	setTimeout(function() { Event.fire('chatterbox_ready', self); }, 500);
	
   	return self;
};
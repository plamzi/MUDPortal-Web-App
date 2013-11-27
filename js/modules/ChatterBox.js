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

	o.css.height = o.css.height||360;
	o.css.width = o.css.width||360;
	
	/* Create a window that doesn't fade when other windows are selected (nofade) */
	var win = new Window({
		id: o.id,
		title: o.title,
		'class': 'nofade ui-group',
		css: o.css,
		handle: '.chat-tabs',
		onResize: function() {
			j('.chat-tab').css({
				width: j(o.id).width() - 10,
				height: j(o.id).height() - 50,
			})
		}
	});
	
	/* Using Twitter Bootstrap markup makes our tabs a breeze to create */
	j('#chat-window .content').prepend('\
		<ul class="chat-tabs nav nav-tabs"></ul>\
		<div class="tab-content"></div>\
	');
	
	var tab = function(t) {
		
		var i = o.tabs.length;
		o.tabs.push(t);

		var html = '<li><a class="kbutton '+t.name+'" data-toggle="tab" href="#chat-tab-'+i+'">'+t.name+'</a></li>';
		
		if (!t.after)
			j(o.id + ' .chat-tabs').append(html);
		else
			j(html).insertAfter(j(o.id + ' .chat-tabs .'+t.after).parent());
		
		j(o.id + ' .tab-content').append('<div id="chat-tab-'+i+'" class="chat-tab tab-pane nice'+(i==0?' active':'')+'">'+(t.html||'')+'</div>');
		
		j('#chat-tab-'+i).css({
			width: j(o.id).width() - 10,
			height: j(o.id).height() - 50,
		})
		.niceScroll({ 
			cursorborder: 'none', 
			touchbehavior: 1
		});
		
		return o.id + ' #chat-tab-' + i;
	}
	
	/* Build the tabs from the options. See Bedlam-ChatterBox.js */
	for (var i = 0; i < o.tabs.length; i++) {
		
		if (!o.tabs[i].target) {
			j(o.id + ' .chat-tabs').append('<li'+(i==0?' class="active"':'')+'><a class="kbutton" data-toggle="tab" href="#chat-tab-'+i+'">'+o.tabs[i].name+'</a></li>');
			j(o.id + ' .tab-content').append('<div id="chat-tab-'+i+'" class="chat-tab tab-pane nice'+(i==0?' active':'')+'"></div>');
	
			j('#chat-tab-'+i).css({
				width: j(o.id).width() - 10,
				height: j(o.id).height() - 80,
			})
			.niceScroll({ 
				cursorborder: 'none',
				touchbehavior: 1
			});
		}
		
		if (o.tabs[i].match)
			try {
				o.tabs[i].re = new RegExp(o.tabs[i].match, 'gi');
				//log(o.tabs[i].re);
			}
			catch(ex) { log(ex) }
				
	}

	//j(o.id + ' .chat-tabs').sortable();

	var process = function(msg) {

		var src = msg;
		//src = src.replace(/([\r\n]|<br>)/g,'');
		
		log('ChatterBox process: '+src);
		
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
					text = '<span style="color: DarkGray; opacity: 0.6">'+j.format.date(new Date(), 'hh:mm:ss') + '</span> ' + text;
				
				text = text.replace(/([^"'])(http?:\/\/[^\s\x1b"']+)/g,'$1<a href="$2" target="_blank">$2</a>');
				text = '<div id="c">' + text +  '</div>';
				
				if (o.tabs[i].target) {
					var t;
					if ((t = o.tabs.index('name', o.tabs[i].target)) > -1) {
						j('#chat-tab-'+t).append(text);
						j('#chat-tab-'+t).scrollTop(j('#chat-tab-'+t)[0].scrollHeight);
					}
				}
				else {
					j('#chat-tab-'+i).append(text);
					j('#chat-tab-'+i).scrollTop(j('#chat-tab-'+i)[0].scrollHeight);
				}
				
				if (o.tabs[i].gag)/* we're hiding the output so triggers can still work */ 
					msg = msg.replace(match[0], '\033<span style="display: none"\033>'+match[0]+'\033</span\033>');
			}
		}
		return msg;
	}
	
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
   	var exp = {
		process: process,
		tab: tab
	}
   	
   	Config.ChatterBox = exp;
   	Event.fire('chatterbox_ready');
   	
   	return exp;
}
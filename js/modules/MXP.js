/* 
 * v1.3 - 9/26/2014
 * This plugin is part of the core so it's always available on the app page
 *  
*/

var MXP = function () {
	
	var mxp = 0, elements = [];
	
	var prep = function(t) {
		t = new Colorize().process(t)
			.replace(/\x1b\[[1-7]z/g, '')
			.replace(/\n/g,'<br>');
		return t;
	};

	var process = function(t) {
		
		if (t.has('\xff\xfa\x5b\xff\xf0')) {
			log('Got IAC SB MXP IAC SE -> BEGIN MXP');
			t = t.replace(/.\xff\xfa\x5b\xff\xf0/, '');
			j('body').append('<div id="mxpf" style="display: none"></div>');
			mxp = 1;
		}

		if (!mxp)
			return t;
		
		t = t.replace(/\r/g,'');
		
		if (t.match(/!element/i)) {
			var m = t.match(/<!element ([^]+?)>/gi);
			if (m && m.length) {
				for (var i = 1; i < m.length; i++)
					elements.push(m[i].substring(10, m[i].length-1).split(' '));
			}
			log(elements);
			t = t.replace(/<!element[^]+>/gi, '');
		}
		
		if (t.has('<VERSION>'))
			t = t.replace('\x1b[1z<VERSION>\x1b[7z', '');
				
		/* <color> tag */
		t = t.replace(/\x1b\[[1-7]z<color(.+?)>([^]+?)<\/color>\x1b\[[1-7]z/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		/* <c> tag */
		t = t.replace(/\x1b\[[1-7]z<c (.+?)>([^]+?)<\/c>\x1b\[[1-7]z/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		t = t.replace(/<a(|[^]+?)>([^]+?)<\/a>/gi, '\x1b<a target="_blank" $1\x1b>$2\x1b<\/a\x1b>');
		
		/* conform send links with no href */
		t = t.replace(/(<send )("[^]+?)>/gi, '$1 href=$2>');
		
		/* <send> simple & single-choice tag: turn into links, escape &lt, &gt */
		t = t.replace(/<send(|[^]+?)>([^]+?)<\/send>/gi, '\x1b<a class="mxp tip"$1\x1b>$2\x1b<\/a\x1b>');
		
		t = t.replace(/hint=/gi, 'title=');
		
		/* <font> support */
		t = t.replace(/\x1b\[[1-7]z<font([^]+?)>\x1b\[[1-7]z/gi, '\x1b<font style="$1>');
			t = t.replace(/<font([^]+?)color=([^ >]+)/gi, '<font$1color:$2;');
			t = t.replace(/<font([^]+?)back=([^ >]+)/gi, '<font$1background-color:$2;');
			t = t.replace(/<font([^]+?)face='([^']+)'/gi, '<font$1font-family:\'$2\';');
			t = t.replace(/<font([^]+?)face="([^"]+)"/gi, '<font$1font-family:\'$2\';');
			t = t.replace(/<font([^]+?)face=([^ >]+)/gi, '<font$1font-family:\'$2\';');
			t = t.replace(/<font([^]+?)size=([^ >]+)/gi, '<font$1font-size:$2px;');
		t = t.replace(/<font([^]+?)>/gi, '\x1b<span$1"\x1b>');
		t = t.replace(/<\/font>/gi, '\x1b</span\x1b>');

		/* <image> support */
		t = t.replace(/\x1b\[[1-7]z<image ([^]+?) url="([^]+?)">\x1b\[[1-7]z/gi, '\x1b<img src="$2$1"\x1b>');
		t = t.replace(/\x1b\[[1-7]z<image([^]+?)url="([^]+?)">\x1b\[[1-7]z/gi, '\x1b<img$1src="$2"\x1b>');
		
		/* open tags */
		t = t.replace(/<([\/BRIUS]{1,3})>/gi, '\x1b<$1\x1b>');

		//if (Config.debug)
			//t += '<buy>bread</buy>';
		
		/* declared elements */
		for (var i = 0; i < elements.length; i++) {
			if (elements[i][1] == 'FLAG=""') {
				var re = new RegExp('<('+elements[i][0]+')>([^]+)<\/'+elements[i][0]+'>', 'g');
				t = t.replace(re, '\x1b<a class="mxp" href="$1 $2"\x1b>$2\x1b</a\x1b>');
			}
			else {
				var re = new RegExp('<(|\/)'+elements[i][0]+'>', 'g');
				t = t.replace(re, '');
			}
		}
		
		//log('post-MXP: '+t);
		if (t.match(/\x1b\[[1-7]z<frame/i)) {
		
			j('#mxpf').html(
				t
				.replace(/<frame (.+?) (open)/gi, '<span class="iframe" $1 open="1"')
				.replace(/<frame (.+?) (eof)/gi, '<span class="iframe" $1 eof="1"')
				.replace(/<frame (.+?) (close)/gi, '<span class="iframe" $1 close="1"')
				.replace(/<frame/gi, '<span class="iframe"')
			);
			
			j('#mxpf .iframe').each(function() {
				
				var n = j(this).attr('name');
				var p = j(this).attr('parent');
				var align = j(this).attr('align');
				var open = j(this).attr('open');
				var close = j(this).attr('close');
				var eof = j(this).attr('eof');
				var action = j(this).attr('action') || j(this).attr('Action');
				
				if (!action && !close && !eof) 
					action = "open";
				else
					action = "eof";

				if (action.toLowerCase() == "close")
					close = 1;
				
				if (action.toLowerCase() == "open")
					open = 1;
				
				var css = {
					width: j(this).attr('width') || 300,
					height: j(this).attr('height') || 280,
					left: j(this).attr('left') || (j(window).width() - 300),
					top: j(this).attr('top') || 20
				};
				
				if (align && align.length) {
					if (align.has('top'))
						css.top = 0;
					if (align.has('bottom'))
						css.bottom = 0;
					if (align.has('left'))
						css.left = 0;
					if (align.has('right'))
						css.right = 0;
				};
				
				if (window[n]) {
					if (close)
						j('.' + n).remove();
					else
					if (eof)
						j('.' + n).empty();
					else
					if (j('.' + n).length)
						j('.' + n +' .content').empty();
					else 
					if (action == 'open')
						Config[n] = new window[n];
				}
				else
				if (p && Config[p]) {
					if (close) {
						j('.tab-' + n).remove();
						j('a[href="#tab-'+n+'"]').remove;
					}
					else
					if (eof)
						j('.tab-' + n).empty();
					else
					if (j('.tab-' + n).length)
						j('.tab-' + n).empty();
					else 
					if (action == 'open')
						Config[p].win.tab({
							name: n,
							'class': 'tab-'+n
						});
				}
				else if (!p && action == 'open') {
					console.log('New MXP window: ' + n);
					Config[n] = new Window({ 
						id: '#' + n, 
						title: n, 
						'class': n + ' nofade',
						css: css
					});
					
					j('#' + n + ' .content')
					.addClass('nice').niceScroll({
						cursorwidth: 7,
						cursorborder: 'none'
					});
				}
				
				Event.fire('mxp_frame', n, action);
				
			});
			
			t = t.replace(/\x1b\[[1-7]z<frame.+?>/gi, '');
		}
		
		if (t.match(/\x1b\[[1-7]z<dest/i)) {
		
			j('#mxpf').html(
				t
				.replace(/\x1b\[[1-7]z<dest ([A-Za-z]+)/gi, '<div class="dist" name="$1"')
				.replace(/\x1b\[[1-7]z<\/dest>/gi, '</div>')
			);
			
			j('#mxpf .dist').each(function() {

				var x = j(this).attr('x');
				var y = j(this).attr('y');
				var n = j(this).attr('name');
				
				var msg = prep(j(this).html());

				if (x || y)
					msg = '<span style="position: absolute; top: ' + (y || 0) + '; left: ' + (x || 0) + '">' + msg + '</span>';

				msg = Event.fire('mxp_dest', msg, n);
				
				if (j('.tab-'+n).length) {
					var my = j('.tab-'+n);
					my.append(msg).scrollTop(my.prop('scrollHeight'));
					j(my).parent().parent().find('a[href="#'+j(my).attr('id')+'"]').tab('show');
					j(my).closest('.window').get(0).win.resize();
				}
				else
				if (j('#' + n).length) {
					var my = j('#' + n + ' .content');
					my.append(msg).scrollTop(my.prop('scrollHeight'));
					j('#' + n).get(0).win.resize();
				}
				
			});
			
			t = t.replace(/(\x1b\[[1-7]z<dest[\s\S]*\/dest>)/gi, '');
		}
		
		t = t.replace(/\x1b\[[1-7]z/g, ''); /* strip any remaining enclosures, for now */
		return t;
	};
	
	var multi = function(o, src) {
		
		var o = o.split('|');
		
		log(o);
		
		if (o.length == 1)
			return;
		
		j('.mxp-dropdown').remove();
		
		j('body').append('<ul class="mxp-dropdown"></ul>');
		
		for (var i = 0; i < o.length; i++)
			j('.mxp-dropdown').append('<li><a class="mxp" href="'+o[i]+'">'+o[i]+'</a>');
		
		j('.mxp-dropdown').css({
			top: j(src).offset().top,
			left: j(src).offset().left + j(src).width() + 5,
			zIndex: 200,
			position: 'absolute'
		});
		
		j('input').on('mouseover', function() {
			j('.mxp-dropdown').remove();
		});
	};
	
	j('body').on('click', '.mxp', function(evt) {

		j('.mxp-dropdown').remove();
		//console.log('mxp click');
		var href;
		
		if ((href = j(this).attr('href'))) {
			
			 if (href.has('|'))
				multi(href, this);
			 else
				Config.socket.write(href);
		}
		else
			Config.socket.write(j(this).text());
		
		return false;
	});
	
	return {
		process: process,
		enabled: function() { return mxp; }
	};
};

if (Config.getSetting('mxp') == null || Config.getSetting('mxp') == 1) {
	Config.mxp = new MXP();
	Event.listen('internal_mxp', Config.mxp.process);
}
else
	log('MXP disabled in profile or game preferences.');
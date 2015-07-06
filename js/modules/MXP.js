/* 
 * v1.3 - 9/26/2014
 * This plugin is part of the core so it's always available on the app page
 *  
*/

var MXP = function () {
	
	var mxp = 0, elements = [], entities = [];
	
	var prep = function(t) {
	
		t = new Colorize()
			.process(t)
			.replace(/\x1b\[[1-7]z/g, '')
			.replace(/\r/g,'')
			.replace(/\n/g,'<br>');
			
		t = t.replace(/\x1b>/g,'>');
		t = t.replace(/\x1b</g,'<');
		
		return t;
	};

	var process = function(t) {
		
		if (!t)
			return t;
		
		if (t.has('\xff\xfa\x5b\xff\xf0')) {
			log('Got IAC SB MXP IAC SE -> BEGIN MXP');
			t = t.replace(/.\xff\xfa\x5b\xff\xf0/, '');
			if (!mxp) {
				j('body').append('<div id="mxpf" style="display: none"></div>');
				mxp = 1;
			}
		}

		if (t.has('\xff\xfb\x5b')) {
			console.log('Got IAC WILL MXP -> BEGIN MXP');
			t = t.replace(/.\xff\xfb\x5b/, '');
			if (!mxp) {
				j('body').append('<div id="mxpf" style="display: none"></div>');
				mxp = 1;
			}
		}
		
		if (!mxp && !t.match(/\x1b\[[0-7]z/))
			return t;

		t = t.replace(/\r/g,'');
		
		if (t.has('<VERSION>'))
			t = t.replace('\x1b[1z<VERSION>\x1b[7z', '');
		
		if (t.match(/!element/i)) {
			
			var m = t.match(/<!element ([^]+?)>/gi);
			
			if (m && m.length) {
				
				elements = [];
				
				for (var i = 1; i < m.length; i++) {

					var e = m[i].substring(10, m[i].length-1).split(' ');

					if (e[1] == 'FLAG=""') {
						e[2] = new RegExp('<('+e[0]+')>([^]+)<\/'+e[0]+'>', 'gi');
						e[3] = '\x1b<a class="mxp" href="$1 $2"\x1b>$2\x1b</a\x1b>';
					}
					else {
						e[2] = new RegExp('<(|\/)'+e[0]+'>', 'gi');
						e[3] = '';
					}
					
					elements.push(e);
				}
				
				console.log(elements);
				Event.fire('mxp_elements', elements);
				t = t.replace(/<!element[^]+>/gi, '');
			}
		}
		
		if (t.match(/!entity/i)) {
			
			var m = t.match(/<!entity ([^]+?)>/gi);
			
			if (m && m.length) {
				
				entities = [];
				
				for (var i = 1; i < m.length; i++)
					entities.push(m[i].substring(9, m[i].length-1).split(' '));
				
				for (var i = 0; i < entities.length; i++)
					Event.fire('mxp_entity', entities[i]);
				
				t = t.replace(/<!entity[^]+>/gi, '');
				log(entities);
			}
		}
				
		/* declared elements */
		for (var i = 0; i < elements.length; i++)
			t = t.replace(elements[i][2], elements[i][3]);
		
		/* <color> tag */
		t = t.replace(/\x1b\[[1-7]z<color(.+?)>([^]+?)<\/color>\x1b\[[1-7]z/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		/* <c> tag */
		t = t.replace(/\x1b\[[1-7]z<c (.+?)>([^]+?)<\/c>\x1b\[[1-7]z/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		t = t.replace(/<a(|[^]+?)>([^]+?)<\/a>/gi, '\x1b<a target="_blank" $1\x1b>$2\x1b<\/a\x1b>');
		
		/* conform send links with no href */
		t = t.replace(/(<send )([^"]+?)>/gi, '$1 href=$2>');
		t = t.replace(/send href=""/gi, 'send href="#"');
		
		/* <send> simple & single-choice tag: turn into links, escape &lt, &gt */
		t = t.replace(/<send(|[^>]+)>(.+?)<\/send>/gi, '\x1b<a class="mxp tip"$1\x1b>$2\x1b<\/a\x1b>');
		
		t = t.replace(/hint="([^|]+?)"/gi, 'title="$1"');

		/* <font> support */
		t = t.replace(/\x1b\[[1-7]z<font([^]+?)>\x1b\[[1-7]z/gi, '<font style="$1>');
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

		//if (Config.debug)
			//t += '<buy>bread</buy>';
		//if (Config.debug)
			//t += '<BR><BR>';
		/* open tags */
		t = t.replace(/<([\/BRIUS]{1,3})>/gi, '\x1b<$1\x1b>');

		t = frames(t);
		
		t = t.replace(/\x1b\[[1-7]z<[^\x1b>]+>/g, '');  /* strip any unsupported tags */
		t = t.replace(/<[^\x1b>]+?>\x1b\[[1-7]z/g, '');
		t = t.replace(/\x1b\[[1-7]z/g, ''); /* strip any remaining enclosures, for now */

		return t;
	};
	
	var frames = function(t) {
		
		if (t.match(/\x1b\[[1-7]z<frame/i)) {
			
			j('#mxpf').html(
				prep(
				t
				.replace(/<frame (.+?) (open)/gi, '<span class="iframe" $1 open="1"')
				.replace(/<frame (.+?) (eof)/gi, '<span class="iframe" $1 eof="1"')
				.replace(/<frame (.+?) (close)/gi, '<span class="iframe" $1 close="1"')
				.replace(/<frame/gi, '<span class="iframe"')
				)
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
					width: j(this).attr('width') || null,
					height: j(this).attr('height') || null,
					left: j(this).attr('left') || null,
					top: j(this).attr('top') || null
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
				
				if (css.width || css.height || css.left || css.top)
					css.pos = 1;
				else
					css = null;
				
				if (window[n] || j('.' + n).length) {
					if (close)
						j('.' + n).remove();
					else
					if (eof || j('.' + n).length) {
						if (j('.' + n + ' .out').length) /* need a better way to empty different elements */
							j('.' + n + ' .out').empty();
						else
							j('.' + n + ' .content').empty();
					}
					else 
					if (action == 'open') {
						try {
							Config[n] = new window[n];
						}
						catch(ex) {
							console.log('New MXP window: ' + n);
							Config[n] = new Window({ 
								id: '#' + n, 
								title: n, 
								'class': n + ' nofade',
								css: (css.pos || (align && align.length) ) ? css : null
							});
							
							j('#' + n + ' .content').addClass('nice').niceScroll({
								cursorwidth: 7,
								cursorborder: 'none'
							});
						}
					}
				}
				else
				if (p && Config[p]) {
					if (close) {
						j('.tab-' + n).remove();
						j('a[href="#tab-'+n+'"]').remove;
					}
					else
					if (eof || j('.tab-' + n).length) {
						if (j('.tab-' + n + ' .content').length)
							j('.tab-' + n + ' .content').empty();
						else
							j('.tab-' + n).empty();
					}
					else 
					if (action == 'open')
						Config[p].win.tab({
							name: n,
							'class': 'tab-'+n,
							scroll: 1
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
					
					j('#' + n + ' .content').addClass('nice').niceScroll({
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
				prep(
				t
				.replace(/\n/g,'<br>')
				.replace(/\x1b\[[1-7]z<dest ([^>]+)/gi, '<div class="dest" name="$1"')
				.replace(/\x1b\[[1-7]z<\/dest>/gi, '</div>')
				)
			);
			
			j('#mxpf .dest').each(function() {

				var x = j(this).attr('x');
				var y = j(this).attr('y');
				var n = j(this).attr('name');
				
				var msg = j(this).html();

				if (x || y)
					msg = '<span style="position: absolute; top: ' + (y || 0) + '; left: ' + (x || 0) + '">' + msg + '</span>';

				msg = Event.fire('mxp_dest', msg, n);
				
				if (j('.tab-'+n).length) {
					
					var my = j('.tab-'+n + ' .content').length ? j('.tab-'+n + ' .content') : j('.tab-'+n);
					
					my.append(msg);
					//my.parent().parent().find('a[href="#'+j(my).attr('id')+'"]').tab('show');
					
					if (my.hasClass('nice')) {
						my.getNiceScroll().resize();
						my.scrollTop(my.prop('scrollHeight'));
					}
				}
				else
				if (j('#' + n).length) {
				
					if (n == 'scroll-view') {
						Config.ScrollView.add(msg);
						return j('#' + n).get(0).win.front();
					}
					
					var my = j('#' + n + ' .content');
					my.append(msg);
					
					if (my.hasClass('nice')) {
						my.getNiceScroll().resize();
						my.scrollTop(my.prop('scrollHeight'));
					}
				}
				else
				if (n == 'Modal') {
					msg = msg.split('<br>');
					var title = msg.shift();
					msg.shift();
					new Modal({
						title: title,
						text: msg.join('<br>'),
						replace: 1
					});
				}
				else
				if (Config.ScrollView)
					Config.ScrollView.add(msg);
			});
			
			t = t.replace(/(\x1b\[[1-7]z<dest[\s\S]*\/dest>)/gi, '');
		}
		
		return t;
	};
	
	var multi = function(o, src) {
		
		var o = o.split('|'), hint = [];
		
		log(o);
		
		if (j(src).attr('hint') && j(src).attr('hint').has('|'))
			hint = j(src).attr('hint').split('|');
			
		j('.mxp-dropdown').remove();
		
		j('body').append('<ul class="mxp-dropdown"></ul>');
		
		for (var i = 0; i < o.length; i++)
			j('.mxp-dropdown').append('<li><a class="mxp" href="'+o[i]+'">' + (hint[i+1] || o[i]).replace(/[0-9]/g, '') + '</a>');
		
		j('.mxp-dropdown').css({
			top: j(src).offset().top,
			left: j(src).offset().left + j(src).width() + 5,
			position: 'absolute'
		});
		
		j('input').on('mouseover', function() {
			j('.mxp-dropdown').remove();
		});
	};
	
	var translate = function(t) {
		return prep(process(t));
	};
	
	j('body').on('click', '.mxp', function(evt) {

		j('.mxp-dropdown').remove();
		//console.log('mxp click');
		var href = j(this).attr('href');
		
		if (href) {
			if (href.has('|'))
				multi(href, this);
			else
			if (href == '#')
				Config.socket.write('');
			else
				Config.socket.write(href);
		}
		else
			Config.socket.write(j(this).text());
		
		return false;
	});
	
	j('body').on('click', function(evt) {
		if (!j(this).is('a'))
			j('.mxp-dropdown').remove();
	});
	
	return {
		prep: prep,
		process: process,
		translate: translate,
		enabled: function() { 
			return mxp; 
		},
		disable: function() {
			mxp = 0;
		}
	};
};

if (Config.getSetting('mxp') == null || Config.getSetting('mxp') == 1) {
	Config.mxp = new MXP();
	Event.listen('internal_mxp', Config.mxp.process);
}
else
	log('MXP disabled in profile or game preferences.');

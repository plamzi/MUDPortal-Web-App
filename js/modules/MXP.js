/* 
 * v1.1 - 9/9/2013
 * This plugin is part of the core so it's always available on the app page
 *  
*/

var MXP = function () {
	
	var mxp = 0, elements = [];
	
	var process = function(t) { 	
		
		if (t.has('\xff\xfa\x5b\xff\xf0')) {
			log('Got IAC SB MXP IAC SE -> BEGIN MXP');
			t = t.replace(/.\xff\xfa\x5b\xff\xf0/, '');
			mxp = 1;
		}

		t = t.replace(/ÿú\[ÿð/, ''); 

		if (!mxp)
			return t;
		
		if (t.has('ELEMENT')) {
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
		t = t.replace(/<color(.+?)>([^]+?)<\/color>/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		/* <c> tag */
		t = t.replace(/<c (.+?)>([^]+?)<\/c>/gi, '\x1b<span style="color: $1"\x1b>$2\x1b<\/span\x1b>');
		
		t = t.replace(/<a(|[^]+)>([^]+)<\/a>/gi, '\x1b<a target="_blank" $1\x1b>$2\x1b<\/a\x1b>');
		
		/* conform send links with no href */
		t = t.replace(/(<send )("[^]+?)>/gi, '$1 href=$2>');
		
		/* <send> simple & unichoice tag: turn into links, escape &lt, &gt */
		t = t.replace(/<send(|[^]+?)>([^]+?)<\/send>/gi, '\x1b<a class="mxp"$1\x1b>$2\x1b<\/a\x1b>');
		
		t = t.replace(/<font color=([^]+?)>/gi, '\x1b<span style="color:$1"\x1b>');
		
		t = t.replace(/<\/font>/gi, '\x1b</span\x1b>');
		
		/* open tags */
		t = t.replace(/<([\/BRIUS]{1,3})>/gi, '\x1b<$1\x1b>');

		t = t.replace(/\x1b\[[0-9]+?z/g, '\x1b'); /* strip enclosures, for now */
		
		t = t.replace(/\x1b\[7/g, ''); /* strip enclosures, for now */
		
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

		return t;
	}
	
	var multi = function(o, src) {
		
		var o = o.split('|');
		
		log(o);
		
		if (o.length == 1)
			return;
		
		j('.mxp-dropdown').remove();
		
		j('.out').append('<ul class="mxp-dropdown"></ul>');
		
		mxp++;
		
		for (var i = 0; i < o.length; i++)
			j('.mxp-dropdown').append('<li><a class="mxp" href="'+o[i]+'">'+o[i]+'</a>');
		
		j('.mxp-dropdown').css({
			top: j(src).offset().top - 5,
			left: j(src).offset().left,
			zIndex: j(src).parent().parent().zIndex() + 1, 
			position: 'fixed'
		});
		
		/*
		j(src).parent().on('click', function() {
			setTimeout( function () {
				j('.mxp-dropdown').remove();
			}, 400);
			return true;
		});
		
		j(src).parent().next().on('click', function() {
			j('.mxp-dropdown').remove();
			return true;
		});*/
		
		j('input').on('mouseover', function() {
			j('.mxp-dropdown').remove();
		});
	}
	
	j('body').on('click', '.mxp', function(evt) {
		
		j('.mxp-dropdown').remove();
		//console.log('mxp click');
		var href;
		
		if ((href = j(this).attr('href'))) {
			
			 if (href.has('|'))
				multi(href, this);
			 else
				Config.socket.send(href);
		}
		else
			Config.socket.send(j(this).text());
		
		return false;
	});
	
	return {
		process: process
	}
}

if (Config.getSetting('mxp') == null || Config.getSetting('mxp') == 1)
	Event.listen('internal_mxp', new MXP().process);
else
	log('MXP disabled in profile or game preferences.');
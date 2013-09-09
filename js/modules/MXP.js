/* 
 * v1.1 - 9/9/2013
 * This plugin is part of the core so it's always available on the app page
 *  
*/

var MXP = function () {
	
	var out, mxp = 0, elements = [];

	var process = function(t, caller) { 	
		
		out = caller;
		
		if (t.has('\xff\xfb\x5b')) { // IAC WILL MXP
			console.log('Got IAC WILL MXP');
			t = t.replace(/\xff\xfb\x5b/, '');
			mxp = 1;
		}
		
		//<IAC><SB><MXP><IAC><SE> - begin MXP
		t = t.replace(/.\xff\xfa\x5b\xff\xf0/, '');
		t = t.replace(/ÿú\[ÿð/, '');       

		if (!mxp)
			return t;
		
		if (t.has('ELEMENT')) {
			var m = t.match(/<!element [^]+?>/gi);
			if (m && m.length)
				for (var i = 0; i < m.length; i++)
					elements.push(m[i].split(' '));
			//t = t.replace(/<!element[^]+?>/gi, '');
		}
		
		t = t.replace(/<!element[^]+>/gi, '');
		
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
		
		/* open tags */
		t = t.replace(/<([\/BRIUS]{1,3})>/gi, '\x1b<$1\x1b>');
		
		/* declared elements */
		for (var i = 0; i < elements.length; i++) {
			var re = new RegExp('<(|\/)'+elements[i][1]+'>', 'g');
			t = t.replace(re, '');
		}
		
		t = t.replace(/\x1b\[[0-9]+?z/g, '\x1b'); /* strip enclosures, for now */
		t = t.replace(/\x1b\[7/g, ''); /* strip enclosures, for now */

		return t;
	}
	
	var multi = function(o, src) {
		
		var o = o.split('|');
		
		console.log(o);
		
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
		
		var href;
		
		if ((href = j(this).attr('href'))) {
			
			 if (href.has('|'))
				multi(href, this);
			 else
				out.send(href);
		}
		else
			out.send(j(this).text());
		
		return false;
	});
	
	return {
		process: process
	}
}

Event.listen('before_process', new MXP().process);
/*
 * Colorize.js is always included in the app page so you don't need to invoke it manually.
 * It is used internally by other modules, such as ScrollView.js
 * Adds ANSI 16-color codes and XTERM256 colors using span tags
*/

var Colorize = function (o) {
	
	var xterm;
	
	var ansi = {
		'30':   	'#000',	   //black
		'1;30':		'#6E6E6E', //bright black
		'31':		'#bf1b00', //red
		'1;31':		'#ff193f', //bright red
		'32':		'#00ac00', //green
		'1;32':		'#a1e577', //bright green
		'33':		'#DAA520', //yellow		
		'1;33':		'#f3df00', //bright yellow
		'34':		'#1f68d5', //blue
		'1;34':		'#3680ee', //bright blue
		'35':		'#a501a7', //magenta
		'1;35':		'#e100e4', //bright magenta
		'36':		'#01c8d4', //cyan
		'1;36':		'#5bedf6', //bright cyan
		'37':		'#dbdbdb', //off-white
		'1;37':		'#fff; font-weight: bold',	  //bright white
		'39': 		'#dbdbdb',  //default
	},
	
	bgansi = {
		'40': 'Black',
		'1;40': 'DimGray',
		'41': 'Red', 
		'1;41': 'OrangeRed',
		'42': 'Green',
		'1;42': 'LightGreen,',
		'43': 'GoldenRod',
		'1;43': 'Gold',
		'44': 'Blue', 
		'1;44': 'LightSkyBlue',
		'45': 'DarkOrchid',
		'1;45': 'Magenta',
		'46': 'Cyan',
		'1;46': 'LightCyan',
		'47': 'FloralWhite',
		'1;47': 'White',
		'49': 'Black',
		'1;49': 'DimGray'
	},
	
	other = {
		'[1m': '<b>',
		'[3m': '<i>',
		'[4m': '<u>',
		'[7m': '', /* invert */
		'[9m': '<s>',
		'[22m': '</b>',
		'[23m': '</i>',
		'[24m': '</u',
		'[27m': '', /* uninvert */
		'[29m': '</s>'
	};

	var colors256 = ['#000', '#B00','#0B0','#BB0','#00B','#B0B','#0BB','#BBB','#555','#F55','#5F5','#FF5','#55F','#F5F','#5FF','#FFF','#000','#005','#008','#00B','#00D','#00F','#050','#055','#058','#05B','#05D','#05F','#080','#085','#088','#08B','#08D','#08F','#0B0','#0B5','#0B8','#0BB','#0BD','#0BF','#0D0','#0D5','#0D8','#0DB','#0DD','#0DF','#0F0','#0F5','#0F8','#0FB','#0FD','#0FF','#500','#505','#508','#50B','#50D','#50F','#550','#555','#558','#55B','#55D','#55F','#580','#585','#588','#58B','#58D','#58F','#5B0','#5B5','#5B8','#5BB','#5BD','#5BF','#5D0','#5D5','#5D8','#5DB','#5DD','#5DF','#5F0','#5F5','#5F8','#5FB','#5FD','#5FF','#800','#805','#808','#80B','#80D','#80F','#850','#855','#858','#85B','#85D','#85F','#880','#885','#888','#88B','#88D','#88F','#8B0','#8B5','#8B8','#8BB','#8BD','#8BF','#8D0','#8D5','#8D8','#8DB','#8DD','#8DF','#8F0','#8F5','#8F8','#8FB','#8FD','#8FF','#B00','#B05','#B08','#B0B','#B0D','#B0F','#B50','#B55','#B58','#B5B','#B5D','#B5F','#B80','#B85','#B88','#B8B','#B8D','#B8F','#BB0','#BB5','#BB8','#BBB','#BBD','#BBF','#BD0','#BD5','#BD8','#BDB','#BDD','#BDF','#BF0','#BF5','#BF8','#BFB','#BFD','#BFF','#D00','#D05','#D08','#D0B','#D0D','#D0F','#D50','#D55','#D58','#D5B','#D5D','#D5F','#D80','#D85','#D88','#D8B','#D8D','#D8F','#DB0','#DB5','#DB8','#DBB','#DBD','#DBF','#DD0','#DD5','#DD8','#DDB','#DDD','#DDF','#DF0','#DF5','#DF8','#DFB','#DFD','#DFF','#F00','#F05','#F08','#F0B','#F0D','#F0F','#F50','#F55','#F58','#F5B','#F5D','#F5F','#F80','#F85','#F88','#F8B','#F8D','#F8F','#FB0','#FB5','#FB8','#FBB','#FBD','#FBF','#FD0','#FD5','#FD8','#FDB','#FDD','#FDF','#FF0','#FF5','#FF8','#FFB','#FFD','#FFF','rgb(8,8,8)','rgb(18,18,18)','rgb(28,28,28)','rgb(38,38,38)','rgb(48,48,48)','rgb(58,58,58)','rgb(68,68,68)','rgb(78,78,78)','rgb(88,88,88)','rgb(98,98,98)','rgb(108,108,108)','rgb(118,118,118)','rgb(128,128,128)','rgb(138,138,138)','rgb(148,148,148)','rgb(158,158,158)','rgb(168,168,168)','rgb(178,178,178)','rgb(188,188,188)','rgb(198,198,198)','rgb(208,208,208)','rgb(218,218,218)','rgb(228,228,228)','rgb(238,238,238)'];

	var prep = function(t) {
		t = t.replace(/\033/g, ';');
		t = t.replace(/[m\[]/g, '');
		t = t.split(';');
		t.shift();
		return t;
	}
	
	var stripANSI = function(t) {
		return t.replace(/\033\[[0-9;]+?m/g,'');
	}
	
	var colorize = function(t) {
		
		//log('Colorize received: '+t);
		
		if (t.has('[7m')) {
			//log("before: "+t);
			t = t.replace(/(\033\[.*?)3([0-9])(.*?m)\033\[7m/g, '$14$2$3');
			//log("after: "+t);
		}
		
		t = t.replace(/\033\[[0;]+m/g, '</span>');
		
		var m = t.match(/(\033\[[0-9;]+m\033\[[0-9;]+m|\033\[[0-9;]+m)/g);
		
		if (!m)
			return t;
		
		m = m.unique();
		m = m.sort(function(a, b) { return (b.length - a.length) });
		
		//log(m);

		for (var i = 0; i < m.length; i++) {
			
			var v = '', xterm = 0, c = prep(m[i]);
			var color = '', bgcolor = '', bold = '', italic = '';
			
			//log(c);
			
			for (var a = 0; a < c.length; a++) {
				
				if (c[a] == '1')
					bold = ' font-weight: bold;';
				else
				if (c[a] == '3')
					italic = ' font-style: italic;';
				else
				if (c[a] == '7')
					flip = 1;
			}
			
			for (var a = 0; a < c.length; a++) {
				
				if (c[a] == '5') {
					if (c[a-1] == '38') {
						color = 'color:'+colors256[parseInt(c[a+1])]+';';
						xterm = 1;
					}
					else
					if (c[a-1] == '48') {
						bgcolor = ' background-color:'+colors256[parseInt(c[a+1])]+';';
						xterm = 1;
					}
				}
				else
				if (!xterm && ansi[c[a]]) {
					if (bold)
						color = 'color:'+ansi['1;'+c[a]]+';';
					else
						color = 'color:'+ansi[c[a]]+';';
				}
				else
				if (!xterm && bgansi[c[a]]) {
					if (bold)
						bgcolor = ' background-color:'+bgansi['1;'+c[a]]+';';
					else
						bgcolor = ' background-color:'+bgansi[c[a]]+';';
				}
			}
				
			if (c.has('0') || color || bgcolor)
				v += '</span>';
			
			if (color || bgcolor || bold || italic)
				v += '<span style="' + color + bgcolor + bold + italic + '">';
			
			//log(v);
			
			var re = new RegExp(m[i].replace(/\[/g, '\\['), 'g');
			t = t.replace(re, v);
		}

		for (var o in other) {
			re = new RegExp('\033\\'+o, 'g');
			t = t.replace(re, other[o]);
		}
		
		t = t.replace(/\033\[[0-9;]+?m/g,'');
		t = t.replace(/\033\[2J/g,'');
		t = t.replace(/\033\[0c/g,'');

		//console.log('after colorize: '+t);
		return t;
	}
	
	var process = function(t) {
		
		if (!t.has('\033')) 
			return t;
		
		t = colorize(t);
		
		return t;
	}
	
	return {
		process: process,
		strip: stripANSI
	}
	
}

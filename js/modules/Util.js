String.prototype.has = function(a) { if (!a.length) return false; return (this.indexOf(a) != -1) };

String.prototype.start = function(a) { return (this.indexOf(a) == 0) };

String.prototype.cap = function() {  return this.charAt(0).toUpperCase() + this.slice(1) };

stringify = function(A) {
	var cache = [];
	var val = JSON.stringify(A, function(k, v) {
	    if (typeof v === 'object' && v !== null) {
	        if (cache.indexOf(v) !== -1)
	            return;
	        cache.push(v);
	    }
	    return v;
    });
    return val;
};

function html_encode(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
};

function html_decode(str) {
    return str.replace(/&amp\;/g,'&').replace(/&lt\;/g,'<').replace(/&gt\;/g,'>') ;
};

function addslashes(str) {
  //  discuss at: http://phpjs.org/functions/addslashes/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Ates Goral (http://magnetiq.com)
  // improved by: marrtins
  // improved by: Nate
  // improved by: Onno Marsman
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Oskar Larsson H�gfeldt (http://oskar-lh.name/)
  //    input by: Denny Wardhana
  //   example 1: addslashes("kevin's birthday");
  //   returns 1: "kevin\\'s birthday"

  return (str + '')
    .replace(/[\\"']/g, '\\$&')
    .replace(/\u0000/g, '\\0');
};

function getSelText() {
	
	if (window.getSelection)
	    return window.getSelection().toString();
	else if (document.getSelection)
		return document.getSelection().toString();
	else if (document.selection)
	     return document.selection.createRange().text;
	
	return null;
}

function getCaretPosition (ctrl) {
	var CaretPos = 0;	// IE Support
	if (document.selection) {
	ctrl.focus ();
		var Sel = document.selection.createRange ();
		Sel.moveStart ('character', -ctrl.value.length);
		CaretPos = Sel.text.length;
	}
	// Firefox support
	else if (ctrl.selectionStart || ctrl.selectionStart == '0')
		CaretPos = ctrl.selectionStart;
	return (CaretPos);
}

function setCaretPosition(ctrl, pos){
	if(ctrl.setSelectionRange)
	{
		ctrl.focus();
		ctrl.setSelectionRange(pos,pos);
	}
	else if (ctrl.createTextRange) {
		var range = ctrl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}

Date.prototype.ymd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString();
   var dd  = this.getDate().toString();
   return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};
	  
Array.prototype.remove = function() {
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what= a[--L];
		while((ax = this.indexOf(what)) != -1){
			this.splice(ax, 1);
		}
	}
	return this;
}

Array.prototype.index = function(key1, val1, key2, val2) {

	if (!key1) {
		for (var i = 0; i < this.length; i++)
			if (this[i] == val1)
				return i;
	}
	
	if (!this.length || !this[0][key1]) return -1;
	for (var i = 0; i < this.length; i++) {
		if (this[i][key1] == val1) {
			if (!val2)
				return i;
			else if (this[i][key2] == val2)
				return i;
		}
	}
	
	return -1;
}

Array.prototype.fetch = function(key1, val1, key2) {

	if (!this.length || !this[0][key1]) 
		return null;
	
	for (var i = 0; i < this.length; i++) {
		if (this[i][key1] == val1)
			return this[i][key2];
	}
	
	return null;
}

Array.prototype.has = function(v) {
	return (this.indexOf(v) != -1);
}

Array.prototype.not = function(key1, val1) {
	if (!key1)
		return null;
	for (var i = 0; i < this.length; i++)
		if (this[i] != val1)
			return this[i];
	return null;
}

Array.prototype.unique = function() {
    return this.reduce(function(p, c) {
        if (p.indexOf(c) < 0) 
        	p.push(c);
        return p;
    }, []);
}

Array.prototype.add = function(A) {
	if (this.indexOf(A) == -1)
		this.push(A);
}

Array.prototype.remove = function(A) {
	if (this.indexOf(A) != -1)
		this.splice(this.indexOf(A), 1);
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /*, thisp*/) {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this) {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }
    return res;
  };
}

String.prototype.trimm = function () { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '') }

String.prototype.param = function(A) {
	A = A.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+A+"=([^&#]*)");
	var results = regex.exec(this);
	if( results == null ) return "";
		else return decodeURIComponent(results[1]);
}

/*
if (!Object.prototype.extend)
	Object.defineProperty(Object.prototype, "extend", {
		enumerable: false,
		value: function() {
			var dest = this;
			for (var i = 0; i < arguments.length; i++) {
				var from = arguments[i], 
					props = Object.getOwnPropertyNames(from);
					props.forEach(function(name) {
						var d = Object.getOwnPropertyDescriptor(from, name);
						Object.defineProperty(dest, name, d);
					});
			}
			return this;
		}
	});
*/
var param = function(A) {
	A = A.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+A+"=([^&#]*)");
	var results = regex.exec(window.location.search);
	if( results == null ) return "";
		else return decodeURIComponent(results[1]);
}

var log = function() {
	if (Config.debug)
		console.log.apply(console, arguments);
}

var dump = function(A) {
	if (Config.debug)
		console.log(stringify(A))
}

function exists(A) { return ( typeof A != 'undefined' ) ? 1 : 0 };

function addCommas(nStr) {
	nStr += '';
x = nStr.split('.');
x1 = x[0];
x2 = x.length > 1 ? '.' + x[1] : '';
var rgx = /(\d+)(\d{3})/;
while (rgx.test(x1)) {
	x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

jQuery.fn.center = function () {
    this.css("top", Math.max(0, (jQuery(window).height() - jQuery(this).height()) / 2));
    this.css("left", Math.max(0, (jQuery(window).width() - jQuery(this).width()) / 2));
    return this;
}

var multiprocess = function(cb)  {
	var i = 0, busy = 0, done = 0;
	var processor = setInterval(function() {
		if (!busy) {  
			busy = 1;
				done = cb.call();
					if (done)
						clearInterval(processor);
			busy = 0;
		}
	}, 100);
}

function glow(url) {
	
	var stdDeviation = 2,
	rgb = "#000",
	colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";
	 
	if (!arguments.length) {
	url = "glow";
	}
	 
	function my() {
	 
	var defs = this.append("defs");
	 
	var filter = defs.append("filter")
	.attr("id", url)
	.attr("x", "-20%")
	.attr("y", "-20%")
	.attr("width", "140%")
	.attr("height", "140%")
	.call(function() {
	this.append("feColorMatrix")
	.attr("type", "matrix")
	.attr("values", colorMatrix);
	this.append("feGaussianBlur")
	// .attr("in", "SourceGraphics")
	.attr("stdDeviation", stdDeviation)
	.attr("result", "coloredBlur");
	});
	 
	filter.append("feMerge")
	.call(function() {
	this.append("feMergeNode")
	.attr("in", "coloredBlur");
	this.append("feMergeNode")
	.attr("in", "SourceGraphic");
	});
	}
	 
	my.rgb = function(value) {
	if (!arguments.length) return color;
	rgb = value;
	color = d3.rgb(value);
	var matrix = "0 0 0 red 0 0 0 0 0 green 0 0 0 0 blue 0 0 0 1 0";
	colorMatrix = matrix
	.replace("red", color.r)
	.replace("green", color.g)
	.replace("blue", color.b);
	 
	return my;
	};
	 
	my.stdDeviation = function(value) {
	if (!arguments.length) return stdDeviation;
	stdDeviation = value;
	return my;
	};
	 
	return my;
}
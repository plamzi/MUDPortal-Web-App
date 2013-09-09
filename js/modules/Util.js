String.prototype.has = function(A) { if (!A.length) return false; return (this.indexOf(A) != -1) }

String.prototype.start = function(A) { return (this.indexOf(A) == 0) }

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
}

Array.prototype.remove= function(){
	var what, a= arguments, L= a.length, ax;
	while(L && this.length){
		what= a[--L];
		while((ax= this.indexOf(what))!= -1){
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

String.prototype.trimm = function () { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '') }

String.prototype.param = function(A) {
	A = A.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+A+"=([^&#]*)");
	var results = regex.exec(this);
	if( results == null ) return "";
		else return decodeURIComponent(results[1]);
}

var param = function(A) {
	A = A.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+A+"=([^&#]*)");
	var results = regex.exec(window.location.search);
	if( results == null ) return "";
		else return decodeURIComponent(results[1]);
}

function exists(A) { return (( typeof A != 'undefined' )?A:null) };
	
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
    this.css("top", Math.max(0, (j(window).height() - j(this).height()) / 2));
    this.css("left", Math.max(0, (j(window).width() - j(this).width()) / 2));
    return this;
}
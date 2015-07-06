
var Modal = function(o) {
	
	log('Modal.init');
	
	o.backdrop = o.backdrop || 0;
	
	var close = function() {
		
		console.log('Modal close');
		
		if (o.abort)
			Config.Socket.write(o.abort);
		
		j('.modal .mo-dismiss').off();
		j('.modal').modal('hide');
	};
	
	var init = function() {
		
		if (o.close && o.close == 1)
			return j('.modal').modal('hide');
		
		if (o.mxp) {
			o.replace = 1;
			o.mxp = Config.mxp.translate(o.mxp);
			o.text = o.text ? o.mxp + o.text : o.mxp;
		}
		
		if (o.text)
			o.text = Config.mxp.prep(o.text);
		
		if (o.error)
			o.error = Config.mxp.prep(o.error);

		if (o.info)
			o.info = Config.mxp.prep(o.info);
		
		if (exists(o.monospace) && !o.monospace) {
			o.html = o.text;
			delete o.text;
			log('monospace option is false');
		}
		
		/* try to update the contents of an already existing modal */
		if (o.replace) {
			
			if (j('.modal-plain').length && j('.modal').is(':visible')) {
				
				log('modal (simple) found in replace mode');
				j('.modal h3').html(o.title);
				j('.modal .modal-body').html(o.text || o.html);
				
				buttons();
				links();
				
				return;
			}
		}
		
		j('.modal').modal('hide');
		
		j('body').append('\
			<div class="modal '+(o['class'] || '')+' modal-plain fade"><div class="modal-dialog"><div class="modal-content">\
				<div class="modal-header">\
					<button type="button" class="close mo-dismiss">×</button>\
					<h3>' + (o.title || '') + '</h3>\
				</div>\
				<div class="modal-body">\
				' + (o.info ? '<div class="alert alert-info">' + o.info + '</div>' : '') + '\
				' + (o.error ? '<div class="alert">' + o.error + '</div>' : '') + '\
				' + (o.text ? '<div class="modal-text-content">' + o.text + '</div>' : o.html) + '\
				<br><br></div>\
				<div class="modal-footer">\
					<button class="btn btn-primary kbutton dismiss mo-dismiss">OK</button>\
				</div>\
			</div></div></div>\
		');
	
		buttons();
		links();
		
		if (o.closeText || o.cancelText)
			j('.modal .dismiss').html(o.closeText || o.cancelText);
	
		if (o.closeable == false || o.closeable == 0)
			j('.modal .close').remove();
	
		j('.modal .mo-dismiss').on('click', close);
		
		if (o.css) {
			if (o.css.width)
				o.css['margin-left'] = -(o.css.width / 2); 
			j('.modal').css(o.css);
			//j('.modal-body').height(j('.modal').height() - j('.modal-header').height() - j('.modal-footer').height() - 4);
		}

		j('.modal').modal(o);
	};
	
	var buttons = function() {
		
		if (!o.buttons)
			return;
			
		j('.modal-footer .btn').remove();
		
		if (o.buttons.pop) {
			for (var i = 0; i < o.buttons.length; i++) {
				
				var b = o.buttons[i];
				
				j('.modal-footer').append('<button class="btn btn-default kbutton custom-'+i+'" data-dismiss="'+(b.keep?'':'modal')+'">'+b.text+'</button>');
				
				if (b.send)
					j('.modal-footer .custom-'+i).click(function(cmd) {
						return function() { Config.Socket.write(cmd); }
					}(b.send));
					
				if (b.click)
					j('.modal-footer .custom-'+i).click(b.click);
				
				if (b.css)
					j('.modal-footer .custom-'+i).css(b.css);
			}
		}
		else {
			var n = 0;
			for (var i in o.buttons) {
				j('.modal-footer').append('<button class="btn btn-default kbutton custom-'+n+'" data-dismiss="modal">'+i+'</button>');
				j('.modal-footer .custom-'+n).click(function(cmd) {
					return function() { Config.Socket.write(cmd); }
				}(o.buttons[i]));
				n++;
			}
		}
	};
	
	var links = function() {
		
		if (!o.links)
			return;
		
		j('.modal-footer').remove('.modal-links');
		j('.modal-footer').prepend('<div class="modal-links left" style="position: relative; z-index: 1; font-size: 11px; opacity: 0.7"></div>');
		
		if (o.links.pop)
		for (var i = 0; i < o.links.length; i++) {
			j('.modal-links').append('<a class="link-'+i+' left" data-dismiss="'+(o.links[i].keep?'':'modal')+'">'+o.links[i].text+'</a><br>');
			j('.modal-links .link-'+i).click(o.links[i].click);
			if (o.links[i].css)
				j('.modal-links .link-'+i).css(o.links[i].css);
		}
		else {
			var n = 0;
			for (var i in o.links) {
				j('.modal-links').append('<a class="link-'+n+'" data-dismiss="modal">'+i+'</a><br>');
				j('.modal-links .link-'+n).click(function(cmd) {
					return function() { Config.Socket.write(cmd); }
				}(o.links[i]));
				n++;
			}
		}
	};

	init();
}

j('body').on('shown.bs.modal', function() {
	
	j('.modal .modal-body').niceScroll({ cursorborder: 'none', cursorwidth: 7 });
});

j('body').on('hide.bs.modal', function() {
	
	j('.modal .modal-body').niceScroll('destroy');
	j('.modal a, .modal button').off('click');
	j('.modal input, .modal textarea').off('keywdown');
	j('.modal, .modal-backdrop').remove();
});

Event.listen('gmcp', function(d) {

	if (!d || !d.start || !d.start('Modal '))
		return d;

	log('Modal: gmcp trigger');

	try {
		var o = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
		new Modal(o);
	}
	catch(ex) {
		log(ex);
	}
	
	return d;
});
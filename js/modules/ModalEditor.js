
var ModalEditor = function(o) {
	
	var close = function(send) {
		
		if (send !== true)
			Config.Socket.write(o.abort);
		
		j('.modal .me-dismiss').off();
		j('.modal .me-send').off();
		j('.modal').modal('hide').remove();
	};
	
	var send = function() {
		var msg = j('.modal .me-editor').val();
		Config.Socket.write((o.before || '') + msg + (o.after || ''));
		close(true);
	};

	o.backdrop = o.backdrop || 0;
	
	if (o.replace) {
		if (j('.modal').length && j('.modal').is(':visible')) {
			j('.modal h3').html(o.title);
			j('.modal .modal-body p').html(o.text || o.html);
			return;
		}
	}
	else
		j('.modal').modal('hide').remove();
	
	j('body').append('\
		<div class="modal '+(o['class'] || '')+' fade"><div class="modal-dialog"><div class="modal-content">\
			<div class="modal-header">\
				<button type="button" class="close me-dismiss" aria-hidden="true">×</button>\
				<h3>' + (o.title || 'Multi-Line Input') + '</h3>\
			</div>\
			<div class="modal-body">\
				<p>\
					<textarea spellcheck="false" autocapitalize="off" autocorrect="off" class="me-editor">' + (o.text || o.html || '') + '</textarea>\
				</p>\
			</div>\
			<div class="modal-footer">\
				<button class="btn btn-primary kbutton me-dismiss" aria-hidden="true">' + (o.closeText || 'Cancel') + '</button>\
				<button class="btn btn-primary kbutton me-send" aria-hidden="true">' + (o.sendText || 'Send' ) + '</button>\
			</div>\
		</div></div></div>\
	');

	j('.modal .me-dismiss').on('click', close);
	j('.modal .me-send').on('click', send);
	
	if (o.closeable == false || o.closeable == 0)
		j('.modal .close').remove();
	
	if (o.css) {
		if (o.css.width)
			o.css['margin-left'] = -(o.css.width / 2); 
		j('.modal').css(o.css);
	}
	
	if (o.buttons) {
		
		j('.modal-footer .kbutton').remove();
		
		for (var i = 0; i < o.buttons.length; i++) {
			j('.modal-footer').prepend('<button class="btn btn-default kbutton custom-'+i+'" data-dismiss="'+(o.buttons[i].keep?'':'modal')+'" \
			aria-hidden="true">'+o.buttons[i].text+'</button>');
			j('.modal-footer .custom-'+i).click(o.buttons[i].click);
			if (o.buttons[i].css)
				j('.modal-footer .custom-'+i).css(o.buttons[i].css);
		}
	}
	
	j('.modal').modal(o);
	
	setTimeout(function() {
		j('.modal textarea').focus();	
	}, 500);
}

Event.listen('gmcp', function(d) {
	
	if (!d.start('ModalEditor '))
		return d;
	
	log('ModalEditor detected gmcp data');
	
	try {
		var o = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
		new ModalEditor(o);
	}
	catch(ex) {
		log(ex);
	}
	
	return '';
});

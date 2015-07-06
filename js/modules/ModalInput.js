
var ModalInput = function(o) {
	
	var colorize = new Colorize();
	
	var close = function(send) {
		
		console.log('ModalInput close');
		
		if (send !== true)
			Config.Socket.write(o.abort);
		
		j('.modal .me-dismiss').off();
		j('.modal .me-send').off();
		j('.modal .me-second').off();
		j('.modal').modal('hide');
	};

	var send = function() {
		
		var msg = j('.modal .me-input').val();
		
		if (j('.modal .me-pass2').length) {
			Config.Socket.write(
				stringify({
					password1: msg,
					password2: j('.modal .me-pass2').val() 
				})
			);
		}
		else
			Config.Socket.write((o.before || '') + msg + (o.after || ''));
		
		close(true);
	};

	o.backdrop = o.backdrop || 0;
	
	if (o.close && o.close == 1)
		return close();
	
	if (o.mxp) {
		o.replace = 1;
		o.mxp = Config.mxp.translate(o.mxp);
		o.intro = o.intro ? o.mxp + o.intro : o.mxp;
	}
	
	if (o.text)
		o.text = colorize.strip(o.text).replace(/\r/g, '');
	
	if (o.error)
		o.error = Config.mxp.prep(o.error);

	if (o.info)
		o.info = Config.mxp.prep(o.info);

	if (o.intro)
		o.intro = Config.mxp.prep(o.intro);
	
	if (o.replace) {
		if (j('.me-modal').length && j('.me-modal').is(':visible')) {
			j('.modal h3').html(o.title);
			j('.modal .modal-body').html(o.text || o.html);
			return;
		}
	}
	
	j('.modal').modal('hide').remove();
	
	j('body').append('\
		<div class="modal '+(o['class'] || '')+' fade me-modal"><div class="modal-dialog"><div class="modal-content">\
			<div class="modal-header">\
				<button type="button" class="close me-dismiss">×</button>\
				<h3>' + (o.title || 'Multi-Line Input') + '</h3>\
			</div>\
			<div class="modal-body">\
				' + (o.info ? '<div class="alert alert-info">' + o.info + '</div>' : '') + '\
				' + (o.error ? '<div class="alert">' + o.error + '</div>' : '') + '\
				' + (o.intro ? '<div class="intro">' + o.intro + '</div><br>' : '') + '\
					<' + (o.tag || 'textarea') + (o.type ? ' type="' + o.type + '" ' : ' ') + 'class="me-input ' + (o.text ? 'modal-text-content' : '') 
					+ '" spellcheck="false" autocapitalize="off" autocorrect="off" \
					placeholder="' + (o.placeholder || '') + '" ' + (o.tag ? 'value="' + (o.text || '') + '"' : '') + '">' + (o.tag ? '' : (o.text || o.html || '')) + (o.tag ? '' : '</textarea>') + '\
			<br><br></div>\
			<div class="modal-footer">\
				<button class="btn btn-primary kbutton me-dismiss">' + (o.closeText || 'Cancel') + '</button>\
				<button class="btn btn-primary kbutton me-send">' + (o.sendText || 'Send' ) + '</button>\
			</div>\
		</div></div></div>\
	');

	/* password reset is a special case */
	if (o.attr && (o.attr == 'reset' || o.attr == 'change')) {
		
		j('.modal-body').append('<br><input type="password" class="me-pass2" placeholder="re-enter password">');
		
		j('.modal .me-send').addClass('disabled');

		j('.modal input').on('keyup', function() {
			
			var a = j('.modal .me-input').val(), b = j('.modal .me-pass2').val();
			
			if (a.length > 5 && b.length > 5 && a == b)
				j('.modal .me-send').removeClass('disabled');
			else
				j('.modal .me-send').addClass('disabled');
		});
	}
	
	if (o.tag && o.tag == 'input') {
		j('.modal-body').css({ padding: 30 });
		j('.modal input').width(300);
		if (!o.intro || o.intro.length < 60)
			o.css ? o.css.width = 400 : o.css = { width: 400 };
	}
	
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
			
			var b = o.buttons[i];
			var cls = (!b.click && !exists(b.send)) ? ' me-send': ''; /* button without custom handling is the send one */
				
			j('.modal-footer').prepend('<button class="btn btn-default kbutton custom-'+i + cls + '">'+b.text+'</button>');
			
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
	
	j('.modal .me-send').on('click', send);
	j('.modal .me-dismiss').on('click', close);
	
	if (o.sendText)
		j('.modal .me-send').text(o.sendText);
	
	j('.modal').modal(o);
	
	setTimeout(function() {
		j('.modal textarea').focus();	
	}, 500);
}

Event.listen('gmcp', function(d) {
	
	if (!d || !d.length)
		return d;
	
	if (!d.start)
		console.log(d);
	
	if (!d.start || !d.start('ModalInput'))
		return d;
	
	log('ModalInput detected gmcp trigger');
	
	try {
		var o = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
		o.replace = o.gmcp = 1;
		new ModalInput(o);
	}
	catch(ex) {
		log(ex);
	}
	
	return d;
});


var Modal = function(o) {
	
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
				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\
				<h3></h3>\
			</div>\
			<div class="modal-body">\
				<p></p>\
			</div>\
			<div class="modal-footer">\
				<button class="btn btn-primary kbutton dismiss" data-dismiss="modal" aria-hidden="true">OK</button>\
			</div>\
		</div></div></div>\
	');
	
	if (o.title)
		j('.modal h3').html(o.title);
	
	if (o.text || o.html)
		j('.modal-body p').html(o.text || o.html);

	if (o.closeText)
		j('.modal .dismiss').html(o.closeText);

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
}

j('body').on('shown.bs.modal', function() {
	j('.modal .modal-body').niceScroll({ cursorborder: 'none', cursorwidth: 7 });
});

j('body').on('hide.bs.modal', function() {
	try { j('.modal .modal-body').niceScroll('destroy'); } catch(ex) {};
	j('.modal').remove();
});
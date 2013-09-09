
var Modal = function(o) {
	
	j('body').append('\
		<div id="modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
			<div class="modal-header">\
				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>\
				<h3></h3>\
			</div>\
			<div class="modal-body">\
				<p></p>\
			</div>\
			<div class="modal-footer">\
				<button class="kbutton dismiss" data-dismiss="modal" aria-hidden="true">Cancel</button>\
			</div>\
		</div>\
	');
	
	if (o.title)
		j('#modal h3').html(o.title);
	
	if (o.text)
		j('#modal .modal-body p').html(o.text);

	if (o.closeText)
		j('#modal .dismiss').html(o.closeText);
	
	if (o.button) {
		j('#modal .modal-footer').prepend('<button class="kbutton doer" data-dismiss="modal" aria-hidden="true">'+o.button.text+'</button>');
		j('#modal .modal-footer .doer').click(function(evt) {
			o.button.click(evt);
		});
	}
	
	j('#modal').modal(o);
	j('#modal inut').focus();
}

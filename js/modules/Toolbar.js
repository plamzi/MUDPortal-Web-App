
var Toolbar = function () {
	
	var init = function() {
		
		j('body').append('<div id="tmp-toolbar" class="tmp-toolbar"></div>');
			
		j('#tmp-toolbar').on('click', 'button', function(e) {
			
			e.stopPropagation();
			var t = j(e.target).attr('href');
			var win = j(t).get(0).win;

			if (j(this).hasClass('active')) {
				win.hide();
				j(this).removeClass('active').addClass('disabled');
			}
			else
			if (j(this).hasClass('disabled')) {
				win.show();
				j(this).removeClass('disabled').addClass('active');
			}
			else {
				win.front();
				j('#tmp-toolbar button').removeClass('active');
				j(this).addClass('active');
			}
		});
	};

	var update = function(a) {
		j('#tmp-toolbar').empty();
		j('.window').each(function() {
			j('#tmp-toolbar').append('<button href="#'+j(this).attr('id')
			+ '" class="btn kbutton">'
			+ ( j(this).get(0).win.title() || j(this).attr('id') ) 
			+ '</button>');
		});
	};

	var front = function(a) {
		j('#tmp-toolbar button').removeClass('active');
		j('#tmp-toolbar button[href="'+a+'"]').addClass('active');
	};
	
	init();
	
	return {
		update: update,
		front: front
	};
};
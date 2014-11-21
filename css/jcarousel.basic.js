(function($) {
    $(function() {

		$('.jcarousel').jcarousel();
		
		$('.jcarousel')
		.on('jcarousel:reloadend', function(event, carousel) {
			if (ui)
				ui.onscrollend(this, event, carousel);
		})
		.on('jcarousel:scrollend', function(event, carousel) {
			if (ui)
				ui.onscrollend(this, event, carousel);
		});
		
        $('.jcarousel-control-prev')
            .on('jcarouselcontrol:active', function() {
                $(this).removeClass('inactive');
            })
            .on('jcarouselcontrol:inactive', function() {
                $(this).addClass('inactive');
            })
            .jcarouselControl({
                target: '-=1'
            });

        $('.jcarousel-control-next')
            .on('jcarouselcontrol:active', function() {
                $(this).removeClass('inactive');
            })
            .on('jcarouselcontrol:inactive', function() {
                $(this).addClass('inactive');
            })
            .jcarouselControl({
                target: '+=1'
            });

        $('.jcarousel-pagination')
            .on('jcarouselpagination:active', 'a', function() {
                $(this).addClass('active');
        		$('.jcarousel-pagination a').attr('onclick', 'return false;');
            })
            .on('jcarouselpagination:inactive', 'a', function() {
                $(this).removeClass('active');
            })
            .jcarouselPagination();
    });
})(jQuery);
var Window = function(o) {
	
	var id, h, position, width, height, maximized, opt;

	var button = function(o) {
		j(id + ' .toolbar').append('<i class="icon '+o.icon+' ui-right" \
		style="margin-right: 6px; position: relative; top: -18px; z-index: 1" \
		title="'+o.title+'"></i>');
		j(id + ' .'+o.icon).click(o.click); 
	}
	
	var title = function(t) {
		j(id + ' .title').html(t);
	}
	
	var init = function(o) {
		
		opt = o;
		id = o.id;
		
		j('.app').prepend('\
			<div id="'+o.id.split('#')[1]+'" class="window '+(o['class']||'')+'" >\
				<div class="handle toolbar">\
					<div class="title" style="width: 96%; text-align: center">'+(o.title||'&nbsp;')+'</div>\
				</div>\
				<div class="content"></div>\
			</div>\
		');
		
		title(o.title||'');
		
		if (o.css)
			j(id).css(o.css);
		
		if (o.transparent) {
			j(id + ' .toolbar').hide();
			j(id + ' .content').css({
				'background-color': 'transparent',
				'top': 0,
				'padding': 0
			});
		}
		
		if (o.closeable) {
			button({
				icon: 'icon-remove',
				title: 'Close this window.',
				click: function() { 
					j(id).remove();
					j('.window:first').click();
				}
			});
		}
		
		if (o.max) {
			button({
				icon: 'icon-unchecked',
				title: 'Maximize this window.',
				click: function() { 
					maximize()
				}
			});
			
			button({
				icon: 'icon-columns',
				title: 'Minimize this window.',
				click: function() { 
					minimize()
				}
			});
			
			j(id + ' .icon-columns').hide();

			j(window).resize(function() {
				j(id).center();
				if (maximized)
					maximize();
			});
		}
		
		j(id)
			.draggable({
				/*stack: ".ui-group",*/
				handle: o.transparent?'.content':'.handle',
				snap: 1,
				stop: function(e, u) {
					j(id + ' .nice').getNiceScroll().resize();
					j('.nicescroll-rails').css('z-index', j(id).css('z-index'));
				}
			})
			.css({
				'display':'inline-block',
				'overflow':'hidden',
				'paddingBottom':'12px'
			})
			.click(function() { 
				front(); 
			});
		
		if (!o.noresize) {
			j(id).resizable({
				minWidth: 60,
				width: 300,
				stop: function(e, u) { 	
					j(id + ' .nice').getNiceScroll().resize();
					j('.nicescroll-rails').css('z-index', j(id).css('z-index'));
					if (o.onResize)
						o.onResize.call();
				}
			});
		}
			
		j(id + ' .ui-resizable-handle').css('z-index', j(id).css('z-index'));
	}
	
	var maximize = function() {
		
		position = j(id).position();
		width = j(id).width();
		height = j(id).height();
		
		j(id).css({
			width: j(window).width(),
			height: j(window).height()-20,
			top: 0,
			left: 0
		});
		
		j(id + ' .icon-unchecked').hide();
		j(id + ' .icon-columns').show();
		front();
		
		maximized = 1;
	}
	
	var minimize = function() {
		
		j(id).css({
			width: width,
			height: height,
			top: position.top,
			left: position.left
		});
		
		j(id + ' .icon-unchecked').show();
		j(id + ' .icon-columns').hide();
		j(id + ' .out').scrollTop(j(id + ' .out')[0].scrollHeight);
		
		maximized = 0;
	}
	
	var front = function() {
		
		if (j(id).hasClass('nofront'))
			return;
		
		console.log('front: ' + id);
		var maxZ = 0;
		
		j(id).siblings().each(function() {
			
			if (!j(this).hasClass('window'))
				return;
			
			if (parseInt(j(this).css('z-index')) > maxZ)
				maxZ = parseInt(j(this).css('z-index'));
			
			if (this != j(id) && !j(this).hasClass('nofade'))
				j(this).css('opacity', '0.3');
		});
		
		j(id).css('opacity', '1');
		j(id).css('z-index', ++maxZ);
		j('#header').css('opacity', '0.4');
	}
	
	if (o)
		init(o);
	
	return {
		init: init,
		title: title,
		button: button,
		front: front,
		minimize: minimize,
		maximize: maximize,
		maximized: maximized
	}
	
}
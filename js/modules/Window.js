var Window = function(o) {
	
	var id, h, position, width, height, maximized, opt;
	var view_id = Config.view;

	var button = function(o) {
		j(id + ' .toolbar').append('<i class="icon '+o.icon+'" title="'+o.title+'"></i>');
		j(id + ' .'+o.icon).click(o.click); 
	}
	
	var title = function(t) {
		j(id + ' .title').html(t);
	}
	
	var init = function(o) {
		
		opt = o;
		id = o.id;
		
		console.log('Window.js init() '+id);
		
		j('.app').prepend('\
			<div id="'+o.id.split('#')[1]+'" class="window '+(o['class']||'')+'" >\
				<div class="handle toolbar">\
					<div class="title" style="width: 96%; text-align: center">'+(o.title||'&nbsp;')+'</div>\
				</div>\
				<div class="content"></div>\
			</div>\
		');
		
		title(o.title||'');
		
		/* attempt to restore window position and size */
		var default_pos = getpos(o);
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
					if (o.onClose)
						o.onClose.call();
					j(id).remove();
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
					savepos();
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
					savepos();
					if (o.onResize)
						o.onResize.call();
				}
			});
		}
			
		j(id + ' .ui-resizable-handle').css('z-index', j(id).css('z-index'));
		
		if (o.id == '#scroll-view' && default_pos) {
			if (Config.Device.lowres)
				win.maximize();
			else
				j(id).center();
		}
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

		console.log('Window.front: ' + id);
		if (j(id).hasClass('nofront'))
			return;
		
		var myZ = parseInt(j(id).css('z-index'));
		var maxZ = myZ;
		if (!myZ)
			maxZ = myZ = 0;
		
		j(id).siblings().each(function() {
			
			if (!j(this).hasClass('window'))
				return;
			
			if (parseInt(j(this).css('z-index')) > maxZ)
				maxZ = parseInt(j(this).css('z-index'));
			
			if (!j(this).hasClass('nofade'))
				j(this).css('opacity', '0.3');
		});
		
		j(id).css('opacity', '1');
		
		if (maxZ > myZ) {
			j(id).css('z-index', ++maxZ);
			savepos();
			console.log('Window.front(ed): ' + id);
		}
	}
	
	var savepos = function() {
		
		if (!user.id || !Config.host)
			return;
			
		if (!user.pref.win)
			user.pref.win = {};
		
		if (!user.pref.win[view_id])
			user.pref.win[view_id] = {};
		
		user.pref.win[view_id][id] = {
			offset: j(id).offset(),
			width: j(id).width(),
			height: j(id).height(),
			zIndex: parseInt(j(id).css('z-index'))
		};
		
		//console.log('Saving window position: '+id);
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });	
	}
	
	var getpos = function(o) {

		//console.log('Restoring saved position: '+id);
		
		if (!user.id || !user.pref.win || !Config.host)
			return 1;
		
		if (!user.pref.win[view_id] || !user.pref.win[view_id][id])
			return 1;
		
		var prefs = user.pref.win;
		
		while (Object.keys(prefs).length > 3) {
			console.log('Trimming window pref length: '+Object.keys(prefs).length);
			var i = 0;
			for (var p in prefs) {
				if (!i) {
					delete prefs[p];
					i++;
				}
			}
		}

		//console.log('Window pref length: '+Object.keys(prefs).length);
		
		if (!user.pref.win[view_id])
			return 1;
			
		var pref = user.pref.win[view_id][id];
		 
		if (!o.css)
			o.css = {};
			
		o.css.left = (pref.offset.left < 0)?0:pref.offset.left;
		o.css.top = (pref.offset.top < 0)?0:pref.offset.top;
		o.css.width = pref.width;
		o.css.height = pref.height;
		if (pref.zIndex)
			o.css.zIndex = pref.zIndex;
		
		return 0;
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
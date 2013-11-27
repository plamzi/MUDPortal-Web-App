var Window = function(o) {
	
	var id, h, position, width, height, maximized, opt;
	var minZ = 100;
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
		
		log('Window.init: '+id);
		
		var cleanID = o.id.split('#')[1];
		
		j('.app').prepend('\
			<div id="'+cleanID+'" class="window '+(o['class']||'')+'" >\
				<div class="content"></div>\
			</div>\
		');
		
		if (!o.handle) {
			j(o.id).prepend('\
			<div class="handle toolbar">\
			<div class="title" style="width: 96%; text-align: center">'+(o.title||'&nbsp;')+'</div>\
			</div>');
			o.handle = '.handle';
		}
		else {
			j(o.id + ' .content').css({ 
				top: -20,
				height: '106%'
			});
		}
		
		title(o.title||'');

		if (o.transparent) {
			j(id + ' .toolbar').hide();
			j(id + ' .content').css({
				'background-color': 'transparent',
				'top': 0,
				'padding': 0
			});
		}
		
		if (o.closeable)
			button({
				icon: 'icon-remove',
				title: 'Close this window.',
				click: function() {
					if (o.onClose)
						o.onClose();
					j(id).remove();
				}
			});
		
		button({
			icon: 'icon-minus',
			title: 'Collapse this window.',
			click: collapse
		});
		
		if (o.max) {
			button({
				icon: 'icon-unchecked',
				title: 'Maximize this window.',
				click: maximize
			});
			
			button({
				icon: 'icon-columns',
				title: 'Un-minimize this window.',
				click: minimize
			});
			
			j(id + ' .icon-columns').hide();

			j(window).resize(function() {
				if (maximized)
					maximize();
			});
		}
		
		if (o.transparent)
			o.handle = '.content';
		
		j(id)
			.draggable({
				/*stack: ".ui-group",*/
				handle: o.handle,
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
				log('Window.click');
				front();
			});
		
		j(id + ' .handle').dblclick(collapse);
		
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
		
		if (o.nofront)
			j(id).addClass('nofront');
		
		if (o.nofade)
			j(id).addClass('nofade');
		
		j(id + ' .ui-resizable-handle').css('z-index', j(id).css('z-index'));
		
		if (id == '#scroll-view' && default_pos) {
			if (Config.Device.lowres)
				win.maximize();
			else
				j(id).center();
		}
		
		if (Config.collapse.has(id))
			collapse();
		
		/* attempt to restore window position and size */
		var default_pos = getpos(o);
		j(id).css(o.css);

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
	
	var collapse = function() {
		
		if (j(id + ' .content').hasClass("hidden")) {
			j(id + ' .handle').siblings().removeClass('hidden');
			j(id + ' .icon-plus').addClass('icon-minus').removeClass('icon-plus').attr('title', 'Collapse this window.');
		}
		else {
			j(id + ' .handle').siblings().addClass('hidden');
			j(id).css('z-index', minZ - 1);
			j(id + ' .icon-minus').addClass('icon-plus').removeClass('icon-minus').attr('title', 'Expand this window.');
			return false;
		}
		
		savepos();
	}
	
	var front = function() {

		log('Window.front: ' + id);
		
		if (j(id).hasClass('nofront'))
			return;

		j(id).css('opacity', 1);
		
		var Z = [], myZ = parseInt(j(id).css('z-index'));
		
		j(id).siblings().each(function() {

			if (!j(this).hasClass('window'))
				return;
			
			Z.push({ id: '#'+j(this).attr('id'), z: parseInt(j(this).css('z-index')) });
			
			if (!j(this).hasClass('nofade'))
				j(this).css('opacity', 0.3);
		});

		if (Z.length < 2)
			return;

		Z.sort(function(a, b) {
			return(a.z > b.z)
		});
		
		Z.push({ id: id, z: 0 });
		
		if (myZ < Z[Z.length-2].z) {
			for (var i = 0; i < Z.length; i++)
				j(Z[i].id).css('z-index', minZ + i);
			log('Window.front(ed): ' + id);
			savepos();
		}
	}
	
	var savepos = function() {
		
		if (!user.id || !Config.host)
			return;
			
		if (!user.pref.win)
			user.pref.win = {};
		
		user.pref.win[view_id] = {};
		
		j(id).parent().children().each(function() {
			
			if (j(this).hasClass('window')) {
	
				user.pref.win[view_id]['#'+j(this).attr('id')] = {
					offset: j(this).offset(),
					width: j(this).width(),
					height: j(this).height(),
					zIndex: parseInt(j(this).css('z-index')),
					collapsed: j(this).find('.content').hasClass('hidden')
				};
				
				log('Saving window position: ' + stringify(user.pref.win[view_id]['#'+j(this).attr('id')]));
			}
		});
	
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });	
	}
	
	var getpos = function(o) {

		//log('Restoring saved position: '+id);
		
		if (!user.id || !user.pref.win || !Config.host)
			return 1;
		
		if (!user.pref.win[view_id] || !user.pref.win[view_id][id])
			return 1;
		
		var prefs = user.pref.win;
		
		while (Object.keys(prefs).length > 5) {
			log('Trimming window pref length: '+Object.keys(prefs).length);
			var i = 0;
			for (var p in prefs) {
				if (!i) {
					delete prefs[p];
					i++;
				}
			}
		}

		if (!user.pref.win[view_id])
			return 1;
			
		var pref = user.pref.win[view_id][id];
		 
		if (!o.css)
			o.css = {};
			
		o.css.left = (pref.offset.left < 0)?0:pref.offset.left;
		o.css.top = (pref.offset.top < 0)?0:pref.offset.top;
		o.css.width = pref.width;
		o.css.height = pref.height;
		o.css.zIndex = pref.zIndex||o.css.zIndex;
		
		if (pref.collapsed)
			collapse();
		
		log(stringify(o));
		
		return 0;
	}
	
	init(o);
	
	return {
		title: title,
		button: button,
		front: front,
		minimize: minimize,
		maximize: maximize,
		maximized: maximized
	}
	
}
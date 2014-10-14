var Window = function(o) {
	
	var id, h, position, width, height, maximized, opt, was_at;
	var minZ = 100;
	var view_id = Config.view;
	
	o = o || {
		id: '#scroll-view',
		title: 'ScrollView'
	};

	o.css = o.css || {
		height: 380,
		width: 380
	};
	
	o.tabs = o.tabs || [];
	
	if (Config.device.touch || param('gui'))
		o.handle = '.none';
	
	var button = function(o) {
		j(id + ' .toolbar').append('<i class="icon '+o.icon+' tip" title="'+o.title+'"></i>');
		j(id + ' .'+o.icon).click(o.click); 
	}
	
	var title = function(t) {
		if (t) {
			o.title = t;
			j(id + ' .title').html(t);
		}
		else
			return o.title;
	}
	
	var resize = function() {
		
		var h = j(id).height();
		
		if (j(id + ' .handle').length)
			h -= 18;
		
		j(id + ' .content').height(h);
		j(id + ' .tab-content').height(h - 30);
		j(id + ' .tab-pane').height(h - 30);
		
		renice();	
	}
	
	var renice = function() {
		j(o.id + ' .nice').each(function() {
			j(this).getNiceScroll().resize();
		});
	}
	
	var init = function(o) {
		
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
			<div class="title" style="width: 100%; text-align: center; text-overflow: ellipsis;">'+(o.title||'&nbsp;')+'</div>\
			</div>');
			o.handle = '.handle';
		}
		else 
			j(id + ' .content').css({ top: 0 });
		
		title(o.title||'');

		if (o.transparent) {
			j(id + ' .toolbar').remove();
			j(id + ' .content').css({
				'background-color': 'transparent',
				top: 0
			});
			j(id).css('border', 'none');
		}
		
		if (o.closeable)
			button({
				icon: 'icon-remove',
				title: 'Close this window.',
				click: function() {
					if (o.onClose)
						o.onClose();
					Event.fire('window_close', j(id));
					j(id + ' .nice').getNiceScroll().remove();
					j(id).remove();
				}
			});
		/*
		button({
			icon: 'icon-minus',
			title: 'Collapse this window.',
			click: collapse
		});
		
		
		if (o.max) {
			button({
				icon: 'icon-unchecked',
				title: 'Max/minimize this window.',
				click: maximize
			});
			j(window).resize(function() {
				if (maximized)
					maximize();
			});
		}*/
		
		if (o.transparent)
			o.handle = '.content';
		
		j(id).click(front);
		
		if (!Config.device.mobile && !param('kong') && !param('gui') && !o.nodrag && !Config.nodrag)
			draggable();

		j(id + ' .handle').dblclick(hide);
		
		j(id).css({
			'overflow':'hidden',
		});
		
		if (!o.noresize) {
			j(id).resizable({
				minWidth: 60,
				width: 300,
				handles: 'all',
				stop: function(e, u) { 	
					resize();
					
					if (o.onResize)
						o.onResize();
					
					savepos();
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

		for (var i = 0; i < o.tabs.length; i++)
			tab(o.tabs[i]);
					
		/* attempt to restore window position and size */
		var default_pos = getpos(o);
		
		j(id).css(o.css);
		
		if (j(id + ' .handle').length)
			j(id + ' .content').height(j(id).height() - 18);
	}
	
	var draggable = function() {
	
		try {
			j(id).draggable('destroy');
		} catch(ex) {}
		
		j(id).draggable({
			/*stack: ".ui-group",*/
			handle: o.handle,
			snap: 1,
			//containment: "window",
			//iFrameFix: true,
			start: function(e, u) {
				was_at = u.position;
				j(this).css({ bottom: '', right: '' });
			},
			stop: function(e, u) {
				
				if (o.master) {
				
					j('.window').not('#scroll-view').animate({
						top: '-=' + (was_at.top - u.position.top) + 'px',
						left: '-=' + (was_at.left - u.position.left) + 'px'
					}, function() {
						resize();
						savepos();
					});
					
					return;
				}
				
				resize();
				savepos();
			}
		});
	};
	
	var maximize = function() {

		position = j(id).position();
		width = j(id).width();
		height = j(id).height();
		
		j(id).css({
			width: j(window).width(),
			height: j(window).height(),
			top: 0,
			left: 0
		});
		
		return self;
		//j(id + ' .icon-unchecked').hide();
		//j(id + ' .icon-columns').show();
	};
	
	var show = function() {
		j(id).show();
		front();
		return self;
	};
	
	var hide = function() {
		j(id).hide();
		return self;
	};
	
	var collapse = function() {
		
		if (j(id + ' .content').hasClass("hidden")) {
			j(id + ' .handle').siblings().removeClass('hidden');
			j(id + ' .icon-plus').addClass('icon-minus').removeClass('icon-plus').attr('title', 'Collapse this window.');
			j(id).css('border', '0.5px solid rgba(255, 255, 255, 0.1)');
		}
		else {
			j(id + ' .handle').siblings().addClass('hidden');
			j(id).css('z-index', minZ - 1);
			j(id + ' .icon-minus').addClass('icon-plus').removeClass('icon-minus').attr('title', 'Expand this window.');
			j(id).css('border', 'none');
		}
		
		savepos();
		return false;
	}
	
	var front = function() {

		if (j(id).hasClass('nofront'))
			return;
	
		if (Config.front == id)
			return;

		log('Window.front: ' + id);

		j(id).css('opacity', 1);
		
		var Z = [], myZ = parseInt(j(id).css('z-index'));
		
		j(id).siblings().each(function() {

			if (!j(this).hasClass('window'))
				return;
			
			Z.push({ 
				id: '#'+j(this).attr('id'), 
				z: parseInt(j(this).css('z-index')) 
			});
			
			if (!j(this).hasClass('nofade'))
				j(this).css('opacity', 0.3);
		});

		if (!Z.length)
			return log('solo window. no front needed');
	
		Z.sort(function(a, b) {
			return(a.z > b.z);
		});
		
		Z.push({ id: id, z: 0 });
		
		for (var i = 0; i < Z.length; i++)
			j(Z[i].id).css('z-index', minZ + i);
	
		Config.front = id;
		
		log('Window.front(ed): ' + id);
		Event.fire('window_front', id);
		savepos();
		
		return self;
	}
	
	var savepos = function() {
		
		if (!user.id || !Config.host || param('kong') || param('gui'))
			return;
			
		if (!user.pref.win)
			user.pref.win = {};
		
		if (!user.pref.win[view_id])
			user.pref.win[view_id] = {};
		
		j('.window').each(function() {
			
			var id = j(this).attr('id');
			var offs = j(this).offset();
			
			/*
			if (offs.top < 0)
				j(this).css({ top: 0 });
			
			if (offs.top >= j(window).height())
				j(this).css({ top: parseInt(j(window).height() - j(this).height()) });
			
			if (offs.left < 0)
				j(this).css({ left: 0 });
			
			if (offs.left >= j(window).width())
				j(this).css({ left: parseInt(j(window).width() - j(this).width()) });
			
			offs = j(this).offset();
			
			offs.top = parseInt(offs.top);
			offs.left = parseInt(offs.left);
			*/
			var o = {
				offset: offs,
				width: j(this).width(),
				height: j(this).height(),
				zIndex: parseInt(j(this).css('z-index')),
				collapsed: j(this).find('.content').hasClass('hidden')?1:0
			};
			
			//console.log(o);
			user.pref.win[view_id]['#'+id] = o;
			log('Saving window position: #' + id + ' ' + stringify(user.pref.win[view_id]['#'+id]));
		});
		
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });	
	}
	
	var getpos = function(o) {

		if (!user.id || !user.pref || !user.pref.win || !Config.host || param('kong') || param('gui'))
			return 1;
		
		log('Restoring saved position:  '+ o.id);
		
		var prefs = user.pref.win;
		
		while (Object.keys(prefs).length > 20) {
			log('Trimming window pref length: ' + Object.keys(prefs).length);
			var i = 0;
			for (var p in prefs) {
				if (!i) {
					delete prefs[p];
					i++;
				}
			}
		}

		if (!prefs[view_id] || !prefs[view_id][o.id]) {
			log('no stored position for ' + o.id);
			log(prefs);
			return 1;
		}
		
		var pref = prefs[view_id][o.id];
		
		//log('remembered position: ');
		//log(pref);
		
		if (pref.offset.left < 0)
			pref.offset.left = 0;
		
		if (pref.offset.left > j(window).width())
			pref.offset.left = j(window).width()-pref.width;
		
		if (pref.offset.top < 0)
			pref.offset.top = 0;
		
		if (pref.offset.top > j(window).height())
			pref.offset.top = j(window).height()-pref.height;

		o.css.left = pref.offset.left;
		o.css.top = pref.offset.top;
		
		o.css.width = pref.width||o.css.width;
		o.css.height = pref.height||o.css.height;
		
		o.css.zIndex = pref.zIndex||o.css.zIndex;
		
		if (pref.collapsed)
			collapse();

		log(stringify(o));
		
		return 0;
	}
	
	var tab = function(t) {

		t.html = t.html || '';
		console.log(t);
		
		var i = o.tabs.length;
		o.tabs.push(t);

		if (!j(o.id + ' .content .tabs').length) {
			j(o.id + ' .content').prepend('<ul class="tabs nav nav-tabs"></ul><div class="tab-content"></div>');
			j(o.id + ' .content').css('background-color', 'transparent');
			j(o.id + ' .tabs:hover').css({ cursor: 'move' });
			o.handle = '.nav-tabs';
			draggable();
		}
				
		var html = '<li><a class="kbutton" data-toggle="tab" href="#tab-'+i+'">'+t.name+'</a></li>';
		
		if (!t.after && !t.before)
			j(o.id + ' .nav-tabs').append(html);
		else
		if (t.before)
			j(html).insertBefore(j(o.id + ' .nav-tabs a:contains("'+t.before+'")').parent());
		else
			j(html).insertAfter(j(o.id + ' .nav-tabs a:contains("'+t.after+'")').parent());
		
		j(o.id + ' .tab-content').append('<div id="tab-'+i+'" class="'+(t['class']||'')+' tab-pane nice'+(i==0?' active':'')+'">'+(t.html||'')+'</div>');
		
		resize();
		
		j(o.id + ' #tab-'+i).niceScroll({ 
			cursorborder: 'none',
			touchbehavior: 1,
			height: j(o.id + ' #tab-'+i).height()
		});
		
		return o.id + ' #tab-' + i;
	}
	
	init(o);
	
	var self = {
		title: title,
		button: button,
		tab: tab,
		front: front,
		maximize: maximize,
		show: show,
		hide: hide,
		maximized: maximized,
		resize: resize
	}
	
	j(o.id).get(0).win = self;
	
	Event.fire('window_open', self);
	
	return self;
}

var Window = function(o) {
	
	o = o || {
		id: '#scroll-view',
		title: 'ScrollView'
	};

	var id, h, position, width, height, maximized, opt, was_at;
	var minZ = 100;
	var view_id = Config.view;
	var drag = ( !Config.device.mobile && !param('kong') && !param('gui') && !param('embed') && !o.nodrag && !Config.nodrag );
	var doresize = (!o.noresize && !param('embed') && !Config.nodrag);
	var save = ( window.user && user.id && Config.host && !Config.kong && !param('gui') && !param('embed') );
	var handle = !o.handle && !o.transparent;
	
	o.css = o.css || {
		height: 380,
		width: 380
	};
	
	o.closeable = exists(o.closeable) ? o.closeable : drag;
	
	o.tabs = o.tabs || [];
	
	if (Config.device.touch || param('gui'))
		o.handle = '.none';
	
	var button = function(o) {
		j(id + ' .toolbar').prepend('<i class="icon '+o.icon+' tip" title="'+o.title+'"></i>');
		j(id + ' .'+o.icon).click(o.click); 
	};
	
	var title = function(t) {
		if (t) {
			o.title = t;
			j(id + ' .title').html(t);
		}
		else
			return o.title;
	};
	
	var resize = function() {

		if (o.onResize)
			o.onResize();
		
		var h = j(id).height();
		
		if (handle)
			h -= 18;

		j(id + ' .content').height(h).width(j(id).width());
		
		j(id + ' .tab-content').height( j(id).height() - j(id + ' .nav-tabs').height() );
		
		j(id + ' .tab-pane').each(function() { 
			
			var w = j(this).parent().width(), h = j(this).parent().height(), ch = h;
			
			if (j(this).find('.footer'))
				ch -= (j(this).find('.footer').height() + 4);
					
			j(this).css({
				height: h,
				width: '100%',
			});
			
			j(this).find('.content').css({
				height: ch,
				width: '100%',
			});
		});
		
		/* docked windows */
		/*
		j(id + ' .window').each(function() {
			
			j(this).css({
				width: j(this).parent().width(),
				height: j(this).parent().height(),
			});
			
			j(this).get(0).win.resize(); 
		});*/
		renice();
	}
	
	var renice = function() {
		j(id + ' .nice').each(function() {
			j(this).getNiceScroll().resize();
		});
	}
	
	var init = function(o) {

		o.id = o.id.start('#') ? o.id : '#' + o.id; 
		id = o.id;

		log('Window.init: ' + id);
		
		j('.app').prepend('\
			<div id="'+ id.split('#')[1] +'" class="window '+ ( o['class'] || '' ) + '" >\
				<div class="content"></div>\
			</div>\
		');
		
		if (handle) {
			j(id).prepend('\
			<div class="handle">\
					<div class="title" style="width: 100%; text-align: center; text-overflow: ellipsis;">' + ( o.title || '&nbsp;' ) + '</div>\
					<div class="toolbar"></div>\
			</div>');
			o.handle = '.handle';
		}
		else 
			j(id + ' .content').css({ top: 0 });
		
		title(o.title || '');

		if (o.transparent) {
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
		
		draggable();

		if (Config.Toolbar)
			j(id + ' .handle').dblclick(hide);
		
		j(id).css({
			'overflow':'hidden',
		});
		
		if (doresize) {
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
		
		front(0);
		
		/* attempt to restore window position and size */
		var default_pos = getpos(o);
		
		j(id).css(o.css);
		
		if (j(id + ' .handle').length)
			j(id + ' .content').height(j(id).height() - 18);
	}
	
	var draggable = function(cancel) {
	
		try {
			j(id).draggable('destroy');
		} catch(ex) {}
	
		if (cancel === 0 || !drag) {
			j(id + ' .ui-resizable-handle').remove();
			return;
		}
		
		j(id).draggable({
			/*stack: ".ui-group",*/
			handle: o.handle,
			snap: 1,
			//containment: "window",
			iFrameFix: o.iframe ? 1 : 0,
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
		var p = j(id).parent();
		
		j(id).css({
			width: j(p).width(),
			height: j(p).height(),
			top: 0,
			left: 0
		});
		
		return self;
		//j(id + ' .icon-unchecked').hide();
		//j(id + ' .icon-columns').show();
	};
	
	var show = function() {
		j(id).show();
		Event.fire('window_show', id);
		front();
		return self;
	};
	
	var hide = function() {
		j(id).hide();
		Event.fire('window_hide', id);
		savepos();
		return self;
	};
	
	/* this type of collapse is no longer in use. see toolbar & show / hide */
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
	
	var front = function(save) {

		if (j(id).hasClass('nofront'))
			return;
	
		if (Config.front == id) {
			Event.fire('window_front', id);
			return;
		}
		
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
		
		if (save)
			savepos();
		
		return self;
	}
	
	var savepos = function() {
		
		if (!save)
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
				opacity: parseFloat(j(this).css('opacity')),
				collapsed: j(this).is(':visible') ? 0 : 1
			};
			
			//console.log(o);
			user.pref.win[view_id]['#'+id] = o;
			log('Saving window position: #' + id + ' ' + stringify(user.pref.win[view_id]['#'+id]));
		});
		
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });	
	}
	
	var getpos = function(o) {

		if (!save || !user.id || !user.pref || !user.pref.win)
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
		
		delete o.css.right, delete o.css.bottom;
		
		if (pref.collapsed)
			hide();

		log(stringify(o));
		
		return 0;
	}
	
	var tab = function(t) {

		t.html = t.html || '';
		console.log(t);
		
		var i = o.tabs.length;
		o.tabs.push(t);

		if (!j(id + ' .content .tabs').length) {
			j(id + ' .content').prepend('<ul class="tabs nav nav-tabs"></ul><div class="tab-content"></div>');
			j(id + ' .content').css('background-color', 'transparent');
			j(id + ' .tabs:hover').css({ cursor: 'move' });
			o.handle = '.nav-tabs';
			draggable();
		}
				
		var html = '<li><a class="kbutton ' + (t.id ? t.id.replace('#', '') : '') + '" data-toggle="tab" href="#tab-'+i+'">'+t.name+'</a></li>';
		
		if (!t.after && !t.before)
			j(id + ' .nav-tabs').append(html);
		else
		if (t.before)
			j(html).insertBefore(j(o.id + ' .nav-tabs a:contains("'+t.before+'")').parent());
		else
			j(html).insertAfter(j(o.id + ' .nav-tabs a:contains("'+t.after+'")').parent());
		
		j(o.id + ' .tab-content').append('<div id="tab-'+i+'" class="'+( t['class'] || '')+' tab-pane'+(i==0?' active':'')+'">'+(t.html||'')+'</div>');

		if (t.scroll)
			j(o.id + ' #tab-'+i).addClass('nice').niceScroll({
				cursorborder: 'none',
				//touchbehavior: 1,
				height: j(o.id + ' #tab-'+i).height()
			});
		
		resize();
		
		return o.id + ' #tab-' + i;
	};
	
	var dock = function(t) {
		
		var target = tab(t);
		console.log('request to dock window: ' + t.id + ' -> ' + target);
		
		j(t.id).detach().appendTo(target).css({
			left: 0,
			right: 'auto',
			top: 0,
			bottom: 'auto',
			height: '100%',
			width: '100%',
			position: 'relative',
			zIndex: 'inherit',
			borderWidth: 0
		});

		j(t.id).removeClass('window');
		
		var w = j(t.id).get(0).win;
		w.draggable(0);
		w.resize();
		w.show();
		
		j(t.id).find('.icon-remove').remove();
		
		return target;
	};
	
	init(o);
	
	var self = {
		id: o.id,
		title: title,
		button: button,
		tab: tab,
		dock: dock,
		front: front,
		maximize: maximize,
		show: show,
		hide: hide,
		maximized: maximized,
		resize: resize,
		draggable: draggable
	}
	
	j(o.id).get(0).win = self;
	
	Event.fire('window_open', self);
	
	return self;
}

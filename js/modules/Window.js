var Window = function(o) {
	
	var id, h, position, width, height, maximized, opt;
	var minZ = 100;
	var view_id = Config.view;
	
	o.css = o.css||{
		height: 380,
		width: 380
	}
	
	o.id = o.id||'#scroll-view';
	
	if (Config.device.touch) {
		o.noresize = 1;
		o.handle = '.none';
	}
	
	var button = function(o) {
		j(id + ' .toolbar').append('<i class="icon '+o.icon+' tip" title="'+o.title+'"></i>');
		j(id + ' .'+o.icon).click(o.click); 
	}
	
	var title = function(t) {
		j(id + ' .title').html(t);
	}
	
	var init = function(o) {
		
		opt = o;
		opt.tabs = [];
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
		else {
			j(o.id + ' .content').css({ 
				top: -38,
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
			j(id).css('border', 'none');
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
		
		/*
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
		
		if (!Config.device.mobile && !param('kong'))
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
		.click(function() {
			//log('Window.click');
			front();
		});

		//j(id + ' .handle').dblclick(collapse);
		
		j(id)
		.css({
			'overflow':'hidden',
		});
		
		if (!o.noresize) {
			j(id).resizable({
				minWidth: 60,
				width: 300,
				stop: function(e, u) { 	
					//j(id + ' .content').height(j(o.id).height()-12);
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

		for (var i = 0; i < o.tabs.length; i++)
			tab(o.tabs[i]);
					
		/* attempt to restore window position and size */
		var default_pos = getpos(o);
		
		j(id).css(o.css);
		//j(id + ' .content').height(j(id).height()-12);
	}
	
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
		
		//j(id + ' .icon-unchecked').hide();
		//j(id + ' .icon-columns').show();
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
		
		//j(id + ' .icon-unchecked').show();
		//j(id + ' .icon-columns').hide();
		j(id + ' .out').scrollTop(j(id + ' .out')[0].scrollHeight);
		
		maximized = 0;
	}
	
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
		
		for (var i = 0; i < Z.length; i++)
			j(Z[i].id).css('z-index', minZ + i);
	
		Config.front = id;
		
		log('Window.front(ed): ' + id);
		savepos();
	}
	
	var savepos = function() {
		
		if (!user.id || !Config.host || param('kong'))
			return;
			
		if (!user.pref.win)
			user.pref.win = {};
		
		user.pref.win[view_id] = {};
		
		j('.window').each(function() {
	
			user.pref.win[view_id]['#'+j(this).attr('id')] = {
				offset: j(this).offset(),
				width: j(this).width(),
				height: j(this).height(),
				zIndex: parseInt(j(this).css('z-index')),
				collapsed: j(this).find('.content').hasClass('hidden')?1:0
			};
			
			log('Saving window position: ' + stringify(user.pref.win[view_id]['#'+j(this).attr('id')]));
		});
	
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });	
	}
	
	var getpos = function(o) {

		if (!user.id || !user.pref || !user.pref.win || !Config.host || param('kong'))
			return 1;
		
		log('Restoring saved position: '+o.id);
		
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

		if (!user.pref.win[view_id] || !user.pref.win[view_id][o.id])
			return 1;
		
		var pref = user.pref.win[view_id][o.id];
	
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
	
	var tab = function(t) {
		
		var i = o.tabs.length;
		o.tabs.push(t);

		if (!j(o.id + ' .content .tabs').length) {
			j(o.id + '.content').prepend('\
				<ul class="tabs nav nav-tabs"></ul>\
				<div class="tab-content"></div>');
			j(o.id + ' .content').css('background-color', 'transparent');
			j(o.id + ' .tabs:hover').css({ cursor: move });
		}
		
		var html = '<li><a class="kbutton '+t.name+'" data-toggle="tab" href="#tab-'+i+'">'+t.name+'</a></li>';
		
		if (!t.after)
			j(o.id + ' .tabs').append(html);
		else
			j(html).insertAfter(j(o.id + ' .chat-tabs .'+t.after).parent());
		
		j(o.id + ' .tab-content').append('<div id="tab-'+i+'" class="tab-pane nice'+(i==0?' active':'')+'">'+(t.html||'')+'</div>');
		
		j('#tab-'+i).css({
			width: j(o.id).width() - 10,
			height: j(o.id).height() - 50,
		})
		.niceScroll({ 
			cursorborder: 'none', 
			touchbehavior: 1
		});
		
		return o.id + ' #tab-' + i;
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
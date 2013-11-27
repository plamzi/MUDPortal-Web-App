var ControlPanel = function () {
	
	if (Config.Device.mobile)
		return;
	
	var self = this;
	
	var id = '#control-panel';
	
	var pref, list, g;

	var d = window.sitelist, pref = window.user.pref;
	
	var tmc;
	
	var win = new Window({
		id: id,
		title: 'Game Center',
		noresize: 1,
		nofade: 1,
		css: {
			width: 700,
			height: 500,
			top: 160,
			left: 100,
			zIndex: 101
		}
	});
	
	j(id + ' .content').append('<div style="padding: 0px 4px 0px 4px; width: 172px; border-right: 1px solid #222;" class="left gamelist nice"></div>\
			<div class="left gamepanel" style="width: 500px; height: 100%"></div>')

	var loadProfiles = function () {
		j(id + ' .gamelist').prepend('<div class="profiles"><a class="folder" data="profile-link"><i class="icon-folder-open-alt"></i> My Profiles</a><br></div>');
		if (pref.profiles) {
			for (var p in pref.profiles) {
				var P = pref.profiles[p];
				if ((Config.clean || Config.solo) && Config.host != P.host)
					continue;
				var i = d.index('host', P.host);
				j(id + ' .gamelist .profiles').append('<a class="profile-link" host="'+d[i].host+'" port="'+d[i].port+'" thumb="'+d[i].img+'">'+p+'<br></a>');
			}
		}
	}
	
	var loadMudconnectList = function() {
		
		if (Config.solo || Config.clean)
			return;
			
		j.get('/app/xml/mudconnect.xml', function(d) {
			
			j(id + ' .gamelist .profiles').after('<div class="tmc"><a class="tmc-list folder"><i class="icon-folder-close-alt"></i> Big List (A-Z)<br></a></div>');
			
			tmc = j(d).find('mud');
			
			tmc = tmc.sort(function(a, b) {
				return j(a).find('title').text() > j(b).find('title').text()
			});
			
			var thumb = '';
			
			for (var g = 0; g < tmc.length; g++) {
				var name = j(tmc[g]).find('title').text();
				var host = j(tmc[g]).find('host').text();
				var port = j(tmc[g]).find('port').text();
				if (name.length && host.length && port.length)
					j(id + ' .gamelist .tmc').append('<a style="display:none" class="tmc-link game-link" host="'+host+'" port="'+port+'" thumb="'+thumb+'">'+name+'<br></a>');
			}
		});
	}
	
	var loadSiteList = function() {

		j(id + ' .gamelist').append('<div class="sitelist"><a class="big-list folder" data="game-link"><i class="icon-folder-open-alt"></i> Site List<br></a></div>');

		for (g = 0; g < d.length; g++) {
			try {
					var el = d[g].elements.replace(/&amp;/g, '&');
					var play = el.match(/\[play=(.+?)\]/)[1].replace(/\\\//g, '/');
					
					if (!play.has('http')) {
						d[g].host = play.split(':')[0];
						d[g].port = play.split(':')[1];
					}
					else {
						d[g].host = play.param('host');
						d[g].port = play.param('port');
					}

					if (!d[g].host || !d[g].port) {
						console.log('Skipping game: '+stringify(d[g]));
						continue;
					}
				
				if ((Config.clean || Config.solo) && Config.host != d[g].host)
					continue;
				
				d[g].img = '/'+el.match(/"(images\\\/.+?\.(png|gif|jpg))"/i)[1].replace(/\\\//g, '/');
				
				j(id + ' .sitelist').append('<a class="game-link" data="'+g+'" host="'+d[g].host+'" port="'+d[g].port+'" thumb="'+d[g].img+'">'+d[g].name+'<br></a>');
				
				
			} catch(ex) { log(d[g]) }
		}

	}
	
	var loadGamelist = function() {
		j(id + ' .gamelist').empty();
			loadSiteList();
			loadMudconnectList();
			loadProfiles();
	}

	loadGamelist();

	j(id).on('click', '.tmc', function(e) {
		e.stopPropagation();
		j('.tmc .folder').click();
		j('.gamelist').scrollTop(0);
	});
	
	j(id).on('click', ' .folder', function(e) {
		
		e.stopPropagation();
		
		j(this).siblings().toggle();
		
		var i = j(this).find('i');
		
		if (i.hasClass('icon-folder-open-alt')) {
			i.removeClass('icon-folder-open-alt');
			i.addClass('icon-folder-close-alt');
		}
		else {
			i.addClass('icon-folder-open-alt');
			i.removeClass('icon-folder-close-alt');
		}
		
		//setTimeout(function() {
			j('.gamelist').getNiceScroll().resize();
		//}, 2000);
		
	});
	
	j(id).on('click', ' .game-link, .profile-link', function(e) {
		
		e.stopPropagation();
		
		var profile = j(this).hasClass('profile-link');
		
		var tmclink = j(this).hasClass('tmc-link');
		
		var t = j(id + ' .gamepanel');
		
		t.removeAttr('profile');
		
		var name = j(this).text();
		var host = j(this).attr('host');
		var port = j(this).attr('port');
		var thumb = j(this).attr('thumb');
		
		t.attr('name', name);
		t.attr('host', host);
		t.attr('port', port);

		var url = '/play?host=' + host + '&port=' + port + '&name=' + encodeURIComponent(name) + (profile?'&profile='+encodeURIComponent(name):'');
		url = "<a href=\""+url+"\" class=\"button-primary\">play</a>";
		
		if (profile)
			t.attr('profile', '1');
		
		j('.gamepanel .scroll').niceScroll('destroy');
		
		t.empty();
		
		t.append('<div class="left" style="padding: 4px 18px 0px 4px"><img class="game-thumb" src="'+thumb+'"></div><div class="left" style="padding-top: 4px">'+name+'<div style="height: 8px; clear: both"></div>'+url);
		
		if (profile)
			t.append('<br>\
					<a class="kbutton save right tip" title="Save your preferences for this game or game profile."><i class="icon-save"></i> save</a></div>\
					<a class="kbutton pdel right tip" title="Delete this game profile."><i class="icon-remove"></i> delete</a></div>\
					<div style="clear: both"></div>');
		else
			t.append('<br>\
			<a class="kbutton save right tip" title="Save your preferences for this game or game profile."><i class="icon-save"></i> save</a></div>\
			<a class="kbutton clone right tip" title="Create a profile for this game."><i class="icon-copy"></i> profile</a></div>\
			<div style="clear: both"></div>');
				
		t.append('<ul class="nav nav-tabs">\
				<li class="active"><a href="#macros" class="kbutton" data-toggle="tab"><i class="icon-retweet"></i> macros</a></li>\
				<li><a href="#triggers" class="kbutton" data-toggle="tab"><i class="icon-reply"></i> triggers</a></li>\
				<li><a href="#settings" class="kbutton settings" data-toggle="tab"><i class="icon-cog"></i> settings</a></li>\
				</ul>');

		if (!profile)
			j(id + ' .gamepanel ul').append('<span class="kbutton right" title="Configurations at this level will apply to all profiles for this game"><i class="icon-question"></i></span>');
		
		t.append('<div class="tab-content">\
				<div class="tab-pane active" id="macros"></div>\
				<div class="tab-pane" id="triggers"></div>\
				<div class="tab-pane" id="settings"><div class="scroll"></div></div>\
				</div>');
		
		j(id + ' .gamepanel #macros').append('Macros support arguments (wildcards) in the format $1, $2... $*. The macro "$me -> Myname" will replace $me with Myname in any other macros or triggers.<br><br><a class="right kbutton macro-add"><i class="icon-plus"></i> new</a><div class="scroll"></div>');	
		j(id + ' .gamepanel #triggers').append('Triggers support wildcards in the format $1, $2... $9.<br><br><a class="right kbutton trigger-add"><i class="icon-plus"></i> new</a><div class="scroll"></div>');	

		if (user.id && pref) {
	
			if (pref.sitelist && pref.sitelist[name])
				var G = pref.sitelist[name];
			else if (pref.profiles && pref.profiles[name])
				var G = pref.profiles[name];
			
			if (G) {
				var t = j('#control-panel #macros .scroll');
				for (var n = 0; n < G.macros.length; n++) {
					var i = G.macros[n];
					t.append('<div><input type="text" style="width: 100px" placeholder="macro name" value="'+i[0]+'"> \
							<input type="text" placeholder="commands to send" value="'+i[1]+'"> \
					<i class="icon-'+(i[2]?'check':'unchecked')+'"></i> <i class="icon-star'+(i[3]?'':'-empty')+'"></i> \
					<i class="icon-remove-sign"></i></div>');
				}

				var t = j('#control-panel #triggers .scroll');
				for (var n = 0; n < G.triggers.length; n++) {
					var i = G.triggers[n];
					t.append('<div><input type="text" style="width: 100px" placeholder="trigger phrase" value="'+i[0]+'"> \
							<input type="text" placeholder="response" value="'+i[1]+'"> \
					<i class="icon-'+(i[2]?'check':'unchecked')+'"></i> \
					<i class="icon-remove-sign"></i></div>');
				}
			}
		}
		
		var t = j(id + ' .gamepanel #settings .scroll');
		t.append('Auto-load official plugins:  <i class="icon-check" id="official"></i><br>');
		t.append('Echo commands to main window:  <i class="icon-check" id="echo"></i><br>');
		t.append('Keep last command in input:  <i class="icon-check" id="keepcom"></i><br>');
		t.append('Enable MXP:  <i class="icon-check" id="mxp"></i><br>');
		
		if (G && G.settings)
			for (var s = 0; s < G.settings.length; s++)
				if (!G.settings[s].value)
					j(id + ' #settings ' + '#'+G.settings[s].id).removeClass('icon-check').addClass('icon-unchecked');

		j('.gamepanel .scroll').css({ height: '280px' });
		
		j('.gamepanel .scroll').niceScroll({ 
			cursorborder: 'none', 
			touchbehavior: 1
		});
		
		j('.gamelist a').removeClass('game-link-selected');
		j(this).addClass('game-link-selected');
		
	});

	if (param('profile')) {
		j(id + ' .profile-link').each(function() {
			if (j(this).text() == param('profile'))
				j(this).click();
		});
	}
	else if (param('host')) {
		j(id + ' .game-link').each(function() {
			if (j(this).attr('host') == param('host'))
				j(this).click();
		});
	}
	else
		if (j(id + ' .game-link:first').length)
			j(id + ' .game-link:first').click();
	
	j(id + ' .nice').niceScroll({ 
		cursorborder: 'none', 
		touchbehavior: 1
	});
	
	j(id).on('click', 'a.macro-add', function() {
		var t = j(this).parent().find('.scroll');
		t.append('<div><input type="text" style="width: 100px" placeholder="macro name"> <input type="text" placeholder="commands to send"> \
				<i class="icon-unchecked" title="Enable or disable this macro."></i> \
				<i class="icon-star-empty" title="Favorite macros with no arguments will appear as Quick Buttons."></i> \
				<i class="icon-remove-sign" title="Delete this macro."></i></div>');
		j('.gamepanel .scroll').getNiceScroll().resize();
		t.scrollTop(t[0].scrollHeight);
	});
	
	j(id).on('click', 'a.trigger-add', function() {
		var t = j(this).parent().find('.scroll');
		t.append('<div><input type="text" style="width: 100px" placeholder="trigger phrase"> <input type="text" placeholder="response"> \
				<i class="icon-unchecked" title="Enable or disable this trigger."></i> \
				<i class="icon-remove-sign" title="Delete this trigger."></i></div>');
		j('.gamepanel .scroll').getNiceScroll().resize();
		t.scrollTop(t[0].scrollHeight);
	});
	
	j(id).on('click', 'i.icon-remove-sign', function() {
		j(this).parent().remove();
	});
	
	j(id).on('click', 'i.icon-unchecked', function() {
		j(this).removeClass('icon-unchecked');
		j(this).addClass('icon-check');
	});
	
	j(id).on('click', 'i.icon-check', function() {
		j(this).removeClass('icon-check');
		j(this).addClass('icon-unchecked');
	});
	
	j(id)
	.on('click', 'i.icon-star-empty', function() {
		j(this).removeClass('icon-star-empty');
		j(this).addClass('icon-star');
	})
	.on('click', 'i.icon-star', function() {
		j(this).removeClass('icon-star');
		j(this).addClass('icon-star-empty');
	});
			
	j(id).on('click', '.save', function() {

		if (!user.id) {
			new Modal({
				title: 'Unsupported Action',
				text: 'Please register or login to be able to save your game preferences.',
				buttons: [
				    {
				    	text: 'Nah',
				    	click: function() {
				    		j('#modal').modal('hide');
				    	}
				    },
				    {
				    	text: 'Register',
				    	click: function() {
				    		window.open('/component/comprofiler/registers', '_reg');
				    		j('#modal').modal('hide');
				    	}
				    }
				]
			});
			return false;
		}
		
		var name = j(this).parent().attr('name');
		var profile = j(this).parent().attr('profile');
		
		if (!profile) {
			
			if (!pref.sitelist)
				pref.sitelist = {};

			pref.sitelist[name] = {
				macros: [],
				triggers: [],
				settings: [],
				host: j(this).parent().attr('host')
			};

		}
		else {
			
			if (!pref.profiles)
				pref.profiles = {};

			pref.profiles[name] = {
				macros: [],
				triggers: [],
				settings: [],
				host: j(this).parent().attr('host')
			};
		}
				
		j(id+' #macros .scroll div').each(function() {
			var a, b;
			if (!(a = j(this).find('input:first').val()))
				return;
			if (!(b = j(this).find('input:nth-child(2)').val()))
				return;
			
			c = j(this).find('.icon-check').length;
			d = j(this).find('.icon-star').length;
			
			if (profile) {
				pref.profiles[name].macros.push([a, b, c, d]);
			}
			else
				pref.sitelist[name].macros.push([a, b, c, d]);
		});

		j(id+' #triggers .scroll div').each(function() {
			var a, b;
			if (!(a = j(this).find('input:first').val()))
				return;
			if (!(b = j(this).find('input:nth-child(2)').val()))
				return;
			
			c = j(this).find('.icon-check').length;
			
			if (profile)
				pref.profiles[name].triggers.push([a, b, c]);
			else
				pref.sitelist[name].triggers.push([a, b, c]);
		});

		j(id+' #settings .scroll i').each(function() {
			
			var a = {
				id: j(this).attr('id'),
				value: j(this).hasClass('icon-check')?1:0
			};
			
			if (profile)
				pref.profiles[name].settings.push(a);
			else
				pref.sitelist[name].settings.push(a);
		});
			
		j.post('?option=com_portal&task=set_pref', { pref: stringify(pref) }, function() {
			new Modal({
				title: 'Preferences Saved',
				text: 'Your user preferences have been saved successfully.'
			});
		});
		
		if (Config.MacroPane)
			Config.MacroPane.init();
		
		if (Config.TriggerHappy)
			Config.TriggerHappy.init();
		
		return false;
	});
	
	j(id).on('click', '.clone', function() {
		
		if (!user.id) {
			new Modal({
				title: 'Unsupported Action',
				text: 'Please register or login to be able to create game profiles.',
				closeText: 'OK'
			});
			return false;
		}
		
		var m = new Modal({
			title: 'New profile based on ' + j('.gamepanel').attr('name'),
			text: '<em>Entering an existing profile name will overwrite it.</em><br><br><input type="text" placeholder="enter profile name">',
			buttons: [{
				text: 'Create',
				click: function() {
					
					var v;
					
					if (!(v = j('#modal .modal-body input').val()))
						return;
					
					if (!user.pref.profiles)
						user.pref.profiles = {};
					
					user.pref.profiles[v] = {
						id: v,
						name: j('.gamepanel').attr('name'),
						host: j('.gamepanel').attr('host'),
						port: j('.gamepanel').attr('port'),
						macros: [],
						triggers: [],
						settings: {}
					};
					
					j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });
					loadGamelist();
					j(id + ' .gamelist').getNiceScroll().resize();
				}
			}]
		});
		
		return false;
		
	});
	
	j(id).on('click', '.pdel', function() {
		var name = j(this).parent().attr('name');
		delete user.pref.profiles[name];
		j.post('?option=com_portal&task=set_pref', { pref: stringify(user.pref) });
		loadGamelist();
		j(id + ' .gamelist').getNiceScroll().resize();
	});
}

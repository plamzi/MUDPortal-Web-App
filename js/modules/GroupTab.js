var GroupTab = function(o) {
	
	o.id = o.id||'#group-tab';
	
	var group, membersLength, affs, min = [], sel, i;

	var path = '/app/images/group-';

	var init = function() {
        
		log('GroupTab: init');
	    
        o.id = Config.ChatterBox.tab({ 
	    	name: o.title || 'group', 
	    	before: 'chat',
	    	scroll: 1
	    });
	    
	    j(o.id).append('<div class="list" style="clear:both; min-height: 30px; height: 100%; position: relative"></div>');
	   // j('.chat-tabs a:first').click();
	    j(o.id + ' .group-member').click(function() {
	    	j(o.id + ' .group-member').removeClass('active');
	    	j(this).addClass('active');
	    });
	}
		
	var draw = function() {
		
		var m = group.members;
		

				j(o.id + ' .list').empty();
				
				for (i = 0; i < m.length; i++) {
					
					var mem = m[i];

					j(o.id + ' .list').append('\
					<div class="group-member '+mem.name+'" data="'+mem.name+'" id="group-member-'+i+'" num="'+i+'">\
						<i class="icon icon-double-angle-up member-close ui-button" style="position: absolute; z-index:2;" tabindex="1" title="minimize member panel"></i>\
						<i class="icon icon-double-angle-down member-show ui-button" style="position: absolute; z-index:2; display:none;" tabindex="1" title="maximize member panel"></i>\
						<div class="noart">\
							<div class="group-name">'+mem.name+'</div>\
							<div class="group-desc">'+classes[mem.info.class]+', Level '+mem.info.lvl+'</div>\
							<div class="group-chat"></div>\
							<div class="group-bars">\
								<img class="group-bar group-healthbar" src="'+path+'healthbar.png" style="width:'+Math.floor(mem.info.hp*186/mem.info.mhp)+'px">\
								<img class="group-bar group-manabar" src="'+path+'manabar.png" style="width:'+Math.floor(mem.info.mn*186/mem.info.mmn)+'px">\
								<img class="group-bar group-movebar" src="'+path+'movebar.png" style="width:'+Math.floor(mem.info.mv*186/mem.info.mmv)+'px">\
								<img class="group-bar group-expbar" src="'+path+'expbar.png">\
							</div>\
							<div class="group-stats">\
								<span class="group-stat group-hp">'+mem.info.hp+'</span> / <span class="group-maxhp">'+mem.info.mhp+'</span><br>\
								<span class="group-stat group-mn">'+mem.info.mn+'</span> / <span class="group-maxmn">'+mem.info.mmn+'</span><br>\
								<span class="group-stat group-mv">'+mem.info.mv+'</span> / <span class="group-maxmv">'+mem.info.mmv+'</span><br>\
								<span class="group-stat group-exp">100%</span><br>\
							</div>\
						</div>\
							<div class="group-aff"></div>\
					</div>\
					');
				}
				
				//j(o.id+' .list').sortable({	placeholder: "group-member-placeholder"	});
				j(o.id+' .list').disableSelection();
				
				j(o.id+' .group-member .member-close').click(function(e) { 
					j(this).parent().css({ height: 24 });
					j(this).parent().find('.group-icon').hide();
					j(this).parent().find('.group-desc').hide();
					j(this).parent().find('.group-bars').css({ top: 14 });
					j(this).hide();
					j(this).parent().find(".member-show").show();
						i = parseInt(j(this).parent().attr('num'));
						min.add(group.members[i].name);
						//log(min);
				});
				j('.group-member .member-show').click(function(e) { 
					j(this).parent().css({ height: 82 });
					j(this).hide();
					j(this).parent().find('.group-icon').show();
					j(this).parent().find('.group-bars').css({ top: 28 });
					j(this).parent().find(".member-close").show();
					j(this).parent().find('.group-desc').show();
						i = parseInt(j(this).parent().attr('num'));
						min.remove(group.members[i].name);
						//log(min);
				});	
				/*
			} else {
				for (var i = 0; i < m.length; i++) {
					var mem = m[i];
					j(o.id+' .list #group-member-'+i+' .group-desc').html(mem.info.class+', Level '+mem.info.lvl);
					j(o.id+' .list #group-member-'+i+' .group-stats').html('\
						<span class="group-stat group-hp">'+mem.info.hp+'</span> / <span class="group-maxhp">'+mem.info.mhp+'</span><br>\
						<span class="group-stat group-mn">'+mem.info.mn+'</span> / <span class="group-maxmn">'+mem.info.mmn+'</span><br>\
						<span class="group-stat group-mv">'+mem.info.mv+'</span> / <span class="group-maxmv">'+mem.info.mmv+'</span><br>\
						<span class="group-stat group-exp">100%</span><br>\
					');
					j(o.id+' .list #group-member-'+i+' .group-bars').html('\
						<img class="group-bar group-healthbar" src="'+path+'healthbar.png" style="width:'+Math.floor(mem.info.hp*186/mem.info.mhp)+'px"><br>\
						<img class="group-bar group-manabar" src="'+path+'manabar.png" style="width:'+Math.floor(mem.info.mn*186/mem.info.mmn)+'px"><br>\
						<img class="group-bar group-movebar" src="'+path+'movebar.png" style="width:'+Math.floor(mem.info.mv*186/mem.info.mmv)+'px"><br>\
						<img class="group-bar group-expbar" src="'+path+'expbar.png"><br>\
					');
				}
			}*/
			
			if (o.noart)
		    	j(o.id + ' .noart div').css({ left: 20 });
	}
	
	var aff = function() {
		var t = j(o.id+' .list .'+group.members[0].name+' .group-aff');
		t.empty();
		for (var i = 0; i < affs.length; i++) {
			if (affs[i].gives)
				t.append('<div class="group-one-aff tip" title="Gives '+affs[i].gives+' to '+affs[i].to+'">'+affs[i].name + ': ' + affs[i].duration + '</div>');
			else
				t.append('<div class="group-one-aff">'+affs[i].name + ': ' + affs[i].duration + '</div>');
		}
	}
	
	var update = function(d) {
		
		if (d.start('group {')) {
			try {
				group = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
				draw(); aff();
			} catch(err) {
				console.log('GroupTab gmcp parse error: '+err);
			};
		}
		else
		if (d.start('char.affs')) {
			try {
				affs = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
				aff();
			} catch(err) {
				console.log('GroupTab gmcp parse error: '+err);
			};
		}		
		
		return d; 
	}
	
	var selected = function() {
		if (!j(o.id + ' .active').length)
			return null;
		var i = parseInt(j(o.id + ' .active').attr('id'));
		return group.members[i];
	}
	
	return {
		init: init,
		update: update,
		selected: selected
	}
}
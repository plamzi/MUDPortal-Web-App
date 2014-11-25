var MistyBars = function(o) {
    
    var cv, cs, cm, win, id = "#bar-window";
    
    var o = o || {
    	title: 'MistyBars'
    };
    
    var process = function(d) {
		
		if (!d || !d.has('char.'))
		    return d;
		    		
		try {
			
			var key = d.match(/([^ ]+?) /)[1];
			var value = d.match(/[^ ]+? (.*)/)[1];

			var s = {};
			s[key] = eval('(' + value + ')');

			cm = exists(s['char.maxstats']) || cm;
			cv = exists(s['char.vitals']) || cv;
			cs = exists(s['char.status']) || cs;
			
			redraw();
			log('MistyBars (default): '+stringify(s));
			
		} catch(err) {
			log('MistyBars gmcp parse error: ' + err);
		};
		
		return d;
   };
    
	var draw = function() {
    
        var z = 1;
        
        win = new Window({
            id: id,
            title: o.title || 'MistyBars',
            'class': 'bar-window nofade',
            transparent: 1,
            noresize: 1,
            css: {
                height: 130,
                width: 360,
		        top: j(window).height() - 140,
		        left: Config.width + 30
            }
        });
        
		j(id + ' .content').append('\
			<img class="status grayscale" src="/app/images/bedlam-status.png">\
			<img class="bars" src="/app/images/bedlam-status-bars.png">\
			<div class="smoke hpbar"><img src="/app/images/bedlam-orb-smoke.png"></div>\
			<div class="bar-wrapper">\
    			<div class="manabar black"></div>\
    			<div class="movebar black"></div>\
    			<div class="expbar black"></div>\
    			<div class="tarbar black"></div>\
			</div>\
			<div class="hp-label label"><span class="hp now"></span><span class="maxhp max"></span></div>\
			<div class="mana-label label"><span class="mana now"></span><span class="maxmana max"></span></div>\
			<div class="moves-label label"><span class="moves now"></span><span class="maxmoves max"></span></div>\
			<div class="exp-label label single-label"></div>\
			<div class="tar-label label single-label"></div>\
		');
		
		var st = '#bar-window .';
		
		j(st + 'bars'  ).css({ 'zIndex': z });
		j(st + 'smoke' ).css({ 'zIndex': ++z });
		j(st + 'bar-wrapper' ).css({ 'zIndex': z });
		j(st + 'black' ).css({ 'zIndex': z });
		j(st + 'status').css({ 'zIndex': ++z });
		j(st + 'label').css({ 'zIndex': ++z });
	};
	
	var redraw = function(d) {
	
		var w = 200;
		var st = '#bar-window .';
		var ot = '#out-window .';
		
		if (cv) {
			j(st + 'hp').html(cv.hp);
			j(st + 'mana').html(cv.mana);
			j(st + 'moves').html(cv.moves);				
		}
		
		if (cm) {
			j(st + 'maxhp').html('/'+cm.maxhp);
			j(st + 'maxmana').html('/'+cm.maxmana);
			j(st + 'maxmoves').html('/'+cm.maxmoves);
		}
		
		if (cv && cm) {
			j(st + 'hpbar' ).animate({ height: 120-(120*(cv.hp / cm.maxhp)) }, 1200, 'easeInOutExpo');
			j(st + 'manabar' ).animate({ width: w-(w*(cv.mana / cm.maxmana)) }, 1200, 'easeInOutExpo');
			j(st + 'movebar' ).animate({ width: w-(w*(cv.moves / cm.maxmoves)) }, 1200, 'easeInOutExpo');
			
			j(ot + 'mini-hpbar' )  .animate({ width: parseInt((cv.hp / cm.maxhp)*100) + '%' }, 1200, 'easeInOutExpo');
			j(ot + 'mini-manabar' ).animate({ width: parseInt((cv.mana / cm.maxmana)*100) + '%' }, 1200, 'easeInOutExpo');
			j(ot + 'mini-movebar' ).animate({ width: parseInt((cv.moves / cm.maxmoves)*100) + '%' }, 1200, 'easeInOutExpo');			
		}

		if (cs) {
			j(st + 'exp-label').html((cs.tnl==-1)?addCommas(cs.exp):(cs.enl - cs.tnl));
			j(st + 'tar-label').html(cs.enemy.length?cs.enemy:"<span class='no-target'>no target</span>");
			j(st + 'tarbar' ).animate({ width: w-(w*(cs.enemypct / 100)) }, 1200, 'easeInOutExpo');
		}
	};

	if (o.process)
		process = eval('('+o.process+')');
	
	if (o.listen)
		 Event.listen(o.listen, process);
	else
		 Event.listen('gmcp', process);
	
	Event.listen('scrollview_ready', function(d, sv) {
	    sv.win.button({
	        icon: 'icon-th-list',
	        title: 'Hide / show the misty status bar.',
	        click: function() {
	            j('#bar-window').toggle();
	            Config.MistyBars.win.front();
	        }
	    });
	});
	
	draw();
	
	return {
	    process: process,
	    win: win
	};
};
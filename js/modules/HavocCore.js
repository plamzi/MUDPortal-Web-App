/* Havoc Websocket rich-text UI customizations. Included when &havoc is set in the URL */

if (param('havoc')) {
	
	Config.port = Config.port.length ? Config.port : 6001;
	Config.proxy = 'ws://' + Config.host + ':' + Config.port + '/';
	Config.bare = 1;
	Config.nocore = 1;
	Config.base64 = 1;
	Config.debug = 1;
	Config.notrack = 1;
	
	Event.listen('socket_open', function() {
		Config.Socket.write('{ portal: 1 }');
	});
	
	j('body').css({ 
	    fontFamily: 'Open Sans, "Lucida Console", "Courier New"',
	    fontSize: 15
	});
}

if (param('havoc') && !param('gui')) {

    Config.ScrollView = new ScrollView();
    
    Config.MistyBars = new MistyBars({ 
        
        process: function(d) { 
            
            try {
                
                var key = d.match(/([^ ]+?) /)[1];
                var value = d.match(/[^ ]+? (.*)/)[1];
                
                if (!key.has('ch')) 
                    return d; 
                
                var p = eval('(' + value + ')'); 
                
                if (p.points) 
                    p = p.points; 
                
                cm = { 
                    maxhp: p.maxhit||cm.maxhp, 
                    maxmana: p.maxmana||cm.maxmana, 
                    maxmoves: p.maxstamina||cm.maxmoves 
                };
                
                cv = { 
                    hp: p.hit, 
                    mana: p.mana, 
                    moves: p.stamina 
                };
                
                cs = { /* level: 210, enl: 3000, tnl: 1000, state: 3, pos: "Standing", */ 
                    tnl: -1, 
                    exp: p.exp||"N/A", enemy: p.enemy||"N/A", 
                    enemypct: p.enemypct||0 
                };
                
                redraw(); 
                log('MistyBars override: '+stringify(p)); 
            } 
            catch(err) { 
                log('MistyBars override gmcp parse error: '+err); 
            }
                
            return d; 
        }
    });

    if (!param('gui'))
	    j(document).ready(function() {
	    	Config.Toolbar = new Toolbar();
	    	Event.listen('window_open', Config.Toolbar.update);
	    	Event.listen('window_close', Config.Toolbar.update);
	    	Event.listen('window_front', Config.Toolbar.front);
	    });
}
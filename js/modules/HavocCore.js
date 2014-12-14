/* Havoc Websocket rich-text UI customizations. Included when &havoc is set in the URL */
   
if (param('havoc')) {
	
	Config.port = Config.port.length ? Config.port : 6001;
	Config.proxy = 'ws://' + Config.host + ':' + Config.port + '/';
	Config.fbAppId = Config.fbAppId || param('fb'); 
	Config.bare = 1;
	Config.nocore = 1;
	Config.base64 = 1;
	Config.debug = 1;
	Config.notrack = 1;
	Config.notriggers = 1;
	Config.nomacros = 1;
	
	Event.listen('socket_open', function() {
		Config.Socket.write('{ portal: 1 }');
	});
}

if (param('havoc') && !param('gui')) {

    Config.ScrollView = new ScrollView();
    
    if (param('misty'))
    Config.MistyBars = new MistyBars({ 
        
        process: function(d) { 
            
            try {
                
                var key = d.match(/([^ ]+?) /)[1];
                var value = d.match(/[^ ]+? (.*)/)[1];
                
                if (!key.start('ch.points')) 
                    return d; 
                
                var p = eval('(' + value + ')'); 
                
                if (p.points) 
                    p = p.points; 
                
                cm = { 
                    maxhp: p.maxhit || cm.maxhp, 
                    maxmana: p.maxmana || cm.maxmana, 
                    maxmoves: p.maxstamina || cm.maxmoves 
                };
                
                cv = { 
                    hp: p.hit, 
                    mana: p.mana, 
                    moves: p.stamina 
                };
                
                cs = { /* level: 210, enl: 3000, tnl: 1000, state: 3, pos: "Standing", */ 
                    tnl: -1, 
                    exp: p.exp || "N/A", 
                    enemy: p.enemy || "N/A", 
                    enemypct: p.enemypct || 0 
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
	
    Event.listen('socket_close', function() {
		new Modal({
			title: 'Server Disconnected',
			text: 'Lost server connection. This is normal if you\'re navigating away or connecting from elsewhere. If not, usually, this means a server boot / update. Please reload the page to make sure you have the latest app code.<br><br>',
			backdrop: 'static',
			closeable: 0,
			buttons: [{
			   text: 'Reload',
			   click: function() { window.onbeforeunload = function() {}; window.location.reload(); }
			}]
		});
	});
	
    if (!param('gui'))
	    j(document).ready(function() {
	    	Config.Toolbar = new Toolbar();
	    	Event.listen('window_open', Config.Toolbar.update);
	    	Event.listen('window_close', Config.Toolbar.update);
	    	Event.listen('window_front', Config.Toolbar.front);
	    });
    
    if (!param('gui'))
	Event.listen('mxp_frame', function(name, action) {
		
		if (name == 'syslog' && action == 'open') {
			
			j('#syslog').css({ 
				width: 400,
				height: 150,
				left: Config.width,
				top: 800,
				fontSize: 12
			});
		}
	});
}

var Facebook = function(a, b) {

	console.log("Facebook: " + a);
	
	if (a == 'init') {
		
		if (!Config.fbAppId)
			return;
			
		log('HavocCore: Facebook.init ' + Config.fbAppId);
		
		window.fbAsyncInit = function() {
			log('HavocCore: fbAsyncInit');
			FB.init({
				appId      : Config.fbAppId,
			    status :    true,
			    cookie :    true,
				xfbml      : true,
				version    : 'v2.1'
			});
		
			//Facebook('checkState');
			//FB.Event.subscribe('auth.login', function(resp) { Facebook('statusChange', resp); } );
		};

		( function(d, s, id){
			 var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;} js = d.createElement(s); js.id = id;
			 js.src = "//connect.facebook.net/en_US/sdk.js"; fjs.parentNode.insertBefore(js, fjs);
		} (document, 'script', 'facebook-jssdk'));

		j('body').on('show.bs.modal', function() {
			if (j('.modal.login-prompt').length)
				j('.modal-footer').prepend('\
					<div class="left" style="opacity: 0.7; margin-right: 6px">\
						<img src="/aaralon/images/FacebookButton.png" class="tip pointer" title="Log in with your Facebook account." onclick="Facebook(\'login\');return false;">\
					</div>');
		});

		return;
	}

	if (a == 'login') {
		try {
			FB.getLoginStatus(function(resp) {
				if (resp.status == "connected")
					Facebook('statusChange', resp);
				else
					FB.login(function(resp) { Facebook('statusChange', resp); }, { scope: 'public_profile,email' });
			});
		} 
		catch(ex) {
			log(ex);
		}
	}
	
	if (a == 'checkState')
		return FB.getLoginStatus(function(resp) { Facebook('statusChange', resp); });
	
	if (a == 'statusChange') {
		console.log(b);
		if (b.status == "connected") {
			
			FB.api("/me", function (resp) {
				
				if (!resp || resp.error)
					return;
				
				console.log(resp);
				
				if (window.info)
					info.fb = resp;
				
				Config.Socket.write(stringify({ fbid: resp.id, email: resp.email }));
			});
		}
	}
}

Event.listen('gmcp', function(d) {
	
	if (!d || !d.start || !d.start('game.info'))
		return d;
    
	d = eval('(' + d.match(/[^ ]+? (.*)/)[1] + ')');

	if (d.fbAppId && d.fbAppId.length) {
		
		log('HavocCore received Facebook app id from server');
		
		if (!Config.fbAppId) {
			Config.fbAppId = d.fbAppId;
			Facebook('init');
		}
	}
	
	return d;
});


	
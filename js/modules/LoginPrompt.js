var LoginPrompt = function(o) {

	var user, line, pastuser = 0;
	var id = o.id = o.id || '#login-prompt';
	var pass = param('kongregate_game_auth_token') || null;
	o['class'] = 'login-prompt';
	
	log('LoginPrompt.init gmcp is ' + o.gmcp);
	
	if (j('#login-prompt').length) {
		o.replace = 1;
		log('replace mode');
	}
	
	try {
		
		if (!o.gmcp) {
			o.show = new RegExp(o.show);
	    	o.error = new RegExp(o.error);
		}
		
   		o.dismiss = new RegExp(o.dismiss);
    	o.password = new RegExp(o.password);
	}
	catch(ex) {
	    log(ex);
	}
	
	var shown = function() { return j('.modal #login-prompt').length; };
	
	var listen = function(d) {
		
		if ((line = d.match(o.show))) {
			log('LoginPrompt listen show');
			
			if (param('kongregate_user_id'))
				Config.socket.write(param('kongregate_user_id'));
			else
			if (param('token'))
				Config.socket.write(param('token'));
			else
				show(line[0]);
		}
		else
		if ((line = d.match(o.error))) {
			j(id + ' .error').html(line[0]).show();
			return '';
		}
		else
		if (pass && (line = d.match(o.password))) {
			pastuser = 1;
			Config.socket.write(pass);
			return '';
		}
		else
		if (d.match(o.dismiss) && shown()) {
			log('LoginPrompt dismiss detected');
			j('.modal').modal('hide');
			setTimeout(function() { j('#scroll-view .send').focus(); }, 500);
		}
		
		return d;
	};
	
	var go = function() { 

        log('LoginPrompt.go');
        
		if (!j(id + ' .user').val()) {
			j(id + ' .error').html('You need to enter a '+o.placeholder+'.').show();
			return;
		}
		
		if (!param('havoc') && !j(id + ' .pass').val()) {
			j(id + ' .error').html('You need to enter a password.').show();
			return;
		}
        
        j(id+' .error').hide();
		
        user = j(id+' .user').val();
        pass = j(id+' .pass').val();
		
		if (pastuser)
			Config.socket.write(pass);
		else
		if (o.gmcp) {
			if (pass)
				Config.socket.write(stringify({ username: user, password: pass}));
			else
				Config.socket.write(user);
		}
		else
			Config.socket.write(user);
	};
	
	var show = function(t) {
		
		o.err =  (o.gmcp && o.error ? o.error : null);
		
		o.text = '\
		<div id="'+id.split('#')[1]+'" class="login-prompt">\
			<div class="error alert" '+ (o.err ? '' : 'style="display:none"')+'>' + (o.err || '') + '</div>\
			<div style="width: 100%">\
			<div class="left" style="margin: 0px; opacity: 0.6; padding: 0px 40px 0px 0px">\
			<img style="width: 90px;" src="/app/images/login.png"></div>\
			<div class="left" style="width: 200px">\
			<input class="user right" type="text" tabindex="1" autocapitalize="off" autocorrect="off" size=18 placeholder="'+(o.placeholder||'')+'">\
			<br><br>\
			<input class="pass right" type="password" tabindex="2" autocapitalize="off" autocorrect="off" size=18 placeholder="password">\
			</div></div>\
		</div>';
	
		o.title = t || o.title || 'Please Login:';
		
		o.closeable = o.closeable || 0;
		
		o.buttons = [{
		    text: '<i class="icon-signin"></i> Login',
		    keep: 1,
		    click: go
		}];
		
		if (window.user.guest && !Config.device.touch && !param('kong') && !param('gui') && !param('havoc'))
			o.buttons.unshift({
                text: '<i class="icon-sun"></i> Portal Sign-In',
    		    click: function() {
    		    	window.open('/component/comprofiler/login', '_self');
    		    }
    		});
		
		o.css = o.css || {
		    width: 400
		};
		
		var enter = function() {
		
			j(id + ' .user').on('keydown', function(e) {
				if (e.which == 13) {
					if (!param('havoc') && !j(id+' .pass').val().length)
						j(id+' .pass').focus();
					else
						go(e);
					e.preventDefault(); 
				}
			});
			
			j(id + ' .pass').on('keydown', function(e) { 
				if (e.which == 13) { 
					go(e); 
					e.preventDefault(); 
				}
			});
		};
		
		j('body').on('shown.bs.modal', enter);
		j('body').off('hide.bs.modal', enter);
		
		new Modal(o);
		
		setTimeout(function() {
	    	j(id + ' .user').focus();
		}, 500);
	};
	
	if (o.gmcp)
		show();
	
	return {
		listen: listen
	};
};

Event.listen('gmcp', function(d) {
	
	if (!d.start('LoginPrompt '))
		return d;
	
	log('LoginPrompt detected gmcp trigger');
	
	try {
		var o = JSON.parse(d.match(/^[^ ]+ (.*)/)[1]);
		o.gmcp = 1;
		new LoginPrompt(o);
	}
	catch(ex) {
		log(ex);
	}
	
	return d;
});
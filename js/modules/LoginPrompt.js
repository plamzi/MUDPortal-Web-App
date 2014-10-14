var LoginPrompt = function(o) {
	
	var user, line, pastuser = 0;
	var id = o.id = o.id||'#login-prompt';
	var pass = param('kongregate_game_auth_token')||null;
	var shown = 0;
	//var pass = null;
	
	try {
	    o.show = new RegExp(o.show);
	    o.error = new RegExp(o.error);
	    o.dismiss = new RegExp(o.dismiss);
	    o.password = new RegExp(o.password);
	}
	catch(ex) {
	    log(ex);
	}
	
	var listen = function(d) {
		
		if ((line = d.match(o.show))) {
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
		if (d.match(o.dismiss) && shown) {
			j('.modal').modal('hide');
			setTimeout(function() { j('#scroll-view .send').focus(); }, 500);
			shown = 0;
		}
		
		return d;
	};
	
	var go = function() { 

        log('LoginPrompt.go');
        
		if (!j(id + ' .user').val()) {
			j(id + ' .error').html('You need to enter a '+o.placeholder+'.').show();
			return;
		}
		
		if (!j(id + ' .pass').val()) {
			j(id + ' .error').html('You need to enter a password.').show();
			return;
		}
        
        j(id+' .error').hide();
		
		pass = j(id+' .pass').val();
		
		if (pastuser)
			Config.socket.write(pass);
		else
			Config.socket.write(j(id+' .user').val());
	};
	
	var show = function(t) {
		
		shown = 1;
		
		o.text = '\
		<div id="'+id.split('#')[1]+'" class="login-prompt">\
			<div class="error alert" style="display:none"></div>\
			<div style="width: 100%">\
			<div class="left" style="margin: 0px; opacity: 0.6; padding: 0px 40px 0px 0px">\
			<img style="width: 90px;" src="/app/images/login.png"></div>\
			<div class="left" style="width: 200px">\
			<input class="user right" type="text" tabindex="1" autocapitalize="off" autocorrect="off" size=18 placeholder="'+(o.placeholder||'')+'">\
			<br><br>\
			<input class="pass right" type="password" tabindex="2" autocapitalize="off" autocorrect="off" size=18 placeholder="password">\
			</div></div>\
		</div>';
	
		o.title = t||'';
		
		o.closeable = 0;
		
		o.buttons = [{
		    text: '<i class="icon-signin"></i> Login',
		    keep: 1,
		    click: go
		}];
		
		if (window.user.guest && !Config.device.touch && !param('kong') && !param('gui'))
			o.buttons.push({
                text: '<i class="icon-sun"></i> Portal Sign-In',
    		    click: function() {
    		    	window.open('/component/comprofiler/login', '_self');
    		    }
    		});
		
		o.css = o.css||{
		    width: 400
		};
		
		new Modal(o);
		
		j(id+' .pass').keypress(function(e) { 
			if (e.which == 13) { 
				e.preventDefault(); 
				go(e); 
			} 
		});
		
		j(id+' .user').keypress(function(e) { 
			if (e.which != 13) 
				return true;
			e.preventDefault(); 
			if (j(id+' .pass').val().length == 0)
				j(id+' .pass').focus();
			else
				go(e);
		});
		
		setTimeout(function() {
	    	j(id+' .user').focus();
		}, 1000);
	};

	log('LoginPrompt.init');
	
	return {
		listen: listen
	};
};
var LoginPrompt = function(opt) {
	
	var o = opt, user, pass, line;
	var id = o.id = o.id||'#login-prompt';
	var pass;
	
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
		
		if ((line = d.match(o.show)) && !j('#modal').length)
			show(line[0]);
		
		if (!j('#modal').length)
		    return d;
		
		if ((line = d.match(o.error))) {
			j(id + ' .error').html(line[0]).show();
			return '';
		}
		else
		if (pass && (line = d.match(o.password))) {
			Config.socket.write(pass);
			return '';
		}
		else
		if (d.match(o.dismiss)) {
			j('#modal').modal('hide');
			setTimeout(function() {
		    	j('#scroll-view').click();
			}, 1000);
		}
		
		return d;
	}
	
	var go = function() { 

        log('Login.go');

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
		Config.socket.write(j(id+' .user').val());
	};
	
	var show = function(t) {
		
		o.text = '\
		<div id="'+o.id.split('#')[1]+'">\
			<div class="error alert" style="display:none"></div>\
			<div style="width: 100%">\
			<div class="left" style="margin: 0px; opacity: 0.6; padding: 0px 40px 0px 0px">\
			<img style="width: 90px;" src="/bedlam/app/images/login.png"></div>\
			<div class="left" style="width: 200px">\
			<input class="user right" type="text" tabindex="1" size=18 placeholder="'+(o.placeholder||'')+'">\
			<br><br>\
			<input class="pass right" type="password" tabindex="2" size=18 placeholder="password">\
			</div></div>\
		</div>';
	
		o.title = t||'';
		
		o.closeable = 0;
		
		o.buttons = [{
		    text: 'Login',
		    keep: 1,
		    click: go
		}];
		
		o.css = {
		    width: 400
		};
		
		new Modal(o);
		
		j(id+' .pass').keypress(function(e) { 
			if (e.which == 13) { 
				e.preventDefault(); 
				go(e) 
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
		}, 3000);
	}

	log('LoginPrompt.init');
	
	return {
		listen: listen
	}
}
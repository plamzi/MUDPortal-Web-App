/* Havoc (c) 2014 */

var Mapper = function(o) {
	
	var self = this, path = ( o.path || 'http://' + Config.host + '/world/' ), nice, data = {}, map, marker, win, img, was = { zone: '' }, title, tile = 72 *  (o.scale || .75);

	var H, W, iH, iW, 
	xOffset = Math.floor(tile / 6), 
	yOffset = Math.floor(tile / 2);

	var mymaps = [
		'Calandor.map', 
		'Calandor Temple.map'
	];

	var myimages = [
	 	'/aaralon/images/AaralonSplash.jpg',
		'/aaralon/world/Calandor.jpg',
		'/aaralon/world/Calandor Temple.jpg'
	];
	
	var ani = {
		'^Vwm': {
			img: path + 'core/images/scenery/windmill-',
			frames: [ '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18' ]
		},
		'^Ze': {
			img: path + 'core/images/scenery/fire',
			frames: [ '1', '2', '3', '4', '5', '6', '7', '8' ]		
		}
	}
	
	var animate = function(d) {
		
		if (!d.terrain)
			return;
		
		var a = null;
		
		j('.ani').animateSprite('stop').remove();
		
		for (var i in ani)
			if (d.terrain.has(i))
				a = ani[i];
		
		if (!a) 
			return;
			
		j(map).append('<img class="ani" src="'+a.img + a.frames[0] + '.png'+'">');
		
		j('.ani').css(getpos(was));
		
	    j('.ani').animateSprite({
			columns: a.frames.length,
			fps: 12,
			loop: true,
			animations: {
				run: a.frames
			}
		});
		
		j('.ani').animateSprite('play', 'run'); 
	};
	
	var loadZone = function(z) {
		
		loadImage(path + z + '.jpg', img);
		
		if (data[z]) {
				
		}
	};
	
	var loadMaps = function() {

		mymaps.forEach(function(i) {
	        j.get(path + i, function(d) {
			
				var z = i.split('.')[0];
				
				data[z] = d.replace(/[ \t]/g, '').split('\n').slice(3, -1);
				data[z] = data[z].map(function(i) {
					return i.split(',');
				});
				
				console.log(data);
				
			}, 'text');
	    });
	};
	
	var loadImage = function(src, target) {
		return j(target).attr('src', src);
	};
	
	var setTitle = function(t) {
		title = (was.id || was.zone) + ': ' + was.x + 'x' + was.y + ' ' + t.name;
		win.title(title);
		j(marker).attr('title', title);
	};
	
	var setPortals = function(p) {
		j(o.id + ' #portals').empty();
	};

	var go = function(at) {

		at = at || was;
		
		if (was.zone != at.zone) {
			loadZone(at.proto || at.zone);
			setTimeout(go, 1500);
		}
		
		iW = j(img).width();
		iH = j(img).height();
		
		log('iW: '+iW+ ' iH: '+iH);
		
		W = j(map).width();
		H = j(map).height();
		
		var pos = getpos(at);
		
		j(marker).css(pos).show();
		
		var x = pos.left + (tile / 2) - (W / 2);
		var y = pos.top + (tile / 2) - (H / 2);
		
		if (x < 0)
			x = 0;
		
		if (y < 0)
			y = 0;
		
		if (x + W > iW)
			x = iW - W;
		
		if (y + H > iH)
			y = iH - H;
			
		j(map).scrollLeft(x).scrollTop(y);
		was = at;

		log('mapper.go: scrolled to: x' + j(map).scrollLeft() + ' y' + j(map).scrollTop());
		
		!nice || nice.resize();
		
		if (!o.mini) {
			//animate(at);
			home(at);
		}
		
		return self;
	};
	
	var init = function() {
		
		loadMaps();

		myimages.forEach(function(i) {
	        j('<img/>')[0].src = i;
	    });
		
		map = o.id + ' .content';
		img = map + ' #map';
		marker = map + ' #marker';

		o.css = o.css || {
			height: 400,
			width: 400,
			top: 400, 
			left: Config.width
		};
	
		win = new Window({
			id: o.id,
			title: 'HavocMapper',
			'class': 'nofade nofront',
			handle: '.inbar',
			css: o.css,
			onResize: function() {
	        	go(was);
	        }
		});

		j(map).html('\
			<img id="map" class="pointer" style="max-width: none; max-height: none; z-index: 1; position: absolute" oncontextmenu="return false;">\
			<img id="marker" class="tip" style="width: 54px; height: 54px; z-index: 2; position: absolute; display: none" src="/aaralon/images/brush.png"></img>\
		');

		j(o.id).prepend('<div class="inbar" style="position: absolute; top: 0px; left: 0px; z-index: 2; height: 20px; width: 100%; text-align: center;">\
			<div class="title" style="white-space: nowrap; text-overflow: ellipsis; font-size: ' + (o.mini?10:13) + 'px;"></div>\
		</div>');

		loadImage(path + 'Calandor.jpg', img);
		
		j(o.id + ' .ui-resizable-handle').css('zIndex', 3);
		
		nice = j(map).addClass('nice').niceScroll({
			//touchbehavior: 1,
			cursorborder: 'none',
			zindex: 3,
			cursorwidth: 8,
			railoffset: { top: -4, left: -4 }
		});
		
		//if (o.mini)
			//j(map).addClass('frame-left')
		
		j(document).on('click', img, clicked);
	};

	var home = function(at) {
		
		if (!param('gui'))
			return;
		
		if (at.zone == 'Calandor' && at.x == 78 && at.y == 29 && j('#bar #home').text().has('recall'))
			j('#bar #home').html('<img src="/bedlam/art/cache/ui/cmdrent@2x.png"> home');
		else
			if (j('#bar #home').text().has('home'))
				j('#bar #home').html('<img src="/bedlam/art/cache/ui/cmdrent@2x.png"> recall');
	};
	
	var getpos = function(at) {
		
		if (!at.x)
			return { left: 0, top: 0 };
		
		var oddX = at.x % 2;
		
		mX = xOffset + ((tile * 0.75) * at.x) - (tile / 2);
		mY = (tile * at.y) - (tile / 2) + (!oddX ? yOffset : 0); 
		
		log('mX: '+mX+ ' mY: '+mY);
		return { left: mX - 4, top: mY - 5 };
	};
	
	var update = function(d) {
		
		if (!d || !d.start)
			return d;

		try {
			if (d.start('ch.at ')) {
				
				log('Havoc' + (o.mini ? '(mini)': '')+ 'Mapper.update at');
				
				at = eval('(' + d.match(/[^]+? (.*)/)[1] + ')');
				go(at);
			}
			else
			if (d.start('room.info ')) {
				log('HavocMapper.update room.info');
				var t = eval('(' + d.match(/[^]+? (.*)/)[1] + ')');
				setTitle(t);
				animate(t);
				if (t.portals)
					setPortals(t.portals);
			}
		} 
		catch(err) {
			log('Mapper gmcp parse error: '+err);
		};
		
		return d;
	};
	
	var clicked = function(e) {
		
		var offset = j(this).offset();
		var x = e.clientX - offset.left;
		var y = e.clientY - offset.top;

		x -= (xOffset * 2);
		
		var mX = Math.round(x / (tile * 0.75));
		
		if (!(mX % 2))
			y -= (yOffset - xOffset);
	
		var mY = Math.round(y / tile); 
		
		console.log('mX: ' + mX + ' mY: ' + mY);
		
		if (Config.socket)
			Config.socket.write('travel ' + mX + ' ' + mY);
	};
	
	init();
	
	var self = {
		update: update,
		win: win,
		go: go
	};
	
	return self;
};

if (param('havoc') && param('map') != '0') {
	Config.Mapper = new Mapper({ id: '#havoc-mapper' });
	Event.listen('gmcp', Config.Mapper.update);
}
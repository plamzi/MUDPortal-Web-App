var JujuMapper = function(o) { 
	
	o = o || {
		scale: 1.6,
		width: 2000,
		height: 2000,
		nums: 0,
		css: {
			width: 400, 
			height: 400, 
			bottom: 0,
			left: Config.width
		}
	};
	
	o.seeall = o.seeall || param('seeall');
	
	if (Config.kong) {
		o.css.width = 398;
		o.css.height = 240;
	}
	
	o.loadURL = o.loadURL || '/index.php?option=com_portal&task=get_map&host='+Config.host+'&port='+Config.port;
	o.saveURL = '/index.php?option=com_portal&task=save_map&host='+Config.host+'&port='+Config.port;
	
	var map = {}, areas = {}, rooms = {}, exits = [], tags = [], selection = [];
	var lns, rms, tgs;
	var svg, c_map, ready = 0, at, prev, R;
    var id = '#mapper', W, H;
    var nice, skipframes;
    
    o.container = id + ' .content';
	
    var dist = 38;

    var xOffset = {
    	n:	 0,
    	e:	 +dist,
    	s:	 0,
    	w:	 -dist,
    	ne:  +dist,
    	nw:  -dist,
    	se:  +dist,
    	sw:  -dist,
    	u:	+Math.floor(dist/3),
    	d:  -Math.floor(dist/3)
    };
    
    var yOffset = {
    	n:	 -dist,
    	e:	 0,
    	s:	 +dist,
    	w:	 0,
    	ne:  -dist,
    	nw:  -dist,
    	se:  +dist,
    	sw:  +dist,
    	u: -Math.floor(dist/3),
    	d: +Math.floor(dist/3)
    };
	
	var rev = {
	    n: 's',
	    e: 'w',
	    s: 'n',
	    w: 'e',
	    u: 'd',
	    d: 'u',
	    ne: 'sw',
	    nw: 'se',
	    se: 'nw',
	    sw: 'ne'
	};
	
	var colors = [
		'Gold',
		'LightSkyBlue',
		'#90EE90',
		'Magenta',
		'Cyan',
		'CornflowerBlue',
		'Pink',
		'Green',
		'Plum',
		'Aqua',
		'#9966CC',
		'Aquamarine',
		'Bisque',
		'SandyBrown',
		'Chartreuse',
		'Chocolate',
		'GoldenRod',
		'PowderBlue',
		'LightGreen',
		'MediumPurple',
		'MediumTurquoise',
		'Moccasin',
		'PaleVioletRed',
		'DarkKhaki',
		'Lime',
		'Salmon',
		'PeachPuff',
		'LightGoldenRodYellow',
		'Khaki',
		'LightSalmon',
		'SandyBrown',
		'DarkSeaGreen',
		'Thistle',
		'Tan',
		'PowderBlue',
		'PapayaWhip',
		'MistyRose',
		'Orange',
		'HotPink',
		'Orchid',
		'LightSteelBlue',
		'Wheat',
		'LightSlateGray'
	];
    
    var color_index = 0;
    
    var getZoneColor = function() {
    	if (++color_index >= colors.length)
    		color_index = 0;
    	return colors[color_index];
    }
    
    var moveKey = function(d, from, to) {
    	if (exists(d[from])) {
    		d[to] = d[from];
    		delete d[from];
    	}
    }
    
    var pack = function() {
    	map.rni = [];
    	map.ti = [];
    	var R, n;
    	for (var i in map.rooms) {
    		R = map.rooms[i];
    		delete R.num;
    		
    			/*
	    		if (R.zone)
	    			R.zone = map.areas.index('name', R.zone);
	    		
	    		if ((n = map.rni.indexOf(R.name)) == -1) {
	    			map.rni.push(R.name);
	    			R.name = map.rni.length - 1;
	    		}
	    		else
	    			R.name = n;
	    		*/
    		
	    		if (R.terrain) {
		    		if ((n = map.ti.indexOf(R.terrain)) == -1) {
		    			map.ti.push(R.terrain);
		    			R.terrain = map.ti.length - 1;
		    		}
		    		else
		    			R.terrain = n;
	    		}
	    		
	    	moveKey(R, 'terrain', 'T');
	    	moveKey(R, 'via', 'V');
	    	moveKey(R, 'name', 'N');
	    	moveKey(R, 'zone', 'O');
	    	moveKey(R, 'trans', 'R');
	    	if (isNaN(R.z) || R.z == 'NaN')
	    		R.z = 0;
	    	if (R.trans == 0)
	    		delete R.trans;
    	}
    }
    
    var unpack = function() {
    	var R, n;
    	for (var i in map.rooms) {
    		R = map.rooms[i];
    		R.num = i;
    		moveKey(R, 'T', 'terrain');
	    	moveKey(R, 'V', 'via');
	    	moveKey(R, 'N', 'name');
	    	moveKey(R, 'O', 'zone');
	    	moveKey(R, 'R', 'trans');
    		
	    	if (R.zone && map.areas[parseInt(R.zone)]) 
    			R.zone = map.areas[parseInt(R.zone)].name;
    		
    		if (map.rni)
    			R.name = map.rni[parseInt(R.name)];
    		
    		if (map.ti && map.ti.length)
    			R.terrain = map.ti[parseInt(R.terrain)];
    		
    		delete R.inside;
    		delete R.deadend;
    		delete R.entrance;
    		delete R.exit;
    	}
    	delete map.rni;
    }

    j.ajax({
    	url: o.loadURL,
    	async: true,
    	cache: true,
    	dataType: "json",
    	success: function(d) {
			try {
				
				if (d[0] == '"')
					map = eval('('+d+')');
				else
					map = d;
				
				unpack();
				
				for (var i = 0; i < map.areas.length; i++)
				   	areas[map.areas[i].name] = map.areas[i];
			   
				log(areas);
				var n = 0;
				
				for (var i in map.rooms) {
					
					var r = map.rooms[i]; 
					r.x = parseInt(r.x);
					r.y = parseInt(r.y);
					r.z = parseInt(r.z);
				   
					if (map.rooms[i].x > o.width)
						o.width = map.rooms[i].x + 100;
				   
					if (map.rooms[i].y > o.height)
						o.height = map.rooms[i].y + 100;

				   n++;
				}
			   
				j.extend(true, rooms, map.rooms);
				log('Mapper.load completed: ' + n + ' rooms loaded from file.');
				
				init();
				ready = 1;
				if (at)
					go(at);
				
			}
			catch (ex) {
				log(ex);
			}
		},
		error: function(e) {
			log( "Mapper: error loading world file: " + stringify(e));
		}
    });

	var save = function() {
		j(id + ' .icon-save').replaceWith('<i class="icon icon-spinner spinner"></i>');
		map.rooms = j.extend(true, {}, rooms);
		pack();
		j.post(o.saveURL, { data: map }, function(d) {
			j(id + ' .icon-spinner').replaceWith('<i class="icon icon-save save" title="Save the latest map data."></i>');
		});
	};
	
	var editing = function() {
	    return (j(id + ' .icon-edit').hasClass("on"))
	};
	
	var seeall = function() {

		if (o.seeall)
			return 1;
			
		if (!editing())
			return 0;
			
	    return (j(id + ' .reveal').hasClass("on"))
	};
	
	var settings = function() {
	 
	};
	
	var escape = function(d) {
		if (!exists(d))
			return 'unknown';
		return (d.replace(/[ ,;'"\/\\\(\)&]/g, ''));
	};
	
	var flatExits = function(r) {
		return d3.entries(r.exits).filter(function(d) {
			return (d.key != 'd' && d.key != 'u')
		}).length;
	};
	
	var noexit = function(r) {
		return (!r.exits || j.isEmptyObject(r.exits))
	};
	
	var exitType = function(d) {
		
		if (rooms[d.to.num].exits && rooms[d.to.num].exits[rev[d.e]] != d.from.num)
			return 'jump';
		
		if (d.e.has('n') && d.to.y >= d.from.y)
			return 'jump';
		
		if (d.e.has('s') && d.to.y <= d.from.y)
			return 'jump';
		
		if (d.e.has('w') && d.to.x >= d.from.x)
			return 'jump';
		
		if (d.e.has('e') && d.to.x <= d.from.x)
			return 'jump';
		
		if (d.from.num == d.to.num)
			return 'jump';
		
		return 'normal';
	};
	
 	var init = function() {

		log('Mapper.init');
		
		if (svg) {
			svg.selectAll(".room, .line, .tag").remove();
			svg.remove();
		}
		
		var width = o.width * o.scale;
		var height = o.height * o.scale;
		
		svg = d3.select(o.container)
			.append("svg:svg")
			.attr("width", width)
			.attr("height", height)
			.attr("transform", "scale("+o.scale+")")
            //.attr("preserveAspectRatio", "xMidYMid meet")
            .attr("id", "map");
/*
		viewport = svg.append("g").attr("id", "viewport")
        .attr("transform", "scale(4.0)")
     	.attr("transform", "translate([0, 0]) scale(1.0)");

		
		drag = d3.behavior.drag()
	    .on("drag", function(d) {
	    	d.x += d3.event.dx;
	    	d.y += d3.event.dy;
 		});*/
		
		svg.append("svg:defs").selectAll("marker")
		.data(["OneWayArrow"])
		.enter()
		.append("svg:marker")
		.attr("id", String)
		.attr("class", "arrow")
		.attr("viewBox", "0 0 8 8")
		.attr("refX", 6)
		.attr("refY", 3)
		.attr("markerWidth", 8)
		.attr("markerHeight", 8)
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M0,3v-3l6,3l-6,3z");
		
		/*
		var background = svg.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
		.on("mouseup", function(d) {
		});
		 */
		
		var c = svg.append("svg:g").attr("id", "container");
		
		c_map = c.append("svg:g").attr("class", "map");
		
		c_lines = c_map.append("svg:g").attr("id", "lines");
		c_rooms = c_map.append("svg:g").attr("id", "rooms");
		c_tags = c_map.append("svg:g").attr("id", "tags");

		if ('WebkitAppearance' in document.documentElement.style) /* fix for Safari & Chrome (WebKit) scaling */
			c_map.attr("transform", "scale("+o.scale+")");
		
		//myGlow = glow("myGlow").rgb("#aaa").stdDeviation(1);
		
		j(o.container)
		.addClass('nice')
		.scroll(function() {
		    clearTimeout(j.data(this, 'scrollTimer'));
		    j.data(this, 'scrollTimer', setTimeout(function() {
		    	log('Mapper: stopped scrolling');
		    	updateVisible();
		    }, 200));
		});
		
	    nice = j(o.container).niceScroll({ 
			cursorborder: 'none',
			//boxzoom: 1,
			touchbehavior: 1,
			cursorwidth: 0
		});
	
		W = j(o.container).width(), H = j(o.container).height();
		
		if (o.onLoad)
			o.onLoad();
		
		if (at)
			go(at);
	};
	
 	var genRooms = function() {
 		
 		log('mapper.genRooms: '+stringify(at));
 		//areas[at.zone]
 		
 		var T = j(o.container).scrollTop(),
 		L = j(o.container).scrollLeft(),
 		n = 0,
 		loc = [],
 		dungeon = areas[at.zone]?(areas[at.zone].dungeon):0,
 		edit = editing(),
 		see = seeall(),
 		noex = noexit(at);
 		
 		R = d3.values(rooms).filter(function(r) {
 			
 			if (dungeon && r.zone != at.zone && r.trans != 1)
 				return 0;
 			
 			//if (noex && r.num != at.num)
 				//return 0;
 			
			if (!see && r.z != at.z) {
				//don't render rooms 2 vertical levels apart
				if (Math.abs(r.z-at.z) > 1)
					return 0;
				//don't render lower rooms
				/* if (r.trans != 1 && at.z > r.z)
					return 0; */
			}

			if (!r.x)
				return 0;
			
 			var x = (r.x * o.scale), y = (r.y * o.scale);
 						
 			if (!(y >= T && y <= T + H && x >= L && x <= L + W))
 				return 0;
 			
 			if (areas[r.zone]) {
	 			if (!see && r.zone != at.zone && ((W < 1000 && n > 600) || noexit(r) || (r.trans != 1 && areas[r.zone].dungeon)) ) {
	 				//log('Mapper.genRooms: hidden dungeon room ' + stringify(r));
	 				return 0;
	 			}
	 			
	 			if (W > 1200 && see && r.zone != at.zone && ((areas[r.zone].dungeon && r.trans != 1) ))
	 				return 0;
	 			
	 			if (W > 1200 && see && r.z < at.z)
	 				return 0;
	 			//if (see && r.trans && W > 1000)
	 				//return 0;
 			}
 			
 			if (n > 600)
 				return 0;
 			
 			if (!edit && loc.has(x + 'x' + y))
 				return 0;
 			
 			loc.push(x + 'x' + y);
 			
 			n++;
 			
 			return 1;
 		});
 		if (Config.debug)
 			log("Mapper.genRooms: " + R.length);
 	};
 	
	var genExits = function() {

		R = R||d3.values(rooms), exits = [], tags = [], zonetags = [];
		
		for (var r = 0; r < R.length; r++) {

			if (!R[r].exits)
				continue;
		
			var E = R[r].exits;
	    	
    		for (var e in E) {
    			
    			if (!rooms[E[e]])
    				continue;
    			
    			var d = {
        			from: R[r],
        			to: rooms[E[e]],
        			z:	R[r].z,
        			e: e
    	    	};
    			
    			d.type = exitType(d);
    				
    			if (d.type == 'jump' 
    				&& d.from.zone != d.to.zone
    				&& at.num != d.from.num)
    			continue;
    			
    			try {
	    			//log(R[r].zone);
	    			if (R[r].zone != rooms[E[e]].zone && areas[R[r].zone].notag != 1 && j.inArray(R[r].zone, zonetags) == -1) {
	        			tags.push({ to: R[r], e: e});
	        			zonetags.push(R[r].zone);
	        		}
    			}
    			catch(ex) { log(ex) }
    			
    			exits.push(d);
    			//log('added exit:\n'+ stringify(d));
    		}
		}
	};
	
	var drawExit = function(d) {
		
		if (d.type == 'jump') {
    		
    		var ghost = {
    			x: d.from.x + (xOffset[d.e] * 0.8),
    			y: d.from.y + (yOffset[d.e] * 0.8)
    		}
    		
    	    var dx = d.to.x - ghost.x,
    	    dy = d.to.y - ghost.y,
    	    dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
    		
    		var flip = d.flip?0:1; /* invert the curve */
    		
    		if (d.e == 'e' && d.to.x < d.from.x && d.to.y < d.from.y) {
    			flip = 0;
    		}
    		if (d.e == 's' && d.to.x < d.from.x && d.to.y > d.from.y) {
    			flip = 0;
    		}
    		
    	    return "M" + d.from.x + "," + d.from.y + "L" + ghost.x + "," + ghost.y + "M" + ghost.x + "," + ghost.y + "A" + dr + "," + dr + " 0 0," + flip +" " + d.to.x + "," + d.to.y;
    	
    	}
    	else if (W > 1000 && Math.abs(d.from.x - d.to.x) > 600 || Math.abs(d.from.y - d.to.y) > 600)
    		return null;
    	else
    		return d3.svg.line().interpolate("linear")([[d.from.x, d.from.y], [d.to.x, d.to.y]])
	};
	
	var render = function(cb) {

 		if (!ready || !at) {
 			setTimeout(render, 1000);
 			log('Delaying render until map is loaded.');
 			return;
 		}
 		
        log('Mapper.render @' + at.num);

		W = j(o.container).width(), H = j(o.container).height();
		
		log('W ' + W + ' H ' + H);
		
        var see = seeall();
        
        selection = [];
        
        genRooms();
		genExits();
		
		if (!o.notip) {
			j(o.container + ' .room').each(function() { 
				try {
					j(this).tooltip('destroy');
				} catch(ex) {}
			});
			j('.ui-tooltip').remove();
		}
		
		svg.selectAll(".room, .line, .tag").remove();
        
        lns = c_lines.selectAll(".line")
            .data(exits, function(d) { return "line_" + (d.from.num + '-' + d.to.num); })
            .enter()
            .append("svg:path")
            .attr("id", function(d) { return "line_" + (d.from.num + '-' + d.to.num); })
            .attr("class", function(d) { 
	            
            	var c = "line room_"+d.from.num+" room_"+d.to.num+" a_" + escape(d.to.zone||d.from.zone);
	            c += " z-"+d.z;
	            
	            if (see && d.from.zone != at.zone)
	            	c += " seeall";
	            
	            return c;
	        })
	        .attr("marker-end", function(d) {
	        	if (d.type == 'jump')
	        		return "url(#OneWayArrow)";
	        	return null;
	        })
	        .attr("fill", function(d) {
	        	
	        	return null;
	        	
	        	if (at.num == d.from.num)
	        		return 'White';
	        	
	        	if (at.num == d.to.num && d.type != 'jump')
	        		return 'White';
	        	
	        	if (d.from.z != d.to.z)
	        		return 'Crimson';
	        	
	        	if (areas[d.to.zone||d.from.zone])
	        		return areas[d.to.zone||d.from.zone].color;
	        	
	        	return 'none';
	        })
	        .style("stroke", function(d) {

	        	//if (d.to.num == at.num)
	        		//log(areas[d.to.zone||d.from.zone].color);
	        	
	        	if (at.num == d.from.num)
	        		return 'White';
	        	
	        	if (at.num == d.to.num && d.type != 'jump')
	        		return 'White';
	        	
	        	if (d.from.z != d.to.z)
	        		return 'Crimson';
	        	
	        	if (areas[d.to.zone||d.from.zone])
	        		return areas[d.to.zone||d.from.zone].color;
	        	
	        	return null;
	        })
	        .style("stroke-dasharray", function(d) { 
	        	if (d.type == 'jump') 
	        		return ("5, 4") 
	        })
            .attr("d", drawExit);
		
		//log('Mapper.render after links');
		
		rms = c_rooms.selectAll(".room")
          	.data(R, function(d) { return d.num })
          	.enter()
            .append('svg:circle')
          	.attr("cx", function(d) { return d.x; })
          	.attr("cy", function(d) { return d.y; })
          	.attr("id", function(d) { return "room_"+d.num })
            .attr("title", function(d) { return (o.nums || editing())?d.num + ': ' + d.name:d.name })
            .attr("class", function(d) { 
            	
            	var pos, c = "room room_"+d.num+" a_" + escape(d.zone) + (d.num == at.num?' active':'');
            	c += " z-"+d.z;
            	if (see && !c.has('active'))
	            	c += " seeall";
            	return c;
            	
            })
            .style("stroke", function(d) {
            	if (areas[d.zone])
            		return areas[d.zone].color;
	        })
	        .style("fill", function(d) {
	        	if (areas[d.zone])
	        		return areas[d.zone].color;
	        })
            .on("mousedown", function(d) {
            	
            	if (!editing()) {
            		
            		d3.event.stopPropagation();
            		
            		if (at.num != d.num) {
            			var p;
        				if ((p = path(d))) {
        					p.shift();
        					//mskipframes = p.length - 1;
        					for (var i = 0; i < p.length; i++) {
        						p[i] = p[i][0];
        						Config.socket.write(p[i]);
        					}
            			}
            		}
            		
            		return;
            	}
            	
            	var me = svg.select('#room_'+d.num);
            	
            	if (d3.event.ctrlKey) {
            		
            		var zone = svg.selectAll('.a_'+escape(d.zone));
            		
	            	if (me.attr("selected")) {
	            		zone.style("stroke", areas[d.zone].color)
	            		.style("stroke-width", 1)
	            		.attr("selected", function(d) {
	            			if (!d.e)
	            				selection.remove(d.num);
	            			return null;
	            		});
	            	}
	            	else {
	            		zone.style("stroke", "Crimson")
	            		.style("stroke-width", 2)
	            		.attr("selected", function(d) {
	            			if (!d.e)
	            				selection.push(d.num);
	            			return 1;
	            		});
	            	}
	            	
            	}
            	else {
            		
            		var scope = svg.selectAll('.room_'+d.num);
            			
	            	if (me.attr("selected")) {
	            		scope.style("stroke", areas[d.zone].color).style("stroke-width", 1).attr("selected", null);
	            		selection.remove(d.num);
	            	}
	            	else {
	            		scope.style("stroke", "Crimson").style("stroke-width", 2).attr("selected", "1");
	            		selection.push(d.num);
	            	}
            	}
            	
            	j('#mapper .context .selection').remove();
            	
            	j('#mapper .context').append('<span class="selection">'+selection.length+' rooms selected</span>');
            	
            	if (selection.length != 1)
            		j('#mapper .context .trans').hide();
            	else
            	if (rooms[selection[0]].trans)
            		j('#mapper .context .trans').show();
            	
            	d3.event.stopPropagation();
            })
            .on("mouseover", function(d) {
            	if (o.notip)
            		return;
            	j(d3.event.target).tooltip({ 
			      	container: '.mapper .content',
			      	position: { my: 'center bottom', at: 'center+10 top' }
				}).tooltip('open');
				svg.select('#room_'+d.num).attr("r", 6);
            })
            .on("mouseout", function(d) {
            	if (!o.notip) {
            		try {
            			j(d3.event.target).tooltip('destroy');
            		} catch(ex) {}
            	}
        		svg.select('#room_'+d.num).attr("r", 4);
            })/*
            .call(drag)
            .call(myGlow)*/;
		
		//log('Mapper.render after rooms');
		
        tgs = c_tags.selectAll(".tag")
            .data(tags, function(d) { return "tag_" + d.to.num })
            .enter()
            .append("svg:text")
            .text(function(d) {
            	return d.to.zone;
            })
            .style("fill", function(d) {
            	if (areas[d.to.zone])
            	return areas[d.to.zone].color 
            })
            .attr("x", function(d) { 
            	var x = d.to.x - (d.to.zone.length * 1.8);
            	return x;
            })
	        .attr("y", function(d) {
	        	var y = d.to.y;
	        	y -= yOffset[d.e];
	        	return y - 20; 
	        })
	        .attr("id", function(d) { return "tag_" + d.to.num })
            .attr("class", function(d) {
            	var c = "tag room_" + d.to.num + " a_" + escape(d.to.zone);
            	c += " z-"+d.to.z;
            	return c;
            })/*
            .style("filter", "url(#drop-shadow)")*/;
        
       	svg.selectAll(".room").classed("in", 0).attr("r", 4);
	 	
	 	svg.selectAll(".room, .line").classed("active", 1)/*.classed("hidden", 0)*/;

	 	svg.selectAll(".tag").classed("active", 0);
	 	svg.selectAll(".tag:not(.a_"+escape(at.zone)+")").classed("active", 1);
	 	svg.selectAll(".tag:not(.z-" + at.z +")").classed("active", 0);
	 	
	 	if (!seeall()) {
		 	svg.selectAll(".room:not(.a_"+escape(at.zone)+")").classed("active", 0);
		 	svg.selectAll(".line:not(.a_"+escape(at.zone)+")").classed("active", 0);
		 	svg.selectAll(".room:not(.z-" + at.z +")").classed("active", 0);
		 	svg.selectAll(".line:not(.z-" + at.z +")").classed("active", 0);
	 	}
	 	else {
	 		svg.selectAll(".tag").classed("active", 1);
	 	}
	 	
	 	svg.selectAll(".room_" + at.num).style("active", 1).classed("in", 1).attr("r", 6);
	 	
	 	j('#mapper .context .trans').hide();
        j('#mapper .context .selection').remove();
        
        if (cb) {
        	if (Config.debug)
        		log('Mapper.render callback');
        	cb();
        }
	};

	var updateVisible = function(cb) {
		
		if (Config.debug)
			log("Mapper.updateVisible");
		
		if (!o.notip)
			try {
				j(o.container + " .room").tooltip('destroy');
			} catch (ex) {}
		
    	
        render(cb);
	};
	
	var moveRoom = function(r) {
		
		log("Mapper.moveRoom: " + stringify(r));
		
		svg.select("#room_"+r.num)
	   .transition()
	   .duration(500)
	   .attr('cx', r.x)
	   .attr('cy', r.y);
	
		genExits(R);
		
		svg.selectAll(".line.room_"+r.num)
		.transition()
		.duration(500)
		.attr("d", drawExit);
	};

	var upload = function(o) {
		
		log('Mapper.upload data');
		var data, n = 0;
		
		try {
			data = eval('(' + o.data + ')');
			if (!data.rooms)
				return "Data is missing a 'rooms' array.";
			if (!data.rooms.length)
				return "The 'rooms' object is not an array or is empty.";
			if (typeof data.rooms[0].num == 'undefined')
				return "The 'rooms' array is missing the required 'num' field.";
			if (o.test)
				return "Input data passed all preliminary checks.";
		}
		catch(ex) {
			return ex;
		}
		
		j(id + ' .context #upload').html('<div class="box-note"></div>');
		var status = j(id + ' .context #upload .box-note');
		
		status.append('Parsed '+ data.rooms.length + ' rooms total.<br>').scrollTop(status[0].scrollHeight);
		
		for (var r = data.rooms.length - 1; r >= 0; r--) {
			
			var R = data.rooms[r];
			
			if (!R.num) {
				data.rooms.splice(r, 1);
				continue;
			}
			
			if (rooms[R.num]) {
				if (o.skip && R.num != data.start) {
					//status.append('Skipping #'+ R.num + '<br>').scrollTop(status[0].scrollHeight);
					data.rooms.splice(r, 1);
					continue;
				}
				else
				if (o.overwrite) {
					delete rooms[R.num];
					continue;
				}
			}
			
			n++;
		}
		
		var t = "Successfully prepped " + n + "/" + data.rooms.length + " rooms.<br>";

		log("Mapper.upload: " + t);
		
		status.css({ height: 240 }).niceScroll({ 
			cursorborder: 'none',
			touchbehavior: 1,
			cursorwidth: 2
		});
		
		status.append(t).scrollTop(status[0].scrollHeight);
		
		if (data.rooms[0].x) {
			
			j(id + ' .context #upload .box-note').html(t);
			
			status.append("Suspended positioning (room coorinates detected).<br>Updating rooms... ")
			.scrollTop(status[0].scrollHeight);
			
			for (var r = 0; r < data.rooms.length; r++) {
				n += update(data.rooms[r], 1);
			}
			
			status.append("Rooms updated: " + n + "/" + data.rooms.length)
			.scrollTop(status[0].scrollHeight);
			
			return;
		}
		
		status.append('Positioning..<br>');
		var n = 0, pass = 0, passes = 0, done = 0, result = 0;
		
		if (data.start) {
			var i = data.rooms.index('num', data.start);
			if (i > -1) {
				result = update(data.rooms[i], 1);
				if (result) {
					status.append('Added start room #' + data.start + ' to map.<br>')
					.scrollTop(status[0].scrollHeight);
					data.rooms.splice(i, 1);
					n++;
				}
				else {
					status.append('Start room #' + data.start + ' could not be placed in relation to an existing room. Aborting.<br>')
					.scrollTop(status[0].scrollHeight);
					return;
				}
			}
			else {
				status.append('Start room #' + data.start + ' not found in room array - aborting.<br>')
				.scrollTop(status[0].scrollHeight);
				return;
			}
		}
		
		while (!done) {
			pass = n;
			for (var r = 0; r < data.rooms.length; r++) {
				result = update(data.rooms[r], 1);
				if (result) {
					data.rooms.splice(r, 1);
					r--;
					n++;
					if (Config.debug)
						alert('pause');
				}
			}
			status.append("Pass #" + (++passes) + " | Rooms placed: " + n + " Remaining:" + data.rooms.length + '<br>')
			.scrollTop(status[0].scrollHeight);
			done = (pass == n || !data.rooms.length);
		}
		
	};

	var zoom = function(d) {
		
		log("Mapper.zoom: "+d);
		
		if (d == 'in')
			o.scale += 0.2;
		else
			o.scale -= 0.2;
		
		if (o.scale > 6)
			o.scale = 6;
		
		if (o.scale < 0.4)
			o.scale = 0.4;
		
		init();
	};
	
	var stretch = function(r) {
		
		log("Mapper.stretch: canvas size check "+stringify(r));
		
		var shiftX = 0, shiftY = 0, stretched = 0;
		
		if (r.x < 100) {
			shiftX += 200;
			o.width += 200;
			stretched = 1;
		}
		else
			if (r.x > (o.width - 100)) {
				o.width = r.x + 200;
				stretched = 1;
			}
			
		if (r.y < 100) {
			shiftY += 200;
			o.height += 200;
			stretched = 1;
		}
		else
			if (r.y > (o.height - 100)) {
				o.height = r.y + 200;
				stretched = 1;
			}
		
		if (shiftX || shiftY) {
			for (var i in rooms) {
				if (rooms[i].x)
					rooms[i].x += shiftX;
				if (rooms[i].y)
					rooms[i].y += shiftY;
			}
		}
		
		if (stretched) {
			init();
			go(at);
			log("Mapper.stretch: canvas stretch based on "+stringify(r));
		}
	};
	
	var zoneCheck = function(r) {
		
		var A;
		r.zone = r.zone.split(' /')[0];
		//r.zone = r.zone.split(' I')[0];
		
		if ((A = map.areas.index('name', r.zone)) == -1) {   
			log('New area first seen.');
		   
			var a = {
				name: r.zone,
				color: getZoneColor()
			};
		   
			map.areas.push(a);
			areas[r.zone] = a;
			//log(a);
		}
		//log(areas);
	};
	
	var update = function(r, auto) {
	   
		if (!auto || Config.debug)
			log("Mapper.update: " + stringify(r));

		var to, i, type, inside = (r.terrain && r.terrain.toLowerCase().has('inside'))?1:0;
		//r.road = (r.terrain && r.terrain.toLowerCase().has('road'))?1:0;
		
		/*
		if (r.name.toLowerCase().has('road') 
				|| r.name.toLowerCase().has('river')
				|| r.name.toLowerCase().has('ocean')
				|| r.name.toLowerCase().has(' way'))
			r.road = 1;
		*/
		
		if (j.isEmptyObject(rooms)) {
			log('Mapper.udate: First ever room.');
			r.x = o.width / 2;
			r.y = o.height / 2;
			r.z = 0;
			rooms[r.num] = r;
			if (auto)
				return 1;
		}
	   
		zoneCheck(r);
		
		if (rooms[r.num]) {
		   
			if (!auto)
				log('Mapper.update: merge');
		   
		   delete rooms[r.num].exits;
		   r = j.extend(true, rooms[r.num], r);
		   
		   if (!auto)
			   log(stringify(r));
		   
		   svg.selectAll("#room_"+r.num).attr('title', (o.nums || editing())?r.num + ': ' + r.name:r.name);
			
		   if (r.zone)
			   j(".room_"+r.num).removeClass('a_undefined').addClass('a_'+escape(r.zone));
		}
		   
		if (!r.x || !r.y)
			delete r.via;
		else
			stretch(r);

		if (noexit(r) && !r.x) {
			
			log('Mapper.update: no-exit room');
			
			if (prev && prev.x) {
	    	   r.x = prev.x + (xOffset.e / 2);
	    	   r.y = prev.y + (yOffset.e / 2);
	    	   r.z = prev.z;
			}
			
			rooms[r.num] = r;
           
			if (!auto)
				moveRoom(r);
			else {
				log(stringify(r));
				return 1;
			}
			
		}
		else
		for (var e in r.exits) {
		   
		   var E = r.exits[e];
		   //log(E);
		   
	       if (E == r.num) {
	       		continue;
	       }
	       else if (!(to = rooms[E])) {
	    	   if (r.x) {
		    	   rooms[E] = {
			    		name: 'Unexplored',
			    		num: E,
			    		zone: r.zone,
			    		x: r.x + xOffset[e],
			       		y: r.y + yOffset[e],
			       		z: (function() {
			       			if (e == 'd')
			       				return r.z - 1;
			       			else
			       			if (e == 'u')
			       				return r.z + 1;
			       			else
			       				return r.z;
			       		})()
			       };
		    	   
		    	   if (rooms[E].x < 0 || rooms[E].x > o.width
		    			 || rooms[E].y < 0 || rooms[E].y > o.height)
		    		   			stretch(rooms[E]);
		    	   if (!auto)
		    		   log("New unexplored: "+stringify(rooms[E]));
		    	   continue;
	    	   }
	       } 
	       else
	       if (!to.x && r.x) { /* catch added but unplaced rooms */
	    	   
	    	   to.x = r.x + xOffset[e];
	    	   to.y = r.y + yOffset[e];
	    	   to.z = (function() {
	       			if (e == 'd')
	       				return r.z - 1;
	       			else
	       			if (e == 'u')
	       				return r.z + 1;
	       			else
	       				return r.z;
	       		})();
	    	   if (!auto)
	    		   log("New neighbor prelim. co-ordinates: "+stringify(to));
	       }
	       
    	   //if (!to.exits)
    		 //  continue;
    	   
	       //if (to.exits[rev[e]] != r.num)
	    	   //continue;
	       
	       /* two-way exit. try better placement */
	       //if (!r.conf && to.exits && to.exits[rev[e]] == r.num)
	    	   //delete r.via;
	       
	       /*
	       if (e == 'u' || e == 'd') {
	    	   continue;
	       }*/
	       
	       if (!to || !to.x)
	    	   continue;
	       
	       if (auto && r.x) /* uploading rooms w/ coordinates */
	    	   return 1;
	       
    	   if (typeof r.via != 'undefined')
    		   continue;
	       
	       log('Placement via:\n'+stringify(to));
	       
           r.via = to.num;
           
           x_off = xOffset[e];
           y_off = yOffset[e];
        	   
  			if (e == 'd')
   				r.z = to.z + 1;
   			else
   			if (e == 'u')
   				r.z = to.z - 1;
   			else {//UA-22695570-35
   				
   				r.z = to.z;
  				
   				if (inside) {
	        	   	x_off = Math.floor(x_off * 0.5);
	       	   	 	y_off = Math.floor(y_off * 0.5);
   				}
	           
   				if (flatExits(r) == 1) {
	               	x_off = Math.floor(xOffset[e] * 0.38);
	               	y_off = Math.floor(yOffset[e] * 0.38);
   				}
   				
   				if (r.road) {
	        	   	x_off = Math.floor(x_off * 2.0);
	       	   	 	y_off = Math.floor(y_off * 2.0);
   				}
   				
  			}
         
  			/*
            for (rr = 0; rr < R.length; rr++) {
         	   if (R[rr].x == to.x - x_off && R[rr].y == to.y - y_off && R[rr].z == r.z) {
         		   r.ovl = 1;
         	   }
            }
  			
            if (r.x)
	  			if (r.x != to.x - x_off || r.y != to.y - y_off) {
	                log('Conflicting relative positions for '+stringify(r));
	                r.odd = 1;
	  			}
            */
  			
  			r.x = to.x - x_off;
  			r.y = to.y - y_off;
           
  			if (to.zone != r.zone)
           	   r.trans = 1;
           
  			/*
          	if (to.inside() && !r.inside())
          		r.exit = 1;
          	else
          		if (!to.inside && r.inside)
        		   r.entrance = 1;
			*/
  			
          	//if (to.exits && to.exits[rev[e]] == r.num)
          		//r.conf = 1;
          	 
           rooms[r.num] = r;
           
           if (!auto) {
        	   moveRoom(r);
           }
           else {
        	   log(stringify(r));
        	   return 1;
           }
        	   
	   }
	   
	   //log(rooms);
	   if (!auto)
		   go(r);
	   else
		   return 0;
	};
	
	var path = function(to) {
		
		log('Mapper.path to: '+stringify(to));
		
		var limit = 0;
		var i, n, e, p = [], q = [], h = [];
		
		q.push([ ['@', at.num] ]);
		
		while (q.length) {
			
			//if (++limit < 10)
				//log(stringify(q));
			
			if (++limit > 500) {
				log('Mapper.path hit limit (500 iterations).');
				return null;
			}
			
			p = q.shift(),
			n = p[p.length - 1];
			
			if (rooms[n[1]] && rooms[n[1]].exits) {
				
				var Ex = rooms[n[1]].exits;
					
				for (var e in Ex) {
					
					if (h.has(Ex[e]))
						continue;
					
						var a = j.extend(true, [], p);
						a.push([e, Ex[e]]);
							if (Ex[e] == to.num)
								return a;
						q.push(a);
						h.push(Ex[e]);
				}
			}
			
			//if (Config.debug)
				//alert(stringify(q));
		}
		
		return null;
	};
	
	var go = function(r) {
	    
		log('Mapper.go: '+stringify(r));

		if (!r)
			return;
		
		if (!r.x && rooms[r.num])
			r = at = rooms[r.num];
		
		if (r.x) {
			var x = (r.x * o.scale) - (j(o.container).width() / 2);
			var y = (r.y * o.scale) - (j(o.container).height() / 2);
			log('Mapper.go: scroll to: x'+x + ' y'+y );
			j(o.container).scrollLeft(x).scrollTop(y);
			log('Mapper.go: scrolled to: x'+j(o.container).scrollLeft() + ' y'+j(o.container).scrollTop() );
			/* if near map edge, render anyway */
			if (y + H > (o.height - H) || x + W > (o.width - W))
				render();
		}
		
		if (win)
			win.title(r.name);
			//win.title(r.num + ': ' + r.name + ' - ' + r.zone);
	};
	
	var process = function(d) {

		if (!d.start || !d.start('room.info'))
		    return d;

		log('JujuMapper.process');
		
		try {
			var data = d.match(/^[^ ]+ (.*)/)[1];
			log(data);
			var r = eval('('+data+')');
		} catch(err) {
			log('Mapper gmcp parse error: '+err);
			return;
		};
		
		log('Mapper.gmcp: '+stringify(r));

		if (at) {
			if (at.num == r.num)
				return d;
			prev = at;
		}
		
		//if (r.zone && map.areas)
			//zoneCheck(r);
		
		if (rooms[r.num])
		   at = rooms[r.num];
	   	else
		   at = r;
		
		if (ready) {
			if (editing())
	            update(r);
			else
				go(at);
		}
		
		return d; 
	};

	var context = function() {
		if (!j('.mapper .context').length) {
			j('.mapper').prepend("<div class='context context-top'><ul></ul></div>");
			j('.mapper .context-top ul').append('<li class="kbutton tip dir" title="Nudge selected left (west)." data="w"><i class="icon-angle-left"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip dir" title="Nudge selected up (north)." data="n"><i class="icon-angle-up"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip dir" title="Nudge selected down (south)." data="s"><i class="icon-angle-down"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip dir" title="Nudge selected right (east)." data="e"><i class="icon-angle-right"></i></li>');
			//j('.mapper .context-top ul').append('<li class="kbutton tip trans" style="display: none" title="Move room to adjacent area."><i class="icon-external-link"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip road" title="Flag selection as road (always shown)."><i class="icon-road"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip dungeon" title="Flag area as dungeon (not shown unless inside)."><i class="icon-th"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip reveal" title="Reveal all rooms in map window."><i class="icon-eye-open"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip forget" title="Forget (remove) selected."><i class="icon-remove"></i></li>');
			//j('.mapper .context-top ul').append('<li class="kbutton tip download" title="Download room data."><i class="icon-download-alt"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip upload" title="Upload room data."><i class="icon-upload-alt"></i></li>');
			j('.mapper .context-top ul').append('<li class="kbutton tip save" title="Save latest map data."><i class="icon-save"></i></li>');
			//j('.mapper .context-top ul').append('<li class="kbutton tip relay" title="Re-layout selected."><i class="icon-refresh"></i></li>');
		}
		else {
			j('.mapper .context').remove();
			j('.mapper .context .trans').hide();
		 	selection = [];
		}
	};
	
	j(document).on('click', id + ' .context .reveal', function(evt) {
		j(this).toggleClass('on');
		render();
	});
	
	j(document).on('click', id + ' .context .trans', function(evt) {
		var S = rooms[selection[0]],
		conv = 0;
		for (var e in S.exits) {
			
			if (!conv && rooms[S.exits[e]].zone != S.zone) {
				S.zone = rooms[S.exits[e]].zone;
				delete rooms[S.exits[e]].trans;
				conv = 1;
			}
			
			if (conv && rooms[S.exits[e]].zone != S.zone)
				rooms[S.exits[e]].trans = 1;
			else
			if (!conv && rooms[S.exits[e]].zone == S.zone)
				rooms[S.exits[e]].trans = 1;
		}
		render();
	});
	
	j(document).on('click', id + ' .context .upload', function(evt) {
		j(this).toggleClass('on');
		if (!j('.mapper .context #upload').length) {
			j('.mapper .context').append("<div id='upload'>Existing rooms:  <i class='icon-check checkbox' data='skip'></i> skip <i class='icon-unchecked checkbox' data='merge'></i> merge <i class='icon-unchecked checkbox' data='overwrite'></i> overwrite</div>");
			j('.mapper .context #upload').append("<textarea style='width: 90%; height: 300px' placeholder='Paste JSON: " +
					"{ start: #of_start_room, rooms: [ { num: room1#, name: \"Room 1 Name\", zone: \"Zone Name\", terrain: \"Inside\", exits: { n: room2# } }, " +
					"{ num: room2#, name: \"Room 2 Name\", zone: \"Zone Name\", exits: { s: room1# } } ]. " +
					"The start room is the point from which relative placement will begin, so it should be a room that already has x,y,z coordinates. " +
					"If you are adding only rooms with pre-calculated x,y,z coordinates, there is no need to supply a start room.'>");
			j('.mapper .context #upload').append("<div style='clear:both; height: 16px'></div><a class='kbutton btest'> test </a> <a class='kbutton bupload'>upload</a>");
		}
		else {
			j('.mapper .context #upload .box-note').getNiceScroll().remove();
			j('.mapper .context #upload').remove();
		}
	});
	
	j(document).on('click', id + ' .context .dir', function() {
		
		var dir = j(this).attr("data");
		var x_off = xOffset[dir] / 4, y_off = yOffset[dir] / 4;
		
		for (var s = 0; s < selection.length; s++) {
			var S = rooms[selection[s]];
			S.x += x_off;
			S.y += y_off;
			moveRoom(S);
		}
		
	});
	
	j(document).on('click', id + ' .context .forget', function() {
		for (var s = 0; s < selection.length; s++) {
			var S = rooms[selection[s]];
			svg.selectAll('.room_'+S.num).remove();
			delete rooms[S.num];
		}
		selection = [];
		render(function() { go(at) });
	});
	
	j(document).on('click', id + ' .context .checkbox', function() {
		j(id + ' .context .checkbox').removeClass('icon-check').addClass('icon-unchecked');
		j(this).removeClass('icon-unchecked').addClass('icon-check');
	});
	
	j(document).on('click', id + ' .context .road', function() {
		for (var s = 0; s < selection.length; s++) {
			var S = rooms[selection[s]];
			if (S.trans)
				delete S.trans;
			else
				S.trans = 1;
			svg.selectAll('.room_'+S.num).remove();
		}
		render(function() { go(at) });
	});
	
	j(document).on('click', id + ' .context .dungeon', function() {
		
		if (!selection.length)
			return;
		
		var S = rooms[selection[0]];
		
		if (!S.zone)
			return;
		
		var i = map.areas.index('name', S.zone);
			
		if (!areas[S.zone].dungeon) {
			areas[S.zone].dungeon = 1;
			map.areas[i].dungeon = 1;
		}
		else {
			delete areas[S.zone].dungeon;
			delete map.areas[i].dungeon;	
		}
		
		log(areas);
		render(function() { go(at) });
	});
	
	j(document).on('click', id + ' .context .btest', function() {
		
		var o = {
			data: j(id + ' .context #upload textarea').val()
		};
		
		var type = j(id + ' .context #upload .icon-check').attr('data');
		
		o[type] = 1;
		o.test = 1;
		
		j(id + ' .context #upload .box-note').remove();
		j(id + ' .context #upload').prepend('<div class="box-note">'+upload(o)+'</div>');
		
	});
	
	j(document).on('focus', id + ' .context #upload textarea', function() {
		j(id + ' .context #upload .box-note').remove();
	});
	
	j(document).on('click', id + ' .context .bupload', function() {
		
		var o = {
			data: j(id + ' .context #upload textarea').val()
		};
		
		var type = j(id + ' .context #upload .icon-check').attr('data');
		
		o[type] = 1;
		upload(o);
	});
	
	j(document).on('click', id + ' .save', function() {
		save();
	});
	
	if (!o.clean) {
		
	    var win = new Window({
	        id: id,
	        closeable: o.closeable || 0,
	        transparent: o.transparent || 0,
	        //max: 1,
	        css: o.css,
	        'class': 'mapper nofade',
	        title: 'Juju Mapper',
	        onResize: function() {
	        	!nice || nice.resize();
	        	go(at);
	        }
	    });
	    
	    if (!Config.kong)
		    win.button({
		    	icon: 'icon-edit',
		    	title: 'Start mapping / editing.',
		    	click: function() {
		    		j(id + ' .icon-edit').toggleClass('on');
		    		j(id + ' .toolbar .icon-save').toggle();
		    		context();
		    	}
		    });
	    
	    j(id + ' .toolbar .icon-save').addClass('save').toggle();
	    
	    win.button({
	    	icon: 'icon-zoom-out',
	    	title: 'Zoom out.',
	    	click: function(e) {
	    		zoom('out');
	    		return false;
	    	}
	    });
	    
	    win.button({
	    	icon: 'icon-zoom-in',
	    	title: 'Zoom in.',
	    	click: function(e) {
	    		zoom('in');
	    		return false;
	    	}
	    });
		
		j(id + ' .icon-stop').hide();
	}

	if (o.process)
		process = eval('('+o.process+')');
	
	if (o.listen)
		Event.listen(o.listen, process);
	else
		Event.listen('gmcp', process);
	
	if (!Config.Toolbar && !Config.kong)
		Event.listen('scrollview_ready', function(d, sv) {
		    sv.win.button({
		        icon: 'icon-location-arrow',
		        title: 'Toggle the mapper window.',
		        click: function() {
		        	if (j('#mapper').length) {
		        		Event.drop('gmcp', process);
		        		j('#mapper').remove();
		        	}
		        	else
		        		Config.JujuMapper = new JujuMapper();
		        	return false;
		        }
		    });
		});
	
	return {
		process: process,
		init: init,
		go: function() { go(at); }
	};
};
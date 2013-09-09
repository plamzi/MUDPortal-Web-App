var Config = {
	debug: param('debug'),
	host: param('host'),
	port: param('port'),
	Device: {
		touch: ('ontouchstart' in window || navigator.msMaxTouchPoints),
		lowres: (j(window).width() <= 640),
		width: j(window).width(),
		height: j(window).height()
	}
}
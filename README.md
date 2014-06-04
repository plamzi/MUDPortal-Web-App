MUDPortal-Web-App
=================

Web UI code for the MUD game client running on http://www.mudportal.com/play

Screenshots: 
http://www.mudportal.com/images/Promo1.png
http://www.mudportal.com/images/Promo2.png

Features include but are not limited to:

* Modern modular window-based web UI with draggable and resizable windows

* Plugin framework with event notification and a documented API: http://www.mudportal.com/forum/api-documentation 

* A proxy in node.js that enables the client to connect to any target game server and handles all protocol negotiations

* MCCP compression support (zlib)

* MXP protocol support built into the client

* GMCP / ATCP protocol support and example uses in multiple existing plugins

* 256-color support, including background colors

* Triggers / macros / command memory (w/ typeahead)

* Vector-based world mapper with flexible edit mode to allow for mapping any MUD world via exploration

* 18 custom plugins found under js/modules
MUDPortal-Web-App
=================

Web UI code for the MUD game client running on http://www.mudportal.com/play

Screenshots:
http://www.mudportal.com/images/Promo1.png
http://www.mudportal.com/images/Promo2.png
http://www.mudportal.com/images/PromoToolbar.png

Features include but are not limited to:

* A modern window-based web UI with draggable and resizable windows

* Modular framework with event notification and a documented API: http://www.mudportal.com/forum/api-documentation 

* A standalone Websocket proxy in node.js that enables a web client to connect to any target game server and handles all protocol negotiations

* MCCP compression support (zlib)

* MXP protocol support built into the client

* MSDP protocol support

* GMCP / ATCP protocol support and example uses in multiple existing plugins

* 256-color support, including background colors

* Unicode font support 

* Vector-based world mapper with flexible edit mode to allow for mapping any MUD world via exploration

* Triggers / macros / command memory with typeahead (saved to a back end that is not included in this project)

* 18 custom plugins found under js/modules, plus lots of working examples on www.mudportal.com
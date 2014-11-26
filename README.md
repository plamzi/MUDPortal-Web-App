MUDPortal Web App
=================

Source code for the websocket cloud app running at http://www.mudportal.com/play | http://www.cloudgamer.org/play

The web app can connect to any MUD / MUSH / MOO game server and supports all major data interchange and interactive text protocols.

The client pairs with the Havoc open source Multiplayer RPG Game Server at https://github.com/plamzi/Havoc


<b>Screenshots:</b>

http://www.mudportal.com/images/Demo1.png

http://www.mudportal.com/images/Demo2.png

http://www.mudportal.com/images/Demo3.png


<b>Features include:</b>

* A modern window-based web UI with draggable and resizable windows, window toolbar.

* Modular framework with event notification and a documented API: http://www.mudportal.com/forum/api-documentation 

* A standalone Websocket proxy in node.js that enables a web client to connect to any socket game server and handles all protocol negotiations for simplicity (also doubles as a chat server)

* MCCP compression support (zlib)

* MXP protocol support built into the client

* MSDP protocol support

* GMCP / ATCP protocol support (JSON) with sample uses in multiple existing plugins

* 256-color support, including background colors

* Unicode font support and UTF-8 negotiation

* Vector-based world mapper with flexible edit mode to allow for mapping any MUD world via exploration

* Triggers / macros / command memory with typeahead (at this time, user prefs are saved to a Joomla back end that is not included in this project)

* 20+ plugins found under js/modules, plus lots of working examples and customizations you can see in action on http://www.mudportal.com


<h1> Installation Notes</h1>

* Grab this repository:

```
git clone https://github.com/plamzi/MUDPortal-Web-App
```

* Copy all files to a web-accessible folder on your web server.

* Point a browser at the root of the folder to load the included index.html file.

* For details on customizing the client, explore the web app forums at http://www.mudportal.com/forum/ . Register for a free account to browse existing customizations.

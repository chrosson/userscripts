// ==UserScript==
// @name           Localdev
// @author         Chrosson
// @version        0.0.1
// @include        http*://www.thestudentroom.co.uk/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_getResourceText
// @grant          GM_xmlhttpRequest
// @require        https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js
// @require        https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js
// @resource    api    file:///home/.../Desktop/userscripts/TSRAPI.js
// @resource    tsr    file:///home/.../Desktop/userscripts/TSRStreamline.user.js
// ==/UserScript==

GM_info.scriptSource = GM_info.scriptSource + "\n" + GM_getResourceText('tsr');
eval(GM_getResourceText('api'));
eval(GM_getResourceText('tsr'));

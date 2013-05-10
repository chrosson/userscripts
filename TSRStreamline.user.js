// ==UserScript==
// @name           TSR Streamline
// @author         Chrosson
// @version        0.0.1
// @description    A streamlined TSR
// @include        http*://www.thestudentroom.co.uk/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_getResourceText
// @grant          GM_xmlhttpRequest
// @copyright      2013+, Chrosson
// @namespace      http://www.thestudentroom.co.uk/member.php?u=334116
// @require        https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js
// @require        https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js
// ==/UserScript==

// @downloadURL    https://userscripts.org/scripts/source/156618.user.js
// @updateURL      https://userscripts.org/scripts/source/156618.meta.js


/*
======================INLINE_RESOURCE_BEGIN======================

***********RESOURCE_START=tmpl1*************

<div id="streamline-view" ng-app="streamline" ng-cloak>

  <div>
    Search: <input ng-model="query">
  </div>

  <div ng-controller="PostListCtrl">
    <div>
      Search: <button ng-click="getThread()">Greet</button>
    </div>
    <ol>
      <li ng-repeat="post in posts | filter:query">
        {{post.post_author_name}}
        <p>{{post.post_content}}</p>
      </li>
    </ol>
  </div>

  Nothing here {{'yet' + '!'}} {{ 1 + 2 }}
</div>

*************RESOURCE_END*************

***********RESOURCE_START=css*************

#streamline-view {
  position: fixed; z-index: 2000;
  top: 10px; left: 10px; bottom: 10px; right: 10px;
  background-color: rgb(202, 202, 202);
  overflow-y: auto;
}

*************RESOURCE_END*************

======================INLINE_RESOURCE_END======================
*/

(function () {
  'use strict';

  var api = new TSRAPI();

  if (!/thestudentroom/.test(window.location.host)) {
    console.log("not root tsr url - " + window.location.host);
    return;
  } else {
    console.log("found tsr url - " + window.location.host);
  }

  var resource = (function () {
      var resource = {}, len, match, resourceBlocks,
          inlineResourcesMatch = (/^=+INLINE_RESOURCE_BEGIN=+$([\s\S]*?)^=+INLINE_RESOURCE_END=+$/m).exec(GM_info.scriptSource);

      resourceBlocks = (inlineResourcesMatch && inlineResourcesMatch[1].match(/^\**RESOURCE_START[\s\S]*?^\**RESOURCE_END\**$/mg)) || null;

      len =            (resourceBlocks       && resourceBlocks.length) || 0;

      for (var i = 0; i < len; i++) {
          match = (/^\**RESOURCE_START=(.*?)\**$\s*^([\s\S]*)^\**RESOURCE_END\**$/m).exec(resourceBlocks[i]);
          resource[match[1]] = match[2];
      }

      return resource;
  })();

  var styleElt = document.createElement("style");
  styleElt.textContent = resource['css'];
  styleElt.type = 'text/css';
  document.body.appendChild(styleElt);

  var master = document.createElement('div');

  /******* ANGULAR BEGIN *******/
  // http://stackoverflow.com/questions/13937318/convert-angular-http-get-function-to-a-service
  // http://stackoverflow.com/questions/15666048/angular-js-service-vs-provide-vs-factory
  // http://stackoverflow.com/questions/13762228/confused-about-service-vs-factory
  // http://jacobmumm.com/2012/08/28/angular-js-services/

  var app = angular.module('streamline', []);
  app.controller('PostListCtrl', ['$scope', function ($scope) {

    $scope.posts = [
      {"user": "Nexus S",
       "text": "Fast just got faster with Nexus S."},
      {"user": "Motorola XOOM™ with Wi-Fi",
       "text": "The Next, Next Generation tablet."},
      {"user": "MOTOROLA XOOM™",
       "text": "The Next, Next Generation tablet."}
    ];

    $scope.getThread = function () {
      api.mbq.get_thread("1820185", 0, 9, false, function (data) {
        var posts = data.posts, l = posts.length, postsList = [];
        $scope.posts = postsList;
        $scope.$apply();
      });
      // http://www.thestudentroom.co.uk/external.php?type=rss2&lastpost=1&count=100
    };

  }]);

  master.insertAdjacentHTML('afterbegin', resource['tmpl1']);

  document.body.insertAdjacentElement('afterbegin', master);

})();


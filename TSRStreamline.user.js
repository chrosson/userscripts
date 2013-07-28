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

/* TODO
 * - Occasional bug where loading new posts causes a tile with no background
 *   I thought clearing the colourcache would fix this, clearly not
 *   Looks like they simply aren't assigned a style attribute
 */

/*
======================INLINE_RESOURCE_BEGIN======================

***********RESOURCE_START=postlist_tmpl*************

<div id="strmln-view" ng-app="streamline" ng-cloak>

  <div>
    Search: <input ng-model="query">
  </div>

  <div ng-controller="NewPostListCtrl" ng-init="getPosts()">
    <div>
      GetNewPosts <button ng-click="getPosts()">Greet</button>
      Limit: <input type="range" min="0" max="{{posts.length}}" ng-model="limit">
    </div>
    <div class="strmln-post-tiles">
      <div class="strmln-post-tile strmln-forum-{{post.forum.id}}"
           ng-repeat="post in posts | limitTo:limit"
           ng-style="forumStyle(post.forum)">
        <div class="strmln-post-tile-content">
          {{post.user}}
          <p>{{post.title}}</p>
          <p>{{post.date}}</p>
        </div>
      </div>
    </div>
    <div class="strmln-post-forums">
      <div category-hover="strmln-forum-{{post.forum.id}}"
           ng-repeat="post in posts | limitTo:limit | uniqueCount:'forum.id' | orderBy:['-count','+forum.title']">
        {{post.count}} - <a href="{{post.forum.url}}">{{post.forum.title}}</a>
      </div>
    </div>
  </div>

  <!--<div ng-controller="PostListCtrl">
    <div>
      GotThread <button ng-click="getThread()">Greet</button>
    </div>
    <ol>
      <li ng-repeat="post in posts | filter:query">
        {{post.post_author_name}}
        <p>{{post.post_content}}</p>
      </li>
    </ol>
  </div>-->

  Nothing here {{'yet' + '!'}} {{ 1 + 2 }}
</div>

*************RESOURCE_END*************

***********RESOURCE_START=css*************

#strmln-view {
  position: fixed; z-index: 2000;
  top: 10px; left: 10px; bottom: 10px; right: 10px;
  background-color: rgb(202, 202, 202);
  overflow-y: auto;
}

.highlight { background-color: blue; }
.fadeout   { opacity: 0.2; }

.strmln-post-tiles  { position: absolute; right: 170px; left: 20px; font-size: 0; text-align: center; }
.strmln-post-forums { position: absolute; width: 150px; right: 20px; }

.strmln-post-tile {
  position: relative;
  width: 100px; height: 100px;
  display: inline-block;
  margin: 3px;
  padding: 3px;
  font-size: 13px; text-align: left;
}

.strmln-post-tile-content {
  position: absolute; height: 100%; width: 100%; overflow: hidden;
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

  // From https://github.com/prettycode/Object.identical.js/blob/3bc2365477cfe3863de6f465fb34716e2b565e7c/Object.identical.js
  var isIdentical = function (a, b, sortArrays) {
    function sort(object) {
      if (sortArrays === true && Array.isArray(object)) {
          return object.sort();
      } else if (typeof object !== "object" || object === null) {
        return object;
      }

        return Object.keys(object).sort().map(function(key) {
        return {
          key: key,
          value: sort(object[key])
        };
      });
    }

    return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
  };

  var styleElt = document.createElement("style");
  styleElt.textContent = resource['css'];
  styleElt.type = 'text/css';
  document.body.appendChild(styleElt);

  var master = document.createElement('div');

  /******* ANGULAR BEGIN *******/

  // http://www.cheatography.com/proloser/cheat-sheets/angularjs/ - angularjs cheat sheet
  // http://www.egghead.io/ - good angularjs vids

  // making things change on a hover
  // http://stackoverflow.com/questions/14105845/make-background-color-change-on-hover-after-setting-style-using-ng-style
  // http://stackoverflow.com/questions/9576167/highlight-multiple-items-on-hovers-condition
  // http://www.grobmeier.de/angular-js-the-show-on-mouseenter-hide-on-mouseleave-directive-31082012.html
  // https://www.google.com/webhp?ie=UTF-8#hl=en&q=css+highlight+multiple+items+related+element+on+hover&fp=1

  // http://jsfiddle.net/ItsLeeOwen/HFWEp/ - switching between html fragment templates

  // http://stackoverflow.com/questions/15114942/angular-js-fire-off-two-async-service-calls-then-perform-action-after-both-have
  // http://www.adobe.com/devnet/html5/articles/angularjs-directives-and-the-computer-science-of-javascript.html

  // http://stackoverflow.com/questions/13937318/convert-angular-http-get-function-to-a-service
  // http://stackoverflow.com/questions/15666048/angular-js-service-vs-provide-vs-factory
  // http://stackoverflow.com/questions/13762228/confused-about-service-vs-factory
  // http://jacobmumm.com/2012/08/28/angular-js-services/
  // http://onehungrymind.com/angularjs-directives-basics/
  // http://www.codinginsight.com/angularjs-directives/
  // http://docs.angularjs.org/guide/directive

  // http://www.nganimate.org/angularjs/ng-repeat/appear
  // http://code.angularjs.org/1.1.5/docs/api/ng.directive:ngAnimate
  // http://www.yearofmoo.com/2013/04/animation-in-angularjs.html
  // http://onehungrymind.com/ng-animate-first-look-with-angularjs-wizard/

  // Angular with masonry
  // http://jsfiddle.net/kstep/j25aj/9/ or http://jsfiddle.net/j25aj/12/
  // http://plnkr.co/edit/dmuGHCNTCBBuYpjyKQ8E?p=preview
  // http://stackoverflow.com/questions/16504151/masonry-with-angularjs

  var app = angular.module('streamline', []);

  // This currently isn't used
  app.controller('PostListCtrl', ['$scope', function ($scope) {

    $scope.posts = [
      {"post_author_name": "Nexus S",
       "post_content": "Fast just got faster with Nexus S."},
      {"post_author_name": "Motorola XOOM™ with Wi-Fi",
       "post_content": "The Next, Next Generation tablet."},
      {"post_author_name": "MOTOROLA XOOM™",
       "post_content": "The Next, Next Generation tablet."}
    ];

    $scope.getThread = function () {
      api.mbq.get_thread("1820185", 0, 3, false, function (data) {
        $scope.posts = data.posts;
        $scope.$apply();
      });
    };

  }]);

  // http://oazabir.github.io/Droptiles/ - unknown license
  // http://blog.sarasoueidan.com/windows8-animations/ - really slick, but noncommercial and attribution
  // http://codepen.io/coolinfoforme/details/uAhzx#stats - looks like bsd?
  // http://www.ryanlowdermilk.com/2012/03/windows-8-metro-tiles-with-html-css3-and-javascript/
  // http://masonry.desandro.com/ - this this this
  // https://github.com/desandro/vanilla-masonry
  // https://github.com/metafizzy/packery - noncommercial

  app.controller('NewPostListCtrl', ['$scope', '$filter', function ($scope, $filter) {

    $scope.posts = [];
    $scope.forums = {};
    $scope.limit = null;

    var snakeCase = $filter('wordsToSnakeCase');

    $scope.getPosts = function () {
      api.mbq.get_latest_topic(0, 49, null, null, function (d) {
        var newPosts = [];
        for (var i = 0, l = d.topics.length; i < l; i++) {
          var item = d.topics[i];
          var forumId = item.forum_id;
          if ($scope.forums[forumId] === undefined) {
            $scope.forums[forumId] = {
              id: forumId,
              name: snakeCase(item.forum_name),
              title: item.forum_name,
              url: "http://www.thestudentroom.co.uk/forumdisplay.php?f=" + forumId
            };
          }
          var date = new Date(item.timestamp * 1000);
          var postDate = date.getFullYear() + '-' + ("0" + (date.getMonth()+1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2) +
                         ' ' + ("0" + date.getHours()).slice(-2) + ':' + ("0" + date.getMinutes()).slice(-2);

          var post = {
            user: item.post_author_name,
            date: postDate,
            title: item.topic_title,
            forum: $scope.forums[forumId]
          };
          if (isIdentical(post, $scope.posts[0])) { break; }
          newPosts.push(post);
        }
        $scope.posts = newPosts.concat($scope.posts).slice(0, 50);
        $scope.$apply();
        if ($scope.limit === null) { $scope.limit = 5; $scope.$apply(); }
        forumColorCache = {};
        setTimeout($scope.getPosts, 5000);
      });
    };

    var forumColorCache = {};
    $scope.forumStyle = function (forum) {
      var limit = $scope.limit;
      // http://jsperf.com/array-indexof-vs-object-s-in-operator/10
      if ((typeof forumColorCache[limit]) === "undefined") {
        forumColorCache[limit] = {};
        var posts = $scope.posts, activeForums = {}, activeForumList = [], post;
        for (var l = $scope.limit, i = 0; i < l; i++) {
          post = posts[i];
          if (activeForums[post.forum.id] !== undefined) { continue; }
          activeForums[post.forum.id] = post.forum;
          activeForumList.push(post.forum);
        }
        activeForumList.sort(function (f1, f2) {
          if (f1.name === f2.name) {
            return f1.id === f2.id ? 0 : (f1.id > f2.id ? 1 : -1);
          } else {
            return f1.name > f2.name ? 1 : -1;
          }
        });
        for (var l = activeForumList.length, i = 0; i < l; i++) {
          forumColorCache[limit][activeForumList[i].id] = (360/l) * i;
        }
      }
      return { backgroundColor: 'hsl(' + forumColorCache[limit][forum.id] + ',100%,60%)' };
    };

  }]);

  app.directive('categoryHover', [function () {
    var $tileParent = angular.element('.strmln-post-tiles');
    return {
      link: function ($scope, $element, attrs) {
        $element.bind('mouseenter', function() {
          $tileParent.children(':not(.' + attrs.categoryHover + ')').addClass('fadeout');
          $element.addClass('highlight');
        });
        $element.bind('mouseleave', function() {
          $tileParent.children(':not(.' + attrs.categoryHover + ')').removeClass('fadeout');
          $element.removeClass('highlight');
        });
      }
    };
  }]);

  app.filter('wordsToSnakeCase', [function () {
    return function (words) {
      return angular.lowercase(words.replace(/ /g, '-')).replace(/[^a-z_-]/, '');
    }
  }]);

  // https://github.com/angular-ui/ui-utils/blob/c8c298da336ae7fc84b1289337f5ed5e69863361/modules/unique/unique.js
  // modified to include counting
  app.filter('uniqueCount', ['$parse', function ($parse) {
    return function (items, filterOn) {

      if (filterOn === false) {
        return items;
      }

      if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
        var hashCheck = {}, newItems = [],
          get = angular.isString(filterOn) ? $parse(filterOn) : function (item) { return item; };

        var extractValueToCompare = function (item) {
          return angular.isObject(item) ? get(item) : item;
        };

        angular.forEach(items, function (item) {
          var valueToCheck, isDuplicate = false;

          for (var i = 0; i < newItems.length; i++) {
            if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
              isDuplicate = true;
              newItems[i].count++;
              break;
            }
          }
          if (!isDuplicate) {
            newItems.push(item);
            item.count = 1;
          }

        });
        items = newItems;
      }
      return items;
    };
  }]);

  master.insertAdjacentHTML('afterbegin', resource['postlist_tmpl']);

  document.body.insertAdjacentElement('afterbegin', master);

})();


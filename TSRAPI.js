function TSRAPI() {
  "use strict";

  // https://developer.mozilla.org/en-US/docs/DOM/window.btoa#Unicode_Strings
  var utf8tob64 = function (str) { return btoa(unescape(encodeURIComponent(str))); };
  var b64toutf8 = function (str) { return decodeURIComponent(escape(atob(str))); };

  function noop() {}

  var mbq_parse = (function () {

    function handleStruct(elt) {
      var members = {};
      for (var m = elt.firstElementChild; m !== null; m = m.nextElementSibling) {
        members[m.getElementsByTagName("name")[0].textContent] = handleElt(m.getElementsByTagName("value")[0]);
      }
      return members;
    }

    function handleArray(elt) {
      var items = [];
      var data = elt.firstElementChild;
      for (var m = data.firstElementChild; m !== null; m = m.nextElementSibling) {
        items.push(handleElt(m.firstElementChild));
      }
      return items;
    }

    function handleValue(elt) {
      var val = elt.firstElementChild;
      switch (val.nodeName) {
        case "int":
          return parseInt(elt.textContent, 10);
        case "boolean":
          return (elt.textContent === "1");
        case "string":
          return elt.textContent;
        case "base64":
          if (elt.textContent === null) { alert("Error occured"); }
          return b64toutf8(elt.textContent);
        case "dateTime.iso8601":
          var d = elt.textContent;
          return d.slice(0,4) + "-" + d.slice(4,6) + "-" + d.slice(6,8) + " " + d.slice(9,14);
        case "struct":
          return handleElt(val);
        case "array":
          return handleElt(val);
        default:
          throw "Unrecognised val type '" + val.nodeName + "'";
      }
    }

    function handleElt(elt) {
      switch (elt.nodeName) {
        case "value":
          return handleValue(elt);
        case "struct":
          return handleStruct(elt);
        case "array":
          return handleArray(elt);
        case "param":
          return handleElt(elt.firstElementChild);
        case "params":
          return handleElt(elt.firstElementChild);
        case "methodResponse":
          return handleElt(elt.firstElementChild);
        case "fault":
          var fault = handleElt(elt.firstElementChild);
          console.log("Fault occured");
          console.log(fault);
          return fault;
        default:
          throw "Unrecognised elt '" + elt.nodeName + "'";
      }
    }

    function parseTSRXML(xmldoc) {
      return handleElt(xmldoc.firstChild);
    }

    return parseTSRXML;

  })();

  // modified from https://code.google.com/p/x2js/source/browse/xml2json.js?r=857211ed56c68cb430f52aef367b96c447fd7b9f
  var rss_parse = (function () {
    function parseDOMChildren (node) {
      if (node.nodeType == 9) { // Document node
        var result = {};
        var child = node.firstChild;
        var childName = (child.localName == null) ? child.nodeName : child.nodeName;
        result[childName] = parseDOMChildren(child);
        return result;

      } else if (node.nodeType == 3 || node.nodeType == 4) { // text or CDATA node
        return node.nodeValue;

      } else if (node.nodeType == 1) { // Element node
        var result = { __cnt: 0 };
        var nodeChildren = node.childNodes;

        // Children nodes
        for (var cidx=0; cidx < nodeChildren.length; cidx++) {
          var child = nodeChildren.item(cidx); // nodeChildren[cidx];
          var childName = (child.localName == null) ? child.nodeName : child.nodeName;

          // TSR mappings
          if (childName === 'dc:creator') { childName = 'creator'; }
          else if (childName === 'content:encoded') { childName = 'content'; }
          else if (childName === '#text' && child.nodeValue.replace(/^\s*$/, '') === '') { continue; }

          result.__cnt++;
          if (result[childName] == null) {
            result[childName] = parseDOMChildren(child);
            result[childName+"_asArray"] = [result[childName]];
          } else {
            if (!(result[childName] instanceof Array)) {
              result[childName] = [result[childName]];
              result[childName+"_asArray"] = result[childName];
            }
            var aridx = 0;
            while(result[childName][aridx]!=null) { aridx++; }
            result[childName][aridx] = parseDOMChildren(child);
          }
        }

        // Attributes
        for (var aidx=0; aidx < node.attributes.length; aidx++) {
          var attr = node.attributes.item(aidx); // [aidx];
          result.__cnt++;
          result[attr.name]=attr.value;
        }

        if (result.__cnt == 1 && (result["#cdata-section"] || result["#text"])!=null) {
          result = result["#cdata-section"] || result["#text"];
        }

        if (result["#text"]!=null) {
          result.text = result["#text"];
          delete result["#text"];
          delete result["#text_asArray"];
        }
        if (result["#cdata-section"]!=null) {
          result.__cdata = result["#cdata-section"];
          delete result["#cdata-section"];
          delete result["#cdata-section_asArray"];
        }

        return result;
      }
    }

    return parseDOMChildren;
  })();

  this.noapi = {

    get_feed: function (lastpost, count, forumids, callback) {
      if (typeof(forumids) === 'function') { callback = forumids; forumids = undefined; }
      /*
        http://www.thestudentroom.co.uk/external.php?type=rss2&lastpost=1&count=5
        lastpost: if true, order threads by last post, otherwise when created
        count: number of results
        forumids: optional, comma separated forum ids to return
      */
      jQuery.ajax({
        type: 'GET',
        url: 'http://www.thestudentroom.co.uk/external.php?type=rss2&lastpost=' + lastpost +
             '&count=' + count + (forumids ? '&forumids=' + forumids.join(',') : ''),
        success: function (data, textStatus, jqXHR) {
          var d = rss_parse(data);
          if (!d.rss) { return alert("FAILED: " + d); }
          callback(d);
        },
        error: function (jqXHR, textStatus, errorThrown) { alert("Failed to connect to TSR to get feed..."); },
        dataType: "xml"
      });

    }
  };

  // http://tapatalk.com/api/api_home.php
  // https://github.com/tapatalk/api/tree/master/mobiquo
  this.mbq = {

    get_config: function (callback, onerror) {
      // http://tapatalk.com/api/api_section.php?id=1#get_config
      jQuery.ajax({
        type: 'POST',
        url: "http://www.thestudentroom.co.uk/mobiquo/mobiquo.php",
        data: '<?xml version="1.0"?><methodCall><methodName>get_config</methodName><params></params></methodCall>',
        success: function (data, textStatus, jqXHR) {
          var d = mbq_parse(data);
          if (typeof(d.version) !== 'string') {
            console.log("FAILED: " + d.version);
            console.log(d);
            (onerror || noop)(d, jqXHR, textStatus, errorThrown)
          } else {
            callback(d);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("Failed to connect to TSR to load thread...");
          (onerror || noop)(null, jqXHR, textStatus, errorThrown);
        },
        dataType: "xml"
      });
    },

    get_thread: function (topic_id, start_num, last_num, return_html, callback, onerror) {
      /*
        get_thread      Returns a list of posts under the same thread, given a topic_id
        Name            Type              Required? Description

        topic_id        String            yes       Topic ID of the thread.
        start_num       Int               yes       Returns posts 'slice' max 50. First 20 by default
        last_num        Int               yes
        return_html     Boolean

        total_post_num  Int               yes       total number of posts in this topic
        forum_id        String            yes
        forum_name      byte[]            yes
        topic_id        String            yes
        topic_title     byte[]            yes
        prefix          byte[]
        is_subscribed   Boolean                     true if this thread has been subscribed by this user.
        can_subscribe   Boolean                     false if the subscription feature is turned off
        is_closed       Boolean                     true if thread is closed. shouldn't allow reply or edit unless can_reply (thread) or can_edit (post) are set to "true" explicitly
        can_report      Boolean                     true if if user can report post in this thread
        can_reply       Boolean                     false if user cannot reply to this thread.
        breadcrumb      Array of structs            Forum nav to current thread, order from top forum to it's parent forum
        forum_id        String
        forum_name      byte[]
        sub_only        Boolean
        posts           Array of structs  yes       an array contains a list of posts in a thread.
        post_id         String            yes
        post_title      byte[]            yes       Remove all BBCode in title
        post_content    byte[]            yes       Characters display rules (follow the sequence): 1) Remove all BBCode except [url], [img], [quote], [spoiler] 2) Remove all non-displayable characters (e.g. \n, \t, white-space, etc) at the beginning AND the end of the content (Trimming) 3) when 'return_html' was set as true, it will also return html tag <b>,<i>,<u>,<br />
        post_author_id  String            yes
        post_author_name byte[]           yes
        is_online       Boolean                     true if this user is currently online
        can_edit        Boolean                     true if user can edit this post.
        icon_url        String                      topic author avatar URL
        post_time       Date              yes       dateTime.iso8601 format. If this topic has no reply, use the topic creation time.
        allow_smilies   Boolean                     if "false" do not display smilies (text instead), allows admin disable smilies. assume "true"
        attachments     Array of structs            Returns a list of attachments user has uploaded within this post, in array of hash format.
        content_type    String            yes       "image", "pdf" or "other"
        thumbnail_url   String                      if content type = "image"), use absolute path (optional: if not presented, use "url" to load thumbnail instead)
        url             String                      URL of the attachment source.
        thanks_info     Array of structs         Return post thanks user list infor only when thank_post is supported.
        userid          String                      Id of the user who has thanked this post
        username        byte[]                      Name of the user who has thanked this post
        likes_info      Array of structs            Return post likes user list infor only when like_post/unlike_post are supported.
        userid          String                      Id of the user who has liked this post
        username        byte[]                      Name of the user who has liked this post
      */
      jQuery.ajax({
        type: 'POST',
        url: "http://www.thestudentroom.co.uk/mobiquo/mobiquo.php",
        data: '<?xml version="1.0"?><methodCall><methodName>get_thread</methodName><params>' +
              '<param><value><string>' + topic_id + '</string></value></param>' +
              '<param><value><i4>' + start_num + '</i4></value></param>' +
              '<param><value><i4>' + last_num + '</i4></value></param>' +
              (return_html != null ? '<param><value><boolean>' + return_html + '</boolean></value></param>' : '') +
              '</params></methodCall>',
        success: function (data, textStatus, jqXHR) {
          var d = mbq_parse(data);
          if (typeof(d.position) !== 'number' || d.position < 0) {
            console.log("FAILED: " + d.topic_id);
            console.log(d);
            (onerror || noop)(d, jqXHR, textStatus);
          } else {
            callback(d);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("Failed to connect to TSR to load thread...");
          (onerror || noop)(null, jqXHR, textStatus, errorThrown);
        },
        dataType: "xml"
      });
    },

    get_latest_topic: function (start_num, last_num, search_id, filters, callback) {
      /*
        get_latest_topic  Returns a list of latest topics ordered by date
        Name            Type              Required? Description

        start_num       Int               yes       For pagination. If start_num = 0 & last_num = 9, it returns first 10 posts from the topic, sorted by date (last-in-first-out). If both are not presented, return first 20 posts. if start_num = 0 and last_num = 0, return the first post only, and so on (e.g. 1,1; 2,2). If start_num smaller than last_num returns null. If last_num - start_num > 50, returns only first 50 posts starting from start_num
        last_num        Int               yes
        search_id       String                      for caching and for pagination support
        filters         Array of structs            A set of filtering rules to filter the search result. E.g. user can specify only to display topics under certain sub-forums, or can exclude topis from certain sub-forums. Format of the filters: "only_in" = { array of sub-forum ID }. "not_in" = {array of sub-forum ID}.

        result          Boolean           yes       true if the action is successful.
        result_text     byte[]                      para_description
        total_topic_num Int               yes       total number of latest topics
        search_id       String                      search id for sending back to the server for pagination support
        topics          Array of structs            list of topics in request range
        forum_id        String            yes
        forum_name      byte[]            yes
        topic_id        String            yes
        topic_title     byte[]            yes       Remove all BBCode in title
        prefix          byte[]
        post_author_name byte[]           yes
        post_author_id  String            yes
        is_subscribed   Boolean                     true if this thread has been subscribed by this user.
        can_subscribe   Boolean           yes       false if the subscription feature is turned off
        is_closed       Boolean                     true if this thread has been closed.
        icon_url        String                      the last reply author avatar URL
        participated_uids Array of String           list of users who participated in topic, no more than 10, ordered by the "importance" - can be determined by num of posts by user in topic etc. Plugin should check HTTP Header "Mobiquoid". If = 11, return this key, otherwise do not return it.
        post_time       Date              yes       dateTime.iso8601 format. if no replies, topic creation time.
        reply_number    Int               yes       number of replies in topic (not including OP)
        new_post        Boolean           yes       true if this topic contains new post since user last login
        view_number     Int               yes       total number of view in this topic
        short_content   byte[]                      Characters display rules (should follow this sequence): 1) Remove all BBCode except [ur], [img]. 2) Convert "[url http://...]http://…..[/url]" to "[url]". 3) Convert "[img]http://…..[/img]" to "[img]". 4) Remove "Last edited by..." tag at the end. 5) Remove all non-displayable characters (e.g. \n, \t, etc). 6) Remove all whitespace, /n and /r at the beginning and ending of the content. 7) return only first 200 characters
      */
      var filter = "<struct>" +
        //"<member><name>not_in</name><value><array><data></data></array></member>" +
        //"<member><name>not_in</name><value><array><data><value><string>1</string></value></data></array></member>" +
      "</struct>";
      jQuery.ajax({
        type: 'POST',
        url: "http://www.thestudentroom.co.uk/mobiquo/mobiquo.php",
        data: '<?xml version="1.0"?><methodCall><methodName>get_latest_topic</methodName><params>' +
              '<param><value><i4>' + start_num + '</i4></value></param>' +
              // Compensate for strange 'off-by-10' tsr bug
              '<param><value><i4>' + (last_num + 10) + '</i4></value></param>' +
              // Don't omit param if not given, just send empty search id - theoretically then allows filters
              '<param><value><string>' + (search_id != null ? search_id : '') + '</string></value></param>' +

              // Unsure how to make filters work (possibly broken on TSR, works with empty struct though...)
              '<param>' + (filters != null ? '<value><array>' + filters + '</array></value>' : '') + '</param>' +
              //'<param><value>' + filter + '</value></param>' +

              '</params></methodCall>',
        success: function (data, textStatus, jqXHR) {
          var d = mbq_parse(data);
          if (d.result !== true) {
            console.log("Failed to get latest topics");
            console.log(d);
            (onerror || noop)(d, jqXHR, textStatus);
          } else {
            callback(d);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("Failed to connect to TSR to load latest topics...");
          (onerror || noop)(null, jqXHR, textStatus, errorThrown);
        },
        dataType: "xml"
      });
    }

  };

}



function TSRAPI() {
  "use strict";

  // https://developer.mozilla.org/en-US/docs/DOM/window.btoa#Unicode_Strings
  var utf8tob64 = function (str) { return btoa(unescape(encodeURIComponent(str))); };
  var b64toutf8 = function (str) { return decodeURIComponent(escape(atob(str))); };

  var parse = (function () {

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
        forumids: optional, forum ids to return
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

  this.mbq = {

    get_thread: function (topic_id, start_num, last_num, return_html, callback) {
      /*
        get_thread      Returns a list of posts under the same thread, given a topic_id
        Name            Type              Required? Description

        topic_id        String                      Topic ID of the thread.
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
        attachments     Array of Hash table         Returns a list of attachments user has uploaded within this post, in array of hash format.
        content_type    String            yes       "image", "pdf" or "other"
        thumbnail_url   String                      if content type = "image"), use absolute path (optional: if not presented, use "url" to load thumbnail instead)
        url             String                      URL of the attachment source.
        thanks_info     Array of Hash table         Return post thanks user list infor only when thank_post is supported.
        userid          String                      Id of the user who has thanked this post
        username        byte[]                      Name of the user who has thanked this post
        likes_info      Array of Hash table         Return post likes user list infor only when like_post/unlike_post are supported.
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
              '<param><value><boolean>' + return_html + '</boolean></value></param>' +
              '</params></methodCall>',
        success: function (data, textStatus, jqXHR) {
          var d = parse(data);
          if (typeof(d.position) != 'number' || d.position < 0) { return alert("FAILED: " + d.topic_id); }
          callback(d);
        },
        error: function (jqXHR, textStatus, errorThrown) { alert("Failed to connect to TSR to load thread..."); },
        dataType: "xml"
      });
    }

  };



}



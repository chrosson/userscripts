---
published: true
layout: article
title: "Lesson 3 - Down to business"
abstract: "Enough messing, time to actually do something."
author: Chrosson
categories: articles
---

### Behind the scenes
First we need to understand how post deletion works. To do this, we need to see what's sent to TSR when we actually delete a post. Once we know this we can play around the deletion request.

I highly reccomend [Fiddler 2](http://fiddler2.com/) to look at what's being sent between your computer and a server, but for this example it'll suffice to just use the chrome developer tools (fewer bells and whistles, but still functional).

So, find a post of yours you'd like to delete and open the chrome developer tools (F12 or other methods) - feel free to use [this thread](http://www.thestudentroom.co.uk/showthread.php?t=2387591) to create a test post. Now go to the 'Network' tab. You'll see an empty list with some column headings. Refreshing the page will fill this list up - it is a log of every single file or piece of information your browser has got from a server during this page load. You'll note that this list includes images, advertisment things, social media things (but we don't care about any of these).

Now, press the edit button on your post and the editing dialog will appear. Press the delete button to get up the deletion options. Give a reason, select 'Delete Message' and press 'Delete Post', watching the 'Network' list carefully. Note that just before the page reloaded a single item was added to the list. This is because your browser had to send a request to TSR to ask it to delete the post.

Now, if you scroll to the top of the long list of requests for the page reload you'll see the first item has a 'Method' called 'Post'. Click on that item and a pane will appear which gives you information about the request. Scroll down until you come to the 'Form Data' section. This is the part we're interested in - it's the important part of what you sent to TSR when you asked it to delete your post. Click 'view source' to see the raw message we sent to TSR.

It'll look something like

```
do=deletepost&s=&securitytoken=43985743-9a87sdad98sa7das9da&postid=123455678&deletepost=delete&reason=areallygoodreason
```

Let's ignore the security token for now, so the data that was sent to the server was

```
do=deletepost&s=&postid=123455678&deletepost=delete&reason=areallygoodreason
```

### Pulling the strings
Now, we know what our browser did to delete the post, we just need to reproduce it. As it happens, jQuery offers us a [handy method](http://api.jquery.com/jQuery.post/) called `post` which, surprisingly enough, `post`s some data to the server. Which happens to be what happened to delete the post (remember the 'method' column?).

So:
 - the 'url' can be found in the details of the request - it was http://www.thestudentroom.co.uk/editpost.php
 - we've established that the data we want to send to the server is `do=deletepost&s=deletepost=delete&reason=areallygoodreason`
 - the success callback is what we want to do when TSR responds to our request

Lets try the following (trying to delete the 100th post on TSR):

    jQuery.post(
        'http://www.thestudentroom.co.uk/editpost.php',
        'do=deletepost&s=&postid=100&deletepost=delete&reason=areallygoodreason',
        function (data) { console.log(data); alert(123); }
    );

Note the last item in the list of the 'Network' tab. Paste the above into the chrome developer console and hit enter. Now go back to the 'Network' tab and see how two different items have been added to the list - your post request, and then TSR suggesting that your browser should load thread 12. Note that (despite the 'console.log') we don't get anything logged but do get the alert box - this is an issue with the chrome developer tools.

Now, let's see if we can play with this. Find a post of yours you want to delete and click on the post number at the top right. If you look at the url bar now, the 'p=' is the part we're interested in. So, try editing the piece of code above to put in this new post id we have, hit enter in the chrome developer console again and refresh the page to see if your post has been deleted...it hasn't. Turns out that the securitytoken we ignored is actually important and we need it to make the request. If you click on the final item in the network tab list and click the response tab you'll see TSR telling us this.

So, the securitytoken is regenerated whenever we open a page. But if we're pasting into the developer console we're not loading a new page. Maybe we can get jQuery to load a page for us, grab the security token and then use that? As it happens, we can.

To load a page and grab just the security token, we can do this:

    $('<div>').load(
        'http://www.thestudentroom.co.uk/showthread.php?t=2387591 [name="securitytoken"]',
        function () {alert(this.children[0].value);}
    )

That is, create a `<div>` element with `$('<div>')`, open the page specified by the url and load anything matching the (optional) CSS selector into the div element we just created. Once this is done, we call a function which 'alert's the value of the securitytoken.

But instead of alerting it, we could use it in our deletion request. So get the post id we wanted to delete and use it in here:

    var postid = 12345;
    jQuery('<div>')
        .load('http://www.thestudentroom.co.uk/showthread.php?p=' + postid + ' [name="securitytoken"]',
        function () {
            var securitytoken = this.children[0].value;
            jQuery.post(
                'http://www.thestudentroom.co.uk/editpost.php',
                'do=deletepost&s=&postid=' + postid +
                '&deletepost=delete&reason=areallygoodreason&securitytoken=' + securitytoken,
                function () { alert('deleted'); }
            );
      });

This is a relatively complex bit of code, but all we're actually doing is tying together what we've done so far - choose a postid, get a security token for the page containing that post, then actually make the deletion request for the specified postid with the securitytoken we just found. The '+' operators in javascript don't just do maths - they also join strings.

As a guideline, whenever you see a 'function' inside round brackets (arguments in a call to another function), it usually indicates that you're saying "when this function has finished, run this one next". You can't do it in a normal list of steps for reasons beyond the scope of this tutorial.

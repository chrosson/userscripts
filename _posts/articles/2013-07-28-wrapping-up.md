---
published: true
layout: article
title: "Lesson 4 - Wrapping Up"
abstract: Pulling it all together
author: Chrosson
categories: articles
---

### Looking at Anatomy
Last time we found out how to delete a post if we know the post id, so we actually have the core functionality we need. Now we need to wrap it all up so it's usable without messing with the javascript console. So, let's create a minimal userscript - open up the Tampermonkey extension in Chrome and press the little '+' button next to 'Installed userscripts'. Keep this tab open because this is where we're going to be editing our userscript.

First, replace what's already in there with the following:

    // ==UserScript==
    // @name           TSR Post Deleter
    // @author         Chrosson
    // @version        0.1
    // @description    Delete posts
    // @include        http*://www.thestudentroom.co.uk/*
    // @copyright      2013+, Chrosson
    // @namespace      http://www.thestudentroom.co.uk/member.php?u=334116
    // ==/UserScript==

    alert('Hi');

The parts between the `==UserScript==` lines is known as the metadata block and provides information about your userscript. You'll want to change the `author` and `copyright` to yourself. You'll also want to change the `namespace` to something you 'own' - when scripts are named the same it's used to disambiguate so it wants to be unique. I've used my TSR profile page.

Anything below the metadata block is run when the web address matches at least one of the `include` lines (where `*` means 'any characters'). You'll note that we're going to execute the alert on any page of the TSR site. Save it and visit TSR - congratulations on your first userscript!

### Body Sculpting
We clearly don't want to run on any old page, so lets change the include line to match `http*://www.thestudentroom.co.uk/search.php*`. This will make it appear whenever we're doing any kind of search...like for our own posts from the 'My Stats' tab. Go there now so you can refresh after each time we make a userscript change.

Now, let's look at the meat of the userscript. If you remember the first lesson, we found we could get all of the result links with `$('#search_results a[href^="showthread"]')`. Let's start out by adding a button in front of each result link, and it just so happens that jQuery provides a method called `before`. So, let's replace our alert with

    $('#search_results a[href^="showthread"]').before(function () {
        return $('<button>').text('X');
    });

The function passed to `before` is called for each item and returns the thing that we want inserting. In this case, a button with the text 'X'. Not very exciting. In order to get to our final goal of deleting posts, we need to get the post id. As the `this` variable refers to the element we found, we can extract the post id from the `href` attribute - i.e. where the link points to. Let's try the following line:

    return $('<button>').text(this.href.match(/p=([0-9]+)/)[1]);

The above uses a mysterious tool known as regular expressions which are designed for matching and extracting bits of information out of strings. Simply speaking we're obtaining the number following the `p=` in the link. If you save that and refresh the search page you'll see all the post ids listed. Excellent! Let's pull in the work we did in the last lesson and make this body:

    function deletePost(postid) {
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
    }

    $('#search_results a[href^="showthread"]').before(function () {
        var postid = this.href.match(/p=([0-9]+)/)[1];
        return $('<button>').text('X').click(function () { deletePost(postid); });
    });

Congratulations, we can delete posts individually!

### Toning the Muscle
We don't really get much information on whether it fails or succeeds. Let's make it so that we know when a post hasn't been deleted for whatever reason by adding some checking for closed threads, already deleted posts and other people's posts, and properly report success. We can do this by replacing the deletion button with some informative text.

    function deletePost(postid, button) {
        jQuery('<div>')
            .load('http://www.thestudentroom.co.uk/showthread.php?p=' + postid + ' [name="securitytoken"]',
            function () {

                // Check if thread is closed (i.e. there's no security token)
                if (this.children[0] === undefined) {
                    $(button).replaceWith($('<button>').css('color','red').text('Closed').prop('disabled',true));
                    return;
                };

                // Delete the post
                var securitytoken = this.children[0].value;
                jQuery.post(
                    'http://www.thestudentroom.co.uk/editpost.php',
                    'do=deletepost&s=&postid=' + postid +
                    '&deletepost=delete&reason=areallygoodreason&securitytoken=' + securitytoken,
                    function (doc) {

                        if (typeof doc === "string" &&
                                doc.indexOf('post_' + postid) !== -1) {
                            // Not sure what happened, failed to delete for some reason
                            $(button).replaceWith($('<button>').css('color','red').text('!').prop('disabled',true));
                            
                        } else if (typeof doc === "string") {
                            // Assume we did delete
                            $(button).parent().parent().fadeOut();
                            
                        } else if (typeof doc === "object" &&
                                doc.childNodes[0].textContent.indexOf("Invalid Post specified.") > -1) {
                            // Already deleted
                            $(button).parent().parent().fadeOut();
                            
                        } else if (typeof doc === "object" &&
                                doc.childNodes[0].textContent.indexOf("you do not have permission") > -1) {
                            // No permission for some reason
                            $(button).replaceWith($('<button>').css('color','red')
                                .text('No permission').prop('disabled',true));
                        
                        } else {
                            alert("Unknown error, report post to Chrosson");
                            
                        }
                        
                    }
                );
            });
    }

    $('#search_results a[href^="showthread"]').before(function () {
        var postid = this.href.match(/p=([0-9]+)/)[1];
        return $('<button>').text('X').click(function () { deletePost(postid, this); });
    });

Note how the script has exploded in size. Error checking is sadly one of the hardest parts of writing a userscript. Let's make it a bit prettier by adding a progress spinner while we're waiting for deletion. Just add the following code right at the top of the deletePost function to, as the first step, replace the initial button with a progress spinner.

    var progress = $('<img>').attr('src', 'http://www.thestudentroom.co.uk/images/miscellaneous/progress.gif');
    $(button).replaceWith(progress);
    button = progress;

Finally, we add a button to delete all posts on a results page and make the single deletion buttons easier to click and end up with out final userscript. Note how we've added a class to make selection of our post deletion buttons easier when we go through each one to click it. I've also added a few comments in to clarify bits of the code

    // ==UserScript==
    // @name           TSR Post Deleter
    // @author         Chrosson
    // @version        0.1
    // @description    Delete posts
    // @include        http*://www.thestudentroom.co.uk/*
    // @copyright      2013+, Chrosson
    // @namespace      http://www.thestudentroom.co.uk/member.php?u=334116
    // ==/UserScript==

    function deletePost(postid, button) {

        // Replace button with progress loader
        var progress = $('<img>').attr('src', 'http://www.thestudentroom.co.uk/images/miscellaneous/progress.gif');
        $(button).replaceWith(progress);
        button = progress;

        jQuery('<div>')
            .load('http://www.thestudentroom.co.uk/showthread.php?p=' + postid + ' [name="securitytoken"]',
            function () {

                // Check if thread is closed (i.e. there's no security token)
                if (this.children[0] === undefined) {
                    $(button).replaceWith($('<button>').css('color','red').text('Closed').prop('disabled',true));
                    return;
                };

                // Delete the post
                var securitytoken = this.children[0].value;
                jQuery.post(
                    'http://www.thestudentroom.co.uk/editpost.php',
                    'do=deletepost&s=&postid=' + postid +
                    '&deletepost=delete&reason=areallygoodreason&securitytoken=' + securitytoken,
                    function (doc) {
                        // doc can either be a string (of a full html page) or an object (of an xml response).
                        // These help differentiate what happened to our request.

                        if (typeof doc === "string" &&
                                doc.indexOf('post_' + postid) !== -1) {
                            // Not sure what happened, failed to delete for some reason
                            $(button).replaceWith($('<button>').css('color','red').text('!').prop('disabled',true));
                            
                        } else if (typeof doc === "string") {
                            // Assume we did delete
                            $(button).parent().parent().fadeOut();
                            
                        } else if (typeof doc === "object" &&
                                doc.childNodes[0].textContent.indexOf("Invalid Post specified.") > -1) {
                            // Already deleted
                            $(button).parent().parent().fadeOut();
                            
                        } else if (typeof doc === "object" &&
                                doc.childNodes[0].textContent.indexOf("you do not have permission") > -1) {
                            // No permission for some reason
                            $(button).replaceWith($('<button>').css('color','red')
                                .text('No permission').prop('disabled',true));
                                
                        } else {
                            alert("Unknown error, report post to Chrosson");
                            
                        }
                        
                    }
                );
            });
    }

    // Create individual buttons for each post on a page.
    $('#search_results a[href^="showthread"]').before(function () {
        var postid = this.href.match(/p=([0-9]+)/)[1];
        return $('<button>').text('X').addClass('postDelete').click(function () { deletePost(postid, this); })
            .css('paddingLeft', '10px').css('paddingRight', '10px');
    });

    // Make a 'delete all' button.
    $('#search_results_sort').after(
        $('<button>').text('Delete All').css('paddingLeft', '10px').css('paddingRight', '10px')
            .click(function () { this.disabled = true; $('.postDelete').click(); })
    );

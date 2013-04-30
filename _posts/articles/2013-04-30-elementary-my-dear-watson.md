---
published: true
layout: article
title: Lesson 1 - Elementary my dear Watson
abstract: You need elements. jQuery gets you elements.
author: Chrosson
categories:
- articles
---

*Definitions and ideas*

* attribute: Given a link element `<a href="http://www.google.com">google</a>` the `href="http://www.google.com"` means the `href` attribute has been assigned to the value `http://www.google.com`. Attributes are a fundamental part of an element and are initially set in the page source, though they may later be later added/deleted/modified with Javascript. You can see current element attributes by opening the element inspector in chrome (or firebug in firefox etc).
* DOM tree: the tree of elements the browser represents a page as. Open your favorite page inspection tool - notice theres a single 'root' element and you can expand that to get elements underneath (contained within) that element. There are no loops. Keep this in the back of your mind.

*Know thy history - jQuery the selector*

CSS is the way browsers know which elements to apply which 'styles' to. To do this it needs to have rules about how to find elements...after all, you need to be able to specify different font sizes for your headings and body text.  
To this end a set of 'rule formats' or 'selectors' were defined to let browsers know how to find what. jQuery uses all of these rule formats and adds a sprinking of its own. Wherever I mention a CSS selector, it's something you can use to find an element with jQuery.

### Get your elements

There are 4 fundamental selectors in CSS.

1. Id: `$('#thisistheid')` - defined by the `id` attribute
2. Class: `$('.thisistheclass')` - defined by the `class` attribute
3. Tag: `$('thisisthetag')` - defined by what kind of 'element' it is - a link is `a`, an image is `img`, the body of the page is `body`. Every element has a tag, even the html itself - try doing a selector on `html`
4. Wildcard: `$('*')` - everything

These (well, the first 3) are absolutely essential. Know them. Other important selectors are documented in this [official table](http://www.w3.org/TR/CSS2/selector.html#pattern-matching). To give a brief idea of what you can do:

* Describing how elements relate to each other in the structure of the page important. A common one is `$('div > a')`, which means 'get any link which is an immediate child of a div'. There are a few of these 'relationship selectors'.
* Describing the attribute(s) of an element can be a way to get to what you want in a more effective way. `$('[alt=":@"]')` selects any element with the alt attribute equal to `:@`. What are these? Well...any angry face emoticons, as it happens.
* Combining everything is necessary sooner or later. `$('.class1.class2')` gets any element with those two classes. `$('[alt=":@"], #wasd > div.abc > a')` - get any angry faces, *or* (the comma) get any links under a div element with class abc which are under the element with id wasd.

[The jQuery selector documentation](http://api.jquery.com/category/selectors/) is your bible. Look at it often. I do.
[This page](http://net.tutsplus.com/tutorials/html-css-techniques/the-30-css-selectors-you-must-memorize/) is probably a good idea to look through to give you an idea of what's available.

### Example

Let's think about [the list of all my posts](http://www.thestudentroom.co.uk/search.php?do=finduser&u=334116) and see how we can get all the links elements to them.

Open chrome web inspector and use the handy element highlighting to navigate down to select the search result area. We can see we have a table with id search_results. Because ids are meant to be unique, we can get this with...  
`$('#search_results')`

Now, we have a tbody, then a tr (table row), then two td (table data, i.e. columns) elements. But we only actually want the second. There are multiple ways to skin a cat, but we'll do nth-child...  
`$('#search_results > tbody > tr > td:nth-child(2)')`

I should note, if you run these selectors in the chrome console it gives you an expandable segment of what you've currently selected. Very handy. We of course want the table under this, then the tbody. As we're getting all the links, we want all the tr elements under that. So...  
`$('#search_results > tbody > tr > td:nth-child(2) > table > tbody > tr')`

If we run that and expand the first in the list it returns we see we want the first td and then the link under that. Easy...  
`$('#search_results > tbody > tr > td:nth-child(2) > table > tbody > tr > :first-child > a')`

Hello link elements!

But all this is feels a bit dirty. Look at the length of that! Could we have done it a better way? Hmm, if we go back to our `#search_results`, what can we say about the links we want? Well, they all begin with showthread. Can we use this? We actually can, because only the links under the #search_results id that we're interested in have this property! It's best not do this on the whole page as we might pick up random things the tsr admins have (or will) decided to put in the navigation bar.

So...  
`$('#search_results a[href^="showthread"]')`

Look at the jquery bible I've linked for the meaning of `^=`. The space between the selector terms just means 'somewhere under this element'. The tag selector (`a`) is not strictly necessary, but I find it helpful as a note of what I'm looking for.

Note I've deliberately chosen not to use the `data-gac` attribute of the links. I don't know what it is and it could disappear at any time. Better to use properties about elements you can rely on.

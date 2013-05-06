---
published: false
layout: article
title: Lesson 2 - The realms of the Gods
abstract: Short summary of your article.
author: Chrosson
categories:
- articles
---

### Definitions and ideas
* DOM ('Document Object Model') tree: the tree of elements the browser represents a page as. Open your favorite page inspection tool - notice theres a single 'root' (HTML) element and you can expand that to get elements underneath (contained within) that element. There are no loops. Keep this in the back of your mind.

### Know thy history - jQuery, superglue and swiss army knifes 
Once upon a time there was IE6 and it was very bad. Then came Firefox and it was quite bad. IE7 and Firefox 2 arrived (five *years* after IE6) and they were bad. Firefox was the better, but not enough to become a major player quickly. Two more years passed and Chrome (and IE8 and Firefox 3.5) was initially released but only began to take off a year later, 2010. A year after that, mobile browser share began to take off and IE9 was released. Welcome to the beginning of 2011 and the dawn of modern web development.

The point of this story is to give you an idea of the scene for jQuery. Javascript was ([and sometimes still is](http://www.crockford.com/javascript/javascript.html)) considered a toy language. It was used for silly effects, not building a website. Part of the problem was the domination of IE6,7,8 for so long with such weak support for Javascript (modern browsers can be literally hundreds of times faster) and incompatibility with official specifications (and Firefox).

jQuery offers *cross browser* functionality to make fundamental tasks work the same way everywhere. Using it gives you compatibility almost for free. It also gives convenience functions to make things easy for the developer. No wonder it's so popular. 1

Remember though, you're targeting (with userscripts) Chrome/Firefox, which typically do the right (i.e. standardised) thing. jQuery is more useful here for making readable code.

# Castles in the sky

Q: What's an example of something jQuery makes easier?  
A: DOM manipulation.

Pretend the DOM (i.e. the webpage) is a car. DOM manipulation allows us to rebuild the page in the form of a tank, or a batmobile. Or, if we do it wrong, leave it in pieces on the floor. And to try again, we can just refresh the page. Specifically, DOM manipulation allows us to add and remove elements, move them around on the page, change their attributes...shape the page exactly as we want it.

Javascript does allow DOM manipulation but, to paraphrase an unknown person, 'writing javascript always feels like a hack'.
```
var span = document.createElement('span');
span.style.fontSize = '20px';
span.textContent = 'This is a span';
document.body.appendChild(span);
```
```
$('<span>')
    .css('font-size', '20px')
    .text('This is a span')
    .appendTo('body');
```
(the second can be expressed on one line - I've split it for readability and to demonstrate a 1 to 1 mapping from the top to bottom)

They're both equivalent - they create a span element, make the font size 20, set the text and put it in the body of the html document. You decide which you prefer. At minimum, the second requires less typing.

I now suggest you download jQAPI (alternative documentation browser for jQuery) and flick through the 'Manipulation' section. It's also a great searching reference.

## Example

We're going to play around a bit to see what we can do with jQuery. Let's start with the selector from last time - `$('#search_results a[href^="showthread"]')`

`$('#search_results a[href^="showthread"]').remove()` - surprise surprise, this removes all of those links we looked so hard for last time. Note we get a list in the console output - this is what allows us to 'chain' jQuery commands. So...

`$('#search_results a[href^="showthread"]').remove().text()` - we have chained on the 'text' command. We now remove the elements and get the text from them all. Note that we've got a string back in the JS console this time so we can't chain any more commands on the end. But how do we know when we can and can't!? Well, we look at the documentation - jQAPI gives '.remove(selector) → jQuery' and '.text() → String'. Well that makes sense - if we get a jQuery thing back, we can chain more jQuery commands on it. Careful though...

`$('#search_results a[href^="showthread"]').text('1234').css('color', 'red')` - scroll down a bit on the page for the text command and we see '.text(textString) → jQuery'. jQuery behaves differently depending on what you want to do. Logically, if you're setting the text you might want to set something else. Let's move onto something more interesting...

`$('#search_results a[href^="showthread"]').map(function (i, elt) { return $(elt).attr('href') })` - we've got each of our link elements. We then use the map command...which apparently 'Pass[es] each element in the current matched set through a function, producing a new jQuery object containing the return values.' Bit opaque. All we're doing is going through each element and getting the 'href' attribute, i.e. where we link to. Note that to get jQuery functions on the plain DOM element we had to 'wrap' it in jQuery. We can actually rephrase the above:
```
var eltList = $('#search_results a[href^="showthread"]');
var hrefList = [];
var length = eltList.length;
var href;
for (var i = 0; i < length; i++) {
  href = $(eltList[i]).attr('href');
  hrefList.push(href);
}
```
Let's move swiftly onwards - we'll come to a bit of background on what's happening above in the next lesson. Anyway, we haven't actually built anything yet - not much of a deity.

`$('<a>')` - a link element. Note how it looks quite similar to the command to select all link elements. jQuery can only tell the difference because of the '<' and '>', so don't forget them.

`$('<a>').attr('href', 'http://www.google.com').text('Big G')` - creates a link element to google with some text.

`$('<a>').attr('href', 'http://www.google.com').text('Big G').insertBefore('#search_results a[href^="showthread"]')` - at long last, we're putting things onto the page. Remember all the many manipulation commands (append, appendTo, prepend etc)? This one happens to do what we want - insert a copy of this link before each element returned by the selector. Now lets combine a little variation on the 'map' command we saw above and our construction here...

```
$('#search_results a[href^="showthread"]').each(function (i, elt) {
  $('<a>').attr('href', elt.href).text('Linky').insertBefore(elt);
});
```
Note that the above can be put on 5 lines (split the 'function' and '}' to a line and indent level by themselves) or 1 line, but I prefer this style. Go with whatever you find readable.  
So what have we done? For 'each' element we've found, create a link element which links to the same link as to the thread link. Perhaps a bit of an anticlimax, but from here we know how to do something to each of a set of elements on a page.

1 Note, however, that it offers no support for building large-scale Javascript sites - it is not a 'framework'.

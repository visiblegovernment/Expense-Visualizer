// 8< ---[placement.js]---

var placement=placement||{}
var __this__=placement
placement.__VERSION__='1.0.1';
placement.// The _Placement_ module provides a set of operations that make it easy to
// place HTML elements relatively to each other. The _placement_ module is the
// foundation for many nice UI element such as tooltips, notifications and 
// various other indications.
// 
// This module makes use of the[jQuery 1.2](http://www.jquery.com) library.
// 
// Types:
// 
// - _position_ is a map of '{x:Integer,y:Integer}'
// - _area_     is a map of '{x:Integer,y:Integer,w:Integer,h:Integer}'
// - _anchor_   is a string of 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' or 'C'
// 
// Anchor model:
// 
// >                        NW----------N----------NE
// >                        |                       |
// >                        |                       |
// >                        W           C           E
// >                        |                       |
// >                        |                       |
// >                        SW----------S----------SE
$=jQuery
placement.MARKER_COUNT=0
placement.PAGE=':page'
placement.WINDOW=':window'
placement.getBox=	function(element){
		// Gets the whole CSS box model information for this element.
		// 
		// 
		// >               ......   WIDTH  .......
		// >           +----------------------------+
		// >           |           MARGIN           |
		// >           |   +---------------------+  | :
		// >           |   |       BORDER        |  | :
		// >           |   |  +---------------+  |  | :
		// >           |   |  |    PADDING    |  |  | :
		// >           |   |  |  +---------+  |  |  |
		// >           |   |  |  | ELEMENT |  |  |  | HEIGHT
		// >           |   |  |  +---------+  |  |  |
		// >           |   |  |               |  |  | :
		// >           |   |  +---------------+  |  | :
		// >           |   |                     |  | :
		// >           |   +---------------------+  | :
		// >           |                            |
		// >           +----------------------------+
		// 
		// The width and height of the element will take into account the padding and
		// the border.
		// 
		// If the element is _hidden_, then you'll just receive a box with
		// undefined property. You have to make sure that the element is visible and do
		// a  '$(e) show ()' yourself before using placement functions.
		var __this__=placement;
		if ( (element === placement.WINDOW) )
		{
			return {'x':window.pageXOffset, 'y':window.pageYOffset, 'w':window.innerWidth, 'h':window.innerHeight}
		}
		else if ( (element === placement.PAGE) )
		{
			return {'x':0, 'y':0, 'w':window.outerWidth, 'h':window.outerHeight}
		}
		var was_hidden=false;
		var e=placement.$(element);
		if ( ((e.length == 0) || e.is(':hidden')) )
		{
			return {'x':undefined, 'y':undefined, 'w':undefined, 'h':undefined}
		}
		var position=e.offset();
		var box={'x':position.left, 'y':position.top, 'w':Math.min(Math.max(e.width(), (parseInt(e.css('minWidth')) || 0)), (parseInt(e.css('maxWidth')) || 999999)), 'h':Math.min(Math.max(e.height(), (parseInt(e.css('minHeight')) || 0)), (parseInt(e.css('maxHeight')) || 999999)), 'marginTop':(parseInt(e.css('marginTop')) || 0), 'marginBottom':(parseInt(e.css('marginBottom')) || 0), 'marginLeft':(parseInt(e.css('marginLeft')) || 0), 'marginRight':(parseInt(e.css('marginRight')) || 0), 'paddingTop':(parseInt(e.css('paddingTop')) || 0), 'paddingBottom':(parseInt(e.css('paddingBottom')) || 0), 'paddingLeft':(parseInt(e.css('paddingLeft')) || 0), 'paddingRight':(parseInt(e.css('paddingRight')) || 0), 'borderTop':(parseInt(e.css('borderTopWidth')) || 0), 'borderBottom':(parseInt(e.css('borderBottomWidth')) || 0), 'borderLeft':(parseInt(e.css('borderLeftWidth')) || 0), 'borderRight':(parseInt(e.css('borderRightWidth')) || 0)};
		box.w = (box.w + (((box.paddingLeft + box.paddingRight) + box.borderLeft) + box.borderRight));
		box.h = (box.h + (((box.paddingTop + box.paddingBottom) + box.borderTop) + box.borderBottom));
		return box
	}
placement.getPosition=	function(element){
		// Gets the position of an element relative to the viewport.
		// For accurate calculations make sure to use pixel values for margins, borders and padding.
		// This method only works with visible and invisible elements.
		var __this__=placement;
		var box=placement.getBox(element);
		return {'x':box.x, 'y':box.y}
	}
placement.getRelativePosition=	function(element){
		// Gets the top and left position of an element relative to its offset parent.
		// For accurate calculations make sure to use pixel values for margins, borders and padding.
		// This method only works with visible and invisible elements.
		var __this__=placement;
		var e=placement.$(element);
		if ( e.is(':hidden') )
		{
			return {'x':undefined, 'y':undefined}
		}
		else if ( true )
		{
			var position=e.position();
			return {'x':position.left, 'y':position.top}
		}
	}
placement.setPosition=	function(element, pos){
		// Sets the element at the given position, taking into account its box model.
		var __this__=placement;
		var e=placement.$(element);
		var box=placement.getBox(element);
		if ( (placement.$(e).css('position') != 'absolute') )
		{
			extend.print("Placement: Element does not have 'position:absolute', which is likely to cause positioning problems")
		}
		e.css({'position':'absolute', 'left':((pos.x - box.marginLeft) + 'px'), 'top':((pos.y - box.marginTop) + 'px')})
	}
placement.setArea=	function(element, area){
		// Sets the area '{x:N,y:N,w:N,h:N}' for the given 'element'. The element
		// 'position' CSS class will be put to 'absolute'
		var __this__=placement;
		var e=placement.$(element);
		var box=placement.getBox(element);
		e.css({'position':'absolute', 'left':((area.x - box.marginLeft) + 'px'), 'top':((area.y - box.marginRight) + 'px'), 'width':(((((area.w - box.paddingLeft) - box.paddingRight) - box.borderLeft) - box.borderRight) + 'px'), 'height':(((((area.h - box.paddingTop) - box.paddingBottom) - box.borderTop) - box.borderBottom) + 'px')})
	}
placement.getArea=	function(element){
		// Returns the area '{x:N,y:N,w:N,h:N}' corresponding to the given 'element'
		var __this__=placement;
		var box=placement.getBox(element);
		return {'x':box.x, 'y':box.y, 'w':box.w, 'h':box.h}
	}
placement.getRelativeArea=	function(element){
		// returns the area with the x and y relative to it's parent
		var __this__=placement;
		var e=placement.$(element);
		var position=placement.getRelativePosition(e);
		var area={'x':position.x, 'y':position.y, 'w':e.width(), 'h':e.height()};
		return area
	}
placement.contains=	function(container, area){
		var __this__=placement;
		var x_in=((area.x >= container.x) && (area.x <= (container.x + container.w)));
		var y_in=((area.y >= container.y) && (area.y <= (container.y + container.h)));
		if ( (x_in && y_in) )
		{
			return true
		}
		else if ( true )
		{
			return false
		}
	}
placement.isAreaOver=	function(area1, area2){
		var __this__=placement;
		if ( ((((area1.x > area2.x) && (area1.x < (area2.x + area2.w))) || (((area1.x + area1.w) > area2.x) && ((area1.x + area1.w) < (area2.x + area2.w)))) || (((area1.w > area2.w) && (area1.x < area2.x)) && ((area1.x + area1.w) > (area2.x + area2.w)))) )
		{
			return true
		}
		else if ( true )
		{
			return false
		}
	}
placement.isOver=	function(element1, element2){
		// Returns True if an element is over an another one
		var __this__=placement;
		var area1=placement.getArea(element1);
		var area2=placement.getArea(element2);
		return placement.isAreaOver(area1, area2)
	}
placement.estimatePosition=	function(element, targetElement, anchor, targetAnchor, offset, minpos){
		// Estimates the desired position for the given 'element' if it should be placed next
		// to the 'targetElement' using the 'anchor' and 'targetAnchors' anchors.
		// 
		// This returns a Map of '{x:Number,y:Number}' representing the position in pixels.
		var __this__=placement;
		var target_pos=placement.getAnchorPosition(targetElement, targetAnchor);
		var element_pos=placement.getPosition(element);
		var element_apos=placement.getAnchorPosition(element, anchor);
		return placement.computeOffset(element_pos, target_pos, element_apos)
	}
placement.estimateAreaPosition=	function(elementArea, targetElementArea, anchor, targetAnchor, offset, minpos){
		// This is the same as 'estimatePosition', only a bit more complex (and a bit slower too) as it
		// estimates the _width_ and _height_ in addition to _x_ and _y_ offsets.
		var __this__=placement;
		var target_pos=placement.getAnchorPositionArea(targetElementArea, targetAnchor);
		var element_pos=elementArea;
		var element_apos=placement.getAnchorPositionArea(elementArea, elementAnchor);
		return placement.computeOffset(element_pos, target_pos, element_apos)
	}
placement.computeOffset=	function(elementPos, targetPos, anchorPos){
		// Computes the position that results from placing the given 'elementPos' relatively to the
		// 'targetPos', taking into account the given 'anchorPos'.
		// 
		// When the 'anchorPos' is '{x:0,y:0}', ...
		var __this__=placement;
		anchorPos = anchorPos === undefined ? {'x':0, 'y':0} : anchorPos
		var anchor_offset={'x':(elementPos.x - anchorPos.x), 'y':(elementPos.y - anchorPos.y)};
		var offset=(offset || {'x':0, 'y':0});
		var target_x=((targetPos.x + anchor_offset.x) + offset.x);
		var target_y=((targetPos.y + anchor_offset.y) + offset.y);
		target_x = Math.floor(Math.max(target_x, 0));
		target_y = Math.floor(Math.max(target_y, 0));
		return {'x':target_x, 'y':target_y}
	}
placement.getAnchorPosition=	function(element, anchor){
		// Gets the position for the given 'anchor' for the given element. This will
		// take care of invoking 'getArea' and then 'getAnchorPositionArea'.
		var __this__=placement;
		var area=placement.getArea(element);
		return placement.getAnchorPositionArea(area, anchor)
	}
placement.getAnchorPositionArea=	function(area, anchor){
		// Computes the _position_ ('{x:Integer,y:Integer}) for the anchor on the given
		// area.
		// 
		// An _anchor_ is a point that you place at a specific orientation:
		// 
		// - North ('N'), which represents the _top center_ position
		// - North-East ('NE'), which represents the _upper right_ corner
		// - East ('E'), which represents the _middle right_ position
		// - South-East ('SE'), which represents the _lower right_ corner
		// - South ('S'), which represents the _lower center_ position
		// - South-West ('SW'), which represents the _lower left_ corner
		// - West ('W'), which represents the _middle left_ position
		// - North-West ('NW'), which represents the _top left_ corner
		// - Center ('C'), which represents the _center_ position
		// 
		// As anchors are points, they're not considered to have a width and a height.
		var __this__=placement;
		var res=[(area.x + (area.w / 2)), area.y];
		if ( (anchor == 'N') )
		{res = [(area.x + (area.w / 2)), area.y];}
		if ( (anchor == 'NE') )
		{res = [(area.x + area.w), area.y];}
		if ( (anchor == 'E') )
		{res = [(area.x + area.w), (area.y + (area.h / 2))];}
		if ( (anchor == 'SE') )
		{res = [(area.x + area.w), (area.y + area.h)];}
		if ( (anchor == 'S') )
		{res = [(area.x + (area.w / 2)), (area.y + area.h)];}
		if ( (anchor == 'SW') )
		{res = [area.x, (area.y + area.h)];}
		if ( (anchor == 'W') )
		{res = [area.x, (area.y + (area.h / 2))];}
		if ( (anchor == 'NW') )
		{res = [area.x, area.y];}
		if ( (anchor == 'C') )
		{res = [(area.x + (area.w / 2)), (area.y + (area.h / 2))];}
		return {'x':res[0], 'y':res[1]}
	}
placement.center=	function(source, targetElement){
		var __this__=placement;
	}
placement.cover=	function(source, targetElement, margin){
		// Displays the @source element "in place" of the @target element. This
		// basically just gets the position for the target, and resizes the
		// element so that it fits the target.
		var __this__=placement;
		var area=placement.getArea(targetElement);
		if ( margin )
		{
			area.x = (area.x - margin);
			area.y = (area.y - margin);
			area.w = (area.w + (margin * 2));
			area.h = (area.h + (margin * 2));
		}
		placement.setArea(source, area)
	}
placement.distance=	function(element, targetElement, anchor, targetAnchor){
		// Computes the distance between the given 'element' and the 'targetElement' using 'anchor'
		// and 'targetAnchors' to determine the point of comparison.
		// 
		// >                    dx  
		// >                  +----+
		// >                  :    :
		// >              +...O-----------------+           O = targetAnchor (NW) on targeElement
		// >          dy  |   | (x,y)           |
		// >              +...|    0------------+----+      0 = anchor (NW) on element
		// >                  |    | (x1,y1)         |
		// >                  |    |                 |      dx = (x1-x)
		// >                  |    |                 |      dy = (y1-y)
		// >                  +----|                 |
		// >                       |                 |
		// >                       +-----------------+
		var __this__=placement;
		var target_pos=placement.getAnchorPosition(targetElement, targetAnchor);
		var element_pos=placement.getAnchorPosition(element, anchor);
		return {'x':(element_pos.x - target_pos.x), 'y':(element_pos.y - target_pos.y)}
	}
placement.getPlace=	function(element, targetElement, anchor, targetAnchor, offset, minpos){
		// Does the same as 'place' but does not sets the position of the element, and returns the computed
		// position for the element.
		// 
		// This is particularly useful when you try different positions and would like to get the best one
		var __this__=placement;
		offset = offset === undefined ? {'x':0, 'y':0} : offset
		minpos = minpos === undefined ? 0 : minpos
		if ( (placement.$(element).length == 0) )
		{
			return false
		}
		var position=placement.estimatePosition(element, targetElement, anchor, targetAnchor, offset, minpos);
		position.x = (position.x + offset.x);
		position.y = (position.y + offset.y);
		return position
	}
placement.place=	function(element, targetElement, anchor, targetAnchor, offset, minpos){
		// Places the given 'element' near the 'targetElement' using the 'targetAnchor' and 'elementAnchor' to
		// place them.
		// 
		// >    # Places 'thisDiv' south (S) corner on 'nextToThisDiv' north (N) corner
		// >    placement place ( thisDiv, nextToThisDiv, "S", "N" )
		var __this__=placement;
		offset = offset === undefined ? {'x':0, 'y':0} : offset
		minpos = minpos === undefined ? 0 : minpos
		var position=placement.getPlace(element, targetElement, anchor, targetAnchor, offset, minpos);
		if ( position )
		{placement.setPosition(element, {'x':position.x, 'y':position.y})}
		return position
	}
placement.decorate=	function(element, targetElement){
		// Decorates the 'targetElement' with parts of the given 'element'. Basically, the
		// decoration works like this:
		// 
		// >                  +----+------------+----+
		// >                  | NE |     N      | NW |
		// >                  +----+------------+----+
		// >                  |    |            |    |
		// >                  | E  |   TARGET   |  W |
		// >                  |    |            |    |
		// >                  +----+------------+----+
		// >                  | SE |     S      | SW |
		// >                  +----+------------+----+
		// 
		// Where the target is surrounded by the '.N', '.NW', ... , '.NE' matching elements
		// of the given 'element'. It should be noted that
		// 
		// - the 'N' and 'S' elements width will be constrained by the 'TARGET' width
		// - the 'E' and 'W' elements height will be constrained by the 'TARGET' height.
		// - the 'NE' and 'NW' elements height will be constrained by the 'N' height.
		// - the 'SE' and 'SW' elements height will be constrained by the 'S' height.
		// - the 'NE' and 'SE' elements width will be constrained by the 'E' width.
		// - the 'NW' and 'SW' elements width will be constrained by the 'W' width.
		var __this__=placement;
		var target_box=placement.getBox(targetElement);
		var n=placement.$('.N', element);
		var s=placement.$('.S', element);
		var e=placement.$('.E', element);
		var w=placement.$('.W', element);
		var ne=placement.$('.NE', element);
		var nw=placement.$('.NW', element);
		var se=placement.$('.SE', element);
		var sw=placement.$('.SW', element);
		var n_box=placement.getBox(n);
		var s_box=placement.getBox(s);
		var e_box=placement.getBox(e);
		var w_box=placement.getBox(w);
		var ne_box=placement.getBox(ne);
		var nw_box=placement.getBox(nw);
		var se_box=placement.getBox(se);
		var sw_box=placement.getBox(sw);
		n_box.x = target_box.x;
		n_box.y = (target_box.y - n_box.h);
		n_box.w = target_box.w;
		s_box.x = target_box.x;
		s_box.y = (target_box.y + target_box.h);
		s_box.w = target_box.w;
		e_box.x = (target_box.x - e_box.w);
		e_box.y = target_box.y;
		e_box.h = target_box.h;
		w_box.x = (target_box.x + target_box.w);
		w_box.y = target_box.y;
		w_box.h = target_box.h;
		ne_box.h = (n_box.h || ne_box.h);
		ne_box.w = (e_box.w || ne_box.w);
		ne_box.x = (e_box.x || (target_box.x - ne_box.w));
		ne_box.y = (n_box.y || (target_box.y - ne_box.h));
		nw_box.h = (n_box.h || nw_box.h);
		nw_box.w = (w_box.w || nw_box.w);
		nw_box.x = (w_box.x || (target_box.x + target_box.w));
		nw_box.y = (n_box.y || (target_box.y - ne_box.h));
		se_box.w = (e_box.w || se_box.w);
		se_box.h = (s_box.h || se_box.h);
		se_box.y = (s_box.y || target_box.y);
		se_box.x = (e_box.x || (target_box.x - se_box.w));
		sw_box.w = (w_box.w || sw_box.w);
		sw_box.h = (s_box.h || sw_box.h);
		sw_box.x = (w_box.x || (target_box.x + target_box.w));
		sw_box.y = (s_box.y || (target_box.y + target_box.h));
		placement.setArea(n, n_box)
		placement.setArea(s, s_box)
		placement.setArea(e, e_box)
		placement.setArea(w, w_box)
		placement.setArea(ne, ne_box)
		placement.setArea(nw, nw_box)
		placement.setArea(se, se_box)
		placement.setArea(sw, sw_box)
	}
placement.opposite=	function(direction){
		// Returns the opposite direction of the given direction, eg. "N" will give "S",
		// "SE" will give "SW", etc.
		var __this__=placement;
		var res='C';
		if ( (direction == 'N') )
		{
			res = 'S';
		}
		if ( (direction == 'NE') )
		{
			res = 'SW';
		}
		if ( (direction == 'E') )
		{
			res = 'W';
		}
		if ( (direction == 'SE') )
		{
			res = 'NW';
		}
		if ( (direction == 'S') )
		{
			res = 'N';
		}
		if ( (direction == 'SW') )
		{
			res = 'NE';
		}
		if ( (direction == 'W') )
		{
			res = 'E';
		}
		if ( (direction == 'NW') )
		{
			res = 'SE';
		}
		if ( (direction == 'C') )
		{
			res = 'C';
		}
		return res
	}
placement.inverse=	function(position){
		// Inverts the 'x' and 'y' components of the given position. This can be handy
		// when using positions as offsets:
		// 
		// >   # Here we use the inverse distance as an offset for the placement
		// >   var d = placement distance (a,b)
		// >   placement place (a,c,"C","C", placement invert(d))
		var __this__=placement;
		position.x = (0 - position.x);
		position.y = (0 - position.y);
		return position
	}
placement._createMarker=	function(label){
		// Creates an HTML marker element that can be used for testing the placement
		// in HTML documents. This requires the [markup](http://www.ivy.fr/js/markup)
		// library.
		var __this__=placement;
		label = label === undefined ? undefined : label
		var marker=html.div({'_':'placement-marker'}, html.span({'_':'label'}, (label || ('' + placement.MARKER_COUNT))));
		placement.$(marker).css({'position':'absolute', 'z-index':'1024', 'min-width':'12px', 'height':'10px', 'font':'9px Monaco,monospace', 'color':'white', 'background':'red', 'padding':'2px', 'margin':'0px', 'border':'0px solid transparent', 'opacity':'0.5'})
		if ( (placement.$('#Placement-Markers').length == 0) )
		{
			placement.$('body').append(html.div({'id':'Placement-Markers'}))
		}
		placement.$('#Placement-Markers').append(marker)
		placement.MARKER_COUNT = (placement.MARKER_COUNT + 1);
		return marker
	}
placement.mark=	function(selector, anchors){
		// Marks the given 'selector' 'anchors' (by default, all of them) and returns a map
		// with:
		// 
		// - 'update' as a callback for updating the markers position
		// - 'markers' as an array of the created markers
		// 
		// This function is very useful for debugging placement, you can use it like that:
		// 
		// >    var m = placement mark (".some.element")
		// >    placement place (".some.element", .... )
		// >    m update ()
		var __this__=placement;
		anchors = anchors === undefined ? ['N', 'NE', 'SE', 'E', 'S', 'SW', 'W', 'NW', 'C'] : anchors
		var markers=[];
		extend.iterate(anchors, function(l){
			var m=placement._createMarker(l);
			placement.place(m, selector, placement.opposite(l), l)
			markers.push(m)
		}, __this__)
		var update=function(){
			extend.iterate(anchors, function(l, i){
				placement.place(markers[i], selector, placement.opposite(l), l)
			}, __this__)
		};
		return {'update':update, 'markers':markers}
	}
placement.init=	function(){
		var __this__=placement;
	}
placement.init()


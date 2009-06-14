# -----------------------------------------------------------------------------
# Project           : Placement module
# -----------------------------------------------------------------------------
# Author            : Sebastien Pierre                    <sebastien@akoha.org>
#                     Benoit Domingue                        <benoit@akoha.org>
# -----------------------------------------------------------------------------
# Creation date     : 15-Jan-2008
# Last modification : 01-Oct-2008
# -----------------------------------------------------------------------------

@module   placement
@version  1.0.1 (01-Oct-2008)
@requires Sugar (0.7.3), jQuery(1.1), Dimension(1.0.1), JavaScript
@target   JavaScript
@shared   $ = jQuery

| The _Placement_ module provides a set of operations that make it easy to
| place HTML elements relatively to each other. The _placement_ module is the
| foundation for many nice UI element such as tooltips, notifications and 
| various other indications.
|
| This module makes use of the[jQuery 1.2](http://www.jquery.com) library.
|
| Types:
|
|  - _position_ is a map of '{x:Integer,y:Integer}'
|  - _area_     is a map of '{x:Integer,y:Integer,w:Integer,h:Integer}'
|  - _anchor_   is a string of 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' or 'C'
|
| Anchor model:
|
|   >                        NW----------N----------NE
|   >                        |                       |
|   >                        |                       |
|   >                        W           C           E
|   >                        |                       |
|   >                        |                       |
|   >                        SW----------S----------SE


@shared MARKER_COUNT = 0
@shared PAGE         = ":page"
@shared WINDOW       = ":window"

# TODO: Add transition options for placement operations, so that the animation
# part can be directly taken into account here

# TODO: Rewrite optimized versions for the CSS and positioning functions

# FIXME: Update the getRelative... things

# -----------------------------------------------------------------------------
#
#  Basic Positioning functions
#
# -----------------------------------------------------------------------------

@function getBox element
| Gets the whole CSS box model information for this element.
|
|
| >               ......   WIDTH  .......
| >           +----------------------------+
| >           |           MARGIN           |
| >           |   +---------------------+  | :
| >           |   |       BORDER        |  | :
| >           |   |  +---------------+  |  | :
| >           |   |  |    PADDING    |  |  | :
| >           |   |  |  +---------+  |  |  |
| >           |   |  |  | ELEMENT |  |  |  | HEIGHT
| >           |   |  |  +---------+  |  |  |
| >           |   |  |               |  |  | :
| >           |   |  +---------------+  |  | :
| >           |   |                     |  | :
| >           |   +---------------------+  | :
| >           |                            |
| >           +----------------------------+
|
| The width and height of the element will take into account the padding and
| the border.
|
| If the element is _hidden_, then you'll just receive a box with
| undefined property. You have to make sure that the element is visible and do
| a  '$(e) show ()' yourself before using placement functions.

	if element is WINDOW
		return {
			x             : window pageXOffset
			y             : window pageYOffset
			w             : window innerWidth
			h             : window innerHeight
		}
	if element is PAGE
		return {
			x             : 0
			y             : 0
			w             : window outerWidth
			h             : window outerHeight
		}
	end
	var was_hidden = False
	var e          = $(element)
	if e length == 0 or (e \is ":hidden")
		return {
			x: Undefined
			y: Undefined
			w: Undefined
			h: Undefined
		}
	end
	# TODO: Handle scroll as well
	var position = e offset ()
	var box = {
		x             : position left
		y             : position top
		w             : Math min (Math max (e width  (), parseInt(e css "minWidth")  or 0), (parseInt(e css "maxWidth")  or 999999))
		h             : Math min (Math max (e height (), parseInt(e css "minHeight") or 0), (parseInt(e css "maxHeight") or 999999))
		marginTop     : parseInt( e css "marginTop" )         or 0
		marginBottom  : parseInt( e css "marginBottom" )      or 0
		marginLeft    : parseInt( e css "marginLeft" )        or 0
		marginRight   : parseInt( e css "marginRight" )       or 0
		paddingTop    : parseInt( e css "paddingTop" )        or 0
		paddingBottom : parseInt( e css "paddingBottom" )     or 0
		paddingLeft   : parseInt( e css "paddingLeft"  )      or 0
		paddingRight  : parseInt( e css "paddingRight" )      or 0
		borderTop     : parseInt( e css "borderTopWidth" )    or 0
		borderBottom  : parseInt( e css "borderBottomWidth" ) or 0
		borderLeft    : parseInt( e css "borderLeftWidth"  )  or 0
		borderRight   : parseInt( e css "borderRightWidth" )  or 0
	}
	box w += box paddingLeft + box paddingRight  + box borderLeft  + box borderRight
	box h += box paddingTop  + box paddingBottom + box borderTop   + box borderBottom
	return box
@end

@function getPosition element
| Gets the position of an element relative to the viewport.
| For accurate calculations make sure to use pixel values for margins, borders and padding.
| This method only works with visible and invisible elements.
	var box = getBox (element)
	return { x : box x, y: box y }
@end

@function getRelativePosition element
| Gets the top and left position of an element relative to its offset parent.
| For accurate calculations make sure to use pixel values for margins, borders and padding.
| This method only works with visible and invisible elements.
	var e        = $( element)
	if e \is ":hidden"
		return {x:Undefined, y:Undefined}
	else
		var position = e position()
		return { x: position left, y : position top }
	end
@end

@function setPosition element, pos
| Sets the element at the given position, taking into account its box model.
	var e   = $ (element)
	var box = getBox (element)
	if $(e) css "position" != "absolute"
		print ("Placement: Element does not have 'position:absolute', which is likely to cause positioning problems")
	end
	e css {
		position: "absolute"
		left  : (pos x - box marginLeft) + "px"
		top   : (pos y - box marginTop) + "px"
	}
@end

# -----------------------------------------------------------------------------
#
#  Basic Area functions
#
# -----------------------------------------------------------------------------

@function setArea element, area
| Sets the area '{x:N,y:N,w:N,h:N}' for the given 'element'. The element
| 'position' CSS class will be put to 'absolute'
	# FIXME: Take care of changing the position for the parent
	var e = $ (element)
	var box = getBox (element)
	e css {
		position: "absolute"
		left  : (area x - box marginLeft) + "px"
		top   : (area y - box marginRight) + "px"
		width : (area w - box paddingLeft - box paddingRight - box borderLeft - box borderRight) + "px"
		height: (area h - box paddingTop  - box paddingBottom - box borderTop - box borderBottom) + "px"
	}
@end

@function getArea element
| Returns the area '{x:N,y:N,w:N,h:N}' corresponding to the given 'element'
	var box = getBox (element)
	return {
		x : box x
		y : box y
		w : box w
		h : box h
	}
@end

@function getRelativeArea element
| returns the area with the x and y relative to it's parent
	var e = $(element)
	var position= getRelativePosition(e)

	var area = {
		x : position x
		y : position y
		w : e width()
		h : e height()
	}

	return area
@end

@function contains container, area
	var x_in = ( area x >= container x ) and (area x <= (container x + container w))
	var y_in = ( area y >= container y ) and (area y <= (container y + container h))
	if x_in and y_in
		return True
	else
		return False
	end
@end

@function isAreaOver area1, area2
	#TODO add y and height support !!!
	if  (area1 x > area2 x) and (area1 x < area2 x + area2 w ) ;
	or  (area1 x + area1 w > area2 x) and (area1 x + area1 w < area2 x  + area2 w)  ;
	or  (area1 w > area2 w) and ( area1 x < area2 x )  and ( area1 x + area1 w > area2 x + area2 w ) 
	 	return True
	else
		return False
	end
@end

@function isOver element1, element2
| Returns True if an element is over an another one
	var area1 = getArea( element1 )
	var area2 = getArea( element2 )
	return isAreaOver( area1, area2 )
@end

# -----------------------------------------------------------------------------
#
#  Anchoring Functions
#
# -----------------------------------------------------------------------------

@function estimatePosition element, targetElement, anchor, targetAnchor, offset, minpos
| Estimates the desired position for the given 'element' if it should be placed next
| to the 'targetElement' using the 'anchor' and 'targetAnchors' anchors.
|
| This returns a Map of '{x:Number,y:Number}' representing the position in pixels.
	# FIXME: Offset and minpos are not used
	var target_pos       = getAnchorPosition (targetElement, targetAnchor)
	var element_pos      = getPosition (element)
	var element_apos     = getAnchorPosition (element, anchor)
	return computeOffset ( element_pos, target_pos, element_apos )
@end

@function estimateAreaPosition elementArea, targetElementArea, anchor, targetAnchor, offset, minpos
| This is the same as 'estimatePosition', only a bit more complex (and a bit slower too) as it
| estimates the _width_ and _height_ in addition to _x_ and _y_ offsets.
	# FIXME: Offset and minpos are not used
	var target_pos       = getAnchorPositionArea (targetElementArea, targetAnchor)
	var element_pos      = elementArea
	var element_apos     = getAnchorPositionArea (elementArea, elementAnchor)
	return computeOffset( element_pos, target_pos, element_apos )
@end

@function computeOffset elementPos:Position, targetPos:Position, anchorPos:Position={x:0,y:0}
| Computes the position that results from placing the given 'elementPos' relatively to the
| 'targetPos', taking into account the given 'anchorPos'.
|
| When the 'anchorPos' is '{x:0,y:0}', ...
	# We compute the offset of the anchor relative to the element position
	var anchor_offset = {
		x : elementPos x - anchorPos x
		y : elementPos y - anchorPos y
	}
	# FIXME: Is this what we expect ?
	var offset        = offset or { x : 0, y : 0 }
	var target_x      = targetPos x + anchor_offset x + offset x
	var target_y      = targetPos y + anchor_offset y + offset y
	target_x          = Math floor( Math max (target_x,0) )
	target_y          = Math floor( Math max (target_y,0) )
	return { x : target_x, y : target_y }
@end

@function getAnchorPosition element, anchor
| Gets the position for the given 'anchor' for the given element. This will
| take care of invoking 'getArea' and then 'getAnchorPositionArea'.
	var area = getArea (element)
	return getAnchorPositionArea ( area, anchor )
@end

@function getAnchorPositionArea area, anchor
| Computes the _position_ ('{x:Integer,y:Integer}) for the anchor on the given
| area.
|
| An _anchor_ is a point that you place at a specific orientation:
|
| - North ('N'), which represents the _top center_ position
| - North-East ('NE'), which represents the _upper right_ corner
| - East ('E'), which represents the _middle right_ position
| - South-East ('SE'), which represents the _lower right_ corner
| - South ('S'), which represents the _lower center_ position
| - South-West ('SW'), which represents the _lower left_ corner
| - West ('W'), which represents the _middle left_ position
| - North-West ('NW'), which represents the _top left_ corner
| - Center ('C'), which represents the _center_ position
|
| As anchors are points, they're not considered to have a width and a height.
	var res  = [ area x + (area w / 2), area y  ]
	# TODO: Use a pattern matching operator for that (but we've got to
	# implement it first !)
	if anchor == 'N'  -> res = [ area x + (area w / 2)  , area y ]
	if anchor == 'NE' -> res = [ area x + area w        , area y ]
	if anchor == 'E'  -> res = [ area x + area w        , area y + (area h / 2) ]
	if anchor == 'SE' -> res = [ area x + area w        , area y + area h ]
	if anchor == 'S'  -> res = [ area x + (area w / 2)  , area y + area h ]
	if anchor == 'SW' -> res = [ area x                 , area y + area h]
	if anchor == 'W'  -> res = [ area x                 , area y + (area h / 2) ]
	if anchor == 'NW' -> res = [ area x                 , area y]
	if anchor == 'C'  -> res = [ area x + (area w / 2)  , area y + (area h / 2) ]
	return { x : res[0], y : res[1] }
@end

# -----------------------------------------------------------------------------
#
#  Placement functions
#
# -----------------------------------------------------------------------------

@function center source, targetElement
	
@end

@function cover source, targetElement, margin
| Displays the @source element "in place" of the @target element. This
| basically just gets the position for the target, and resizes the
| element so that it fits the target.

	var area = getArea (targetElement)
	if margin
		area x -= margin
		area y -= margin
		area w += margin * 2
		area h += margin * 2
	end
	setArea (source, area)
@end

@function distance element, targetElement, anchor, targetAnchor
| Computes the distance between the given 'element' and the 'targetElement' using 'anchor'
| and 'targetAnchors' to determine the point of comparison.
|
| >                    dx  
| >                  +----+
| >                  :    :
| >              +...O-----------------+           O = targetAnchor (NW) on targeElement
| >          dy  |   | (x,y)           |
| >              +...|    0------------+----+      0 = anchor (NW) on element
| >                  |    | (x1,y1)         |
| >                  |    |                 |      dx = (x1-x)
| >                  |    |                 |      dy = (y1-y)
| >                  +----|                 |
| >                       |                 |
| >                       +-----------------+
	var target_pos  = getAnchorPosition (targetElement, targetAnchor)
	var element_pos = getAnchorPosition (element, anchor)
	return {
		x : element_pos x - target_pos x
		y : element_pos y - target_pos y
	}
@end

@function getPlace element, targetElement, anchor, targetAnchor, offset={x:0,y:0}, minpos=0
| Does the same as 'place' but does not sets the position of the element, and returns the computed
| position for the element.
|
| This is particularly useful when you try different positions and would like to get the best one
	if $(element) length == 0 -> return False
	var position = estimatePosition ( element, targetElement, anchor, targetAnchor, offset, minpos )
	position x = position x + offset x
	position y = position y + offset y
	return position
@end

@function place element, targetElement, anchor, targetAnchor, offset={x:0,y:0}, minpos=0
| Places the given 'element' near the 'targetElement' using the 'targetAnchor' and 'elementAnchor' to
| place them.
|
| >    # Places 'thisDiv' south (S) corner on 'nextToThisDiv' north (N) corner
| >    placement place ( thisDiv, nextToThisDiv, "S", "N" )
	var position = getPlace (element,targetElement,anchor,targetAnchor,offset,minpos)
	if position -> setPosition( element, {x:position x, y:position y} )
	return position
@end

@function decorate element, targetElement
| Decorates the 'targetElement' with parts of the given 'element'. Basically, the
| decoration works like this:
|
| >                  +----+------------+----+
| >                  | NE |     N      | NW |
| >                  +----+------------+----+
| >                  |    |            |    |
| >                  | E  |   TARGET   |  W |
| >                  |    |            |    |
| >                  +----+------------+----+
| >                  | SE |     S      | SW |
| >                  +----+------------+----+
| 
| Where the target is surrounded by the '.N', '.NW', ... , '.NE' matching elements
| of the given 'element'. It should be noted that
|
| - the 'N' and 'S' elements width will be constrained by the 'TARGET' width
| - the 'E' and 'W' elements height will be constrained by the 'TARGET' height.
| - the 'NE' and 'NW' elements height will be constrained by the 'N' height.
| - the 'SE' and 'SW' elements height will be constrained by the 'S' height.
| - the 'NE' and 'SE' elements width will be constrained by the 'E' width.
| - the 'NW' and 'SW' elements width will be constrained by the 'W' width.

	var target_box = getBox (targetElement)
	var n          = $(".N", element)
	var s          = $(".S", element)
	var e          = $(".E", element)
	var w          = $(".W", element)
	var ne         = $(".NE", element)
	var nw         = $(".NW", element)
	var se         = $(".SE", element)
	var sw         = $(".SW", element)

	var n_box      = getBox (n)
	var s_box      = getBox (s)
	var e_box      = getBox (e)
	var w_box      = getBox (w)

	var ne_box     = getBox (ne)
	var nw_box     = getBox (nw)
	var se_box     = getBox (se)
	var sw_box     = getBox (sw)

	# FIXME: Should handle Padding, Margin, etc properly

	n_box x        = target_box x
	n_box y        = target_box y - n_box h
	n_box w        = target_box w

	s_box x        = target_box x
	s_box y        = target_box y + target_box h
	s_box w        = target_box w

	e_box x        = target_box x - e_box w
	e_box y        = target_box y
	e_box h        = target_box h

	w_box x        = target_box x + target_box w
	w_box y        = target_box y 
	w_box h        = target_box h

	# NOTE: Here the N,S,E,W may not exist, so we take this case into account.

	ne_box h       = n_box h or ne_box h
	ne_box w       = e_box w or ne_box w
	ne_box x       = e_box x or (target_box x - ne_box w)
	ne_box y       = n_box y or (target_box y - ne_box h)

	nw_box h       = n_box h or nw_box h
	nw_box w       = w_box w or nw_box w
	nw_box x       = w_box x or (target_box x + target_box w)
	nw_box y       = n_box y or (target_box y - ne_box h)

	se_box w       = e_box w or se_box w
	se_box h       = s_box h or se_box h
	se_box y       = s_box y or (target_box y )
	se_box x       = e_box x or (target_box x - se_box w)

	sw_box w       = w_box w or sw_box w
	sw_box h       = s_box h or sw_box h
	sw_box x       = w_box x or (target_box x + target_box w)
	sw_box y       = s_box y or (target_box y + target_box h)

	setArea (n, n_box)
	setArea (s, s_box)
	setArea (e, e_box)
	setArea (w, w_box)

	setArea (ne, ne_box)
	setArea (nw, nw_box)
	setArea (se, se_box)
	setArea (sw, sw_box)

@end

@function opposite direction
| Returns the opposite direction of the given direction, eg. "N" will give "S",
| "SE" will give "SW", etc.
	var res = "C"
	if direction == 'N'  -> res = "S"
	if direction == 'NE' -> res = "SW"
	if direction == 'E'  -> res = "W"
	if direction == 'SE' -> res = "NW"
	if direction == 'S'  -> res = "N"
	if direction == 'SW' -> res = "NE"
	if direction == 'W'  -> res = "E"
	if direction == 'NW' -> res = "SE"
	if direction == 'C'  -> res = "C"
	return res
@end

@function inverse position
| Inverts the 'x' and 'y' components of the given position. This can be handy
| when using positions as offsets:
|
| >   # Here we use the inverse distance as an offset for the placement
| >   var d = placement distance (a,b)
| >   placement place (a,c,"C","C", placement invert(d))
	position x = 0 - (position x)
	position y = 0 - (position y)
	return position
@end

# -----------------------------------------------------------------------------
#
#  Test functions
#
# -----------------------------------------------------------------------------

@function _createMarker label=Undefined
| Creates an HTML marker element that can be used for testing the placement
| in HTML documents. This requires the [markup](http://www.ivy.fr/js/markup)
| library.
	var marker = html div (
		{_:"placement-marker"}
		html span ({_:"label"}, (label or "" + MARKER_COUNT))
	)
	$ (marker) css {
		position    : "absolute"
		z-index     : "1024"
		min-width   : "12px"
		height      : "10px"
		font        : "9px Monaco,monospace"
		color       : "white"
		background  : "red"
		padding     : "2px"
		margin      : "0px"
		border      : "0px solid transparent"
		opacity     : "0.5"
	}
	if $ "#Placement-Markers" length == 0
		$ "body" append (html div {id:"Placement-Markers"})
	end
	$ "#Placement-Markers" append (marker)
	MARKER_COUNT += 1
	return marker
@end

@function mark selector, anchors=["N", "NE", "SE", "E", "S", "SW", "W", "NW", "C"]
| Marks the given 'selector' 'anchors' (by default, all of them) and returns a map
| with:
|
| - 'update' as a callback for updating the markers position
| - 'markers' as an array of the created markers
|
| This function is very useful for debugging placement, you can use it like that:
|
| >    var m = placement mark (".some.element")
| >    placement place (".some.element", .... )
| >    m update ()
	var markers = []
	anchors :: {l|
		var m = _createMarker (l)
		place (m, selector, opposite(l), l)
		markers push (m)
	}
	var update ={ anchors :: {l,i| place(markers[i],selector,opposite(l),l) } }
	return {update:update,markers:markers}
@end

# EOF

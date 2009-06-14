# -----------------------------------------------------------------------------
# Project           : Wallpaper
# -----------------------------------------------------------------------------
# Author            : Sebastien Pierre                    <sebastien@type-z.org>
# -----------------------------------------------------------------------------
# Creation date     : 12-Sep-2008
# Last modification : 03-Apr-2009
# -----------------------------------------------------------------------------

@module   wallpaper
@version  0.0.5 (03-Apr-2009)
@requires sugar, jQuery(1.2), placement
@target   JavaScript
@shared   $ = jQuery

@function error message
	alert (message)
@end

@function showOverlay selector
	var height = (placement getBox "body" h) + "px"
	$ (selector) css { height:height } removeClass "hidden"
	# TODO: Handle page resize
@end

@function hideOverlay selector
	$ (selector) addClass "hidden"
@end

@function hasWidget selector
| Tells if the given HTML node has a Widget instance already bound to it. If so, it
| returns the widget instance. If not, it returns 'Undefined'
	var nodes = $ (selector)
	if nodes length > 0 and nodes [0] widget != Undefined
		return nodes [0] widget
	else
		return Undefined
	end
@end

@function getWidget selector
	return hasWidget (selector)
@end

@function ensureWidget selector, widgetClass
| Ensures that an instance of the given widget class is already bound to the given selector
	var nodes = $ (selector)
	if nodes length > 0
		if nodes [0] widget == Undefined
			return new widgetClass (selector)
		else
			return nodes [0] widget
		end
	else
		return None
	end
@end

# -----------------------------------------------------------------------------
#
#  CORE WIDGET CLASS
#
# -----------------------------------------------------------------------------

@class Widget

	@shared   SELECTOR
	@shared   ACTIONS  = []
	@shared   FIELDS   = []
	@shared   Instance
	@property ui
	@property uis      = {}
	@property inputs   = {}
	@property outputs  = {}
	@property model    = Undefined

	@constructor selector=None
		Instance = self
		ui = $(selector or SELECTOR)
		if ui is Undefined or ui length == 0
			return error ("Cannot instanciate widget " + self getClass() getName() + ": selector empty " + selector)
		end
		if not (ui [0] widget is Undefined)
			return error ("Cannot bind widget " + self getClass() getName() + ": selector already has widget " + selector)
		end
		# console log ("CREATING NEW", self getClass() getName(),"from",selector or SELECTOR)
		ui [0] widget = self
		bindUI ()
	@end

	@method bindActions actions=ACTIONS
		for action in actions
			# console log ("--", ".do-" + action, $ (".do-" + action, ui) length, self getMethod (action) toSource () )
			$ (".do-" + action, ui) click {event|
				# console log ("--", action)
				self [action] (event)
			}
		end
	@end

	@method bindFields fields=FIELDS
		for field in fields
			inputs  [field] = $ (".in-" + field, ui)
			if inputs [field] length == 0
				inputs [field] = $ ("." + field + " .in", ui)
			end
			outputs [field] = $ (".out-" + field, ui)
			if outputs [field] length == 0
				outputs [field] = $ ("." + field + " .out", ui)
			end
			if inputs [field] length == 0 and outputs [field] length == 0
				error ("Field has no input or output: " + field)
			end
		end
	@end

	@method bindUI
		bindActions ()
		bindFields  ()
	@end

	@method getFieldValue field
		if (not field) or $(field) length == 0 -> return Undefined
		# console log ("GET", field, $(field) length)
		var node_name = $(field)[0] nodeName toLowerCase ()
		if $(field) hasClass "empty" -> return ""
		if node_name == "input" or node_name == "textarea"
			return $ trim ($(field) val ())
		else
			return $ trim ($(field) text ())
		end
	@end

	@method setFieldValue field, value
		if $(field) length == 0 -> return Undefined
		var node_name = $(field)[0] nodeName toLowerCase ()
		if node_name == "input" or node_name == "textarea"
			if not value
				$(field) val ("") addClass "empty"
			else
				$(field) val (value) removeClass "empty"
			end
		else
			if not value
				$(field) html ("&mdash;") addClass "empty"
			else
				$(field) text (value) removeClass "empty"
			end
		end
	@end
@end

# -----------------------------------------------------------------------------
#
#  MODAL EDITABLE WIDGET
#
# -----------------------------------------------------------------------------

@class ModalEditable: Widget

	@method bindUI
		$ ("input",    ui) keypress {$(target) removeClass "default"} addClass "default"
		$ ("input",    ui) click    {if $(target) hasClass "default" -> $(target) select ()}
		$ ("textarea", ui) keypress {$(target) removeClass "default"}
		bindActions ["edit", "view", "save", "cancel", "remove"]
		super bindUI ()
	@end

	@method edit
		syncInputsWithOutputs ()
		$ (".on-status.when-edit",   ui) removeClass "hidden"
		$ (".on-status.when-view",   ui) addClass    "hidden"
		$ (".when-edit input:first", ui) focus ()
		ui addClass    "editing"
		ui removeClass "view"
	@end

	@method view
		$ (".on-status.when-edit", ui) addClass    "hidden"
		$ (".on-status.when-view", ui) removeClass "hidden"
		ui removeClass "editing"
		ui addClass    "view"
	@end

	@method save
		if ui hasClass "new"
			ui removeClass "new"
			$ (".when-new", ui) addClass "hidden"
			$ (".when-not-new", ui) removeClass "hidden"
		end
		syncOutputsWithInputs ()
		view ()
	@end

	@method cancel
		view ()
	@end

	@method remove
		ui remove ()
	@end

	@method export fields=inputs, ignoreDefault=True
		var data = {}
		for input,name in fields
			if not (ignoreDefault and input hasClass "default")
				data [name] =  getFieldValue (input)
			end
		end
		return data
	@end

	@method import data, fields=inputs
		for value,name in data
			if fields [name]
				setFieldValue (fields[name], value)
			end
		end
	@end

	@method syncInputsWithOutputs
		import (export (outputs, False), inputs)
	@end

	@method syncOutputsWithInputs
		import (export(inputs), outputs)
	@end

@end

# -----------------------------------------------------------------------------
#
#  DROP-DOWN WIDGET
#
# -----------------------------------------------------------------------------

@class DropDown: Widget

	@shared SELECTOR = ".w-dropdown"
	@shared ACTIONS  = [
		"toggle"
	]

	@method toggle
		var drawer = $(".w-drawer", ui)
		$ (drawer) slideToggle ()
	@end

@end

# -----------------------------------------------------------------------------
#
#  TOOLTIP WIDGET
#
# -----------------------------------------------------------------------------

@class Tooltip: Widget

	@shared   SELECTOR = ".w-tooltip"
	@property boundElement

	@operation make onElement
		# FIXME: This does not work
		# for selector in $ ( SELECTOR, onElement)
		for selector in $ (Tooltip SELECTOR, onElement)
			var tooltip = new Tooltip (selector)
			tooltip bindTo (onElement)
		end
	@end

	@method bindTo element
		# TODO: Unbind element
		boundElement = element
		$ (boundElement) hover (
			show
			hide
		)
	@end

	@method show
		var target_box = placement getBox (boundElement)
		$ (ui) removeClass "hidden" fadeIn ()
	@end

	@method hide
		$ (ui) fadeOut ()
	@end

@end

# -----------------------------------------------------------------------------
#
#  CARDS WIDGET
#
# -----------------------------------------------------------------------------

@class Cards: Widget

	@shared   SELECTOR = ".w-cards"
	@shared ACTIONS  = [
		"startCard"
		"previousCard"
		"nextCard"
		"selectCard"
	]
	@property currentStep = 0

	@property boundElement

	@method startCard
		currentStep = 0
		_doSelectCurrentCard ()
	@end

	@method nextCard
		currentStep += 1
		_doSelectCurrentCard ()
	@end

	@method previousCard
		if currentStep > 0
			currentStep -= 1
			_doSelectCurrentCard ()
		end
	@end

	@method selectCard e
		var card = $ (e target) attr "card"
		# We decrement because we want that the number corresponds to the number
		# of the .N class.
		# Ex: .N1 <==> (card=1)   and not .N1 <==> (card=0)
		currentStep = parseInt (card) - 1
		_doSelectCurrentCard ()
	@end

	@method _doSelectCurrentCard
		$ ( ".w-card.current", ui) removeClass "current"
		$ ( ".w-card.N" + (currentStep + 1), ui) addClass "current"
	@end

@end

# -----------------------------------------------------------------------------
#
#  CARDS WIDGET
#
# -----------------------------------------------------------------------------

@class List: Widget

	@shared SELECTOR = ".w-list"
	@shared ELEMENT_SELECTOR = "li"

	@method bindUI
		super bindUI ()
		$ (ELEMENT_SELECTOR, ui ) click { selectElement (target) }
		$ (".filter .in-value", ui) keyup {
			filterBy ($(target) val ())
		}
		$ (ui) keypress {event|}
	@end

	@method selectElement element
		if not $(element) hasClass "selected"
			$ (ELEMENT_SELECTOR+".current", ui) removeClass "current"
			$ (element) addClass "current"
		end
	@end

	@method filterBy criteria
		criteria = criteria toLowerCase ()
		var empty = True
		for element in $(ELEMENT_SELECTOR, ui)
			if $ (element) text () toLowerCase () indexOf (criteria) == -1
				$ (element) addClass "hidden"
			else
				$ (element) removeClass "hidden"
				empty = False
			end
		end
		if empty
			$(".when-empty") removeClass "hidden"
		else
			$(".when-empty") addClass "hidden"
		end
	@end

@end

# -----------------------------------------------------------------------------
#
#  SLIDER WIDGET
#
# -----------------------------------------------------------------------------

@class Slider: Widget

	@shared SELECTOR = ".w-slider"

	@property    value = 0.0
	@property    start = 0.0
	@property    end   = 0.0

	@method bindUI
		uis body        = $ (".w-slider-body",  ui)
		uis cursor      = $ (".w-cursor",       ui)
		if uis cursor hasClass "is-resizable"
			# FIXME: Here we have to make sure that the callback does not take
			# to much time if we want live update of something according to this
			# slider... so we have to find a mechanism for that
			uis cursor resizable {
				containment : uis body
				handles     : "e,w"
				resize      : {_cursorUpdating()}
				stop        : {_cursorUpdated()}
			}
			uis cursor draggable {
				containment : uis body
				axis        : "x"
				drag        : {_cursorUpdating()}
				stop        : {_cursorUpdated()}
			}
		end
	@end

	@method _updateFromCursor
		# FIXME: Cache this if possible
		var cursor_width = parseInt (uis cursor css "width")
		var cursor_left  = parseInt (uis cursor css "left")
		var body_width   = parseInt (uis body   css "width")
		start = cursor_left / body_width
		value = cursor_width / body_width
		end   = (cursor_left + cursor_width) / body_width
	@end

	@method _cursorUpdated
		_updateFromCursor ()
		onCursorUpdated (value, start, end)
	@end

	@method _cursorUpdating
		_updateFromCursor ()
		onCursorUpdating (value, start, end)
	@end

	@method onCursorUpdated  value, start, end
	@end

	@method onCursorUpdating value, start, end
	@end


@end

# -----------------------------------------------------------------------------
#
#  INIT
#
# -----------------------------------------------------------------------------

@function bind
	$ (DropDown SELECTOR) :: {s|new DropDown (s)}
	$ (Cards SELECTOR)    :: {s|new Cards    (s)}
	$ (List SELECTOR)     :: {s|new List     (s)}
	$ (Slider SELECTOR)   :: {s|new Slider   (s)}
	$ (".has-tooltip")    :: (Tooltip make)
@end

# EOF

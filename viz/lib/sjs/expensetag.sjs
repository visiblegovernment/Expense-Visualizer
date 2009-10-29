# -----------------------------------------------------------------------------
# Project   : VisibleGovernment
# -----------------------------------------------------------------------------
# Author    : Sebastien Pierre                       <sebastien@datalicious.ca>
# License   : BSD License
# -----------------------------------------------------------------------------
# Creation  : 07-Dec-2008
# Last mod  : 29-Oct-2009
# -----------------------------------------------------------------------------

@module expensetag
@import Widget from wallpaper

@shared DEPWHITELIST = {}

# FIXME: Optimize rendering by doing all layers in one looping pass
# FIXME: Grid should use data_subset instead of data 
# FIXME: Resize visualization canvas when window is resized
# FIXME: Refactor page interactions

@shared MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

@function clone value
| Clones the given value
	if isList (value)
		var result = []
		value :: {v,i| result append (clone (v))}
		return result
	if isObject (value)
		var result = {}
		value :: {v,k| result [k] = clone (v)}
		return result
	else
		return value
	end
@end

# ------------------------------------------------------------------------------
#
# SPENDING TAG WIDGET
#
# ------------------------------------------------------------------------------

@class ExpenseTag: Widget

	@shared   SELECTOR  = ".ExpenseTag"
	@shared   DATAMODEL = [
		{
			expenses: "Float"
			guidelines:"Float"
			inflation: "Float"
		}
	]

	@property data
	@property metrics

	@property retrieveExpenses
	@property retrieveGuidelines

	@property ctx
	@property parameters = Undefined

	@constructor ui
		parameters = {
			department:  Undefined
			cumulative:  True
			relative:    False
			travel:      True
			hospitality: True
			guidelines:  False
			guidelinesRatio: 1.00
			positions:   None
			globalMaxMonth:Undefined
			globalMaxTotal:Undefined
			grid:        {quarters:False, years:True, months:False}
			start:       {month:0,year:2003}
			end:         {month:11,year:2008}
			updater:     {ui,s,g|}
		}
		super (ui)
	@end

	@method bindUI
		super bindUI ()
		uis cursor  = $ (".cursor", ui)
		uis canvas  = $ ("canvas", ui) [0]
		ctx = uis canvas getContext "2d"
	@end

	@method getMetrics data
	| Returns an object with various metrics on the data displayed by this visualization. This
	| is called by 'getDatasetMetrics' which is called by 'updateTagsRendering'
		var start_mon    = (parameters start year - 2003) * 12 + parameters start month
		var end_mon      = (parameters end year   - 2003) * 12 + parameters end month
		var range_mon    = (start_mon)..(end_mon)
		# NOTE: For Spray, we have a similar iteration loop as for the rendering
		# section, so we should take advantage of this
		var metrics      = {
			maxMonth : {tra:0,tra_gd:0,hos:0,hos_gd:0,all:0,all_gd:0}
			total    : {tra:0,tra_gd:0,hos:0,hos_gd:0,all:0,all_gd:0}
		}
		for i in range_mon
			var d = data mon [i]
			if isList(parameters positions)
				d = data mon_pos [i]
			end
			if d
				var current  = {tra:0,tra_gd:0,hos:0,hos_gd:0,all:0,all_gd:0}
				if isList(parameters positions)
					for p in parameters positions
						var dp = d[p]
						if dp
							["tra", "tra_gd", "hos", "hos_gd", "all", "all_gd"] :: {k|current [k] += dp [k]}
						end
					end
				else
					current = d
				end
				# We update the total and the maximum value for the month
				["tra", "tra_gd", "hos", "hos_gd", "all", "all_gd"] :: {k| metrics total [k] += current [k]}
				["tra", "tra_gd", "hos", "hos_gd", "all", "all_gd"] :: {k|
					metrics maxMonth [k] = Math max (metrics maxMonth [k], current [k])
				}
			end
		end
		self metrics = metrics
		return metrics
	@end

	@method renderGrid data
	| Renders the background grid, with the months as vertical lines with the given data
	| as parameter
		var width        = parseInt ($(uis canvas) attr "width")
		var height       = parseInt ($(uis canvas) attr "height")
		var start_mon    = (parameters start year - 2003) * 12 + parameters start month
		var end_mon      = (parameters end year   - 2003) * 12 + parameters end month
		var range_mon    = (start_mon)..(end_mon)
		var x            = 0
		var x_step       = width / range_mon length
		var GRID_COLOR   = "#F0F0F0"
		ctx strokeStyle = GRID_COLOR
		for i in range_mon
			var is_year    = (i % 12) == 0
			var is_quarter = (i % 4) == 0
			ctx beginPath ()
			ctx moveTo    (x, height)
			ctx lineTo    (x, 0)
			if parameters grid years and is_year
				ctx lineWidth   = 1
				ctx stroke   ()
			if parameters grid quarters and is_quarter
				ctx lineWidth   = 0.5
				ctx stroke   ()
			if parameters grid months
				ctx lineWidth   = 0.5
				ctx stroke   ()
			end
			ctx closePath ()
			x  += x_step
		end
	@end

	@method renderSurface  data, cache
	| Renders the blue surface that is used as a gradient
		var width        = parseInt ($(uis canvas) attr "width")
		var height       = parseInt ($(uis canvas) attr "height")
		var start_mon    = (parameters start year - 2003) * 12 + parameters start month
		var end_mon      = (parameters end year   - 2003) * 12 + parameters end month
		var range_mon    = (start_mon)..(end_mon)
		var element_step = (width / (end_mon - start_mon))
		# We draw the expenses
		ctx strokeStyle = "#A0A0A0"
		ctx lineWidth   = 1
		var x  = 0
		var y  = height
		var gy = height
		var first = True
		var lx    = Undefined
		var ly    = height
		# For every month in the range
		if True
			var g = ctx createLinearGradient(0, 0, width, height / 2.0)
			g addColorStop (0, '#0c4273')
			g addColorStop (1, '#06b4df')
			ctx fillStyle = g
			ctx beginPath ()
			for i in range_mon
				var d = data mon [i]
				if isList(parameters positions)
					d = data mon_pos [i]
				end
				if d
					# If there is data, we get expenses and guidelines
					var expenses  = Undefined
					var guidelines = Undefined
					if isList(parameters positions)
						for p in parameters positions
							var dp = d[p]
							if dp
								if expenses is Undefined
									expenses  = retrieveExpenses  (dp)
								else
									expenses  += retrieveExpenses  (dp)
								end
							end
						end
					else
						expenses  = retrieveExpenses  (d)
					end
					if expenses
						if parameters cumulative
							y  -= cache normalizeY (expenses)
						else
							y  = height - cache normalizeY (expenses)
						end
						if first is True
							ctx moveTo (x,height)
							ctx lineTo (x,y)
							first = False
						end
					end
				end
				if first is False
					if parameters cumulative
						ctx lineTo (x,y)
					else
						ctx lineTo (lx or 0, ly)
						ctx lineTo (lx or 0, height)
						ctx lineTo (x,  height)
						ctx lineTo (x,  y)
					end
				end
				x += element_step
				ly = y
				lx = x
			end
			ctx lineWidth   = 4
			ctx strokeStyle = "#FFFFFF"
			ctx stroke ()
			if lx
				ctx lineTo (lx + element_step, y)
				ctx lineTo (lx + element_step, height)
				ctx fill ()
			end
		end
	@end

	@method render data=None
		if data != None -> self data = data
		# FIXME: Check parameters
		var width        = parseInt ($(uis canvas) attr "width")
		var height       = parseInt ($(uis canvas) attr "height")
		# FIXME: Use proper date range
		var start_mon    = (parameters start year - 2003) * 12 + parameters start month
		var end_mon      = (parameters end year   - 2003) * 12 + parameters end month
		var range_mon    = (start_mon)..(end_mon)
		var element_step = (width / (end_mon - start_mon))
		var total_expenses  = 0
		var total_guidelines = 0
		retrieveExpenses = {d|
			# This retrieves travel and/or hospitality value from a expense or
			# guideline information, depending on the parameters
			var total = 0
			if parameters travel      -> total += d tra
			if parameters hospitality -> total += d hos
			return total
		}
		retrieveGuidelines = {d|
			var total = 0
			# This retrieved traver and/or hospitality guildelines
			if parameters travel      -> total += d tra_gd * (parameters guidelinesRatio)
			if parameters hospitality -> total += d hos_gd * (parameters guidelinesRatio)
			return total
		}
		if  parameters relative
			# Here we display the visualization in RELATIVE mode, meaning that
			# the highest value for the department visualization will reach the top of the
			# visualization
			var max_total = 0
			if  parameters cumulative 
				# In cumulative mode, the maximum value is the total for the selected region which is
				# in the 'metrics' data
				if parameters guidelines
					max_total = Math max (retrieveExpenses(metrics total), retrieveGuidelines(metrics total))
				else
					max_total = retrieveExpenses(metrics total)
				end
			else
				# In non cumulative, it's simply the maximum month we got from the metrics
				if parameters guidelines
					max_total = Math max (retrieveExpenses(metrics pmaxMonth), retrieveGuidelines(metrics maxMonth))
				else
					max_total = retrieveExpenses(metrics maxMonth)
				end
			end
			normalize_y  = {y|
				# FIXME: We should compute the max within the selected range
				return ((height - 2) * (y / max_total))
			}
		else
			# Here we display the visualisation in ABSOLUTE mode, meaning that the highest value is
			# the highest for ALL the departements. The data is passed as a parameter by the
			# page
			var maxima = Undefined
			if parameters cumulative
				maxima = parameters globalMaxTotal
			else
				maxima = parameters globalMaxMonth
			end
			assert (maxima)
			var maximum = retrieveExpenses (maxima)
			if parameters guidelines -> maximum = Math max (maximum, retrieveGuidelines (maxima))
			normalize_y  = {y|
				return ((height - 2) * (y / maximum))
			}
		end
		ctx fillStyle = "#c6e1ea"
		ctx fillRect (0,0,width,height)
		# We draw the grid
		renderGrid    (data)
		renderSurface (data, {normalizeY:normalize_y})

		var HOSPITALITY_COLOR = "#eddc22"
		var TRAVEL_COLOR      = "#f85a92"

		var x  = 0
		var y  = height
		var gy = height
		var ty = height
		var hy = height
		var tpy = Undefined
		var hpy = Undefined

		# This is the main rendering loop
		for i in range_mon
			var px  = x
			var py  = y
			var pgy = gy
			var d = data mon [i]
			if isList(parameters positions)
				d = data mon_pos [i]
			end
			if d
				# If there is data, we get expenses and guidelines
				var expenses     = Undefined
				var expenses_hos = Undefined
				var expenses_tra = Undefined
				var guidelines   = Undefined
				if isList(parameters positions)
					for p in parameters positions
						var dp = d[p]
						if dp
							if expenses is Undefined
								expenses_hos = dp hos
								expenses_tra = dp tra
								expenses     = retrieveExpenses  (dp)
								guidelines   = retrieveGuidelines (dp)
							else
								expenses_hos += dp hos
								expenses_tra += dp tra
								expenses  += retrieveExpenses  (dp)
								guidelines += retrieveGuidelines (dp)
							end
						end
					end
				else
					expenses_hos = d hos
					expenses_tra = d tra
					expenses  = retrieveExpenses  (d)
					guidelines = retrieveGuidelines (d)
				end
				if expenses
					total_expenses  += expenses
					total_guidelines += guidelines
					if parameters cumulative
						y  -= normalize_y (expenses)
						ty -= normalize_y (expenses_tra)
						hy -= normalize_y (expenses_hos)
						gy -= normalize_y (guidelines)
						# FIXME: Should be
						# if y < gy
						if y > gy
							ctx fillStyle = "#10ff10"
						else
							ctx fillStyle = "#ff1010"
						end
					else
						y  = height - normalize_y (expenses)
						ty = height - normalize_y (expenses_tra)
						hy = height - normalize_y (expenses_hos)
						gy = height - normalize_y (guidelines)
						# FIXME: Should be
						# if y < gy
						if y > gy
							ctx fillStyle = "#10ff10"
						else
							ctx fillStyle = "#ff1010"
						end
					end

					# We draw the guidelines/expense delta rectangle
					if parameters guidelines
						ctx beginPath ()
						ctx moveTo (x, gy)
						ctx lineTo (x, y)
						ctx opacity = 0.5
						ctx lineTo (x + element_step, y)
						ctx lineTo (x + element_step, gy)
						ctx fill   ()
						ctx opacity = 1.0
					end

					# We draw the expenses line
					if True
						ctx beginPath ()
						ctx moveTo (x, y)
						ctx lineTo (x + element_step, y)
						ctx lineWidth   = 2
						ctx strokeStyle = "#0000FF"
						ctx stroke ()
					end

					# We draw the hospitality
					if parameters hospitality
						ctx beginPath ()
						if hpy
							ctx moveTo (x, hpy)
							ctx lineTo (x, hy)
						else
							ctx moveTo (x, hy)
						end
						ctx lineTo (x + element_step, hy)
						ctx lineWidth   = 2
						ctx strokeStyle = HOSPITALITY_COLOR
						ctx stroke ()
						hpy = hy
					end

					# We draw the travel
					if parameters travel
						ctx beginPath ()
						if tpy
							ctx moveTo (x, tpy)
							ctx lineTo (x, ty)
						else
							ctx moveTo (x, ty)
						end
						ctx moveTo (x, ty)
						ctx lineTo (x + element_step, ty)
						ctx lineWidth   = 2
						ctx strokeStyle = TRAVEL_COLOR
						ctx stroke ()
						tpy = ty
					end

					#We draw guidelines information
					if parameters guidelines
						ctx beginPath ()
						ctx moveTo (px,pgy)
						ctx lineTo (x, pgy)
						ctx lineTo (x, gy)
						ctx lineTo (x + element_step, gy)
						ctx lineWidth   = 1
						ctx strokeStyle = "#36DFFF"
						ctx stroke ()
					end

				end
			end
			x += element_step
		end
		if parameters updater
			window setTimeout ({parameters updater (ui, total_expenses, total_guidelines)}, 100)
		end
	@end

@end

# ------------------------------------------------------------------------------
#
# SPENDING TAG UI FUNCTIONS
#
# ------------------------------------------------------------------------------

@function bindEvents
	# FIXME: Refactor all this into a class, this is starting to be a mess
	$ ".do-showOptions"      click { $ ".Parameters > .compacted" addClass "hidden" ; $ ".Parameters > .expanded" removeClass "hidden" slideDown () }
	$ ".do-hideOptions"      click { $ ".Parameters > .compacted" removeClass "hidden" ; $ ".Parameters > .expanded" addClass "hidden" }
	$ ".in-quickfind"        keyup { filterBy ( $ ".in-quickfind" val () ) }
	$ ".do-resetQuickfind"   click { $ ".in-quickfind" val ("") ; filterBy ( $ ".in-quickfind" val () ) }
	$ ".in-guidelinesRatio"  change { updateGuidelineRatio ($(target) val ()) } val "1.0"
	$ ".ctl-guidelinesRatio" slider {
		max:   1.0
		min:   0.0
		value: 1.0
		step:  0.01
		slide: {e,ui| $ ".in-guidelinesRatio" val (ui value) ; updateGuidelineRatio (ui value)}
	}
	$ ".sort-by .name"       click { sortBy "name" }
	$ ".sort-by .expenses"   click { sortBy "expenses" }
	$ ".sort-by .deviation"  click { sortBy "deviation" }
	$ ".dataset .hospitality" click {
		$(target) toggleClass "current" ; updateTagsRendering {hospitality:$(target) hasClass "current"}
	}
	$ ".dataset .guidelines" click {
		$(target) toggleClass "current" ; updateTagsRendering {guidelines:$(target) hasClass "current"}
	}
	$ ".dataset .travel" click {
		$(target) toggleClass "current" ; updateTagsRendering {travel:$(target) hasClass "current"}
	}
	$ ".mode-1  .month"      click { setMode1 "month" }
	$ ".mode-1  .cumulative" click { setMode1 "cumulative" }
	$ ".mode-2  .relative"   click { setMode2 "relative" }
	$ ".mode-2  .absolute"   click { setMode2 "absolute" }
	[".startDate", ".endDate"] :: {ui|
		var ui    = $ (ui)
		var input = $ ( "input",  ui)
		var update_input = {
			var year  = parseInt ($ (".year .values .current", ui) text ())
			var month = parseInt ($ (".month .values .current", ui) attr "value")
			input val ((month + 1) + "/" + year)
		}
		$ (".year .values li", ui) click {
			$ (".year .values .current", ui) removeClass "current"
			$ (target) addClass "current"
			update_input ()
		}
		$ (".month .values li", ui) click {
			$ (".month .values .current", ui) removeClass "current"
			$ (target) addClass "current"
			update_input ()
		}
	}
	# FIXME: These two selectors should be factored out as a widget in Wallpaper
	$ ".DepartmentSelector" :: {ui|
		var template = $ (".departments .template:first", ui)
		var cols     = $ (".departments ul", ui)
		#var count   = DEPARTMENTS length / cols length
		var count    = 11
		var j        = 0
		for d, i in DEPARTMENTS
			if DEPWHITELIST[d[1]]
				var nui = template clone () removeClass "template" removeClass "hidden"
				$ ("input", nui) attr ("value", d[0])
				$ (".name .out", nui) html (d[1])
				if j < count
					$ (".template", cols[0]) before (nui)
				else
					$ (".template", cols[1]) before (nui)
				end
				j += 1
			end
		end
		$ (".departments ul li", ui) click {
			$ (target) toggleClass "selected"
		} addClass "selected"
		$ (".do-selectAll",  ui) click { $ (".departments li",ui) addClass "selected" }
		$ (".do-selectNone", ui) click { $ (".departments li",ui) removeClass "selected" } 
		$ (".do-ok", ui) click {
			var to_show = {}
			var checked   = $ (".departments li.selected", ui)
			checked :: {e|
				var li = e
				if not $(li) hasClass "template"
					var name = $(".name .out", li) text ()
					to_show [name] = True
				end
			}
			filterByDepartment (to_show)
			# FIXME: This is hardcoded, but we do have 25 departments, even if the DEPARTMENTS
			# data as 42 entries
			if checked length == 25
				$ (".departments .value", ui) html "all"
			else
				$ (".departments .value", ui) html ("" + checked length)
			end
		}
	}
	$ ".PositionSelector" :: {ui|
		ui = $(ui)
		var all_positions = $ (".choices li",ui)
		$ (".choices ul li", ui) click {
			$ (target) toggleClass "selected"
		} addClass "selected"
		$ (".do-selectAll",  ui) click { $ (".choices li",ui) addClass "selected" }
		$ (".do-selectNone", ui) click { $ (".choices li",ui) removeClass "selected" } 
		$ (".do-ok", ui) click {
			var checked   = $ (".choices li.selected",ui)
			var positions = None
			if checked length == all_positions length
				$ (".position .value", ui) html "all"
				positions = None
			else
				if checked length == 1
					$ (".position .value", ui) html (checked length + "")
				else
					$ (".position .value", ui) html (checked length + "")
				end
				positions = [] ; checked :: {p|positions push ($("input", p)[0] value)}
			end
			# NOTE: In this case the 'positions' object will be shared by all
			# the expense tags viz, so any alteration will be reflected on the
			# other as well
			updateTagsRendering {positions:positions}
		}
	}

	$ ".w-dialog" :: {d|
		$ (".do-close", d) click {
			$ "#Dialogs" addClass "hidden"
			wallpaper hideOverlay "#Dialogs .w-shade"
		}
	}
	$ ".w-clickdetails .do-showDetails" click {
		$ (".details", $(target) parents ".w-clickdetails:first") show ()
	}
	$ ".w-clickdetails .do-hideDetails" click {
		$ (".details", $(target) parents ".w-clickdetails:first") hide ()
	}
	$ ".ExpenseTag .do-showMore" click {
		showDetails ( $ (target) parents ".ExpenseTag" [0] )
	}

	var timeline = wallpaper getWidget "#TimelineWidget"
	var timeline_start = $ (".timeline .start .out")
	var timeline_end   = $ (".timeline .end .out")
	var timeline_dur   = $ (".timeline .dur .out")
	timeline onCursorUpdating = {value, start, end|
		var months     = (2008 * 12 - (2002 * 12 + 1))
		var start_date = Math round (start * months)
		var end_date   = Math round (end   * months)
		var params = {
			start:{
				year:  2003 + parseInt(start_date / 12)
				month: start_date % 12
			}
			end:{
				year:  2003 + parseInt(end_date / 12)
				month: end_date % 12
			}
		}
		timeline_start html (sprintf("%s. %d", MONTHS[params start month], params start year))
		timeline_end   html (sprintf("%s. %d", MONTHS[params end month],   params end year))
		timeline_dur   html ("" + (end_date - start_date))
	}
	timeline onCursorUpdated = {value, start, end|
		# Months represents the scale of the slider
		var months     = (2008 * 12 - (2002 * 12 + 1))
		var start_date = Math round (start * months)
		var end_date   = Math round (end   * months)
		var params = {
			start:{
				year:  2003 + parseInt(start_date / 12)
				month: start_date % 12
			}
			end:{
				year:  2003 + parseInt(end_date / 12)
				month: end_date % 12
			}
		}
		updateTagsRendering 'params
	}
@end


@function getDatasetMetrics tags=Undefined
| Computes the maximum per month and total maximum for all the displayed expense tags,
| and returns them as '{month:...,total:....}'
	var result = {
		maxMonth:{tra:0,tra_gd:0,hos:0,hos_gd:0,all:0,all_gd:0}
		maxTotal:{tra:0,tra_gd:0,hos:0,hos_gd:0,all:0,all_gd:0}
	}
	if tags is Undefined -> tags = $ ".ExpenseTagsViz .ExpenseTags"
	for expense_tag in tags
		var expense_tag = $ (expense_tag)
		if not expense_tag hasClass "no-data"
			var d = expense_tag [0] _data
			var expense_metrics =  d viz getMetrics (d department)
			["tra","tra_gd","hos","hos_gd","all","all_gd"] :: {k|
				result maxMonth [k] = Math max (result maxMonth [k], expense_metrics maxMonth [k])
				result maxTotal [k] = Math max (result maxTotal [k], expense_metrics total    [k])
			}
		end
	end
	return result
@end

@function showDetails expenseTag
| Show the details for a specific expense tag. This popus-up a details dialog.

	expenseTag  = $(expenseTag)
	var tag_data = $(expenseTag) [0] _data
	var details  = $ "#Templates .ExpenseTagDetails" clone ()

	# We parameter the canvas according to the box size
	var size   = placement getBox ($(".details", details))
	var original_canvas = $("canvas", expenseTag)
	var canvas = $(".maingraph canvas", details)
	canvas attr ("width",  original_canvas attr "width" * 1.5)
	canvas attr ("height", original_canvas attr "height" * 1.5)

	# We bind the main visualization
	#var viz  = wallpaper ensureWidget ($(".maingraph", details), ExpenseTag)
	var viz = new ExpenseTag ($(".maingraph", details))
	tag_data viz parameters :: {v,k|viz parameters [k] = v}
	viz parameters grid          = {quarters:True, years:True}
	viz parameters positions     = None
	viz parameters updater       = None
	viz render ( tag_data department )

	# We bind individual position visualizations
	var position_template = $ (".details tr.template", details)
	for position in POSITIONS
		var id   = position[0]
		var name = position[1]

		var sub_graph = position_template clone () removeClass "template" removeClass "hidden"
		position_template before (sub_graph)

		var canvas   = $("canvas", sub_graph)
		canvas attr ("width",  original_canvas attr "width" * 1.5)

		$ (".name .out", sub_graph) html (name)

		if True
			var sub_viz  = new ExpenseTag (sub_graph)
			tag_data viz parameters :: {v,k|sub_viz parameters [k] = v}
			sub_viz parameters grid quarters = True
			sub_viz parameters positions      = [id]
			if True
				sub_viz parameters updater   = {ui,s,g|
					$ (".expenses  .out", ui)  html (sprintf ("%d", s))
					$ (".guidelines .out", ui) html (sprintf ("%d", g))
					var vari = (s/g) * 100
					if vari > 0
						$ (".variance", ui) html (sprintf ("-%d", vari))
					else
						$ (".variance", ui) html (sprintf ("+%d", vari))
					end
					if s == 0 -> sub_graph addClass "hidden"
				}
			end
			sub_viz render ( tag_data department )
		end
	end

	$ ("body") after (details)
	$ (details) dialog {
		width: 800
		height: 500
		title: "Details for " + (tag_data name)
		close: { $(details) dialog "destroy" remove () }
	}
@end


@function updateTagsRendering parameters
	$ ".ExpenseTagsViz .filter .sort-by .current" removeClass "current"
	var tags = $ ".ExpenseTagsViz .body .tags .ExpenseTag"
	# We update the parameters
	for v in tags
		var viz = v _data viz
		parameters :: {v,k|viz parameters[k] = v}
	end
	# We get the updated metrics data
	# FIXME: Metrics should be handled by the visualizations, it's stupid to have
	# to reset them in the parameters
	var metrics = getDatasetMetrics ( tags )
	# We re-render the tags
	for v in tags
		var viz = v _data viz
		viz parameters globalMaxMonth = metrics maxMonth
		viz parameters globalMaxTotal = metrics maxTotal
		viz render (v _data department)
	end
@end

@function updateGuidelineRatio ratio
	# TODO: Update the ratio as well
	ratio = parseFloat (ratio)
	updateTagsRendering {guidelinesRatio: ratio}
@end

@function filterBy criteria
	for tag in $ ".ExpenseTagsViz .ExpenseTag" 
		if not criteria or ("" + criteria) toLowerCase () == "all departments"
			$ (tag) removeClass "hidden"
		else
			criteria = (""+criteria) toLowerCase ()
			var name = $(tag) [0] _data name toLowerCase ()
			if name indexOf (criteria) != -1
				$ (tag) removeClass "hidden"
			else
				$ (tag) addClass "hidden"
			end
		end
	end
@end

@function filterByDepartment toShow
	for tag in $ ".ExpenseTagsViz .ExpenseTag" 
		var data = $(tag)[0] _data
		if toShow
			if toShow [data name] != True
				$ (tag) addClass "hidden"
			else
				$ (tag) removeClass "hidden"
			end
		else
			$ (tag) removeClass "hidden"
		end
	end
@end

@function sortBy criteria
	# FIXME: Seems like adding and removing a tag destroys the events bound to
	# the tag
	$ ".sort-by .current" removeClass "current"
	$ (".sort-by ." + criteria) addClass "current"
	var tags = []
	$ ".ExpenseTagsViz .ExpenseTag" :: {v|tags push (v)}
	tags sort {a,b|
		a = $(a) [0] _data [criteria]
		b = $(b) [0] _data [criteria]
		var result = 0
		if a < b
			result = 1
		if a > b
			result = -1
		end
		if criteria == "name" -> result = 0 - result
		return result
	}
	tags :: {tag| $ ".ExpenseTagsViz .tags" append (tag)}
@end

@function setMode1 mode
| Switches between 'cumulative' and 'per month'
	$ ".mode-1 .current" removeClass "current"
	if mode == "cumulative"
		$ ".mode-1 .cumulative" addClass "current"
		updateTagsRendering {cumulative:True}
	else
		$ ".mode-1 .month" addClass "current"
		updateTagsRendering {cumulative:False}
	end
@end

@function setMode2 mode
| Switches between 'absolute' and 'relative'
	$ ".mode-2 .current" removeClass "current"
	if mode == "absolute"
		$ ".mode-2 .absolute" addClass "current"
		updateTagsRendering {relative:False}
	else
		$ ".mode-2 .relative" addClass "current"
		updateTagsRendering {relative:True}
	end
@end

# ------------------------------------------------------------------------------
#
# MAIN
#
# ------------------------------------------------------------------------------

$(document) ready {
	wallpaper bind ()
	var guidelines_ratio = parseFloat ($ ".in-guidelinesRatio" val ())
	var original = $ "#Templates > .ExpenseTag"
	var datavizs = $ ".ExpenseTagsViz .body .tags"
	# STEP 1: We process the data and collect stats about it
	var maxima_month = {
		tra     : 0
		tra_gd  : 0
		hos     : 0
		hos_gd  : 0
		all     : 0
		all_gd  : 0
	}
	var maxima_total = {
		tra     : 0
		tra_gd  : 0
		hos     : 0
		hos_gd  : 0
		all     : 0
		all_gd  : 0
	}
	# We get the maximum values for all the departments
	EXPENSES :: {d,n|
		maxima_month :: {v,k|maxima_month [k] = Math max (d max_month [k] or 0, v)}
		maxima_total :: {v,k|maxima_total [k] = Math max (d total [k] or 0, v)}
	}
	var last_department = 0
	# STEP 2 - We create widgets for each department in the EXPENSES dataset
	for department, i in EXPENSES
		if i >= 0
			# We build indicators
			#console log (department name)
			var name             = department name
			DEPWHITELIST[name]   = True
			var total_expenses  = department total all
			var total_guidelines = department total all_gd
			var position         = "" + parseInt(100 * total_expenses/ maxima_total all) + "%"
			var deviation        = total_expenses / total_guidelines * 100

			# We create the view and set it up
			var new_view  = original clone ()
			if name length > 40 -> name = name [0:36] + "..."
			$(".origin .out", new_view) html ("" + name)

			var updater   = {ui,total_expenses,total_guidelines|
				var deviation    = total_expenses / total_guidelines * 100
				$(".out-total",   ui) html (sprintf("%0.3fM$", total_expenses / 1000000.0))
				if deviation >= 100
					$(".variation .out", ui) html ( sprintf ("+%d%%", deviation - 100))
					$(".variation",      ui) addClass "positive" removeClass "negative"
				else
					$(".variation .out", ui) html ( sprintf ("%d%%", deviation - 100))
					$(".variation",      ui) addClass "negative" removeClass "positive"
				end
				if total_expenses == 0
					ui addClass "nodata"
				else
					ui removeClass "nodata"
				end
				var data       = $(ui)[0] _data
				# We update the data
				data expenses  = total_expenses
				data deviation = deviation
			}
			datavizs append (new_view)

			# We create the visualization, and attach it to the view
			var viz                        = new ExpenseTag (new_view)
			viz parameters maxMonth        = department max_month
			# FIXME: Don't know if the total is OK
			viz parameters total           = department total
			viz parameters globalMaxTotal  = maxima_total
			viz parameters globalMaxMonth  = maxima_month
			viz parameters department      = department
			viz parameters guidelinesRatio = parseInt(guidelines_ratio) or 1.0
			viz parameters updater         = updater

			# We bind HTML data
			new_view = $(new_view)[0]
			new_view _data = {
				name: name
				department: department
				parameters: viz parameters
				expenses:   total_expenses
				deviation:  deviation
				viz      :  viz
			}
			updateTagsRendering {}
		end
	end
	sortBy "name"
	bindEvents ()
	$ ".ExpenseTagsViz .tags" sortable ()
}

# EOF - vim: foldmethod=indent foldlevel=0

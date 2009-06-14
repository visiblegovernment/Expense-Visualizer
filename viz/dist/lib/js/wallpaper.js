// 8< ---[wallpaper.js]---

var wallpaper=wallpaper||{}
var __this__=wallpaper
wallpaper.__VERSION__='0.0.5';
wallpaper.$=jQuery
wallpaper.error=	function(message){
		var __this__=wallpaper;
		alert(message)
	}
wallpaper.showOverlay=	function(selector){
		var __this__=wallpaper;
		var height=(placement.getBox('body').h + 'px');
		wallpaper.$(selector).css({'height':height}).removeClass('hidden')
	}
wallpaper.hideOverlay=	function(selector){
		var __this__=wallpaper;
		wallpaper.$(selector).addClass('hidden')
	}
wallpaper.hasWidget=	function(selector){
		// Tells if the given HTML node has a Widget instance already bound to it. If so, it
		// returns the widget instance. If not, it returns 'Undefined'
		var __this__=wallpaper;
		var nodes=wallpaper.$(selector);
		if ( ((nodes.length > 0) && (nodes[0].widget != undefined)) )
		{
			return nodes[0].widget
		}
		else if ( true )
		{
			return undefined
		}
	}
wallpaper.getWidget=	function(selector){
		var __this__=wallpaper;
		return wallpaper.hasWidget(selector)
	}
wallpaper.ensureWidget=	function(selector, widgetClass){
		// Ensures that an instance of the given widget class is already bound to the given selector
		var __this__=wallpaper;
		var nodes=wallpaper.$(selector);
		if ( (nodes.length > 0) )
		{
			if ( (nodes[0].widget == undefined) )
			{
				return new widgetClass(selector)
			}
			else if ( true )
			{
				return nodes[0].widget
			}
		}
		else if ( true )
		{
			return null
		}
	}
wallpaper.Widget=extend.Class({
	name:'wallpaper.Widget', parent:undefined,
	shared:{
		FIELDS:[],
		Instance:undefined,
		ACTIONS:[],
		SELECTOR:undefined
	},
	properties:{
		ui:undefined,
		uis:undefined,
		inputs:undefined,
		outputs:undefined,
		model:undefined
	},
	initialize:function(selector){
		var __this__=this
		selector = selector === undefined ? null : selector
		__this__.uis = {}
		__this__.inputs = {}
		__this__.outputs = {}
		__this__.model = undefined
		__this__.getClass() .Instance = __this__;
		__this__.ui = wallpaper.$((selector || __this__.getClass() .SELECTOR));
		if ( ((__this__.ui === undefined) || (__this__.ui.length == 0)) )
		{
			return extend.error(((('Cannot instanciate widget ' + __this__.getClass().getName()) + ': selector empty ') + selector))
		}
		if ( (! (__this__.ui[0].widget === undefined)) )
		{
			return extend.error(((('Cannot bind widget ' + __this__.getClass().getName()) + ': selector already has widget ') + selector))
		}
		__this__.ui[0].widget = __this__;
		__this__.bindUI()
	},
	methods:{
		bindActions:function(actions){
			var __this__=this
			actions = actions === undefined ? __this__.getClass() .ACTIONS : actions
			extend.iterate(actions, function(action){
				wallpaper.$(('.do-' + action), __this__.ui).click(function(event){
					__this__[action](event)
				})
			}, __this__)
		},
		bindFields:function(fields){
			var __this__=this
			fields = fields === undefined ? __this__.getClass() .FIELDS : fields
			extend.iterate(fields, function(field){
				__this__.inputs[field] = wallpaper.$(('.in-' + field), __this__.ui);
				if ( (__this__.inputs[field].length == 0) )
				{
					__this__.inputs[field] = wallpaper.$((('.' + field) + ' .in'), __this__.ui);
				}
				__this__.outputs[field] = wallpaper.$(('.out-' + field), __this__.ui);
				if ( (__this__.outputs[field].length == 0) )
				{
					__this__.outputs[field] = wallpaper.$((('.' + field) + ' .out'), __this__.ui);
				}
				if ( ((__this__.inputs[field].length == 0) && (__this__.outputs[field].length == 0)) )
				{
					extend.error(('Field has no input or output: ' + field))
				}
			}, __this__)
		},
		bindUI:function(){
			var __this__=this
			__this__.bindActions()
			__this__.bindFields()
		},
		getFieldValue:function(field){
			var __this__=this
			if ( ((! field) || (wallpaper.$(field).length == 0)) )
			{
				return undefined
			}
			var node_name=wallpaper.$(field)[0].nodeName.toLowerCase();
			if ( wallpaper.$(field).hasClass('empty') )
			{
				return ''
			}
			if ( ((node_name == 'input') || (node_name == 'textarea')) )
			{
				return wallpaper.$.trim(wallpaper.$(field).val())
			}
			else if ( true )
			{
				return wallpaper.$.trim(wallpaper.$(field).text())
			}
		},
		setFieldValue:function(field, value){
			var __this__=this
			if ( (wallpaper.$(field).length == 0) )
			{
				return undefined
			}
			var node_name=wallpaper.$(field)[0].nodeName.toLowerCase();
			if ( ((node_name == 'input') || (node_name == 'textarea')) )
			{
				if ( (! value) )
				{
					wallpaper.$(field).val('').addClass('empty')
				}
				else if ( true )
				{
					wallpaper.$(field).val(value).removeClass('empty')
				}
			}
			else if ( true )
			{
				if ( (! value) )
				{
					wallpaper.$(field).html('&mdash;').addClass('empty')
				}
				else if ( true )
				{
					wallpaper.$(field).text(value).removeClass('empty')
				}
			}
		}
	}
})
wallpaper.ModalEditable=extend.Class({
	name:'wallpaper.ModalEditable', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:undefined,
		ACTIONS:[],
		Instance:undefined
	},
	methods:{
		bindUI:function(){
			var __this__=this
			wallpaper.$('input', __this__.ui).keypress(function(){
				wallpaper.$(this).removeClass('default')
			}).addClass('default')
			wallpaper.$('input', __this__.ui).click(function(){
				if ( wallpaper.$(this).hasClass('default') )
				{wallpaper.$(this).select()}
			})
			wallpaper.$('textarea', __this__.ui).keypress(function(){
				wallpaper.$(this).removeClass('default')
			})
			__this__.bindActions(['edit', 'view', 'save', 'cancel', 'remove'])
			__this__.getSuper(wallpaper.ModalEditable.getParent()).bindUI()
		},
		edit:function(){
			var __this__=this
			__this__.syncInputsWithOutputs()
			wallpaper.$('.on-status.when-edit', __this__.ui).removeClass('hidden')
			wallpaper.$('.on-status.when-view', __this__.ui).addClass('hidden')
			wallpaper.$('.when-edit input:first', __this__.ui).focus()
			__this__.ui.addClass('editing')
			__this__.ui.removeClass('view')
		},
		view:function(){
			var __this__=this
			wallpaper.$('.on-status.when-edit', __this__.ui).addClass('hidden')
			wallpaper.$('.on-status.when-view', __this__.ui).removeClass('hidden')
			__this__.ui.removeClass('editing')
			__this__.ui.addClass('view')
		},
		save:function(){
			var __this__=this
			if ( __this__.ui.hasClass('new') )
			{
				__this__.ui.removeClass('new')
				wallpaper.$('.when-new', __this__.ui).addClass('hidden')
				wallpaper.$('.when-not-new', __this__.ui).removeClass('hidden')
			}
			__this__.syncOutputsWithInputs()
			__this__.view()
		},
		cancel:function(){
			var __this__=this
			__this__.view()
		},
		remove:function(){
			var __this__=this
			__this__.ui.remove()
		},
		_RW_export:function(fields, ignoreDefault){
			var __this__=this
			fields = fields === undefined ? __this__.inputs : fields
			ignoreDefault = ignoreDefault === undefined ? true : ignoreDefault
			var data={};
			extend.iterate(fields, function(input, name){
				if ( (! (ignoreDefault && input.hasClass('default'))) )
				{
					data[name] = __this__.getFieldValue(input);
				}
			}, __this__)
			return data
		},
		_RW_import:function(data, fields){
			var __this__=this
			fields = fields === undefined ? __this__.inputs : fields
			extend.iterate(data, function(value, name){
				if ( fields[name] )
				{
					__this__.setFieldValue(fields[name], value)
				}
			}, __this__)
		},
		syncInputsWithOutputs:function(){
			var __this__=this
			__this__._RW_import(__this__._RW_export(__this__.outputs, false), __this__.inputs)
		},
		syncOutputsWithInputs:function(){
			var __this__=this
			__this__._RW_import(__this__._RW_export(__this__.inputs), __this__.outputs)
		}
	}
})
wallpaper.DropDown=extend.Class({
	name:'wallpaper.DropDown', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.w-dropdown',
		ACTIONS:['toggle'],
		Instance:undefined
	},
	methods:{
		toggle:function(){
			var __this__=this
			var drawer=wallpaper.$('.w-drawer', __this__.ui);
			wallpaper.$(drawer).slideToggle()
		}
	}
})
wallpaper.Tooltip=extend.Class({
	name:'wallpaper.Tooltip', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.w-tooltip',
		ACTIONS:[],
		Instance:undefined
	},
	properties:{
		boundElement:undefined
	},
	methods:{
		bindTo:function(element){
			var __this__=this
			__this__.boundElement = element;
			wallpaper.$(__this__.boundElement).hover(__this__.getMethod('show') , __this__.getMethod('hide') )
		},
		show:function(){
			var __this__=this
			var target_box=placement.getBox(__this__.boundElement);
			wallpaper.$(__this__.ui).removeClass('hidden').fadeIn()
		},
		hide:function(){
			var __this__=this
			wallpaper.$(__this__.ui).fadeOut()
		}
	},
	operations:{
		make:function(onElement){
			var __this__ = this;
			extend.iterate(wallpaper.$(wallpaper.Tooltip.SELECTOR, onElement), function(selector){
				var tooltip=new wallpaper.Tooltip(selector);
				tooltip.bindTo(onElement)
			}, __this__)
		}
	}
})
wallpaper.Cards=extend.Class({
	name:'wallpaper.Cards', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.w-cards',
		ACTIONS:['startCard', 'previousCard', 'nextCard', 'selectCard'],
		Instance:undefined
	},
	properties:{
		currentStep:undefined,
		boundElement:undefined
	},
	initialize:function(){
		var __this__=this
		if (true) {var __super__=__this__.getSuper(wallpaper.Cards.getParent());__super__.initialize.apply(__super__,arguments)}
		__this__.currentStep = 0
	},
	methods:{
		startCard:function(){
			var __this__=this
			__this__.currentStep = 0;
			__this__._doSelectCurrentCard()
		},
		nextCard:function(){
			var __this__=this
			__this__.currentStep = (__this__.currentStep + 1);
			__this__._doSelectCurrentCard()
		},
		previousCard:function(){
			var __this__=this
			if ( (__this__.currentStep > 0) )
			{
				__this__.currentStep = (__this__.currentStep - 1);
				__this__._doSelectCurrentCard()
			}
		},
		selectCard:function(e){
			var __this__=this
			var card=wallpaper.$(e.target).attr('card');
			__this__.currentStep = (parseInt(card) - 1);
			__this__._doSelectCurrentCard()
		},
		_doSelectCurrentCard:function(){
			var __this__=this
			wallpaper.$('.w-card.current', __this__.ui).removeClass('current')
			wallpaper.$(('.w-card.N' + (__this__.currentStep + 1)), __this__.ui).addClass('current')
		}
	}
})
wallpaper.List=extend.Class({
	name:'wallpaper.List', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.w-list',
		ELEMENT_SELECTOR:'li',
		ACTIONS:[],
		Instance:undefined
	},
	methods:{
		bindUI:function(){
			var __this__=this
			__this__.getSuper(wallpaper.List.getParent()).bindUI()
			wallpaper.$(__this__.getClass() .ELEMENT_SELECTOR, __this__.ui).click(function(){
				__this__.selectElement(this)
			})
			wallpaper.$('.filter .in-value', __this__.ui).keyup(function(){
				__this__.filterBy(wallpaper.$(this).val())
			})
			wallpaper.$(__this__.ui).keypress(function(event){
			})
		},
		selectElement:function(element){
			var __this__=this
			if ( (! wallpaper.$(element).hasClass('selected')) )
			{
				wallpaper.$((__this__.getClass() .ELEMENT_SELECTOR + '.current'), __this__.ui).removeClass('current')
				wallpaper.$(element).addClass('current')
			}
		},
		filterBy:function(criteria){
			var __this__=this
			criteria = criteria.toLowerCase();
			var empty=true;
			extend.iterate(wallpaper.$(__this__.getClass() .ELEMENT_SELECTOR, __this__.ui), function(element){
				if ( (wallpaper.$(element).text().toLowerCase().indexOf(criteria) == -1) )
				{
					wallpaper.$(element).addClass('hidden')
				}
				else if ( true )
				{
					wallpaper.$(element).removeClass('hidden')
					empty = false;
				}
			}, __this__)
			if ( empty )
			{
				wallpaper.$('.when-empty').removeClass('hidden')
			}
			else if ( true )
			{
				wallpaper.$('.when-empty').addClass('hidden')
			}
		}
	}
})
wallpaper.Slider=extend.Class({
	name:'wallpaper.Slider', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.w-slider',
		ACTIONS:[],
		Instance:undefined
	},
	properties:{
		value:undefined,
		start:undefined,
		end:undefined
	},
	initialize:function(){
		var __this__=this
		if (true) {var __super__=__this__.getSuper(wallpaper.Slider.getParent());__super__.initialize.apply(__super__,arguments)}
		__this__.value = 0.0
		__this__.start = 0.0
		__this__.end = 0.0
	},
	methods:{
		bindUI:function(){
			var __this__=this
			__this__.uis.body = wallpaper.$('.w-slider-body', __this__.ui);
			__this__.uis.cursor = wallpaper.$('.w-cursor', __this__.ui);
			if ( __this__.uis.cursor.hasClass('is-resizable') )
			{
				__this__.uis.cursor.resizable({'containment':__this__.uis.body, 'handles':'e,w', 'resize':function(){
					__this__._cursorUpdating()
				}, 'stop':function(){
					__this__._cursorUpdated()
				}})
				__this__.uis.cursor.draggable({'containment':__this__.uis.body, 'axis':'x', 'drag':function(){
					__this__._cursorUpdating()
				}, 'stop':function(){
					__this__._cursorUpdated()
				}})
			}
		},
		_updateFromCursor:function(){
			var __this__=this
			var cursor_width=parseInt(__this__.uis.cursor.css('width'));
			var cursor_left=parseInt(__this__.uis.cursor.css('left'));
			var body_width=parseInt(__this__.uis.body.css('width'));
			__this__.start = (cursor_left / body_width);
			__this__.value = (cursor_width / body_width);
			__this__.end = ((cursor_left + cursor_width) / body_width);
		},
		_cursorUpdated:function(){
			var __this__=this
			__this__._updateFromCursor()
			__this__.onCursorUpdated(__this__.value, __this__.start, __this__.end)
		},
		_cursorUpdating:function(){
			var __this__=this
			__this__._updateFromCursor()
			__this__.onCursorUpdating(__this__.value, __this__.start, __this__.end)
		},
		onCursorUpdated:function(value, start, end){
			var __this__=this
		},
		onCursorUpdating:function(value, start, end){
			var __this__=this
		}
	}
})
wallpaper.bind=	function(){
		var __this__=wallpaper;
		extend.iterate(wallpaper.$(wallpaper.DropDown.SELECTOR), function(s){
			new wallpaper.DropDown(s)
		}, __this__)
		extend.iterate(wallpaper.$(wallpaper.Cards.SELECTOR), function(s){
			new wallpaper.Cards(s)
		}, __this__)
		extend.iterate(wallpaper.$(wallpaper.List.SELECTOR), function(s){
			new wallpaper.List(s)
		}, __this__)
		extend.iterate(wallpaper.$(wallpaper.Slider.SELECTOR), function(s){
			new wallpaper.Slider(s)
		}, __this__)
		extend.iterate(wallpaper.$('.has-tooltip'), wallpaper.Tooltip.make, __this__)
	}
wallpaper.init=	function(){
		var __this__=wallpaper;
	}
wallpaper.init()


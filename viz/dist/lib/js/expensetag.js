// 8< ---[expensetag.js]---

var expensetag=expensetag||{}
var __this__=expensetag
expensetag.DEPWHITELIST={}
expensetag.MONTHS=['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dev']
expensetag.clone=	function(value){
		// Clones the given value
		var __this__=expensetag;
		if ( extend.isList(value) )
		{
			var result=[];
			extend.iterate(value, function(v, i){
				result.append(expensetag.clone(v))
			}, __this__)
			return result
		}
		else if ( isObject(value) )
		{
			var result={};
			extend.iterate(value, function(v, k){
				result[k] = expensetag.clone(v);
			}, __this__)
			return result
		}
		else if ( true )
		{
			return value
		}
	}
expensetag.ExpenseTag=extend.Class({
	name:'expensetag.ExpenseTag', parent:wallpaper.Widget,
	shared:{
		FIELDS:[],
		SELECTOR:'.ExpenseTag',
		DATAMODEL:[{'expenses':'Float', 'guidelines':'Float', 'inflation':'Float'}],
		ACTIONS:[],
		Instance:undefined
	},
	properties:{
		data:undefined,
		retrieveExpenses:undefined,
		retrieveGuidelines:undefined,
		ctx:undefined,
		parameters:undefined
	},
	initialize:function(ui){
		var __this__=this
		__this__.parameters = undefined
		__this__.parameters = {'department':undefined, 'cumulative':true, 'relative':false, 'travel':true, 'hospitality':true, 'guidelines':false, 'guidelinesRatio':1.0, 'positions':null, 'globalMaxMonth':undefined, 'globalMaxTotal':undefined, 'grid':{'quarters':false, 'years':true, 'months':false}, 'start':{'month':0, 'year':2003}, 'end':{'month':11, 'year':2008}, 'updater':function(ui, s, g){
		}};
		__this__.getSuper(expensetag.ExpenseTag.getParent())(ui)
	},
	methods:{
		bindUI:function(){
			var __this__=this
			__this__.getSuper(expensetag.ExpenseTag.getParent()).bindUI()
			__this__.uis.cursor = $('.cursor', __this__.ui);
			__this__.uis.canvas = $('canvas', __this__.ui)[0];
			__this__.uis.qtip = $(__this__.uis.canvas).qtip({'content':'This is an active list element', 'position':{'target':'mouse', 'corner':{'tooltip':'bottomMiddle'}}, 'show':'mouseover', 'hide':'mouseout', 'content':{'text':$('#Templates .ExpenseTagTooltip').clone()}}).qtip('api');
			__this__.uis.qtip.onPositionUpdate = function(e){
				__this__.updateToolTip(this, arguments)
			};
			__this__.uis.qtip.onHide = function(){
				__this__.uis.cursor.addClass('hidden')
			};
			__this__.ctx = __this__.uis.canvas.getContext('2d');
		},
		updateToolTip:function(){
			var __this__=this
			var pos=__this__.uis.qtip.getPos();
			var w=parseInt($(__this__.uis.qtip.elements.tooltip).css('width'));
			var ref=$(__this__.uis.canvas).offset();
			pos.left = ((pos.left - ref.left) + (w / 2));
			pos.top = ref.top;
			if ( (pos.left >= 0) )
			{
				var width=parseInt($(__this__.uis.canvas).attr('width'));
				var height=parseInt($(__this__.uis.canvas).attr('height'));
				var start_mon=(((__this__.parameters.start.year - 2003) * 12) + __this__.parameters.start.month);
				var end_mon=(((__this__.parameters.end.year - 2003) * 12) + __this__.parameters.end.month);
				var range_mon=extend.range((start_mon),(end_mon));
				var x=0;
				var x_step=(width / range_mon.length);
				var month_offset=parseInt((pos.left / x_step));
				var m=(start_mon + month_offset);
				var year=(__this__.parameters.start.year + (m / 12));
				var month=((m % 12) + 1);
				if ( false )
				{
					__this__.uis.cursor.css({'left':(m * x_step), 'top':0, 'width':x_step, 'height':height})
					__this__.uis.cursor.removeClass('hidden')
				}
				if ( (__this__.uis.qtip.lastMonth != m) )
				{
					var d=__this__.data.mon[m];
					var c=__this__.uis.qtip.elements.content;
					$('.month .out', c).html(sprintf('%02d/%04d', month, year))
					if ( (d === undefined) )
					{
						$('.when-data', c).addClass('hidden')
						$('.when-no_data', c).removeClass('hidden')
						c.addClass('nodata')
					}
					else if ( true )
					{
						$('.when-data', c).removeClass('hidden')
						$('.when-no_data', c).addClass('hidden')
						c.removeClass('nodata')
						var expenses=__this__.retrieveExpenses(d);
						var guidelines=__this__.retrieveGuidelines(d);
						var delta=(expenses / guidelines);
						if ( (delta > 1.0) )
						{
							delta = sprintf('+%d%%', ((delta * 100) - 100));
							$('.delta .out', c).removeClass('negative')
							$('.delta .out', c).addClass('positive')
						}
						else if ( true )
						{
							delta = sprintf('%d%%', ((delta * 100) - 100));
							$('.delta .out', c).addClass('negative')
							$('.delta .out', c).removeClass('positive')
						}
						$('.hospitality  .out', c).html(sprintf('%0.2f $', d.hos))
						$('.travel  .out', c).html(sprintf('%0.2f $', d.tra))
						$('.expenses  .out', c).html(sprintf('%0.2f $', expenses))
						$('.guidelines .out', c).html(sprintf('%0.2f $', guidelines))
						$('.delta .out', c).html(delta)
					}
					__this__.uis.qtip.lastMonth = m;
				}
			}
		},
		// Returns an object with various metrics on the data displayed by this visualization.
		getMetrics:function(data){
			var __this__=this
			var start_mon=(((__this__.parameters.start.year - 2003) * 12) + __this__.parameters.start.month);
			var end_mon=(((__this__.parameters.end.year - 2003) * 12) + __this__.parameters.end.month);
			var range_mon=extend.range((start_mon),(end_mon));
			var metrics={'maxMonth':{'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0}, 'total':{'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0}};
			extend.iterate(range_mon, function(i){
				var d=data.mon[i];
				if ( extend.isList(__this__.parameters.positions) )
				{
					d = data.mon_pos[i];
				}
				if ( d )
				{
					var current={'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0};
					if ( extend.isList(__this__.parameters.positions) )
					{
						extend.iterate(__this__.parameters.positions, function(p){
							var dp=d[p];
							if ( dp )
							{
								extend.iterate(['tra', 'tra_gd', 'hos', 'hos_gd', 'all', 'all_gd'], function(k){
									current[k] = (current[k] + dp[k]);
								}, __this__)
							}
						}, __this__)
					}
					else if ( true )
					{
						current = d;
					}
					extend.iterate(['tra', 'tra_gd', 'hos', 'hos_gd', 'all', 'all_gd'], function(k){
						metrics.total[k] = (metrics.total[k] + current[k]);
					}, __this__)
					extend.iterate(['tra', 'tra_gd', 'hos', 'hos_gd', 'all', 'all_gd'], function(k){
						metrics.maxMonth[k] = Math.max(metrics.maxMonth[k], current[k]);
					}, __this__)
				}
			}, __this__)
			return metrics
		},
		renderGrid:function(data, cache){
			var __this__=this
			var width=parseInt($(__this__.uis.canvas).attr('width'));
			var height=parseInt($(__this__.uis.canvas).attr('height'));
			var start_mon=(((__this__.parameters.start.year - 2003) * 12) + __this__.parameters.start.month);
			var end_mon=(((__this__.parameters.end.year - 2003) * 12) + __this__.parameters.end.month);
			var range_mon=extend.range((start_mon),(end_mon));
			var x=0;
			var x_step=(width / range_mon.length);
			var GRID_COLOR='#F0F0F0';
			__this__.ctx.strokeStyle = GRID_COLOR;
			extend.iterate(range_mon, function(i){
				var is_year=((i % 12) == 0);
				var is_quarter=((i % 4) == 0);
				__this__.ctx.beginPath()
				__this__.ctx.moveTo(x, height)
				__this__.ctx.lineTo(x, 0)
				if ( (__this__.parameters.grid.years && is_year) )
				{
					__this__.ctx.lineWidth = 1;
					__this__.ctx.stroke()
				}
				else if ( (__this__.parameters.grid.quarters && is_quarter) )
				{
					__this__.ctx.lineWidth = 0.5;
					__this__.ctx.stroke()
				}
				else if ( __this__.parameters.grid.months )
				{
					__this__.ctx.lineWidth = 0.5;
					__this__.ctx.stroke()
				}
				__this__.ctx.closePath()
				x = (x + x_step);
			}, __this__)
		},
		// Renders the blue surface that is used as a gradient
		renderSurface:function(data, cache){
			var __this__=this
			var width=parseInt($(__this__.uis.canvas).attr('width'));
			var height=parseInt($(__this__.uis.canvas).attr('height'));
			var start_mon=(((__this__.parameters.start.year - 2003) * 12) + __this__.parameters.start.month);
			var end_mon=(((__this__.parameters.end.year - 2003) * 12) + __this__.parameters.end.month);
			var range_mon=extend.range((start_mon),(end_mon));
			var element_step=(width / (end_mon - start_mon));
			__this__.ctx.strokeStyle = '#A0A0A0';
			__this__.ctx.lineWidth = 1;
			var x=0;
			var y=height;
			var gy=height;
			var first=true;
			var lx=undefined;
			var ly=height;
			if ( true )
			{
				var g=__this__.ctx.createLinearGradient(0, 0, width, (height / 2.0));
				g.addColorStop(0, '#0c4273')
				g.addColorStop(1, '#06b4df')
				__this__.ctx.fillStyle = g;
				__this__.ctx.beginPath()
				extend.iterate(range_mon, function(i){
					var d=data.mon[i];
					if ( extend.isList(__this__.parameters.positions) )
					{
						d = data.mon_pos[i];
					}
					if ( d )
					{
						var expenses=undefined;
						var guidelines=undefined;
						if ( extend.isList(__this__.parameters.positions) )
						{
							extend.iterate(__this__.parameters.positions, function(p){
								var dp=d[p];
								if ( dp )
								{
									if ( (expenses === undefined) )
									{
										expenses = __this__.retrieveExpenses(dp);
									}
									else if ( true )
									{
										expenses = (expenses + __this__.retrieveExpenses(dp));
									}
								}
							}, __this__)
						}
						else if ( true )
						{
							expenses = __this__.retrieveExpenses(d);
						}
						if ( expenses )
						{
							if ( __this__.parameters.cumulative )
							{
								y = (y - cache.normalizeY(expenses));
							}
							else if ( true )
							{
								y = (height - cache.normalizeY(expenses));
							}
							if ( (first === true) )
							{
								__this__.ctx.moveTo(x, height)
								__this__.ctx.lineTo(x, y)
								first = false;
							}
						}
					}
					if ( (first === false) )
					{
						if ( __this__.parameters.cumulative )
						{
							__this__.ctx.lineTo(x, y)
						}
						else if ( true )
						{
							__this__.ctx.lineTo((lx || 0), ly)
							__this__.ctx.lineTo((lx || 0), height)
							__this__.ctx.lineTo(x, height)
							__this__.ctx.lineTo(x, y)
						}
					}
					x = (x + element_step);
					ly = y;
					lx = x;
				}, __this__)
				__this__.ctx.lineWidth = 4;
				__this__.ctx.strokeStyle = '#FFFFFF';
				__this__.ctx.stroke()
				if ( lx )
				{
					__this__.ctx.lineTo((lx + element_step), y)
					__this__.ctx.lineTo((lx + element_step), height)
					__this__.ctx.fill()
				}
			}
		},
		render:function(data){
			var __this__=this
			data = data === undefined ? null : data
			if ( (data != null) )
			{
				__this__.data = data;
			}
			var width=parseInt($(__this__.uis.canvas).attr('width'));
			var height=parseInt($(__this__.uis.canvas).attr('height'));
			var start_mon=(((__this__.parameters.start.year - 2003) * 12) + __this__.parameters.start.month);
			var end_mon=(((__this__.parameters.end.year - 2003) * 12) + __this__.parameters.end.month);
			var range_mon=extend.range((start_mon),(end_mon));
			var element_step=(width / (end_mon - start_mon));
			var total_expenses=0;
			var total_guidelines=0;
			__this__.retrieveExpenses = function(d){
				var total=0;
				if ( __this__.parameters.travel )
				{total = (total + d.tra);}
				if ( __this__.parameters.hospitality )
				{total = (total + d.hos);}
				return total
			};
			__this__.retrieveGuidelines = function(d){
				var total=0;
				if ( __this__.parameters.travel )
				{total = (total + (d.tra_gd * __this__.parameters.guidelinesRatio));}
				if ( __this__.parameters.hospitality )
				{total = (total + (d.hos_gd * __this__.parameters.guidelinesRatio));}
				return total
			};
			if ( __this__.parameters.relative )
			{
				var max_total=0;
				if ( __this__.parameters.cumulative )
				{
					if ( __this__.parameters.guidelines )
					{
						max_total = Math.max(__this__.retrieveExpenses(__this__.parameters.total), __this__.retrieveGuidelines(__this__.parameters.total));
					}
					else if ( true )
					{
						max_total = __this__.retrieveExpenses(__this__.parameters.total);
					}
				}
				else if ( true )
				{
					if ( __this__.parameters.guidelines )
					{
						max_total = Math.max(__this__.retrieveExpenses(__this__.parameters.maxMonth), __this__.retrieveGuidelines(__this__.parameters.maxMonth));
					}
					else if ( true )
					{
						max_total = __this__.retrieveExpenses(__this__.parameters.maxMonth);
					}
				}
				normalize_y = function(y){
					return ((height - 2) * (y / max_total))
				};
			}
			else if ( true )
			{
				var maxima=undefined;
				if ( __this__.parameters.cumulative )
				{
					maxima = __this__.parameters.globalMaxTotal;
				}
				else if ( true )
				{
					maxima = __this__.parameters.globalMaxMonth;
				}
				extend.assert(maxima)
				var maximum=__this__.retrieveExpenses(maxima);
				if ( __this__.parameters.guidelines )
				{maximum = Math.max(maximum, __this__.retrieveGuidelines(maxima));}
				normalize_y = function(y){
					return ((height - 2) * (y / maximum))
				};
			}
			__this__.ctx.fillStyle = '#c6e1ea';
			__this__.ctx.fillRect(0, 0, width, height)
			__this__.renderGrid(data, {'normalizeY':normalize_y})
			__this__.renderSurface(data, {'normalizeY':normalize_y})
			var HOSPITALITY_COLOR='#eddc22';
			var TRAVEL_COLOR='#f85a92';
			var x=0;
			var y=height;
			var gy=height;
			var ty=height;
			var hy=height;
			var tpy=undefined;
			var hpy=undefined;
			extend.iterate(range_mon, function(i){
				var px=x;
				var py=y;
				var pgy=gy;
				var d=data.mon[i];
				if ( extend.isList(__this__.parameters.positions) )
				{
					d = data.mon_pos[i];
				}
				if ( d )
				{
					var expenses=undefined;
					var expenses_hos=undefined;
					var expenses_tra=undefined;
					var guidelines=undefined;
					if ( extend.isList(__this__.parameters.positions) )
					{
						extend.iterate(__this__.parameters.positions, function(p){
							var dp=d[p];
							if ( dp )
							{
								if ( (expenses === undefined) )
								{
									expenses_hos = dp.hos;
									expenses_tra = dp.tra;
									expenses = __this__.retrieveExpenses(dp);
									guidelines = __this__.retrieveGuidelines(dp);
								}
								else if ( true )
								{
									expenses_hos = (expenses_hos + dp.hos);
									expenses_tra = (expenses_tra + dp.tra);
									expenses = (expenses + __this__.retrieveExpenses(dp));
									guidelines = (guidelines + __this__.retrieveGuidelines(dp));
								}
							}
						}, __this__)
					}
					else if ( true )
					{
						expenses_hos = d.hos;
						expenses_tra = d.tra;
						expenses = __this__.retrieveExpenses(d);
						guidelines = __this__.retrieveGuidelines(d);
					}
					if ( expenses )
					{
						total_expenses = (total_expenses + expenses);
						total_guidelines = (total_guidelines + guidelines);
						if ( __this__.parameters.cumulative )
						{
							y = (y - normalize_y(expenses));
							ty = (ty - normalize_y(expenses_tra));
							hy = (hy - normalize_y(expenses_hos));
							gy = (gy - normalize_y(guidelines));
							if ( (y > gy) )
							{
								__this__.ctx.fillStyle = '#10ff10';
							}
							else if ( true )
							{
								__this__.ctx.fillStyle = '#ff1010';
							}
						}
						else if ( true )
						{
							y = (height - normalize_y(expenses));
							ty = (height - normalize_y(expenses_tra));
							hy = (height - normalize_y(expenses_hos));
							gy = (height - normalize_y(guidelines));
							if ( (y > gy) )
							{
								__this__.ctx.fillStyle = '#10ff10a0';
							}
							else if ( true )
							{
								__this__.ctx.fillStyle = '#ff1010a0';
							}
						}
						if ( __this__.parameters.guidelines )
						{
							__this__.ctx.beginPath()
							__this__.ctx.moveTo(x, gy)
							__this__.ctx.lineTo(x, y)
							__this__.ctx.opacity = 0.5;
							__this__.ctx.lineTo((x + element_step), y)
							__this__.ctx.lineTo((x + element_step), gy)
							__this__.ctx.fill()
							__this__.ctx.opacity = 1.0;
						}
						if ( false )
						{
							__this__.ctx.beginPath()
							__this__.ctx.moveTo(x, y)
							__this__.ctx.lineTo((x + element_step), y)
							__this__.ctx.lineWidth = 2;
							__this__.ctx.strokeStyle = '#0000FF';
							__this__.ctx.stroke()
						}
						if ( __this__.parameters.hospitality )
						{
							__this__.ctx.beginPath()
							if ( hpy )
							{
								__this__.ctx.moveTo(x, hpy)
								__this__.ctx.lineTo(x, hy)
							}
							else if ( true )
							{
								__this__.ctx.moveTo(x, hy)
							}
							__this__.ctx.lineTo((x + element_step), hy)
							__this__.ctx.lineWidth = 2;
							__this__.ctx.strokeStyle = HOSPITALITY_COLOR;
							__this__.ctx.stroke()
							hpy = hy;
						}
						if ( __this__.parameters.travel )
						{
							__this__.ctx.beginPath()
							if ( tpy )
							{
								__this__.ctx.moveTo(x, tpy)
								__this__.ctx.lineTo(x, ty)
							}
							else if ( true )
							{
								__this__.ctx.moveTo(x, ty)
							}
							__this__.ctx.moveTo(x, ty)
							__this__.ctx.lineTo((x + element_step), ty)
							__this__.ctx.lineWidth = 2;
							__this__.ctx.strokeStyle = TRAVEL_COLOR;
							__this__.ctx.stroke()
							tpy = ty;
						}
						
						if ( __this__.parameters.guidelines )
						{
							__this__.ctx.beginPath()
							__this__.ctx.moveTo(px, pgy)
							__this__.ctx.lineTo(x, pgy)
							__this__.ctx.lineTo(x, gy)
							__this__.ctx.lineTo((x + element_step), gy)
							__this__.ctx.lineWidth = 1;
							__this__.ctx.strokeStyle = '#36DFFF';
							__this__.ctx.stroke()
						}
					}
				}
				x = (x + element_step);
			}, __this__)
			if ( __this__.parameters.updater )
			{
				window.setTimeout(function(){
					__this__.parameters.updater(__this__.ui, total_expenses, total_guidelines)
				}, 100)
			}
		}
	}
})
expensetag.bindEvents=	function(){
		var __this__=expensetag;
		$('.do-showOptions').click(function(){
			$('.Parameters > .compacted').addClass('hidden')
			$('.Parameters > .expanded').removeClass('hidden').slideDown()
		})
		$('.do-hideOptions').click(function(){
			$('.Parameters > .compacted').removeClass('hidden')
			$('.Parameters > .expanded').addClass('hidden')
		})
		$('.in-quickfind').keyup(function(){
			expensetag.filterBy($('.in-quickfind').val())
		})
		$('.do-resetQuickfind').click(function(){
			$('.in-quickfind').val('')
			expensetag.filterBy($('.in-quickfind').val())
		})
		$('.in-guidelinesRatio').change(function(){
			expensetag.updateGuidelineRatio($(this).val())
		}).val('1.0')
		$('.ctl-guidelinesRatio').slider({'max':1.0, 'min':0.0, 'value':1.0, 'step':0.01, 'slide':function(e, ui){
			$('.in-guidelinesRatio').val(ui.value)
			expensetag.updateGuidelineRatio(ui.value)
		}})
		$('.sort-by .name').click(function(){
			expensetag.sortBy('name')
		})
		$('.sort-by .expenses').click(function(){
			expensetag.sortBy('expenses')
		})
		$('.sort-by .deviation').click(function(){
			expensetag.sortBy('deviation')
		})
		$('.dataset .hospitality').click(function(){
			$(this).toggleClass('current')
			expensetag.updateTagsRendering({'hospitality':$(this).hasClass('current')})
		})
		$('.dataset .guidelines').click(function(){
			$(this).toggleClass('current')
			expensetag.updateTagsRendering({'guidelines':$(this).hasClass('current')})
		})
		$('.dataset .travel').click(function(){
			$(this).toggleClass('current')
			expensetag.updateTagsRendering({'travel':$(this).hasClass('current')})
		})
		$('.mode-1  .month').click(function(){
			expensetag.setMode1('month')
		})
		$('.mode-1  .cumulative').click(function(){
			expensetag.setMode1('cumulative')
		})
		$('.mode-2  .relative').click(function(){
			expensetag.setMode2('relative')
		})
		$('.mode-2  .absolute').click(function(){
			expensetag.setMode2('absolute')
		})
		extend.iterate(['.startDate', '.endDate'], function(ui){
			var ui=$(ui);
			var input=$('input', ui);
			var update_input=function(){
				var year=parseInt($('.year .values .current', ui).text());
				var month=parseInt($('.month .values .current', ui).attr('value'));
				input.val((((month + 1) + '/') + year))
			};
			$('.year .values li', ui).click(function(){
				$('.year .values .current', ui).removeClass('current')
				$(this).addClass('current')
				update_input()
			})
			$('.month .values li', ui).click(function(){
				$('.month .values .current', ui).removeClass('current')
				$(this).addClass('current')
				update_input()
			})
		}, __this__)
		extend.iterate($('.DepartmentSelector'), function(ui){
			var template=$('.departments .template:first', ui);
			var cols=$('.departments ul', ui);
			var count=11;
			var j=0;
			extend.iterate(DEPARTMENTS, function(d, i){
				if ( expensetag.DEPWHITELIST[d[1]] )
				{
					var nui=template.clone().removeClass('template').removeClass('hidden');
					$('input', nui).attr('value', d[0])
					$('.name .out', nui).html(d[1])
					if ( (j < count) )
					{
						$('.template', cols[0]).before(nui)
					}
					else if ( true )
					{
						$('.template', cols[1]).before(nui)
					}
					j = (j + 1);
				}
			}, __this__)
			$('.departments ul li', ui).click(function(){
				$(this).toggleClass('selected')
			}).addClass('selected')
			$('.do-selectAll', ui).click(function(){
				$('.departments li', ui).addClass('selected')
			})
			$('.do-selectNone', ui).click(function(){
				$('.departments li', ui).removeClass('selected')
			})
			$('.do-ok', ui).click(function(){
				var to_show={};
				var checked=$('.departments li.selected', ui);
				extend.iterate(checked, function(e){
					var li=e;
					if ( (! $(li).hasClass('template')) )
					{
						var name=$('.name .out', li).text();
						to_show[name] = true;
					}
				}, __this__)
				expensetag.filterByDepartment(to_show)
				if ( (checked.length == (DEPARTMENTS.length + 2)) )
				{
					$('.departments .value', ui).html('all')
				}
				else if ( true )
				{
					$('.departments .value', ui).html(('' + checked.length))
				}
			})
		}, __this__)
		extend.iterate($('.PositionSelector'), function(ui){
			ui = $(ui);
			var all_positions=$('.choices li', ui);
			$('.choices ul li', ui).click(function(){
				$(this).toggleClass('selected')
			}).addClass('selected')
			$('.do-selectAll', ui).click(function(){
				$('.choices li', ui).addClass('selected')
			})
			$('.do-selectNone', ui).click(function(){
				$('.choices li', ui).removeClass('selected')
			})
			$('.do-ok', ui).click(function(){
				var checked=$('.choices li.selected', ui);
				var positions=null;
				if ( (checked.length == all_positions.length) )
				{
					$('.position .value', ui).html('all')
					positions = null;
				}
				else if ( true )
				{
					if ( (checked.length == 1) )
					{
						$('.position .value', ui).html((checked.length + ''))
					}
					else if ( true )
					{
						$('.position .value', ui).html((checked.length + ''))
					}
					positions = [];
					extend.iterate(checked, function(p){
						positions.push($('input', p)[0].value)
					}, __this__)
				}
				expensetag.updateTagsRendering({'positions':positions})
			})
		}, __this__)
		extend.iterate($('.PeriodSelector'), function(ui){
			ui = $(ui);
			var start_value=$('.startDate .value', ui);
			var end_value=$('.endDate .value', ui);
			$('.do-save', ui).click(function(){
				var start=start_value.val().split('/');
				var end=end_value.val().split('/');
				expensetag.updateTagsRendering({'start':{'year':parseInt(start[1]), 'month':parseInt(start[0])}, 'end':{'year':parseInt(end[1]), 'month':parseInt(end[0])}})
			})
			$('.ctl-date', ui).slider({'min':0, 'max':(((2008 - 2003) * 12) + 12), 'values':[0, (((2008 - 2003) * 12) + 12)], 'value':((2008 - 2003) * 12), 'step':1, 'range':true, 'slide':function(e, ui){
				var params={'start':{'year':(2003 + parseInt((ui.values[0] / 12))), 'month':(ui.values[0] % 12)}, 'end':{'year':(2003 + parseInt((ui.values[1] / 12))), 'month':(ui.values[1] % 12)}};
				start_value.val(sprintf('%d/%d', (params.start.month + 1), params.start.year))
				end_value.val(sprintf('%d/%d', (params.end.month + 1), params.end.year))
				expensetag.updateTagsRendering(params)
			}})
		}, __this__)
		extend.iterate($('.w-dialog'), function(d){
			$('.do-close', d).click(function(){
				$('#Dialogs').addClass('hidden')
				wallpaper.hideOverlay('#Dialogs .w-shade')
			})
		}, __this__)
		$('.w-clickdetails .do-showDetails').click(function(){
			$('.details', $(this).parents('.w-clickdetails:first')).show()
		})
		$('.w-clickdetails .do-hideDetails').click(function(){
			$('.details', $(this).parents('.w-clickdetails:first')).hide()
		})
		$('.ExpenseTag .do-showMore').click(function(){
			expensetag.showDetails($(this).parents('.ExpenseTag')[0])
		})
		var timeline=wallpaper.getWidget('#TimelineWidget');
		var timeline_start=$('.timeline .start .out');
		var timeline_end=$('.timeline .end .out');
		var timeline_dur=$('.timeline .dur .out');
		timeline.onCursorUpdating = function(value, start, end){
			var months=((2008 * 12) - ((2002 * 12) + 1));
			var start_date=Math.round((start * months));
			var end_date=Math.round((end * months));
			var params={'start':{'year':(2003 + parseInt((start_date / 12))), 'month':(start_date % 12)}, 'end':{'year':(2003 + parseInt((end_date / 12))), 'month':(end_date % 12)}};
			timeline_start.html(sprintf('%s. %d', expensetag.MONTHS[params.start.month], params.start.year))
			timeline_end.html(sprintf('%s. %d', expensetag.MONTHS[params.end.month], params.end.year))
			timeline_dur.html(('' + (end_date - start_date)))
		};
		timeline.onCursorUpdated = function(value, start, end){
			var months=((2008 * 12) - ((2002 * 12) + 1));
			var start_date=Math.round((start * months));
			var end_date=Math.round((end * months));
			var params={'start':{'year':(2003 + parseInt((start_date / 12))), 'month':(start_date % 12)}, 'end':{'year':(2003 + parseInt((end_date / 12))), 'month':(end_date % 12)}};
			expensetag.updateTagsRendering(params)
		};
	}
expensetag.getDatasetMetrics=	function(tags){
		// Computes the maximum per month and total maximum for all the displayed expense tags,
		// and returns them as '{month:...,total:....}'
		var __this__=expensetag;
		tags = tags === undefined ? undefined : tags
		var result={'maxMonth':{'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0}, 'maxTotal':{'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0}};
		if ( (tags === undefined) )
		{
			tags = $('.ExpenseTagsViz .ExpenseTags');
		}
		extend.iterate(tags, function(expense_tag){
			var expense_tag=$(expense_tag);
			if ( (! expense_tag.hasClass('no-data')) )
			{
				var d=expense_tag[0]._data;
				var expense_metrics=d.viz.getMetrics(d.department);
				extend.iterate(['tra', 'tra_gd', 'hos', 'hos_gd', 'all', 'all_gd'], function(k){
					result.maxMonth[k] = Math.max(result.maxMonth[k], expense_metrics.maxMonth[k]);
					result.maxTotal[k] = Math.max(result.maxTotal[k], expense_metrics.total[k]);
				}, __this__)
			}
		}, __this__)
		return result
	}
expensetag.showDetails=	function(expenseTag){
		// Show the details for a specific expense tag. This popus-up a details dialog.
		var __this__=expensetag;
		expenseTag = $(expenseTag);
		var tag_data=$(expenseTag)[0]._data;
		var details=$('#Templates .ExpenseTagDetails').clone();
		var size=placement.getBox($('.details', details));
		var original_canvas=$('canvas', expenseTag);
		var canvas=$('.maingraph canvas', details);
		canvas.attr('width', (original_canvas.attr('width') * 1.5))
		canvas.attr('height', (original_canvas.attr('height') * 1.5))
		var viz=new expensetag.ExpenseTag($('.maingraph', details));
		extend.iterate(tag_data.viz.parameters, function(v, k){
			viz.parameters[k] = v;
		}, __this__)
		viz.parameters.grid = {'quarters':true, 'years':true};
		viz.parameters.positions = null;
		viz.parameters.updater = null;
		viz.render(tag_data.department)
		var position_template=$('.details tr.template', details);
		extend.iterate(POSITIONS, function(position){
			var id=position[0];
			var name=position[1];
			var sub_graph=position_template.clone().removeClass('template').removeClass('hidden');
			position_template.before(sub_graph)
			var canvas=$('canvas', sub_graph);
			canvas.attr('width', (original_canvas.attr('width') * 1.5))
			$('.name .out', sub_graph).html(name)
			if ( true )
			{
				var sub_viz=new expensetag.ExpenseTag(sub_graph);
				extend.iterate(tag_data.viz.parameters, function(v, k){
					sub_viz.parameters[k] = v;
				}, __this__)
				sub_viz.parameters.grid.quarters = true;
				sub_viz.parameters.positions = [id];
				if ( true )
				{
					sub_viz.parameters.updater = function(ui, s, g){
						$('.expenses  .out', ui).html(sprintf('%d', s))
						$('.guidelines .out', ui).html(sprintf('%d', g))
						var vari=((s / g) * 100);
						if ( (vari > 0) )
						{
							$('.variance', ui).html(sprintf('-%d', vari))
						}
						else if ( true )
						{
							$('.variance', ui).html(sprintf('+%d', vari))
						}
						if ( (s == 0) )
						{
							sub_graph.addClass('hidden')
						}
					};
				}
				sub_viz.render(tag_data.department)
			}
		}, __this__)
		$('body').after(details)
		$(details).dialog({'width':800, 'height':500, 'title':('Details for ' + tag_data.name), 'close':function(){
			$(details).dialog('destroy').remove()
		}})
	}
expensetag.updateTagsRendering=	function(parameters){
		var __this__=expensetag;
		$('.ExpenseTagsViz .filter .sort-by .current').removeClass('current')
		var tags=$('.ExpenseTagsViz .body .tags .ExpenseTag');
		extend.iterate(tags, function(v){
			var viz=v._data.viz;
			extend.iterate(parameters, function(v, k){
				viz.parameters[k] = v;
			}, __this__)
		}, __this__)
		var metrics=expensetag.getDatasetMetrics(tags);
		extend.iterate(tags, function(v){
			var viz=v._data.viz;
			viz.parameters.globalMaxMonth = metrics.maxMonth;
			viz.parameters.globalMaxTotal = metrics.maxTotal;
			viz.render(v._data.department)
		}, __this__)
	}
expensetag.updateGuidelineRatio=	function(ratio){
		var __this__=expensetag;
		ratio = parseFloat(ratio);
		expensetag.updateTagsRendering({'guidelinesRatio':ratio})
	}
expensetag.filterBy=	function(criteria){
		var __this__=expensetag;
		extend.iterate($('.ExpenseTagsViz .ExpenseTag'), function(tag){
			if ( (! (criteria || (('' + criteria).toLowerCase() == 'all departments'))) )
			{
				$(tag).removeClass('hidden')
			}
			else if ( true )
			{
				criteria = ('' + criteria).toLowerCase();
				var name=$(tag)[0]._data.name.toLowerCase();
				if ( (name.indexOf(criteria) != -1) )
				{
					$(tag).removeClass('hidden')
				}
				else if ( true )
				{
					$(tag).addClass('hidden')
				}
			}
		}, __this__)
	}
expensetag.filterByDepartment=	function(toShow){
		var __this__=expensetag;
		extend.iterate($('.ExpenseTagsViz .ExpenseTag'), function(tag){
			var data=$(tag)[0]._data;
			if ( toShow )
			{
				if ( (toShow[data.name] != true) )
				{
					$(tag).addClass('hidden')
				}
				else if ( true )
				{
					$(tag).removeClass('hidden')
				}
			}
			else if ( true )
			{
				$(tag).removeClass('hidden')
			}
		}, __this__)
	}
expensetag.sortBy=	function(criteria){
		var __this__=expensetag;
		$('.sort-by .current').removeClass('current')
		$(('.sort-by .' + criteria)).addClass('current')
		var tags=[];
		extend.iterate($('.ExpenseTagsViz .ExpenseTag'), function(v){
			tags.push(v)
		}, __this__)
		tags.sort(function(a, b){
			a = $(a)[0]._data[criteria];
			b = $(b)[0]._data[criteria];
			var result=0;
			if ( (a < b) )
			{
				result = 1;
			}
			else if ( (a > b) )
			{
				result = -1;
			}
			if ( (criteria == 'name') )
			{
				result = (0 - result);
			}
			return result
		})
		extend.iterate(tags, function(tag){
			$('.ExpenseTagsViz .tags').append(tag)
		}, __this__)
	}
expensetag.setMode1=	function(mode){
		var __this__=expensetag;
		$('.mode-1 .current').removeClass('current')
		if ( (mode == 'cumulative') )
		{
			$('.mode-1 .cumulative').addClass('current')
			expensetag.updateTagsRendering({'cumulative':true})
		}
		else if ( true )
		{
			$('.mode-1 .month').addClass('current')
			expensetag.updateTagsRendering({'cumulative':false})
		}
	}
expensetag.setMode2=	function(mode){
		var __this__=expensetag;
		$('.mode-2 .current').removeClass('current')
		if ( (mode == 'absolute') )
		{
			$('.mode-2 .absolute').addClass('current')
			expensetag.updateTagsRendering({'relative':false})
		}
		else if ( true )
		{
			$('.mode-2 .relative').addClass('current')
			expensetag.updateTagsRendering({'relative':true})
		}
	}
expensetag.init=	function(){
		var __this__=expensetag;
		$(document).ready(function(){
			wallpaper.bind()
			var guidelines_ratio=parseFloat($('.in-guidelinesRatio').val());
			var original=$('#Templates > .ExpenseTag');
			var datavizs=$('.ExpenseTagsViz .body .tags');
			var maxima_month={'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0};
			var maxima_total={'tra':0, 'tra_gd':0, 'hos':0, 'hos_gd':0, 'all':0, 'all_gd':0};
			extend.iterate(EXPENSES, function(d, n){
				extend.iterate(maxima_month, function(v, k){
					maxima_month[k] = Math.max((d.max_month[k] || 0), v);
				}, __this__)
				extend.iterate(maxima_total, function(v, k){
					maxima_total[k] = Math.max((d.total[k] || 0), v);
				}, __this__)
			}, __this__)
			var last_department=0;
			extend.iterate(EXPENSES, function(department, i){
				if ( (i <= 2) )
				{
					var name=department.name;
					expensetag.DEPWHITELIST[name] = true;
					var total_expenses=department.total.all;
					var total_guidelines=department.total.all_gd;
					var position=(('' + parseInt(((100 * total_expenses) / maxima_total.all))) + '%');
					var deviation=((total_expenses / total_guidelines) * 100);
					var new_view=original.clone();
					if ( (name.length > 40) )
					{name = (extend.slice(name,0,36) + '...');}
					$('.origin .out', new_view).html(('' + name))
					var updater=function(ui, total_expenses, total_guidelines){
						var deviation=((total_expenses / total_guidelines) * 100);
						$('.out-total', ui).html(sprintf('%2.2fK$', (total_expenses / 1000)))
						if ( (deviation >= 100) )
						{
							$('.variation .out', ui).html(sprintf('+%d%%', (deviation - 100)))
							$('.variation', ui).addClass('positive').removeClass('negative')
						}
						else if ( true )
						{
							$('.variation .out', ui).html(sprintf('%d%%', (deviation - 100)))
							$('.variation', ui).addClass('negative').removeClass('positive')
						}
						if ( (total_expenses == 0) )
						{
							ui.addClass('nodata')
						}
						else if ( true )
						{
							ui.removeClass('nodata')
						}
						var data=$(ui)[0]._data;
						data.expenses = total_expenses;
						data.deviation = deviation;
					};
					datavizs.append(new_view)
					var viz=new expensetag.ExpenseTag(new_view);
					viz.parameters.maxMonth = department.max_month;
					viz.parameters.total = department.total;
					viz.parameters.globalMaxTotal = maxima_total;
					viz.parameters.globalMaxMonth = maxima_month;
					viz.parameters.department = department;
					viz.parameters.guidelinesRatio = (parseInt(guidelines_ratio) || 1.0);
					viz.parameters.updater = updater;
					new_view = $(new_view)[0];
					new_view._data = {'name':name, 'department':department, 'parameters':viz.parameters, 'expenses':total_expenses, 'deviation':deviation, 'viz':viz};
					expensetag.updateTagsRendering({})
				}
			}, __this__)
			expensetag.sortBy('name')
			expensetag.bindEvents()
			$('.ExpenseTagsViz .tags').sortable()
		})
	}
expensetag.init()


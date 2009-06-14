// 8< ---[channels.js]---
// The channels module defines objects that make JavaScript client-side HTTP
// communication easier by providing the 'Future' and 'Channel' abstractions
// well known from some concurrent programming languages and frameworks.

var channels=channels||{}
var __this__=channels
channels.__VERSION__='0.8.2';
channels.Future=extend.Class({
	// A Future represents the promise of a future value returned by an invocation
	// that started an asynchronous process. In other words, a future is a value that
	// ''wraps the future value'' that will be later returned by a process that is
	// not able to give the value directly.
	// 
	// The typical use of Futures is when you are doing networking, such as
	// asynchronous HTTP GETs on a web client: you won't have the response directly
	// (because the HTTP GET is synchronous) but you may want to do things in the
	// meantime.
	// 
	// Futures provide an interesting abstraction to deal with these situations.
	// This implementation of Futures was inspired from the Oz programming language.
	name:'channels.Future', parent:undefined,
	shared:{
		STATES:{'WAITING':1, 'SET':2, 'FAILED':3, 'CANCELLED':4},
		FAILURES:{'GENERAL':'FAILURE', 'TIMEOUT':'TIMEOUT', 'EXCEPTION':'EXCEPTION'}
	},
	properties:{
		_value:undefined,
		_failureStatus:undefined,
		_failureReason:undefined,
		_failureContext:undefined,
		_processors:[],
		_onSet:[],
		_onPartial:[],
		_onFail:[],
		_onException:[],
		_onCancel:[],
		_onRefresh:undefined,
		state:undefined
	},
	initialize:function(){
		var __this__=this
		__this__._processors = []
		__this__._onSet = []
		__this__._onPartial = []
		__this__._onFail = []
		__this__._onException = []
		__this__._onCancel = []
		__this__.state = __this__.getClass() .STATES.WAITING;
	},
	methods:{
		// Sets the value for this future. This function can be given as a callback
		// for an underlying asynchronous system (such as MochiKit Defered).
		set:function(value){
			var __this__=this
			__this__._value = value;
			__this__.state = __this__.getClass() .STATES.SET;
			extend.iterate(__this__._processors, function(p){
				try {
					__this__._value = p(__this__._value);
				}
				catch(e){
					__this__._handleException(e)
				}
			}, __this__)
			extend.iterate(__this__._onSet, function(c){
				try {
					c(__this__._value, __this__)
				}
				catch(e){
					__this__._handleException(e)
				}
			}, __this__)
			return __this__
		},
		// Some future values may be updated sequentially, this happens when you do a
		// request to a streaming HTTP service (also known as Comet).
		setPartial:function(){
			var __this__=this
			extend.iterate(__this__._onPartial, function(c){
				try {
					c(__this__._value, __this__)
				}
				catch(e){
					__this__._handleException(e)
				}
			}, __this__)
			return __this__
		},
		// This is an alias for 'value'
		get:function(){
			var __this__=this
			return __this__.value()
		},
		// Cancels the retrieval of the value. This will invoke the onCancel callbacks, only
		// if the Future state is WAITING.
		cancel:function(){
			var __this__=this
			if ( (__this__.state == __this__.getClass() .STATES.WAITING) )
			{
				__this__.state = __this__.getClass() .STATES.CANCELLED;
				extend.iterate(__this__._onCancel, function(c){
					try {
						c(status, reason, context, __this__)
					}
					catch(e){
						__this__._handleException(e)
					}
				}, __this__)
			}
		},
		// Returns the value for this future. This will return 'Undefined' until the
		// value is set. If you want to know if the value is set you can query the
		// 'state' property of the future or invoke the 'isSet' method.
		value:function(){
			var __this__=this
			return __this__._value
		},
		// Fails this future with the given (optional) 'status' (machine-readbale
		// code), 'reason' (human-readable string) and context (the value that
		// originated the failure). 
		// 
		// >   future fail ( f FAILURES TIMEOUT,  "Timeout of 2000ms exceeded")
		// 
		// Could mean to the application that the future failed because the timeout
		// value of 2000 was reached.
		fail:function(status, reason, context){
			var __this__=this
			status = status === undefined ? __this__.getClass() .FAILURES.GENERAL : status
			reason = reason === undefined ? undefined : reason
			context = context === undefined ? undefined : context
			__this__.state = __this__.getClass() .STATES.FAILED;
			__this__._failureStatus = status;
			__this__._failureReason = reason;
			__this__._failureContext = context;
			extend.iterate(__this__._onFail, function(c){
				try {
					c(status, reason, context, __this__)
				}
				catch(e){
					__this__._handleException(e)
				}
			}, __this__)
			return __this__
		},
		// Tells if this future value was set or not.
		isSet:function(){
			var __this__=this
			return (__this__.state === __this__.getClass() .STATES.SET)
		},
		// Tells if this future has failed or not
		hasFailed:function(){
			var __this__=this
			return (__this__.state === __this__.getClass() .STATES.FAILED)
		},
		// Tells if this future has succeeded or not (this is an alias for 'isSet')
		hasSucceeded:function(){
			var __this__=this
			return __this__.isSet()
		},
		// Registers the given callback to be invoked when this future value is set.
		// The callback will take the value as first argument and the future as
		// second argument.
		// 
		// >    future onSet {v,f| print ("Received value", v, "from future", f)}
		onSet:function(callback){
			var __this__=this
			__this__._onSet.push(callback)
			if ( __this__.hasSucceeded() )
			{
				try {
					callback(__this__._value, __this__)
				}
				catch(e){
					__this__._handleException(e)
				}
			}
			return __this__
		},
		// Registers the given callback to be invoked when this future value is
		// partially set. Some values (especially those coming from streaming sources)
		// may be received in success "packets". Callbacks will be invoked with the
		// partial value and this future as argument.
		// 
		// Note that the value will not be processed, as it is partial.
		onPartial:function(callback){
			var __this__=this
			__this__._onPartial.push(callback)
			return __this__
		},
		// This is just an alias for 'onSet', as if you use 'onFail' often,
		// you'll be tempted to use 'onSucceed' as well.
		onSucceed:function(callback){
			var __this__=this
			return __this__.onSet(callback)
		},
		// Registers the given callback to be invoked when this future fails.
		// The callback takes the following arguments:
		// 
		// - the 'status' for the failure (ie. machine-readable description of the error)
		// - the 'reason' for the failure (ie. human-readable description of the error)
		// - the 'context' for the exception, so that clients have the opportunity
		// - the 'future' in which the failure happened
		// 
		// Example:
		// 
		// >    # s = status, r = reason, c = context, f = future
		// >    future onFail {s,r,c,f| print ("Future", f, "failed: with code", s, " reason is ", r, "in context", c)}
		// 
		// 
		// NOTE: failures and exceptions are different things, a failure means that the
		// future won't have its value set (because something happened in the pipe), while
		// an exception means that the code broke at some point.
		onFail:function(callback){
			var __this__=this
			__this__._onFail.push(callback)
			if ( __this__.hasFailed() )
			{
				try {
					callback(__this__._value, __this__)
				}
				catch(e){
					__this__._handleException(e)
				}
			}
			return __this__
		},
		// Registers a callback to handle exceptions that may happen when executing the
		// onFail or onSucceed callbacks. Exception callbacks are added LIFO and are chained:
		// each callback takes the exception 'e' and the future 'f' as parameters, and will
		// block propagation to the next by returning 'False'.
		onException:function(callback){
			var __this__=this
			__this__._onException.splice(0, 0, callback)
		},
		// Registers the given callback to be executed when the future is cancelled. Usually, it is the
		// process that creates the Future that will register an 'onCancel' callback first. For instance,
		// an Future returned by an HTTP Request would have an onCancel callback that would just close the
		// associated HTTP request.
		onCancel:function(callback){
			var __this__=this
			__this__._onCancel.splice(0, 0, callback)
		},
		// Returns the status for the error. The status is a machine-readable code.
		getFailureStatus:function(){
			var __this__=this
			return __this__._failureStatus
		},
		// Returns the reason for the error. The reason is a human-readable string.
		getFailureReason:function(){
			var __this__=this
			return __this__._failureReason
		},
		// Returns the context in which the failure happened. For HTTP channels, this
		// will be the reference to the HTTP request that failed.
		getFailureContext:function(){
			var __this__=this
			return __this__._failureContext
		},
		// Invoked when a future had and exception. This invokes every callback registered
		// in the 'onException' list (which were previously registered using the
		// 'onFail' method).
		_handleException:function(e){
			var __this__=this
			var i=0;
			var r=true;
			while ((i < __this__._onException.length))
			{
				if ( (__this__._onException[i](e, this) == false) )
				{
					i = (exceptionCallbacks.length + 1);
					r = false;
				}
				i = (i + 1);
			}
			if ( (i == 0) )
			{
				throw e
			}
			return r
		},
		// Refreshing a future will basically invoke the 'refresh' callback set
		// with the 'onRefresh' function. Typical use of 'refresh' is to take an
		// existing future and to bind the function that created the value as
		// 'refresh', so that getting a "fresher" value can simply be done
		// by calling 'refresh'.
		// 
		// Example:
		// 
		// >    var c = new channels SyncChannel ()
		// >    var f = c get "this/url"
		// >
		// >    # We bind a refresh function
		// >    f onRefresh {c get ("this/url", f)}
		// >    
		// >    # We bind success callbacks
		// >    f onSucceed {d|print ("Received:",d}
		// >    
		// >    # We should see that the data was received
		// >    # and if we refresh, we should see the
		// >    # 'Reveived:...' text again
		// >    f refresh ()
		// >    
		// >    # And we can call refresh multiple times
		// >    f refresh ()
		// 
		// It's particularly useful to use 'refresh' along with 'process',
		// especially when you're querying URLs frequently.
		refresh:function(){
			var __this__=this
			__this__.state = __this__.getClass() .STATES.WAITING;
			if ( __this__._onRefresh )
			{__this__._onRefresh(__this__)}
			return __this__
		},
		// Sets the callback that will be invoked with this future as argument
		// when the 'refresh' method is invoked. There can be only one refresh
		// callback per future, which means that the previous refresh function
		// will be replaced by the newly given callback.
		// 
		// See 'refresh' for an example.
		onRefresh:function(callback){
			var __this__=this
			__this__._onRefresh = callback;
			return __this__
		},
		// Adds a callback that will process the value of this future, returning
		// the newly processed value. Processing callback will be chained, and
		// will work even if the future value is already set.
		// 
		// Processors are typically used to process the value obtained from a
		// future.
		// 
		// >    var future = getFutureResult()
		// >    future process { v | v toLowerCase() }
		// >    future onSet   { v | print ("Lowercase value: " + v) }
		// 
		// It is a good idea to use processors along with the 'refresh' option,
		// so that you can easily set up a chain of processing the future value.
		process:function(callback){
			var __this__=this
			__this__._processors.push(callback)
			if ( __this__.isSet() )
			{__this__._value = callback(__this__._value);}
			return __this__
		}
	}
})
channels.Channel=extend.Class({
	// Channels are specific objects that allow communication operations to happen
	// in a shared context. The modus operandi is as follows:
	// 
	// - You initialize a channel with specific properties (for HTTP, this would
	// be a prefix for the URLs, wether you want to evaluate the JSON that may
	// be contained in responses, etc).
	// - You send something into the channel (typically an HTTP request)
	// - You get a 'Future' as a promise for a future result.
	// - When the result arrives, the future is set with the resulting value.
	// 
	// Synchronous channels will typically set the result directly, while for
	// asynchronous channels, the result will only be available later.
	// 
	// NOTE: The current implementation of 'Channels' is very much HTTP-oriented. At
	// a later point, the Channels class will be more generic, and will provide
	// separate specific aspects for the HTTP protocol.
	name:'channels.Channel', parent:undefined,
	properties:{
		options:{'prefix':'', 'evalJSON':true, 'forceJSON':false},
		transport:{'get':undefined, 'post':undefined},
		failureCallbacks:[],
		exceptionCallbacks:[]
	},
	initialize:function(options){
		var __this__=this
		options = options === undefined ? {} : options
		__this__.options = {'prefix':'', 'evalJSON':true, 'forceJSON':false}
		__this__.transport = {'get':undefined, 'post':undefined}
		__this__.failureCallbacks = []
		__this__.exceptionCallbacks = []
		if ( extend.isString(options) )
		{
			__this__.options.prefix = options;
		}
		else if ( true )
		{
			extend.iterate(options, function(v, k){
				__this__.options[k] = v;
			}, __this__)
		}
	},
	methods:{
		isAsynchronous:function(){
			var __this__=this
			return undefined
		},
		isSynchronous:function(){
			var __this__=this
			return undefined
		},
		// Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
		// this channel options) and returns a 'Future'.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		get:function(url, body, headers, future){
			var __this__=this
			body = body === undefined ? '' : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			var get_url=(__this__.options.prefix + url);
			body = __this__._normalizeBody(body);
			future = __this__.transport.get(get_url, body, headers, (future || __this__._createFuture()), __this__.options);
			future.onRefresh(function(f){
				return __this__.get(url, body, headers, f)
			})
			return future
		},
		// Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
		// this channel options), using the given 'body' as request body, and
		// returning a 'Future' instance.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		post:function(url, body, headers, future){
			var __this__=this
			body = body === undefined ? '' : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? undefined : future
			var post_url=(__this__.options.prefix + url);
			body = __this__._normalizeBody(body);
			future = __this__.transport.post(post_url, body, headers, (future || __this__._createFuture()), __this__.options);
			future.onRefresh(function(f){
				return __this__.post(url, body, headers, f)
			})
			return future
		},
		// Sets a callback that will be invoked when a future created in this channel
		// fails. The given 'callback' takes the _reason_, _details_ and _future_ as
		// argument, where reason and details are application-specific information
		// (for HTTP, reason is usually a number, detail is the response text)
		onFail:function(callback){
			var __this__=this
			__this__.failureCallbacks.push(callback)
		},
		// Sets a callback that will be invoked when a future created in this channel
		// raises an exception. The given 'callback' takes the _exceptoin_ and _future_ as
		// arguments. Callbacks are inserted in LIFO style, if a callback returns 'False',
		// propagation of the exception will stop.
		onException:function(callback){
			var __this__=this
			__this__.exceptionCallbacks.splice(0, 0, callback)
		},
		// Returns a new future, properly initialized for this channel
		_createFuture:function(){
			var __this__=this
			var future=new channels.Future();
			future.onFail(__this__.getMethod('_futureHasFailed') )
			future.onException(__this__.getMethod('_futureHadException') )
			future.process(__this__.getMethod('_processHTTPResponse') )
			return future
		},
		// Invoked when a future has failed. This invokes every callback registered
		// in the 'failureCallbacks' list (which were previously registered using the
		// 'onFail' method).
		_futureHasFailed:function(reason, details, future){
			var __this__=this
			extend.iterate(__this__.failureCallbacks, function(c){
				c(reason, details, future)
			}, __this__)
		},
		// Invoked when a future had and exception. This invokes every callback registered
		// in the 'exceptionCallbacks' list (which were previously registered using the
		// 'onFail' method).
		_futureHadException:function(e, future){
			var __this__=this
			var i=0;
			var r=true;
			while ((i < __this__.exceptionCallbacks.length))
			{
				if ( (__this__.exceptionCallbacks[i](e, future) == false) )
				{
					i = (__this__.exceptionCallbacks.length + 1);
					r = false;
				}
				i = (i + 1);
			}
			if ( ((i == 0) && __this__.isSynchronous()) )
			{
				throw e
			}
			return r
		},
		_normalizeBody:function(body){
			var __this__=this
			if ( (typeof(body) != 'string') )
			{
				var new_body='';
				extend.iterate(body, function(v, k){
					new_body = (new_body + (((k + '=') + __this__._encodeURI(v)) + '&'));
				}, __this__)
				body = new_body;
			}
			return (body || '')
		},
		_responseIsJSON:function(response){
			var __this__=this
			var content_type=response.getResponseHeader('Content-Type').split(';')[0];
			if ( (((content_type === 'text/javascript') || (content_type === 'text/x-json')) || (content_type === 'application/json')) )
			{
				return true
			}
			else if ( true )
			{
				return false
			}
		},
		_parseJSON:function(json){
			var __this__=this
			return function(){
				return eval(json)
			}()
		},
		_processHTTPResponse:function(response){
			var __this__=this
			if ( ((__this__.options.forceJSON && __this__.options.evalJSON) || (__this__.options.evalJSON && __this__._responseIsJSON(response))) )
			{
				return __this__._parseJSON((('(' + response.responseText) + ')'))
			}
			else if ( true )
			{
				return response.responseText
			}
		},
		_encodeURI:function(value){
			var __this__=this
			return encodeURIComponent(value)
		}
	}
})
channels.SyncChannel=extend.Class({
	// The SyncChannel will use the synchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.SyncChannel', parent:channels.Channel,
	initialize:function(options){
		var __this__=this
		__this__.getSuper(channels.SyncChannel.getParent())(options)
		__this__.transport.get = channels.HTTPTransport.DEFAULT.getMethod('syncGet');
		__this__.transport.post = channels.HTTPTransport.DEFAULT.getMethod('syncPost');
	},
	methods:{
		isAsynchronous:function(){
			var __this__=this
			return false
		},
		isSynchronous:function(){
			var __this__=this
			return true
		}
	}
})
channels.AsyncChannel=extend.Class({
	// The AsyncChannel will use the asynchronous methods from the HTTP transport
	// object to do the communication.
	name:'channels.AsyncChannel', parent:channels.Channel,
	initialize:function(options){
		var __this__=this
		__this__.getSuper(channels.AsyncChannel.getParent())(options)
		__this__.transport.get = channels.HTTPTransport.DEFAULT.getMethod('asyncGet');
		__this__.transport.post = channels.HTTPTransport.DEFAULT.getMethod('asyncPost');
	},
	methods:{
		isAsynchronous:function(){
			var __this__=this
			return true
		},
		isSynchronous:function(){
			var __this__=this
			return false
		}
	}
})
channels.BurstChannel=extend.Class({
	// The BurstChannel is a specific type of AsyncChannel that is capable of
	// tunneling HTTP requests in HTTP.
	name:'channels.BurstChannel', parent:channels.AsyncChannel,
	properties:{
		channelURL:undefined,
		onPushCallbacks:[],
		requestsQueue:[]
	},
	initialize:function(url, options){
		var __this__=this
		__this__.channelURL = undefined
		__this__.onPushCallbacks = []
		__this__.requestsQueue = []
		__this__.getSuper(channels.BurstChannel.getParent())(options)
		__this__.channelURL = (url || '/channels:burst');
	},
	methods:{
		// Registers a callback that will be called when something is 'pushed' into
		// the channel (a GET, POST, etc). The callback can query the channel status
		// and decide to explicitly flush the 'requestsQueue', or just do nothing.
		// 
		// FIXME: WHAT ARGUMENTS ?
		onPush:function(callback){
			var __this__=this
			__this__.onPushCallbacks.push(callback)
		},
		_pushRequest:function(request){
			var __this__=this
			__this__.requestsQueue.push(request)
		},
		_sendRequests:function(requests){
			var __this__=this
			var boundary='8<-----BURST-CHANNEL-REQUEST-------';
			var headers=[['X-Channel-Boundary', boundary], ['X-Channel-Type', 'burst'], ['X-Channel-Requests', ('' + requests.length)]];
			var request_as_text=[];
			var futures=[];
			extend.iterate(requests, function(r){
				var t=(((r.method + ' ') + r.url) + '\r\n');
				extend.iterate(r.headers, function(h){
					t = (t + (((h[0] + ': ') + h[1]) + '\n'));
				}, __this__)
				t = (t + '\r\n');
				t = (t + r.body);
				request_as_text.push(t)
				futures.push(r.future)
			}, __this__)
			var body=request_as_text.join((boundary + '\n'));
			var f=__this__.transport.post(__this__.channelURL, body, headers);
			f.onSet(function(v){
				__this__._processResponses(v, futures)
			})
			f.onFail(function(s, r, c, f){
				extend.iterate(futures, function(f){
					f.fail(s, r, c)
				}, __this__)
			})
		},
		// This is the callback attached to composite methods
		_processResponses:function(response, futures){
			var __this__=this
			console.log(response)
			var text=response.responseText;
			var boundary=response.getResponseHeader('X-Channel-Boundary');
			if ( (! boundary) )
			{
				extend.iterate(futures, function(f){
					f.fail('Server did not provide X-Channel-Boundary header')
				}, __this__)
			}
			else if ( true )
			{
				var i=0;
				extend.iterate(text.split(boundary), function(r){
					r = function(){
						return eval((('(' + r) + ')'))
					}();
					r.responseText = r.body;
					r.getHeader = function(h){
						h = h.toLowerCase();
						result = undefined;
						extend.iterate(r.headers, function(header){
							if ( (header[0].toLowerCase() == h) )
							{
								result = header[1];
							}
						}, __this__)
						return result
					};
					r.getResponseHeader = function(h){
						return (r.getHeader(h) || response.getResponseHeader(h))
					};
					futures[i].set(r)
					i = (i + 1);
				}, __this__)
			}
		},
		// Flushes the 'requestsQueue', using the given 'filter' function. For every request in
		// 'requestsQueue', if 'filter(r)' is 'True', then the request is sent to the server
		// in a composite request.
		flush:function(filter){
			var __this__=this
			filter = filter === undefined ? function(){
				return true
			} : filter
			var remaining=[];
			var flushed=[];
			extend.iterate(__this__.requestsQueue, function(r){
				if ( filter(r) )
				{
					flushed.push(r)
				}
				else if ( true )
				{
					remaining.push(r)
				}
			}, __this__)
			__this__.requestsQueue = remaining;
			__this__._sendRequests(flushed)
		},
		// Invokes a 'GET' to the given url (prefixed by the optional 'prefix' set in
		// this channel options) and returns a 'Future'.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		get:function(url, body, future){
			var __this__=this
			body = body === undefined ? '' : body
			future = future === undefined ? undefined : future
			var request={'method':'GET', 'url':url, 'body':__this__._normalizeBody(body), 'future':(future || __this__._createFuture())};
			__this__._pushRequest(request)
			return request.future
		},
		// Invokes a 'POST' to the give url (prefixed by the optional 'prefix' set in
		// this channel options), using the given 'body' as request body, and
		// returning a 'Future' instance.
		// 
		// The future is already bound with a 'refresh' callback that will do the
		// request again.
		post:function(url, body, future){
			var __this__=this
			body = body === undefined ? '' : body
			future = future === undefined ? undefined : future
			var request={'method':'POST', 'url':url, 'body':__this__._normalizeBody(body), 'future':(future || __this__._createFuture())};
			__this__._pushRequest(request)
			return request.future
		}
	}
})
channels.HTTPTransport=extend.Class({
	// The 'HTTPTransport' is the low-level class used by channels to do HTTP
	// communication. This class really acts as a wrapper for platform-specific HTTP
	// communication implementations, taking care of returning 'Futures' instances to
	// be used by the channels.
	// 
	// All the futures returned by the HTTPTransport will give the HTTP request object
	// as-is. Particularly, the 'Channels' 
	// 
	// In case the transports fails to complete the request, the future 'fail' method
	// will be invoked with the follwing arguments:
	// 
	// - 'request status' as status for the failure (ie.
	// machine-readable description of the error)
	// - 'request responseText' as the reason for the failure (ie.
	// human-readable description of the error)
	// - 'request' as the context for the exception, so that clients have the opportunity
	// to get more information from the reques itself, like headers.
	name:'channels.HTTPTransport', parent:undefined,
	shared:{
		DEFAULT:undefined
	},
	initialize:function(){
		var __this__=this
	},
	methods:{
		syncGet:function(url, body, headers, future, options){
			var __this__=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? new channels.Future() : future
			options = options === undefined ? {} : options
			var request=__this__._createRequest();
			future.onCancel(function(){
				request.abort()
			})
			var response=__this__._processRequest(request, {'method':'GET', 'body':body, 'url':url, 'headers':headers, 'asynchronous':false, 'timestamp':options.timestamp, 'success':function(v){
				future.set(v)
			}, 'failure':function(v){
				future.fail(v.status, v.responseText, v)
			}});
			return future
		},
		syncPost:function(url, body, headers, future, options){
			var __this__=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? new channels.Future() : future
			options = options === undefined ? {} : options
			var request=__this__._createRequest();
			future.onCancel(function(){
				request.abort()
			})
			var response=__this__._processRequest(request, {'method':'POST', 'body':body, 'url':url, 'headers':headers, 'asynchronous':false, 'timestamp':options.timestamp, 'success':function(v){
				future.set(v)
			}, 'failure':function(v){
				future.fail(v.status, v.responseText, v)
			}});
			return future
		},
		asyncGet:function(url, body, headers, future, options){
			var __this__=this
			body = body === undefined ? null : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? new channels.Future() : future
			options = options === undefined ? {} : options
			var request=__this__._createRequest();
			future.onCancel(function(){
				request.abort()
			})
			var response=__this__._processRequest(request, {'method':'GET', 'body':body, 'url':url, 'headers':headers, 'asynchronous':true, 'timestamp':options.timestamp, 'loading':function(v){
				future.setPartial(v)
			}, 'success':function(v){
				future.set(v)
			}, 'failure':function(v){
				future.fail(v.status, v.responseText, v)
			}});
			return future
		},
		asyncPost:function(url, body, headers, future, options){
			var __this__=this
			body = body === undefined ? '' : body
			headers = headers === undefined ? [] : headers
			future = future === undefined ? new channels.Future() : future
			options = options === undefined ? {} : options
			var request=__this__._createRequest();
			future.onCancel(function(){
				request.abort()
			})
			var response=__this__._processRequest(request, {'method':'POST', 'body':body, 'url':url, 'headers':headers, 'asynchronous':true, 'timestamp':options.timestamp, 'success':function(v){
				future.set(v)
			}, 'failure':function(v){
				future.fail(v.status, v.responseText, v)
			}});
			return future
		},
		_createRequest:function(){
			var __this__=this
			// If IE is used, create a wrapper for the XMLHttpRequest object
			if ( typeof(XMLHttpRequest) == "undefined" )
			{
				XMLHttpRequest = function(){return new ActiveXObject(
					navigator.userAgent.indexOf("MSIE 5") >= 0 ?
					"Microsoft.XMLHTTP" : "Msxml2.XMLHTTP"
				)}
			}
			return new XMLHttpRequest()
			
		},
		// Processes the given HTTP request, taking into account the following
		// 'options':
		// 
		// - 'method', the HTTP method ('GET', 'POST', in uppercase)
		// - 'url', the requested url
		// - 'asynchronous' (default 'False'), to indicate wether the request should
		// be made in synchronous or asynchronous mode
		// - 'body' (default is '""') the optional request body
		// - 'headers' is a dictionary of headers to add to the request
		// - 'success', the callback that will be invoked on success, with the
		// request as argument
		// - 'loading', the callback that will be invoked when the request is 
		// loading, with the request as argument.
		// - 'failure', the callback that will be invoked on failure, with the
		// request as argument.
		// - 'timestamp', if 'True' will add an additional 'timestamp' parameter to
		// the request, with the current time. This can prevent some browsers
		// (notably IE) to cache a response that you don't want to cache (even if you
		// specify no-cache, or things like this in the response).
		_processRequest:function(request, options){
			var __this__=this
			var callback_was_executed=false;
			var on_request_complete=function(state){
				callback_was_executed = true;
				if ( ((request.readyState == 3) && options.loading) )
				{
					options.loading(request)
				}
				else if ( (request.readyState == 4) )
				{
					if ( ((request.status >= 200) && (request.status < 300)) )
					{
						options.success(request)
					}
					else if ( true )
					{
						options.failure(request)
					}
				}
			};
			var asynchronous=(options.asynchronous || false);
			if ( ((options.method == 'GET') && options.timestamp) )
			{
				if ( (options.url.indexOf('?') == -1) )
				{
					options.url = (options.url + ('?timestamp=' + new Date().getTime()));
				}
				else if ( true )
				{
					options.url = (options.url + ('&timestamp=' + new Date().getTime()));
				}
			}
			if ( asynchronous )
			{
				request.onreadystatechange = on_request_complete;
			}
			request.open((options.method || 'GET'), options.url, (options.asynchronous || false))
			extend.iterate(options.headers, function(v, k){
				request.setRequestHeader(k, v)
			}, __this__)
			request.send((options.body || ''))
			if ( ((! callback_was_executed) && (! asynchronous)) )
			{
				on_request_complete()
			}
		}
	}
})
channels.init=	function(){
		var __this__=channels;
		channels.HTTPTransport.DEFAULT = new channels.HTTPTransport();
	}
channels.init()


/**
 * MooToolsAdapter 0.1
 * For all details and documentation:
 * http://github.com/inkling/backbone-mootools
 *
 * Copyright 2011 Inkling Systems, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This file provides a basic jQuery to MooTools Adapter. It allows us to run Backbone.js
 * with minimal modifications.
 */
var MooToolsCompat = (function(window){
    var MooToolsAdapter = new Class({
        initialize: function(elements){
            for (var i = 0; i < elements.length; i++){
                this[i] = elements[i];
            }
            this.length = elements.length;
        },

        /**
         * Hide the elements defined by the MooToolsAdapter from the screen.
         */
        hide: function(){
            for (var i = 0; i < this.length; i++){
                this[i].setStyle('display', 'none');
            }
            return this;
        },
        
        show: function(){
            for (var i = 0; i < this.length; i++){
                this[i].setStyle('display', 'block');
            }
            return this;
        },

        /**
         * Append the frst element in the MooToolsAdapter to the elements found by the passed in
         * selector. If the selector selects more than one element, a clone of the first element is
         * put into every selected element except the first. The first selected element always
         * adopts the real element.
         *
         * @param selector A CSS3 selector.
         */
        appendTo: function(target){
            var elements = typeof target == 'string' ? window.getElements(target) : target;

            for (var i = 0; i < elements.length; i++){
                if (i > 0){
                    elements[i].adopt(Object.clone(this[0]));
                } else {
                    elements[i].adopt(this[0]);
                }
            }

            return this;
        },

        /**
         * Set the attributes of the element defined by the MooToolsAdapter.
         *
         * @param map:Object literal map definining the attributes and the values to which
         *     they should be set.
         *
         * @return MooToolsAdapter The object on which this method was called.
         */
        attr: function(attributeName, value){
        	if (typeof attributeName == 'object'){
	            for (var i = 0; i < this.length; i++){
	                this[i].set(map);
	            }
	            return this;
	        }
	        else if(typeof value == 'undefined'){
	        	return this[0].get(attributeName);
	        }
	        else{
	        	return this[0].set(attributeName, value);
	        }
        },

        /**
         * Set the HTML contents of the elements contained by the MooToolsAdapter.
         *
         * @param htmlString:String A string of HTML text.
         *
         * @return MooToolsAdapter The object the method was called on.
         */
        html: function(htmlString){
            for (var i = 0; i < this.length; i++){
                this[i].set('html', htmlString);
            }
            return this;
        },

        /**
         * Remove an event namespace from an eventName.
         * For Example: Transform click.mootools -> click
         *
         * @param eventName:String A string representing an event name.
         *
         * @return String A string representing the event name passed without any namespacing.
         */
        removeNamespace_: function(eventName){
            var dotIndex = eventName.indexOf('.');

            if (dotIndex != '-1'){
                eventName = eventName.substr(0, dotIndex);
            }

            return eventName;
        },

        /**
         * Delegate an event that is fired on the elements defined by the selector to trigger the
         * passed in callback.
         *
         * @param selector:String A CSS3 selector defining which elements should be listenining to
         *     the event.
         * @param eventName:String The name of the event.
         * @param method:Function The callback to call when the event is fired on the proper
         *     element.
         *
         * @return MooToolsAdapter The object the method was called on.
         */
        delegate: function(selector, eventName, method){
            // Remove namespacing because it's not supported in MooTools.
            eventName = this.removeNamespace_(eventName);

            // Note: MooTools Delegation does not support delegating on blur and focus yet.
            for (var i = 0; i < this.length; i++){
                this[i].addEvent(eventName + ':relay(' + selector + ')', method);
            }
            return this;
        },

        /**
         * Bind the elements on the MooToolsAdapter to call the specific method for the specific
         * event.
         *
         * @param eventName:String The name of the event.
         * @param method:Function The callback to apply when the event is fired.
         *
         * @return MooToolsAdapter The object the method was called on.
         */
        bind: function(eventName, method){
            // Remove namespacing because it's not supported in MooTools.
            eventName = this.removeNamespace_(eventName);

            // Bind the events.
            for (var i = 0; i < this.length; i++){
                if (eventName == 'popstate' || eventName == 'hashchange'){
                    this[i].addEventListener(eventName, method);
                } else {
                    this[i].addEvent(eventName, method);
                }
            }
            return this;
        },

        /**
         * Unbind the bound events for the element.
         */
        unbind: function(eventName){
            // Remove namespacing because it's not supported in MooTools.
            eventName = this.removeNamespace_(eventName);

            for (var i = 0; i < this.length; i++){
                if (eventName !== ""){
                    this[i].removeEvent(eventName);
                } else {
                    this[i].removeEvents();
                }
            }
            return this;
        },

        /**
         * Return the element at the specified index on the MooToolsAdapter.
         * Equivalent to MooToolsAdapter[index].
         *
         * @param index:Number a numerical index.
         *
         * @return HTMLElement An HTML element from the MooToolsAdapter. Returns undefined
         *     if an element at that index does not exist.
         */
        get: function(index){
            return this[index];
        },

         /**
          * Removes from the DOM all the elements selected by the MooToolsAdapter.
          */
        remove: function(){
            for (var i = 0; i < this.length; i++){
                this[i].dispose();
            }
            return this;
        },

        /**
         * Add a callback for when the document is ready.
         */
        ready: function(callback){
            for (var i = 0; i < this.length; i++){
                window.addEvent('domready', callback);
            }
        },

        /**
         * Return the text content of all the elements selected by the MooToolsAdapter.
         * The text of the different elements is seperated by a space.
         *
         * @return String The text contents of all the elements selected by the MooToolsAdapter.
         */
        text: function(){
            var text = [];
            for (var i = 0; i < this.length; i++){
                text.push(this[i].get('text'));
            }
            return text.join(' ');
        },

        /**
         * Fire a specific event on the elements selected by the MooToolsAdapter.
         *
         * @param trigger:
         */
        trigger: function(eventName){
            for (var i = 0; i < this.length; i++){
                this[i].fireEvent(eventName);
            }
            return this;
        },
        
        
        data: function(name){
            return this.get(name);
        },
        
        removeAttr: function(propertyName){
        	for (var i = 0; i < this.length; i++){
                this[i].removeProperty(propertyName);
            }
            return this;
        },
        
        addClass: function(className){
        	for (var i = 0; i < this.length; i++){
                this[i].addClass(className);
            }
            return this;
        },
        
        removeClass: function(className){
        	for (var i = 0; i < this.length; i++){
                this[i].removeClass(className);
            }
            return this;
        },
        
        insertBefore: function(element){
        	for (var i = 0; i < this.length; i++){
                this[i].inject(element[0], 'before');
            }
            return this;
        },
        
        find: function(selector){
        	var elements = [];
			for (var i = 0; i < this.length; i++){
                elements.append(this[i].getElements(selector));
            }
			return new MooToolsAdapter(elements);
        },
		
		children: function(selector){
			var elements = [];
			for (var i = 0; i < this.length; i++){
                elements.append(this[i].getChildren(selector));
            }
			return new MooToolsAdapter(elements);
		},
		
		closest: function(selector){
			for (var i = 0; i < this.length; i++){
                var c = this[i].getParent(selector);
                if (c)
                	return new MooToolsAdapter([c]);
            }
			return new MooToolsAdapter([]);
		},
		
		siblings: function(selector){
			var elements = [];
			for (var i = 0; i < this.length; i++){
                elements.append(this[i].getSiblings(selector));
            }
			return new MooToolsAdapter(elements);
		},
		
		append: function(content){
			if (content.length){
				for (var i = 0; i < this.length; i++){
					this.append(content[i]);
				}
				return this;
			}
			
			for (var i = 0; i < this.length; i++){
				this[i].adopt((i==0 ? content : content.clone()));
            }
            
            return this;
		},
		
		keydown: function(fn){
			return this.bind('keydown', fn);
		},
		
		click: function(fn){
			return this.bind('click', fn);
		},
		
		resize: function(fn){
			return this.bind('resize', fn);
		},
		
		hover: function(fn1, fn2){
			this.bind('mouseenter', fn1);
			this.bind('mouseleave', fn2);
		},
		
		each: function(fn){
			for (var i = 0; i < this.length; i++){
				fn.call(this[i], i, this[i]);
            }
            return this;
		},
		
		css: function(propertyName, value){
			if (typeof value == 'undefined'){
				return this[0].getStyle(propertyName);
			}
			
			for (var i = 0; i < this.length; i++){
                this[i].setStyle(propertyName, value);
            }
			return this;
		},

        width: function(value){
			if (typeof value == 'undefined'){
				return this[0].getSize().x;
			}
			
			for (var i = 0; i < this.length; i++){
                this[i].setStyle('width', value);
            }
			return this;
		},
		
		outerWidth: function(includeMargin){
			return this[0].getSize().x;
		},
		
		height: function(value){
			if (typeof value == 'undefined'){
				return this[0].getSize().y;
			}
			
			for (var i = 0; i < this.length; i++){
                this[i].setStyle('height', value);
            }
			return this;
		},
		
		offset: function(){
			var pos = this[0].getPosition();
			return {top: pos.x, left: pos.y};
		},
		
		position: function(){
			var pos = this[0].getPosition(this[0].getOffsetParent());
			return {top: pos.x, left: pos.y};
		}
    });

    /**
     * JQuery Selector Methods
     *
     * $(html) - Returns an HTML element wrapped in a MooToolsAdapter.
     * $(expression) - Returns a MooToolsAdapter containing an element set corresponding the
     *     elements selected by the expression.
     * $(expression, context) - Returns a MooToolsAdapter containing an element set corresponding
     *     to applying the expression in the specified context.
     * $(element) - Wraps the provided element in a MooToolsAdapter and returns it.
     *
     * @return MooToolsAdapter an adapter element containing the selected/constructed
     *     elements.
     */
    MooToolsCompat.$ = function(expression, context){
        var elements;

        // Handle $(html).
        if (typeof expression === 'string' && !context){
            if (expression.charAt(0) === '<' && expression.charAt(expression.length - 1) === '>'){
                elements = [new Element('div', {
                    html: expression
                }).getFirst()];
                return new MooToolsAdapter(elements);
            }
        } else if (typeof expression == 'object'){
            if (instanceOf(expression, MooToolsAdapter)){
                // Handle $(MooToolsAdapter)
                return expression;
            } else {
                // Handle $(element).
                return new MooToolsAdapter([expression]);
            }
        }

        // Handle $(expression) and $(expression, context).
        context = context || document;
        elements = [context.id(expression)] || context.getElements(expression);
        return new MooToolsAdapter(elements);
    };

    /*
     * $.ajax
     *
     * Maps a jQuery ajax request to a MooTools Request and sends it.
     */
    MooToolsCompat.$.ajax = function(params){
        var emulation = false;
        var data = params.data;
        if (Backbone.emulateJSON){
            emulation = true;
            data = data ? { model: data } : {};
        }

        var parameters = {
            url: params.url,
            method: params.type,
            data: data,
            emulation: emulation,
            onSuccess: function(responseText){
                params.success(JSON.parse(responseText));
            },
            onFailure: params.error,
            headers: { 'Content-Type': params.contentType }
        };

        new Request(parameters).send();
    };
    
    /*
     * $.extend
     *
     * Merge the contents of two or more objects together into the first object.
     */
    MooToolsCompat.$.extend = function(){
    	var i = 1;
    	if (typeof arguments[0] == 'boolean')
    		i=2;
    	
    	var target = arguments[i-1];
    	for (; i < arguments.length; i++){
            Object.append(target, arguments[i]);
        }
        
    	return target;
    }

//	Element.alias('getProperty', 'getAttribute');
//	Element.alias('removeProperty', 'removeAttr');
//	Element.alias('setStyles', 'css');
//	Element.alias('getElements', 'find');


	Array.implement({
    	children: function(selector){
    		new MooToolsAdapter(this).children(selector);
    	}
    });

    return MooToolsCompat.$;
});


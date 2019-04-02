/*
Copyright 2019 Vijay s

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
	var _super = this.prototype;

	// Instantiate a base class (but only create the instance,
	// don't run the init constructor)
	initializing = true;
	var prototype = new this();
	initializing = false;

	// Copy the properties over onto the new prototype
	for (var name in prop) {
	  // Check if we're overwriting an existing function
	  prototype[name] = typeof prop[name] == "function" &&
		typeof _super[name] == "function" && fnTest.test(prop[name]) ?
		(function(name, fn){
		  return function() {
			var tmp = this._super;

			// Add a new ._super() method that is the same method
			// but on the super-class
			this._super = _super[name];

			// The method only need to be bound temporarily, so we
			// remove it when we're done executing
			var ret = fn.apply(this, arguments);
			this._super = tmp;

			return ret;
		  };
		})(name, prop[name]) :
		prop[name];
	}

	// The dummy class constructor
	function Class() {
	  // All construction is actually done in the init method
	  if ( !initializing && this.init )
		this.init.apply(this, arguments);
	}

	// Populate our constructed prototype object
	Class.prototype = prototype;

	// Enforce the constructor to be what we expect
	Class.constructor = Class;

	// And make this class extendable
	Class.extend = arguments.callee;

	return Class;
  };
})();


var Sticky = Class.extend({
	element : "",
	stickies: {},
	storageKey: "sticky_items",
	stickyCount : 0,
	stickyCss : '<style>body{margin:0;height:100%;width:100%}.sticky-widget.close{cursor:pointer;}\
				.sticky-widget{position:fixed;min-height:20px;min-width:200px;background-color:#fdd835;box-shadow:0 3px 6px rgba(0,0,0,.16),0 3px 6px rgba(0,0,0,.23);padding:10px}\
				.sticky-widget.left{left:10px}.sticky-widget.right{right:10px}\
				.sticky-widget.top{top:10px}.sticky-widget.bottom{bottom:10px}\
				.sticky-head {cursor: move;display: block;float: left;width: 100%;}\
				.add-sticky {float: left;margin-right: 10px;cursor: pointer;}\
				.sticky-name {float: left;max-width: 70%;text-overflow: ellipsis;cursor: auto;}\
				.hide {display:none}\
				.sticky-head .close {float: right;cursor: pointer;}\
				.sticky-widget textarea{border:0;resize: both; height:90px;background-color:inherit}</style>',
	stickyHtml: '<div class="sticky-head">\
					<span class="add-sticky">+</span>\
					<span class="sticky-name">Untitled</span>\
					<input class="sticky-name hide" type="text" value="Untitled"/></span>\
					<span class="close">&times;</span>\
				</div>\
				<div class="sticky-body">\
					<textarea class="sticky-text"></textarea>\
				</div>',
	options : {
		right : false,
		left : false,
		top :  false,
		bottom : false,
		onSave : function(e) {
			console.info($(e).text());
		}
	},

	init: function(element, option) {
		this.element = element;
		$.extend(this.options, option);
		this.create();
	},

	create : function() {
		this.element.append(this.stickyCss);
		this.loadStickies();
		this.initListeners();
		this.initStorage();
	},

	getStickyElement: function() {
		return $("<div>").addClass("sticky-widget").attr("id", "sticky"+new Date().getTime());
	},

	createSticky : function() {
		this.stickyCount++;
		var stickyElement = this.getStickyElement();
		if (arguments.length == 2 ){
			stickyElement.append($($.parseHTML(this.stickyHtml)));
			stickyElement.attr("id", arguments[0]);
			stickyElement.find(".sticky-text").val(arguments[1]);
		} else {
			stickyElement.append(this.stickyHtml);
		}

		if (this.options.bottom)
			stickyElement.addClass("bottom");
		if (this.options.right)
			stickyElement.addClass("right");

		this.element.append(stickyElement);
	},

	initListeners : function() {
		var self = this;
		this.element.on("mousedown", ".sticky-head", function(e) {
			window.dragging = {};
		    dragging.pageX = e.pageX;
		    dragging.pageY = e.pageY;
		    dragging.element = this;
		    dragging.offset = $(this).offset();

		    function mouseUp() {
				$(document).off("mousemove", mouseMove);
				$(document).off("mouseup", mouseUp);
		    }

		    function mouseMove(e) {
				var left = dragging.offset.left + (e.pageX - dragging.pageX);
		        var top = dragging.offset.top + (e.pageY - dragging.pageY);
		        if (self.options.bottom)
		        	$(dragging.element).parents(".sticky-widget").css("bottom", "unset");
		        
		        if (self.options.right)
		        	$(dragging.element).parents(".sticky-widget").css("right", "unset");
		        $(dragging.element).parents(".sticky-widget")
		        .offset({top: top, left: left});
			}

		    $(document).on("mouseup", mouseUp);
			$(document).on("mousemove", mouseMove);
		});

		this.element.on("dblclick", "span.sticky-name", function(e) {
			$(this).parents(".sticky-widget").find(".sticky-name").toggleClass("hide");
		});

		this.element.on("blur", "input.sticky-name", function(e) {
			$(this).parents(".sticky-widget").find("span.sticky-name").html($(this).val());
			$(this).parents(".sticky-widget").find(".sticky-name").toggleClass("hide");
		});

		this.element.on("click", ".add-sticky", function(e) {
			self.createSticky();
		});

		this.element.on("click", ".sticky-head .close", function(e) {
			self.stickyCount--;
			$(this).parents(".sticky-widget").remove();
		});
	},

	loadStickies: function() {
		this.stickies = this.getStickies();
		var self = this;
		if(!$.isEmptyObject(this.stickies)) 
			$.each(this.stickies, function(key, value) {
				self.createSticky(key, value.value);
			});
		else
			this.createSticky();
	},

	getStickies: function() {
		return window.localStorage.getItem(this.storageKey) ?
			JSON.parse(window.localStorage.getItem(this.storageKey)) :
			{};
	},

	storeStickies: function() {
		window.localStorage.setItem(this.storageKey, JSON.stringify(this.stickies));
	},

	initStorage : function() {
		var self = this;
		this.element.on("change", ".sticky-text", function(e) {

			if (!self.stickies[$(this).parents(".sticky-widget").attr("id")])
				self.stickies[$(this).parents(".sticky-widget").attr("id")] = {}

			self.stickies[$(this).parents(".sticky-widget").attr("id")].value = $(this).val();
			self.storeStickies();
		});
	}
});

$.fn.sticky = function(option) {
	return new Sticky(this,option);
};

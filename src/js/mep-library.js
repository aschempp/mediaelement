if (typeof jQuery != 'undefined') {
	mejs.$ = jQuery;
} else if (typeof MooTools != 'undefined') {
	mejs.$ = MooToolsCompat(window);
} else if (typeof ender != 'undefined') {
	mejs.$ = ender;
}
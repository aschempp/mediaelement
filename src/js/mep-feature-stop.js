(function($) {

	Object.append(mejs.MepDefaults, {
		stopText: 'Stop'
	});

	// STOP BUTTON
	Object.append(MediaElementPlayer.prototype, {
		buildstop: function(player, controls, layers, media) {
			var t = this,
				stop = 
				new Element('div', {
					'class': 'mejs-button mejs-stop-button mejs-stop',
					'html': ('<button type="button" aria-controls="' + t.id + '" title="' + t.options.stopText + '></button>')
				})
				.inject(controls)
				.addEvent('click', function() {
					if (!media.paused) {
						media.pause();
					}
					if (media.currentTime > 0) {
						media.setCurrentTime(0);	
						controls.getElement('.mejs-time-current').setStyle('width', '0px');
						controls.getElement('.mejs-time-handle').setStyle('left', '0px');
						controls.getElement('.mejs-time-float-current').set('html', mejs.Utility.secondsToTimeCode(0) );
						controls.getElement('.mejs-currenttime').set('html', mejs.Utility.secondsToTimeCode(0) );					
						layers.getElement('.mejs-poster').show();
					}
				});
		}
	});
	
})(mejs.$);
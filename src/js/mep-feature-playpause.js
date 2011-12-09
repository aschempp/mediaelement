(function($) {

	Object.append(mejs.MepDefaults, {
		playpauseText: 'Play/Pause'
	});

	// PLAY/pause BUTTON
	Object.append(MediaElementPlayer.prototype, {
		buildplaypause: function(player, controls, layers, media) {
			var 
				t = this,
				play = 
				new Element('div', {
					'class': 'mejs-button mejs-playpause-button mejs-play',
					'html': '<button type="button" aria-controls="' + t.id + '" title="' + t.options.playpauseText + '"></button>'
				})
				.inject(controls)
				.addEvent('click', function(e) {
					e.preventDefault();
				
					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}
					
					return false;
				});

			media.addEventListener('play',function() {
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);
			media.addEventListener('playing',function() {
				play.removeClass('mejs-play').addClass('mejs-pause');
			}, false);


			media.addEventListener('pause',function() {
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
			media.addEventListener('paused',function() {
				play.removeClass('mejs-pause').addClass('mejs-play');
			}, false);
		}
	});
	
})(mejs.$);
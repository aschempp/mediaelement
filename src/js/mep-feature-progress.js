(function($) {
	// progress/loaded bar
	Object.append(MediaElementPlayer.prototype, {
		buildprogress: function(player, controls, layers, media) {

			new Element('div', {
				'class': 'mejs-time-rail',
				'html': '<span class="mejs-time-total">'+
					'<span class="mejs-time-loaded"></span>'+
					'<span class="mejs-time-current"></span>'+
					'<span class="mejs-time-handle"></span>'+
					'<span class="mejs-time-float">' + 
						'<span class="mejs-time-float-current">00:00</span>' + 
						'<span class="mejs-time-float-corner"></span>' + 
					'</span>'+
				'</span>'
			})
			.inject(controls, 'bottom');

			var 
				t = this,
				total = controls.getElement('.mejs-time-total'),
				loaded  = controls.getElement('.mejs-time-loaded'),
				current  = controls.getElement('.mejs-time-current'),
				handle  = controls.getElement('.mejs-time-handle'),
				timefloat  = controls.getElement('.mejs-time-float'),
				timefloatcurrent  = controls.getElement('.mejs-time-float-current'),
				handleMouseMove = function (e) {
					// mouse position relative to the object
					var x = e.page.x,
						position = total.getPosition(),
						width = total.getSize().x,
						percentage = 0,
						newTime = 0;


					if (x > position.x && x <= width + position.x && media.duration) {
						percentage = ((x - position.x) / width);
						newTime = (percentage <= 0.02) ? 0 : percentage * media.duration;

						// seek to where the mouse is
						if (mouseIsDown) {
							media.setCurrentTime(newTime);
						}

						// position floating time box
						var pos = x - position.x;
						timefloat.setStyle('left', pos+'px');
						timefloatcurrent.set('html', mejs.Utility.secondsToTimeCode(newTime));
					}
				},
				mouseIsDown = false,
				mouseIsOver = false;

			// handle clicks
			//controls.getElement('.mejs-time-rail').delegate('span', 'click', handleMouseMove);
			total
				.addEvent('mousedown', function (e) {
					// only handle left clicks
					if (!e.rightClick) {
						mouseIsDown = true;
						handleMouseMove(e);
						return false;
					}					
				});

			controls.getElement('.mejs-time-total')
				.addEvent('mouseenter', function(e) {
					mouseIsOver = true;
				})
				.addEvent('mouseleave',function(e) {
					mouseIsOver = false;
				});

			document
				.addEvent('mouseup', function (e) {
					mouseIsDown = false;
					//handleMouseMove(e);
				})
				.addEvent('mousemove', function (e) {
					if (mouseIsDown || mouseIsOver) {
						handleMouseMove(e);
					}
				});

			// loading
			media.addEventListener('progress', function (e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);

			// current time
			media.addEventListener('timeupdate', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);
			
			
			// store for later use
			t.loaded = loaded;
			t.total = total;
			t.current = current;
			t.handle = handle;
		},
		setProgressRail: function(e) {

			var
				t = this,
				target = (e != undefined) ? e.target : t.media,
				percent = null;			

			// newest HTML5 spec has buffered array (FF4, Webkit)
			if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
				// TODO: account for a real array with multiple values (only Firefox 4 has this so far) 
				percent = target.buffered.end(0) / target.duration;
			} 
			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			// to be anything other than 0. If the byte count is available we use this instead.
			// Browsers that support the else if do not seem to have the bufferedBytes value and
			// should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
			else if (target && target.bytesTotal != undefined && target.bytesTotal > 0 && target.bufferedBytes != undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			}
			// Firefox 3 with an Ogg file seems to go this way
			else if (e && e.lengthComputable && e.total != 0) {
				percent = e.loaded/e.total;
			}

			// finally update the progress bar
			if (percent !== null) {
				percent = Math.min(1, Math.max(0, percent));
				// update loaded bar
				if (t.loaded && t.total) {
					t.loaded.setStyle('width', (t.total.getSize().x * percent));
				}
			}
		},
		setCurrentRail: function() {

			var t = this;
		
			if (t.media.currentTime != undefined && t.media.duration) {

				// update bar and handle
				if (t.total && t.handle) {
					var 
						newWidth = t.total.getSize().x * t.media.currentTime / t.media.duration,
						handlePos = newWidth - (t.handle.getComputedSize({styles:['padding','border','margin']}).totalWidth / 2);

					t.current.setStyle('width', newWidth+'px');
					t.handle.setStyle('left', handlePos+'px');
				}
			}

		}	
	});
})(mejs.$);
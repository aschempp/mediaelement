(function($) {

	Object.append(mejs.MepDefaults, {
		muteText: 'Mute Toggle',
		hideVolumeOnTouchDevices: true
	});

	Object.append(MediaElementPlayer.prototype, {
		buildvolume: function(player, controls, layers, media) {
			// Android and iOS don't support volume controls
			if (mejs.MediaFeatures.hasTouch && this.options.hideVolumeOnTouchDevices)
				return;
			
			var t = this,
				mute = 
				new Element('div', {
					'class': 'mejs-button mejs-volume-button mejs-mute',
					'html': ('<button type="button" aria-controls="' + t.id + '" title="' + t.options.muteText + '"></button>'+
					'<div class="mejs-volume-slider">'+ // outer background
						'<div class="mejs-volume-total"></div>'+ // line background
						'<div class="mejs-volume-current"></div>'+ // current volume
						'<div class="mejs-volume-handle"></div>'+ // handle
					'</div>')
				})
				.inject(controls),
			volumeSlider = mute.getElement('.mejs-volume-slider'),
			volumeTotal = mute.getElement('.mejs-volume-total'),
			volumeCurrent = mute.getElement('.mejs-volume-current'),
			volumeHandle = mute.getElement('.mejs-volume-handle'),

			positionVolumeHandle = function(volume) {
				if (!volumeSlider.isVisible()) {
					volumeSlider.show();
					positionVolumeHandle(volume);
					volumeSlider.hide()
					return;
				}

				var 
				
					// height of the full size volume slider background
					totalHeight = volumeTotal.getSize().y,
					
					// top/left of full size volume slider background
					totalPosition = volumeTotal.getPosition(volumeTotal.getOffsetParent()),
					
					// the new top position based on the current volume
					// 70% volume on 100px height == top:30px
					newTop = totalHeight - (totalHeight * volume);

				// handle
				volumeHandle.setStyle('top', (totalPosition.y + newTop - (volumeHandle.getSize().y / 2))+'px');

				// show the current visibility
				volumeCurrent.setStyle('height', (totalHeight - newTop) + 'px' );
				volumeCurrent.setStyle('top', (totalPosition.y + newTop) + 'px');
			},
			handleVolumeMove = function(e) {
				var
					railHeight = volumeTotal.getSize().y,
					totalOffset = volumeTotal.getPosition(),
					totalTop = parseInt(volumeTotal.getStyle('top').replace(/px/,''),10),
					newY = e.page.y - totalOffset.y,
					volume = (railHeight - newY) / railHeight
					
				// the controls just hide themselves (usually when mouse moves too far up)
				if (totalOffset.y == 0)
					return;
					
				// 0-1
				volume = Math.max(0,volume);
				volume = Math.min(volume,1);						

				// TODO: handle vertical and horizontal CSS
				// only allow it to move within the rail
				if (newY < 0)
					newY = 0;
				else if (newY > railHeight)
					newY = railHeight;

				// move the handle to match the mouse
				volumeHandle.setStyle('top', (newY - (volumeHandle.getSize().y / 2) + totalTop) + 'px' );

				// show the current visibility
				volumeCurrent.setStyle('height', (railHeight-newY)+'px');
				volumeCurrent.setStyle('top', (newY+totalTop)+'px');

				// set mute status
				if (volume == 0) {
					media.setMuted(true);
					mute.removeClass('mejs-mute').addClass('mejs-unmute');
				} else {
					media.setMuted(false);
					mute.removeClass('mejs-unmute').addClass('mejs-mute');
				}

				volume = Math.max(0,volume);
				volume = Math.min(volume,1);

				// set the volume
				media.setVolume(volume);
			},
			mouseIsDown = false;

			// SLIDER
			mute
				.addEvent('mouseenter', function() {
					volumeSlider.show();
				}).addEvent('mouseleave', function() {
					volumeSlider.hide();
				})		
			
			volumeSlider
				.addEvent('mousedown', function (e) {
					handleVolumeMove(e);
					mouseIsDown = true;
					return false;
				});
			document
				.addEvent('mouseup', function (e) {
					mouseIsDown = false;
				})
				.addEvent('mousemove', function (e) {
					if (mouseIsDown) {
						handleVolumeMove(e);
					}
				});


			// MUTE button
			mute.getElement('button').addEvent('click', function() {

				media.setMuted( !media.muted );
				
			});

			// listen for volume change events from other sources
			media.addEventListener('volumechange', function(e) {
				if (!mouseIsDown) {
					if (media.muted) {
						positionVolumeHandle(0);
						mute.removeClass('mejs-mute').addClass('mejs-unmute');
					} else {
						positionVolumeHandle(media.volume);
						mute.removeClass('mejs-unmute').addClass('mejs-mute');
					}
				}
			}, false);

			// set initial volume
			//console.log('init volume',player.options.startVolume);
			positionVolumeHandle(player.options.startVolume);
			
			// shim gets the startvolume as a parameter, but we have to set it on the native <video> and <audio> elements
			if (media.pluginType === 'native') {
				media.setVolume(player.options.startVolume);
			}
		}
	});
	
})(mejs.$);

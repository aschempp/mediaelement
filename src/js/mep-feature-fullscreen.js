(function($) {
	
	Object.append(mejs.MepDefaults, {
		forcePluginFullScreen: false,
		newWindowCallback: function() { return '';},
		fullscreenText: 'Fullscreen'
	});
	
	Object.append(MediaElementPlayer.prototype, {
		
		isFullScreen: false,
		
		isNativeFullScreen: false,
		
		docStyleOverflow: null,
		
		isInIframe: false,
		
		buildfullscreen: function(player, controls, layers, media) {

			if (!player.isVideo)
				return;
				
			player.isInIframe = (window.location != window.parent.location);
				
			// native events
			if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
				
				player.container.addEvent(mejs.MediaFeatures.fullScreenEventName, function(e) {
				//player.container.addEvent('webkitfullscreenchange', function(e) {
				
					
					if (mejs.MediaFeatures.isFullScreen()) {
						player.isNativeFullScreen = true;
						// reset the controls once we are fully in full screen
						player.setControlsSize();
					} else {
						player.isNativeFullScreen = false;
						// when a user presses ESC
						// make sure to put the player back into place								
						player.exitFullScreen();				
					}
				});
			}

			var t = this,		
				normalHeight = 0,
				normalWidth = 0,
				container = player.container,						
				fullscreenBtn = 
					new Element('div', {
						'class': 'mejs-button mejs-fullscreen-button',
						'html': ('<button type="button" aria-controls="' + t.id + '" title="' + t.options.fullscreenText + '"></button>')
					})
					.inject(controls)
					.addEvent('click', function() {
						var isFullScreen = (mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || player.isFullScreen;													
						
						if (isFullScreen) {
							player.exitFullScreen();
						} else {						
							player.enterFullScreen();
						}
					});
			
			player.fullscreenBtn = fullscreenBtn;	

			document.addEvent('keydown',function (e) {
				if (((mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || t.isFullScreen) && e.code == 27) {
					player.exitFullScreen();
				}
			});
				
		},
		enterFullScreen: function() {
			
			var t = this;
			
			
			
			// firefox+flash can't adjust plugin sizes without resetting :(
			if (/* t.container.getElements('object,embed,iframe').length > 0 */
			    t.media.pluginType !== 'native'
			    && (mejs.MediaFeatures.isGecko || t.options.forcePluginFullScreen)) {
				t.media.setFullscreen(true);
				//player.isFullScreen = true;
				return;
			}			
						
			// store overflow 
			docStyleOverflow = document.documentElement.style.overflow;
			// set it to not show scroll bars so 100% will work
			document.documentElement.style.overflow = 'hidden';			
		
			// store sizing
			normalHeight = t.container.getSize().y;
			normalWidth = t.container.getSize().x;
			
			// attempt to do true fullscreen (Safari 5.1 and Firefox Nightly only for now)
			if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
						
				mejs.MediaFeatures.requestFullScreen(t.container);
				//return;
				
			} else if (mejs.MediaFeatures.hasSemiNativeFullScreen) {
				t.media.webkitEnterFullscreen();
				return;
			}
			
			// check for iframe launch
			if (t.isInIframe) {
				var url = t.options.newWindowCallback(this);
				
				
				if (url !== '') {
					
					// launch immediately
					if (!mejs.MediaFeatures.hasTrueNativeFullScreen) {
						t.pause();
						window.open(url, t.id, 'top=0,left=0,width=' + screen.availWidth + ',height=' + screen.availHeight + ',resizable=yes,scrollbars=no,status=no,toolbar=no');
						return;
					} else {
						setTimeout(function() {
							if (!t.isNativeFullScreen) {
								t.pause();
								window.open(url, t.id, 'top=0,left=0,width=' + screen.availWidth + ',height=' + screen.availHeight + ',resizable=yes,scrollbars=no,status=no,toolbar=no');								
							}
						}, 250);
					}
				}	
				
			}
			
			// full window code

			

			// make full size
			t.container
				.addClass('mejs-container-fullscreen')
				.setStyle('width', '100%')
				.setStyle('height', '100%');
				//.setStyles({position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', width: '100%', height: '100%', 'z-index': 1000});				

			// Only needed for safari 5.1 native full screen, can cause display issues elsewhere
			if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
				setTimeout(function() {
					t.container.setStyles({width: '100%', height: '100%'});
				}, 500);
			}
				
			if (t.pluginType === 'native') {
				t.$media
					.setStyle('width', '100%')
					.setStyle('height', '100%');
			} else {
				t.container.getElements('object,embed,iframe')
					.setStyle('width', '100%')
					.setStyle('height', '100%');
					
				if (!mejs.MediaFeatures.hasTrueNativeFullScreen) {
					t.media.setVideoSize($(window).getSize().x,$(window).getSize().y);
				}
			}
			
			t.layers.getChildren('div')
				.setStyle('width', '100%')
				.setStyle('height', '100%');

			if (t.fullscreenBtn) {
				t.fullscreenBtn
					.removeClass('mejs-fullscreen')
					.addClass('mejs-unfullscreen');
			}

			t.setControlsSize();
			t.isFullScreen = true;
		},
		
		exitFullScreen: function() {
			
			var t = this;		
		
			// firefox can't adjust plugins
			if (t.media.pluginType !== 'native' && mejs.MediaFeatures.isFirefox) {				
				t.media.setFullscreen(false);
				//player.isFullScreen = false;
				return;
			}		
		
			// come outo of native fullscreen
			if (mejs.MediaFeatures.hasTrueNativeFullScreen && (mejs.MediaFeatures.isFullScreen() || t.isFullScreen)) {
				mejs.MediaFeatures.cancelFullScreen();
			}	

			// restore scroll bars to document
			document.documentElement.style.overflow = docStyleOverflow;					
				
			t.container
				.removeClass('mejs-container-fullscreen')
				.setStyle('width', normalWidth+'px')
				.setStyle('height', normalHeight+'px');
				//.setStyles({position: '', left: '', top: '', right: '', bottom: '', overflow: 'inherit', width: normalWidth + 'px', height: normalHeight + 'px', 'z-index': 1});

			if (t.media.pluginType === 'native') {
				t.media
					.setStyle('width', normalWidth+'px')
					.setStyle('height', normalHeight+'px');
			} else {
				t.container.getElements('object embed')
					.setStyle('width', normalWidth+'px')
					.setStyle('height', normalHeight+'px');
					
				t.media.setVideoSize(normalWidth, normalHeight);
			}				

			t.layers.getChildren('div')
				.setStyle('width', normalWidth+'px')
				.setStyle('height', normalHeight+'px');

			t.fullscreenBtn
				.removeClass('mejs-unfullscreen')
				.addClass('mejs-fullscreen');

			t.setControlsSize();
			t.isFullScreen = false;
		}	
	});

})(mejs.$);
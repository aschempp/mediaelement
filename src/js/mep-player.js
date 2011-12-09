(function ($) {

	// default player values
	mejs.MepDefaults = {
		// url to poster (to fix iOS 3.x)
		poster: '',
		// default if the <video width> is not specified
		defaultVideoWidth: 480,
		// default if the <video height> is not specified
		defaultVideoHeight: 270,
		// if set, overrides <video width>
		videoWidth: -1,
		// if set, overrides <video height>
		videoHeight: -1,
		// default if the user doesn't specify
		defaultAudioWidth: 400,
		// default if the user doesn't specify
		defaultAudioHeight: 30,
		// width of audio player
		audioWidth: -1,
		// height of audio player
		audioHeight: -1,		
		// initial volume when the player starts (overrided by user cookie)
		startVolume: 0.8,
		// useful for <audio> player loops
		loop: false,
		// resize to media dimensions
		enableAutosize: true,
		// forces the hour marker (##:00:00)
		alwaysShowHours: false,

		// show framecount in timecode (##:00:00:00)
		showTimecodeFrameCount: false,
		// used when showTimecodeFrameCount is set to true
		framesPerSecond: 25,
		
		// automatically calculate the width of the progress bar based on the sizes of other elements
		autosizeProgress : true,
		// Hide controls when playing and mouse is not over the video
		alwaysShowControls: false,
		// force iPad's native controls
		iPadUseNativeControls: false,
		// force iPad's native controls
		iPhoneUseNativeControls: false,	
		// force iPad's native controls
		AndroidUseNativeControls: false,			
		// features to show
		features: ['playpause','current','progress','duration','tracks','volume','fullscreen'],
		// only for dynamic
		isVideo: true,
		
		// turns keyboard support on and off for this instance
		enableKeyboard: true,
		
		// whenthis player starts, it will pause other players
		pauseOtherPlayers: true,
		
		// array of keyboard actions such as play pause
		keyActions: [
				{
						key: 32, // SPACE
						action: function(player, media) {
								if (media.paused || media.ended) {
										media.play();	
								} else {
										media.pause();
								}										
						}
				},
				{
						key: 38, // UP
						action: function(player, media) {
								var newVolume = Math.min(media.volume + 0.1, 1);
								media.setVolume(newVolume);
						}
				},
				{
						key: 40, // DOWN
						action: function(player, media) {
								var newVolume = Math.max(media.volume - 0.1, 0);
								media.setVolume(newVolume);
						}
				},
				{
						key: 37, // LEFT
						action: function(player, media) {
								if (!media.ended && !media.paused) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}
										
										// 5%
										var newTime = Math.min(media.currentTime - (media.duration * 0.05), media.duration);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						key: 39, // RIGHT
						action: function(player, media) {
								if (!media.ended && !media.paused) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}
										
										// 5%
										var newTime = Math.max(media.currentTime + (media.duration * 0.05), 0);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						key: 70, // f
						action: function(player, media) {
								if (typeof player.enterFullScreen != 'undefined') {
										if (player.isFullScreen) {
												player.exitFullScreen();
										} else {
												player.enterFullScreen();
										}
								}
						}
				}					
		]		
	};

	mejs.mepIndex = 0;
	
	mejs.players = [];

	// wraps a MediaElement object in player controls
	mejs.MediaElementPlayer = function(node, o) {
		// enforce object, even without "new" (via John Resig)
		if ( !(this instanceof mejs.MediaElementPlayer) ) {
			return new mejs.MediaElementPlayer(node, o);
		} 

		var t = this;
		
		// these will be reset after the MediaElement.success fires
		t.media = t.node = document.id(node);
		
		// check for existing player
		if (typeof t.node.player != 'undefined') {
			return t.node.player;
		} else {
			// attach player to DOM node for reference
			t.node.player = t;
		}
				
				
		// try to get options from data-mejsoptions
		if (typeof o == 'undefined') {
			o = t.node.get('mejsoptions');	
		}
			
		// extend default options
		t.options = Object.append({},mejs.MepDefaults,o);
		
		// add to player array (for focus events)
		mejs.players.push(t);
		
		// start up
		t.init();

		return t;
	};

	// actual player
	mejs.MediaElementPlayer.prototype = {
		
		hasFocus: false,
		
		controlsAreVisible: true,
		
		init: function() {

			var
				t = this,
				mf = mejs.MediaFeatures,
				// options for MediaElement (shim)
				meOptions = Object.merge({}, t.options, {
					success: function(media, domNode) { t.meReady(media, domNode); },
					error: function(e) { t.handleError(e);}
				}),
				tagName = t.media.tagName.toLowerCase();
		
			t.isDynamic = (tagName !== 'audio' && tagName !== 'video');
			
			if (t.isDynamic) {	
				// get video from src or href?				
				t.isVideo = t.options.isVideo;						
			} else {
				t.isVideo = (tagName !== 'audio' && t.options.isVideo);
			}
		
			// use native controls in iPad, iPhone, and Android	
			if ((mf.isiPad && t.options.iPadUseNativeControls) || (mf.isiPhone && t.options.iPhoneUseNativeControls)) {
				
				// add controls and stop
				t.$media.attr('controls', 'controls');

				// attempt to fix iOS 3 bug
				t.$media.removeProperty('poster');

				// override Apple's autoplay override for iPads
				if (mf.isiPad && t.media.getProperty('autoplay') !== null) {
					t.media.load();
					t.media.play();
				}
					
			} else if (mf.isAndroid && t.AndroidUseNativeControls) {
				
				// leave default player

			} else {

				// DESKTOP: use MediaElementPlayer controls
				
				// remove native controls 			
				t.media.removeProperty('controls');					
				
				// unique ID
				t.id = 'mep_' + mejs.mepIndex++;

				// build container
				t.container =
					new Element('div', {
						'id': t.id,
						'class': 'mejs-container',
						'html': ('<div class="mejs-inner">'+
							'<div class="mejs-mediaelement"></div>'+
							'<div class="mejs-layers"></div>'+
							'<div class="mejs-controls"></div>'+
							'<div class="mejs-clear"></div>'+
						'</div>')
					})
					.addClass(t.media.className)
					.inject(t.media, 'before');	
					
				// add classes for user and content
				t.container.addClass(
					(mf.isAndroid ? 'mejs-android ' : '') +
					(mf.isiOS ? 'mejs-ios ' : '') +
					(mf.isiPad ? 'mejs-ipad ' : '') +
					(mf.isiPhone ? 'mejs-iphone ' : '') +
					(t.isVideo ? 'mejs-video ' : 'mejs-audio ')
				);	
					

				// move the <video/video> tag into the right spot
				if (mf.isiOS) {
				
					// sadly, you can't move nodes in iOS, so we have to destroy and recreate it!
					var $newMedia = t.$media.clone();
					
					t.container.getElement('.mejs-mediaelement').inject(newMedia, 'bottom');
					
					t.$media.remove();
					t.$node = t.$media = $newMedia;
					t.node = t.media = $newMedia[0]
					
				} else {
					
					// normal way of moving it into place (doesn't work on iOS)
					t.container.getElement('.mejs-mediaelement').grab(t.media);
				}
				
				// find parts
				t.controls = t.container.getElement('.mejs-controls');
				t.layers = t.container.getElement('.mejs-layers');

				// determine the size
				
				/* size priority:
					(1) videoWidth (forced), 
					(2) style="width;height;"
					(3) width attribute,
					(4) defaultVideoWidth (for unspecified cases)
				*/
				
				var capsTagName = tagName.substring(0,1).toUpperCase() + tagName.substring(1);
				
				if (t.options[tagName + 'Width'] > 0 || t.options[tagName + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagName + 'Width'];
				} else if (t.media.style.width !== '' && t.media.style.width !== null) {
					t.width = t.media.style.width;						
				} else if (t.media.getProperty('width') !== null) {
					t.width = t.media.get('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}
				
				if (t.options[tagName + 'Height'] > 0 || t.options[tagName + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagName + 'Height'];
				} else if (t.media.style.height !== '' && t.media.style.height !== null) {
					t.height = t.media.style.height;
				} else if (t.media.getProperty('height') !== null) {
					t.height = t.media.get('height');	
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				// set the size, while we wait for the plugins to load below
				t.setPlayerSize(t.width, t.height);
				
				// create MediaElementShim
				meOptions.pluginWidth = t.height;
				meOptions.pluginHeight = t.width;				
			}
			
			

			// create MediaElement shim
			mejs.MediaElement(t.media, meOptions);
		},
		
		showControls: function(doAnimation) {
			var t = this;
			
			doAnimation = typeof doAnimation == 'undefined' || doAnimation;
			
			if (t.controlsAreVisible)
				return;
			
			if (doAnimation) {
				t.controls
					.setStyle('visibility','visible')
					.set('tween', {duration:200, link:'chain'}).get('tween').chain(function(){t.controls.tween('opacity', 1);}, function(){t.controlsAreVisible = true;}).callChain();
	
				// any additional controls people might add and want to hide
				t.container.getElement('.mejs-controls')
					.setStyle('visibility', 'visible')
					.set('tween', {duration:200, link:'chain'}).get('tween').chain(function(){t.container.getElement('.mejs-controls').tween('opacity', 1);}, function(){t.controlsAreVisible = true;}).callChain();
					
			} else {
				t.controls
					.setStyle('visibility','visible')
					.setStyle('display','block');
	
				// any additional controls people might add and want to hide
				t.container.getElement('.mejs-controls')
					.setStyle('visibility','visible')
					.setStyle('display','block');
					
				t.controlsAreVisible = true;
			}
			
			t.setControlsSize();
			
		},

		hideControls: function(doAnimation) {
			//console.log('hide doAnimation', doAnimation);
			var t = this;
			
			doAnimation = typeof doAnimation == 'undefined' || doAnimation;
			
			if (!t.controlsAreVisible)
				return;
			
			if (doAnimation) {
				// fade out main controls
				t.controls.set('tween', {duration:200, link:'chain'}).get('tween').chain(
				function() {
					t.controls.tween('opacity', 0);
				},
				function() {
					t.controls
						.setStyle('visibility','hidden')
						.setStyle('display','block');
						
					t.controlsAreVisible = false;
				});	
	
				// any additional controls people might add and want to hide
				t.container.getElement('.mejs-controls').set('tween', {duration:200, link:'chain'}).get('tween').chain(
				function() {
					t.container.getElement('.mejs-controls').tween('opacity', 0);
				},
				function() {
					t.container.getElement('.mejs-controls')
						.setStyle('visibility','hidden')
						.setStyle('display','block');
				}).callChain();	
			} else {
				
				// hide main controls
				t.controls
					.setStyle('visibility','hidden')
					.setStyle('display','block');		
				
				// hide others
				t.container.getElement('.mejs-controls')
					.setStyle('visibility','hidden')
					.setStyle('display','block');
					
				t.controlsAreVisible = false;
			}
		},		

		controlsTimer: null,

		startControlsTimer: function(timeout) {

			var t = this;
			
			timeout = typeof timeout != 'undefined' ? timeout : 1500;

			t.killControlsTimer('start');

			t.controlsTimer = setTimeout(function() {
				//console.log('timer fired');
				t.hideControls();
				t.killControlsTimer('hide');
			}, timeout);
		},

		killControlsTimer: function(src) {

			var t = this;

			if (t.controlsTimer !== null) {
				clearTimeout(t.controlsTimer);
				delete t.controlsTimer;
				t.controlsTimer = null;
			}
		},		
		
		controlsEnabled: true,
		
		disableControls: function() {
			var t= this;
			
			t.killControlsTimer();
			t.hideControls(false);
			this.controlsEnabled = false;
		},
		
		enableControls: function() {
			var t= this;
			
			t.showControls(false);
			
			t.controlsEnabled = true;
		},		
		

		// Sets up all controls and events
		meReady: function(media, domNode) {			
		
		
			var t = this,
				mf = mejs.MediaFeatures,
				autoplayAttr = domNode.getProperty('autoplay'),
				autoplay = !(typeof autoplayAttr == 'undefined' || autoplayAttr === null || autoplayAttr === 'false'),
				featureIndex,
				feature;

			// make sure it can't create itself again if a plugin reloads
			if (t.created)
				return;
			else
				t.created = true;			

			t.media = media;
			t.domNode = domNode;
			
			if (!(mf.isAndroid && t.options.AndroidUseNativeControls) && !(mf.isiPad && t.options.iPadUseNativeControls) && !(mf.isiPhone && t.options.iPhoneUseNativeControls)) {				
				
				// two built in features
				t.buildposter(t, t.controls, t.layers, t.media);
				t.buildkeyboard(t, t.controls, t.layers, t.media);
				t.buildoverlays(t, t.controls, t.layers, t.media);

				// grab for use by features
				t.findTracks();

				// add user-defined features/controls
				for (featureIndex in t.options.features) {
					feature = t.options.features[featureIndex];
					if (t['build' + feature]) {
						try {
							t['build' + feature](t, t.controls, t.layers, t.media);
						} catch (e) {
							// TODO: report control error
							//throw e;
							//console.log('error building ' + feature);
							//console.log(e);
						}
					}
				}

				t.container.fireEvent('controlsready');
				
				// reset all layers and controls
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();
				

				// controls fade
				if (t.isVideo) {
				
					if (mejs.MediaFeatures.hasTouch) {
						console.log("enabling touch control style")
						
						// for touch devices (iOS, Android)
						// show/hide without animation on touch
						
						t.media.addEvent('touchstart', function() {
							
							console.log('touch click. visible: ' + t.controlsAreVisible + ', enabled: ' + t.controlsEnabled);
							
							// toggle controls
							if (t.controlsAreVisible) {
								t.hideControls(false);
							} else {
								if (t.controlsEnabled) {
									t.showControls(false);
								}
							}
						});					
					
					} else {
						// click controls
						if (t.media.pluginType == 'native') {
							t.media.addEvent('click', function() {
								if (media.paused) {
									media.play();
								} else {
									media.pause();
								}
							});
						} else {
							$(t.media.pluginElement).addEvent('click', function() {
								if (media.paused) {
									media.play();
								} else {
									media.pause();
								}						
							});
						}
					
						// show/hide controls
						t.container
							.addEvent('mouseenter', function () {
								if (t.controlsEnabled) {
									if (!t.options.alwaysShowControls) {								
										t.killControlsTimer('enter');
										t.showControls();
										t.startControlsTimer(2500);		
									}
								}
							})
							.addEvent('mousemove', function() {
								if (t.controlsEnabled) {
									if (!t.controlsAreVisible) {
										t.showControls();
									}
									//t.killControlsTimer('move');
									if (!t.options.alwaysShowControls) {
										t.startControlsTimer(2500);
									}
								}
							})
							.addEvent('mouseleave', function () {
								if (t.controlsEnabled) {
									if (!t.media.paused && !t.options.alwaysShowControls) {
										t.startControlsTimer(1000);								
									}
								}
							});
					}
					
					// check for autoplay
					if (autoplay && !t.options.alwaysShowControls) {
						t.hideControls();
					}

					// resizer
					if (t.options.enableAutosize) {
						t.media.addEventListener('loadedmetadata', function(e) {
							// if the <video height> was not set and the options.videoHeight was not set
							// then resize to the real dimensions
							if (t.options.videoHeight <= 0 && t.domNode.getProperty('height') === null && !isNaN(e.target.videoHeight)) {
								t.setPlayerSize(e.target.videoWidth, e.target.videoHeight);
								t.setControlsSize();
								t.media.setVideoSize(e.target.videoWidth, e.target.videoHeight);
							}
						}, false);
					}
				}
				
				// EVENTS

				// FOCUS: when a video starts playing, it takes focus from other players (possibily pausing them)
				media.addEventListener('play', function() {
						
						// go through all other players
						for (var i=0, il=mejs.players.length; i<il; i++) {
							var p = mejs.players[i];
							if (p.id != t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended) {
								p.pause();
							}
							p.hasFocus = false;
						}
						
						t.hasFocus = true;
				},false);
								

				// ended for all
				t.media.addEventListener('ended', function (e) {
					try{
						t.media.setCurrentTime(0);
					} catch (exp) {
						
					}
					t.media.pause();
					
					if (t.setProgressRail)
						t.setProgressRail();
					if (t.setCurrentRail)
						t.setCurrentRail();						

					if (t.options.loop) {
						t.media.play();
					} else if (!t.options.alwaysShowControls && t.controlsEnabled) {
						t.showControls();
					}
				}, false);
				
				// resize on the first play
				t.media.addEventListener('loadedmetadata', function(e) {
					if (t.updateDuration) {
						t.updateDuration();
					}
					if (t.updateCurrent) {
						t.updateCurrent();
					}
					
					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
						t.setControlsSize();
					}
				}, false);


				// webkit has trouble doing this without a delay
				setTimeout(function () {
					t.setPlayerSize(t.width, t.height);
					t.setControlsSize();
				}, 50);
				
				// adjust controls whenever window sizes (used to be in fullscreen only)
				window.addEvent('resize', function() {
					
					// don't resize for fullscreen mode				
					if ( !(t.isFullScreen || (mejs.MediaFeatures.hasTrueNativeFullScreen && document.webkitIsFullScreen)) ) {
						t.setPlayerSize(t.width, t.height);
					}
					
					// always adjust controls
					t.setControlsSize();
				});				

				// TEMP: needs to be moved somewhere else
				if (t.media.pluginType == 'youtube') {
					t.container.getElement('.mejs-overlay-play').hide();	
				}
			}
			
			// force autoplay for HTML5
			if (autoplay && media.pluginType == 'native') {
				media.load();
				media.play();
			}


			if (t.options.success) {
				
				if (typeof t.options.success == 'string') {
						window[t.options.success](t.media, t.domNode, t);
				} else {
						t.options.success(t.media, t.domNode, t);
				}
			}
		},

		handleError: function(e) {
			var t = this;
			
			t.controls.hide();
		
			// Tell user that the file cannot be played
			if (t.options.error) {
				t.options.error(e);
			}
		},

		setPlayerSize: function(width,height) {
			var t = this;
			
			if (t.height.toString().indexOf('%') > 0) {
			
				// do we have the native dimensions yet?
				var 
					nativeWidth = (t.media.videoWidth && t.media.videoWidth > 0) ? t.media.videoWidth : t.options.defaultVideoWidth,
					nativeHeight = (t.media.videoHeight && t.media.videoHeight > 0) ? t.media.videoHeight : t.options.defaultVideoHeight,
					parentWidth = t.container.getParent().getSize().x,
					newHeight = parseInt(parentWidth * nativeHeight/nativeWidth, 10);
					
				if (t.container.getParent()[0].tagName.toLowerCase() === 'body') { // && t.container.siblings().count == 0) {
					parentWidth = $(window).getSize().x;
					newHeight = $(window).getSize().y;
				}
					
				
				// set outer container size
				t.container
					.setStyle('width', parentWidth+'px')
					.setStyle('height', newHeight+'px');
					
				// set native <video>
				t.$media
					.setStyle('width', '100%')
					.setStyle('height', '100%');
					
				// set shims
				t.container.getElement('object, embed, iframe')
					.setStyle('width', '100%')
					.setStyle('height', '100%');
					
				// if shim is ready, send the size to the embeded plugin	
				if (t.media.setVideoSize)
					t.media.setVideoSize(parentWidth, newHeight);
					
				// set the layers
				t.layers.getChildren('.mejs-layer')
					.setStyle('width', '100%')
					.setStyle('height', '100%');					
			
			
			} else {

				t.container
					.setStyle('width', t.width+'px')
					.setStyle('height', t.height+'px');

				t.layers.getChildren('.mejs-layer')
					.setStyle('width', t.width+'px')
					.setStyle('height', t.height+'px');
					
			}
		},

		setControlsSize: function() {
			var t = this,
				usedWidth = 0,
				railWidth = 0,
				rail = t.controls.getElement('.mejs-time-rail'),
				total = t.controls.getElement('.mejs-time-total'),
				current = t.controls.getElement('.mejs-time-current'),
				loaded = t.controls.getElement('.mejs-time-loaded');
				others = rail.getSiblings();
			

			// allow the size to come from custom CSS
			if (t.options && !t.options.autosizeProgress) {
				// Also, frontends devs can be more flexible 
				// due the opportunity of absolute positioning.
				railWidth = parseInt(rail.getStyle('width'));
			}
			
			// attempt to autosize
			if (railWidth === 0 || !railWidth) {
				
				// find the size of all the other controls besides the rail
				others.each(function(el) {
					if (el.getStyle('position') != 'absolute') {
						usedWidth += el.getComputedSize({styles:['padding','border','margin']}).totalWidth;
					}
				});
				
				// fit the rail into the remaining space
				railWidth = t.controls.getSize().x - usedWidth - (rail.getComputedSize({styles:['padding','border','margin']}).totalWidth - rail.getSize().x);
			}

			// outer area
			rail.setStyle('width', railWidth+'px');
			
			// dark space
			total.setStyle('width', (railWidth - (total.getComputedSize({styles:['padding','border','margin']}).totalWidth - total.getSize().x))+'px');
			
			if (t.setProgressRail)
				t.setProgressRail();
			if (t.setCurrentRail)
				t.setCurrentRail();				
		},


		buildposter: function(player, controls, layers, media) {
			var t = this,
				poster = new Element('div', {'class':'mejs-poster mejs-layer'}).inject(layers, 'bottom'),
				posterUrl = player.domNode.get('poster');

			// prioriy goes to option (this is useful if you need to support iOS 3.x (iOS completely fails with poster)
			if (player.options.poster !== '') {
				posterUrl = player.options.poster;
			}	
				
			// second, try the real poster
			if (posterUrl !== '' && posterUrl != null) {
				t.setPoster(posterUrl);
			} else {
				poster.hide();
			}

			media.addEventListener('play',function() {
				poster.hide();
			}, false);
		},
		
		setPoster: function(url) {
			var t = this,
				posterDiv = t.container.getElement('.mejs-poster'),
				posterImg = posterDiv.getElement('img');
				
			if (posterImg == null) {
				posterImg = new Element('img', {styles: {width: '100%', height: '100%'}}).inject(posterDiv, 'bottom');
			}	
			
			posterImg.set('src', url);
		},

		buildoverlays: function(player, controls, layers, media) {
			if (!player.isVideo)
				return;

			var 
			loading = 
				new Element('div', {
					'class': 'mejs-overlay mejs-layer',
					'html': '<div class="mejs-overlay-loading"><span></span></div>'
				})
				.hide() // start out hidden
				.inject(layers, 'bottom'),
			error = 
				new Element('div', {
					'class': 'mejs-overlay mejs-layer',
					'html': '<div class="mejs-overlay-error"></div>'
				})
				.hide() // start out hidden
				.inject(layers, 'bottom'),				
				
			// this needs to come last so it's on top
			bigPlay = 
				new Element('div', {
					'class': 'mejs-overlay mejs-layer mejs-overlay-play',
					'html': '<div class="mejs-overlay-button"></div>'
				})
				.inject(layers, 'bottom')
				.addEvent('click', function() {
					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}
				});
			
			/*
			if (mejs.MediaFeatures.isiOS || mejs.MediaFeatures.isAndroid) {
				bigPlay.remove();
				loading.remove();
			}
			*/
	

			// show/hide big play button
			media.addEventListener('play',function() {
				bigPlay.hide();
				loading.hide();
				error.hide();
			}, false);	
			
			media.addEventListener('playing', function() {
				bigPlay.hide();
				loading.hide();
				error.hide();			
			}, false);
	
			media.addEventListener('pause',function() {
				if (!mejs.MediaFeatures.isiPhone) {
					bigPlay.show();
				}
			}, false);
			
			media.addEventListener('waiting', function() {
				loading.show();	
			}, false);			
			
			
			// show/hide loading			
			media.addEventListener('loadeddata',function() {
				// for some reason Chrome is firing this event
				//if (mejs.MediaFeatures.isChrome && media.getProperty && media.getProperty('preload') === 'none')
				//	return;
					
				loading.show();
			}, false);	
			media.addEventListener('canplay',function() {
				loading.hide();
			}, false);	

			// error handling
			media.addEventListener('error',function() {
				loading.hide();
				error.show();
				error.getElement('mejs-overlay-error').set('html', "Error loading this resource");
			}, false);				
		},
		
		buildkeyboard: function(player, controls, layers, media) {

				var t = this;
				
				// listen for key presses
				document.addEvent('keydown', function(e) {
						
						if (player.hasFocus && player.options.enableKeyboard) {
										
								// find a matching key
								for (var i=0, il=player.options.keyActions.length; i<il; i++) {
										var keyAction = player.options.keyActions[i];
										if (e.code == keyAction.key) {
												e.preventDefault();
												keyAction.action(player, media);
												return false;
										}
								}
						}
						
						return true;
				});
				
				// check if someone clicked outside a player region, then kill its focus
				document.addEvent('click', function(event) {
					if (document.id(event.target).getParent('.mejs-container') == null) {
							player.hasFocus = false;
					}
				});
			
		},

		findTracks: function() {
			var t = this,
				tracktags = t.domNode.getElements('track');

			// store for use by plugins
			t.tracks = [];
			tracktags.each(function() {
				t.tracks.push({
					srclang: $(this).attr('srclang').toLowerCase(),
					src: $(this).attr('src'),
					kind: $(this).attr('kind'),
					entries: [],
					isLoaded: false
				});
			});
		},
		changeSkin: function(className) {
			this.container[0].className = 'mejs-container ' + className;
			this.setPlayerSize();
			this.setControlsSize();
		},
		play: function() {
			this.media.play();
		},
		pause: function() {
			this.media.pause();
		},
		load: function() {
			this.media.load();
		},
		setMuted: function(muted) {
			this.media.setMuted(muted);
		},
		setCurrentTime: function(time) {
			this.media.setCurrentTime(time);
		},
		getCurrentTime: function() {
			return this.media.currentTime;
		},
		setVolume: function(volume) {
			this.media.setVolume(volume);
		},
		getVolume: function() {
			return this.media.volume;
		},
		setSrc: function(src) {
			this.media.setSrc(src);
		},
		remove: function() {
			var t = this;
			
			if (t.media.pluginType == 'flash') {
				t.media.remove();
			} else if (t.media.pluginTyp == 'native') {
				t.media.prop('controls', true);
			}
			
			// grab video and put it back in place
			if (!t.isDynamic) {
				t.$node.insertBefore(t.container)
			}
			
			t.container.remove();
		}
	};

	// turn into MooTools plugin
	Element.implement('mediaelementplayer', function (options) {
		new mejs.MediaElementPlayer(this, options);
	});
	
	window.addEvent('domready', function() {
		// auto enable using JSON attribute
		$$('.mejs-player').mediaelementplayer();
	});
	
	// push out to window
	window.MediaElementPlayer = mejs.MediaElementPlayer;

})(mejs.$);
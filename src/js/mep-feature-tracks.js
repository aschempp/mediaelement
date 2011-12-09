(function($) {

	// add extra default options 
	Object.append(mejs.MepDefaults, {
		// this will automatically turn on a <track>
		startLanguage: '',
		// a list of languages to auto-translate via Google
		translations: [],
		// a dropdownlist of automatic translations
		translationSelector: false,
		// key for tranlsations
		googleApiKey: '',
		
		tracksText: 'Captions/Subtitles'
	});

	Object.append(MediaElementPlayer.prototype, {
	
		hasChapters: false,

		buildtracks: function(player, controls, layers, media) {
			if (!player.isVideo)
				return;

			if (player.tracks.length == 0)
				return;

			var t= this, i, options = '';

			player.chapters = 
					new Element('div', {'class': 'mejs-chapters mejs-layer', tween: {duration: 200}})
						.inject(layers, 'before').hide();
			player.captions = 
					new Element('div', {
						'class': 'mejs-captions-layer mejs-layer',
						'html': '<div class="mejs-captions-position"><span class="mejs-captions-text"></span></div>'
					})
					.inject(layers, 'before').hide();
			player.captionsText = player.captions.getElement('.mejs-captions-text');
			player.captionsButton = 
					new Element('div', {
						'class': 'mejs-button mejs-captions-button',
						'html': ('<button type="button" aria-controls="' + t.id + '" title="' + t.options.tracksText + '"></button>'+
							'<div class="mejs-captions-selector">'+
								'<ul>'+
									'<li>'+
										'<input type="radio" name="' + player.id + '_captions" id="' + player.id + '_captions_none" value="none" checked="checked" />' +
										'<label for="' + player.id + '_captions_none">None</label>'+
									'</li>'	+
								'</ul>'+
							'</div>')
						})
						.inject(controls)
						
						// hover
						.addEvent('mouseenter', function() {
							player.captionsButton.getElement('.mejs-captions-selector').setStyle('visibility','visible');
						})
						.addEvent('mouseleave', function() {
							player.captionsButton.getElement('.mejs-captions-selector').setStyle('visibility','hidden');
						})					
						
						// handle clicks to the language radio buttons
						.delegate('input[type=radio]','click',function() {
							lang = this.value;

							if (lang == 'none') {
								player.selectedTrack = null;
							} else {
								for (i=0; i<player.tracks.length; i++) {
									if (player.tracks[i].srclang == lang) {
										player.selectedTrack = player.tracks[i];
										player.captions.attr('lang', player.selectedTrack.srclang);
										player.displayCaptions();
										break;
									}
								}
							}
						});
						//.addEvent('mouseenter', function() {
						//	player.captionsButton.getElement('.mejs-captions-selector').setStyle('visibility','visible')
						//});

			if (!player.options.alwaysShowControls) {
				// move with controls
				player.container
					.addEvent('mouseenter', function () {
						// push captions above controls
						player.container.getElement('.mejs-captions-position').addClass('mejs-captions-position-hover');

					})
					.addEvent('mouseleave', function () {
						if (!media.paused) {
							// move back to normal place
							player.container.getElement('.mejs-captions-position').removeClass('mejs-captions-position-hover');
						}
					});
			} else {
				player.container.getElement('.mejs-captions-position').addClass('mejs-captions-position-hover');
			}

			player.trackToLoad = -1;
			player.selectedTrack = null;
			player.isLoadingTrack = false;

			// add user-defined translations
			if (player.tracks.length > 0 && player.options.translations.length > 0) {
				for (i=0; i<player.options.translations.length; i++) {
					player.tracks.push({
						srclang: player.options.translations[i].toLowerCase(),
						src: null,
						kind: 'subtitles', 
						entries: [],
						isLoaded: false,
						isTranslation: true
					});
				}
			}

			// add to list
			for (i=0; i<player.tracks.length; i++) {
				if (player.tracks[i].kind == 'subtitles') {
					player.addTrackButton(player.tracks[i].srclang, player.tracks[i].isTranslation);
				}
			}

			player.loadNextTrack();


			media.addEventListener('timeupdate',function(e) {
				player.displayCaptions();
			}, false);

			media.addEventListener('loadedmetadata', function(e) {
				player.displayChapters();
			}, false);

			player.container
				.addEvent('mouseenter', function () {
					// chapters
					if (player.hasChapters) {
						player.chapters.setStyle('visibility','visible');
						player.chapters.fade('in');
					}
				})
				.addEvent('mouseleave', function () {
					if (player.hasChapters && !media.paused) {
						player.chapters.fade('out').get('tween').chain(function() {
							player.chapters.setStyle('visibility','hidden');
							player.chapters.setStyle('display','block');
						});
					}
				});
				
			// check for autoplay
			if (player.node.getProperty('autoplay') !== null) {
				player.chapters.setStyle('visibility','hidden');
			}				

			// auto selector
			if (player.options.translationSelector) {
				for (i in mejs.language.codes) {
					options += '<option value="' + i + '">' + mejs.language.codes[i] + '</option>';
				}
				player.container.getElement('.mejs-captions-selector ul').before($(
					'<select class="mejs-captions-translations">' +
						'<option value="">--Add Translation--</option>' +
						options +
					'</select>'
				));
				// add clicks
				player.container.getElement('.mejs-captions-translations').change(function() {
					var
						option = $(this);
						lang = option.val();
					// add this language to the tracks list
					if (lang != '') {
						player.tracks.push({
							srclang: lang,
							src: null,
							entries: [],
							isLoaded: false,
							isTranslation: true
						});

						if (!player.isLoadingTrack) {
							player.trackToLoad--;
							player.addTrackButton(lang,true);
							player.options.startLanguage = lang;
							player.loadNextTrack();
						}
					}
				});
			}

		},

		loadNextTrack: function() {
			var t = this;

			t.trackToLoad++;
			if (t.trackToLoad < t.tracks.length) {
				t.isLoadingTrack = true;
				t.loadTrack(t.trackToLoad);
			} else {
				// add done?
				t.isLoadingTrack = false;
			}
		},

		loadTrack: function(index){
			var
				t = this,
				track = t.tracks[index],
				after = function() {

					track.isLoaded = true;

					// create button
					//t.addTrackButton(track.srclang);
					t.enableTrackButton(track.srclang);

					t.loadNextTrack();

				};

			if (track.isTranslation) {

				// translate the first track
				mejs.TrackFormatParser.translateTrackText(t.tracks[0].entries, t.tracks[0].srclang, track.srclang, t.options.googleApiKey, function(newOne) {

					// store the new translation
					track.entries = newOne;

					after();
				});

			} else {
				$.ajax({
					url: track.src,
					success: function(d) {

						// parse the loaded file
						track.entries = mejs.TrackFormatParser.parse(d);
						after();

						if (track.kind == 'chapters' && t.media.duration > 0) {
							t.drawChapters(track);
						}
					},
					error: function() {
						t.loadNextTrack();
					}
				});
			}
		},

		enableTrackButton: function(lang) {
			var t = this;

			t.captionsButton
				.getElement('input[value=' + lang + ']')
					.prop('disabled',false)
				.getSiblings('label')
					.set('html',  mejs.language.codes[lang] || lang );

			// auto select
			if (t.options.startLanguage == lang) {
				$('#' + t.id + '_captions_' + lang).click();
			}

			t.adjustLanguageBox();
		},

		addTrackButton: function(lang, isTranslation) {
			var t = this,
				l = mejs.language.codes[lang] || lang;

			t.captionsButton.getElement('ul').append(
				new Element('li', {
					html: (
						'<input type="radio" name="' + t.id + '_captions" id="' + t.id + '_captions_' + lang + '" value="' + lang + '" disabled="disabled" />' +
						'<label for="' + t.id + '_captions_' + lang + '">' + l + ((isTranslation) ? ' (translating)' : ' (loading)') + '</label>')
				})
			);

			t.adjustLanguageBox();

			// remove this from the dropdownlist (if it exists)
			t.container.getElement('.mejs-captions-translations option[value=' + lang + ']').remove();
		},

		adjustLanguageBox:function() {
			var t = this;
			// adjust the size of the outer box
			t.captionsButton.getElement('.mejs-captions-selector').setStyle('height', 
				t.captionsButton.getElement('.mejs-captions-selector ul').outerHeight(true) +
				t.captionsButton.getElement('.mejs-captions-translations').outerHeight(true)
			);
		},

		displayCaptions: function() {

			if (typeof this.tracks == 'undefined')
				return;

			var
				t = this,
				i,
				track = t.selectedTrack;

			if (track != null && track.isLoaded) {
				for (i=0; i<track.entries.times.length; i++) {
					if (t.media.currentTime >= track.entries.times[i].start && t.media.currentTime <= track.entries.times[i].stop){
						t.captionsText.set('html', track.entries.text[i]);
						t.captions.show();
						return; // exit out if one is visible;
					}
				}
				t.captions.hide();
			} else {
				t.captions.hide();
			}
		},

		displayChapters: function() {
			var 
				t = this,
				i;

			for (i=0; i<t.tracks.length; i++) {
				if (t.tracks[i].kind == 'chapters' && t.tracks[i].isLoaded) {
					t.drawChapters(t.tracks[i]);
					t.hasChapters = true;
					break;
				}
			}
		},

		drawChapters: function(chapters) {
			var 
				t = this,
				i,
				dur,
				//width,
				//left,
				percent = 0,
				usedPercent = 0;

			t.chapters.empty();

			for (i=0; i<chapters.entries.times.length; i++) {
				dur = chapters.entries.times[i].stop - chapters.entries.times[i].start;
				percent = Math.floor(dur / t.media.duration * 100);
				if (percent + usedPercent > 100 || // too large
					i == chapters.entries.times.length-1 && percent + usedPercent < 100) // not going to fill it in
					{
					percent = 100 - usedPercent;
				}
				//width = Math.floor(t.width * dur / t.media.duration);
				//left = Math.floor(t.width * chapters.entries.times[i].start / t.media.duration);
				//if (left + width > t.width) {
				//	width = t.width - left;
				//}

				t.chapters.append( $(
					'<div class="mejs-chapter" rel="' + chapters.entries.times[i].start + '" style="left: ' + usedPercent.toString() + '%;width: ' + percent.toString() + '%;">' + 
						'<div class="mejs-chapter-block' + ((i==chapters.entries.times.length-1) ? ' mejs-chapter-block-last' : '') + '">' + 
							'<span class="ch-title">' + chapters.entries.text[i] + '</span>' + 
							'<span class="ch-time">' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].start) + '&ndash;' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].stop) + '</span>' + 
						'</div>' +
					'</div>'));
				usedPercent += percent;
			}

			t.chapters.getElement('div.mejs-chapter').addEvent('click', function() {
				t.media.setCurrentTime( parseFloat( $(this).attr('rel') ) );
				if (t.media.paused) {
					t.media.play(); 
				}
			});

			t.chapters.show();
		}
	});



	mejs.language = {
		codes:  {
			af:'Afrikaans',
			sq:'Albanian',
			ar:'Arabic',
			be:'Belarusian',
			bg:'Bulgarian',
			ca:'Catalan',
			zh:'Chinese',
			'zh-cn':'Chinese Simplified',
			'zh-tw':'Chinese Traditional',
			hr:'Croatian',
			cs:'Czech',
			da:'Danish',
			nl:'Dutch',
			en:'English',
			et:'Estonian',
			tl:'Filipino',
			fi:'Finnish',
			fr:'French',
			gl:'Galician',
			de:'German',
			el:'Greek',
			ht:'Haitian Creole',
			iw:'Hebrew',
			hi:'Hindi',
			hu:'Hungarian',
			is:'Icelandic',
			id:'Indonesian',
			ga:'Irish',
			it:'Italian',
			ja:'Japanese',
			ko:'Korean',
			lv:'Latvian',
			lt:'Lithuanian',
			mk:'Macedonian',
			ms:'Malay',
			mt:'Maltese',
			no:'Norwegian',
			fa:'Persian',
			pl:'Polish',
			pt:'Portuguese',
			//'pt-pt':'Portuguese (Portugal)',
			ro:'Romanian',
			ru:'Russian',
			sr:'Serbian',
			sk:'Slovak',
			sl:'Slovenian',
			es:'Spanish',
			sw:'Swahili',
			sv:'Swedish',
			tl:'Tagalog',
			th:'Thai',
			tr:'Turkish',
			uk:'Ukrainian',
			vi:'Vietnamese',
			cy:'Welsh',
			yi:'Yiddish'
		}
	};

	/*
	Parses WebVVT format which should be formatted as
	================================
	WEBVTT
	
	1
	00:00:01,1 --> 00:00:05,000
	A line of text

	2
	00:01:15,1 --> 00:02:05,000
	A second line of text
	
	===============================

	Adapted from: http://www.delphiki.com/html5/playr
	*/
	mejs.TrackFormatParser = {
		// match start "chapter-" (or anythingelse)
		pattern_identifier: /^([a-zA-z]+-)?[0-9]+$/,
		pattern_timecode: /^([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,

		split2: function (text, regex) {
			// normal version for compliant browsers
			// see below for IE fix
			return text.split(regex);
		},
		parse: function(trackText) {
			var 
				i = 0,
				lines = this.split2(trackText, /\r?\n/),
				entries = {text:[], times:[]},
				timecode,
				text;

			for(; i<lines.length; i++) {
				// check for the line number
				if (this.pattern_identifier.exec(lines[i])){
					// skip to the next line where the start --> end time code should be
					i++;
					timecode = this.pattern_timecode.exec(lines[i]);				
					
					if (timecode && i<lines.length){
						i++;
						// grab all the (possibly multi-line) text that follows
						text = lines[i];
						i++;
						while(lines[i] !== '' && i<lines.length){
							text = text + '\n' + lines[i];
							i++;
						}

						// Text is in a different array so I can use .join
						entries.text.push(text);
						entries.times.push(
						{
							start: mejs.Utility.timeCodeToSeconds(timecode[1]),
							stop: mejs.Utility.timeCodeToSeconds(timecode[3]),
							settings: timecode[5]
						});
					}
				}
			}

			return entries;
		},

		translateTrackText: function(trackData, fromLang, toLang, googleApiKey, callback) {

			var 
				entries = {text:[], times:[]},
				lines,
				i

			this.translateText( trackData.text.join(' <a></a>'), fromLang, toLang, googleApiKey, function(result) {
				// split on separators
				lines = result.split('<a></a>');

				// create new entries
				for (i=0;i<trackData.text.length; i++) {
					// add translated line
					entries.text[i] = lines[i];
					// copy existing times
					entries.times[i] = {
						start: trackData.times[i].start,
						stop: trackData.times[i].stop,
						settings: trackData.times[i].settings
					};
				}

				callback(entries);
			});
		},

		translateText: function(text, fromLang, toLang, googleApiKey, callback) {

			var
				separatorIndex,
				chunks = [],
				chunk,
				maxlength = 1000,
				result = '',
				nextChunk= function() {
					if (chunks.length > 0) {
						chunk = chunks.shift();
						mejs.TrackFormatParser.translateChunk(chunk, fromLang, toLang, googleApiKey, function(r) {
							if (r != 'undefined') {
								result += r;
							}
							nextChunk();
						});
					} else {
						callback(result);
					}
				};

			// split into chunks
			while (text.length > 0) {
				if (text.length > maxlength) {
					separatorIndex = text.lastIndexOf('.', maxlength);
					chunks.push(text.substring(0, separatorIndex));
					text = text.substring(separatorIndex+1);
				} else {
					chunks.push(text);
					text = '';
				}
			}

			// start handling the chunks
			nextChunk();
		},
		translateChunk: function(text, fromLang, toLang, googleApiKey, callback) {

			var data = {
				q: text, 
				langpair: fromLang + '|' + toLang,
				v: '1.0'
			};
			if (googleApiKey !== '' && googleApiKey !== null) {
				data.key = googleApiKey;
			}

			$.ajax({
				url: 'https://ajax.googleapis.com/ajax/services/language/translate', // 'https://www.google.com/uds/Gtranslate', //'https://ajax.googleapis.com/ajax/services/language/translate', //
				data: data,
				type: 'GET',
				dataType: 'jsonp',
				success: function(d) {
					
					callback((d.responseData !== null) ? d.responseData.translatedText : 'No translation');
				},
				error: function(e) {
					callback(null);
				}
			});
		}
	};
	// test for browsers with bad String.split method.
	if ('x\n\ny'.split(/\n/gi).length != 3) {
		// add super slow IE8 and below version
		mejs.TrackFormatParser.split2 = function(text, regex) {
			var 
				parts = [], 
				chunk = '',
				i;

			for (i=0; i<text.length; i++) {
				chunk += text.substring(i,i+1);
				if (regex.test(chunk)) {
					parts.push(chunk.replace(regex, ''));
					chunk = '';
				}
			}
			parts.push(chunk);
			return parts;
		}
	}

})(mejs.$);

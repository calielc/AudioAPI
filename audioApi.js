function AudioApi() {
	var self = this;

	self.onloadedmetadata = null;
	self.oncanplay = null;
	self.ontimeupdate = null;
	self.onprogress = null;
	self.onended = null;
	self.onerror = null;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext = new AudioContext();
	var gainNode = null;

	var src = null;
	Object.defineProperty(this, "src", {
		get: function () { return src; },
		set: function (value) { src = value; },
	});

	var duration = null;
	Object.defineProperty(this, "duration", {
		get: function () { return duration; },
	});

	var currentTime = null;
	Object.defineProperty(this, "currentTime", {
		get: function () { return currentTime; },
	});

	var loaded = null;
	Object.defineProperty(this, "loaded", {
		get: function () { return loaded; },
	});

	var volume = 1;
	Object.defineProperty(this, "volume", {
		get: function () { return volume; },
		set: function (value) {
			volume = value;

			if (gainNode) {
				gainNode.gain.value = volume;
			}
		},
	});

	var load = function (url) {
		return $.Deferred(function (def) {
			var httpRequest = new XMLHttpRequest();
			httpRequest.open('GET', url, true);
			httpRequest.responseType = 'arraybuffer';

			httpRequest.onload = function () {
				def.resolve(httpRequest.response);
			};

			httpRequest.onprogress = function (args) {
				loaded = {
					total: args.total,
					position: args.loaded,
					percentual: args.loaded / args.total,
				};

				if (self.onprogress && typeof self.onprogress === 'function') {
					self.onprogress(self);
				}
			};

			httpRequest.onerror = function () {
				def.reject();
			};

			httpRequest.send();
		}).promise();
	};

	var playSource = function (buffer) {
		var bufferSource = audioContext.createBufferSource(); // creates a sound source
		bufferSource.buffer = buffer; // tell the source which sound to play
		bufferSource.connect(audioContext.destination); // connect the source to the context's destination (the speakers)

		gainNode = audioContext.createGain();
		bufferSource.connect(gainNode);
		gainNode.connect(audioContext.destination);
		gainNode.gain.value = volume;

		if (self.oncanplay && typeof self.oncanplay === 'function') {
			self.oncanplay(self);
		}

		var timer = null;
		bufferSource.onended = function () {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}

			if (self.onended && typeof self.onended === 'function') {
				self.onended(self);
			}
		};

		bufferSource.start(0); // play the source now
		// note: on older systems, may have to use deprecated noteOn(time);

		if (self.onprogress && typeof self.onprogress === 'function') {
			self.onprogress(self);
		}

		timer = setInterval(function () {
			currentTime += 0.5;

			if (self.onprogress && typeof self.onprogress === 'function') {
				self.onprogress(self);
			}
		}, 500);
	};

	this.play = function () {
		duration = 0;
		currentTime = 0;
		loaded = {
			total: 0,
			position: 0,
			percentual: 0,
		};

		load(src).done(function (response) {
			audioContext.decodeAudioData(response,
				function (buffer) {
					duration = buffer.duration;
					if (self.onloadedmetadata && typeof self.onloadedmetadata === 'function') {
						self.onloadedmetadata(self);
					}

					playSource(buffer);
				},
				function () {
					if (self.onError && typeof self.onError === 'function') {
						self.onError(self);
					}
				});
		}).fail(function () {
			if (self.onError && typeof self.onError === 'function') {
				self.onError(self);
			}
		});
	};
};

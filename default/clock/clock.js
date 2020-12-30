/* Magic Mirror
 * Module: Clock
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("clock", {
	defaults: {
		displayType: "digital", // options: digital, analog, both

		timeFormat: 12,
		displaySeconds: false,
		showPeriod: true,
		showPeriodUpper: false,
		clockBold: false,
		showDate: true,
		showWeek: false,
		dateFormat: "dddd, LL",
	},
	
	getScripts: function () {
		return ["moment.js", "moment-timezone.js", "suncalc.js"];
	},

	getStyles: function () {
		return ["clock_styles.css"];
	},
	
	start: function () {
		Log.info("Starting module: " + this.name);

		var self = this;
		self.second = moment().second();
		self.minute = moment().minute();

		//Calculate how many ms should pass until next update depending on if seconds is displayed or not
		var delayCalculator = function (reducedSeconds) {
			var EXTRA_DELAY = 50; //Deliberate imperceptable delay to prevent off-by-one timekeeping errors

			if (self.config.displaySeconds) {
				return 1000 - moment().milliseconds() + EXTRA_DELAY;
			} else {
				return (60 - reducedSeconds) * 1000 - moment().milliseconds() + EXTRA_DELAY;
			}
		};

		//A recursive timeout function instead of interval to avoid drifting
		var notificationTimer = function () {
			self.updateDom();

			//If seconds is displayed CLOCK_SECOND-notification should be sent (but not when CLOCK_MINUTE-notification is sent)
			if (self.config.displaySeconds) {
				self.second = moment().second();
				if (self.second !== 0) {
					self.sendNotification("CLOCK_SECOND", self.second);
					setTimeout(notificationTimer, delayCalculator(0));
					return;
				}
			}

			//If minute changed or seconds isn't displayed send CLOCK_MINUTE-notification
			self.minute = moment().minute();
			self.sendNotification("CLOCK_MINUTE", self.minute);
			setTimeout(notificationTimer, delayCalculator(0));
		};

		//Set the initial timeout with the amount of seconds elapsed as reducedSeconds so it will trigger when the minute changes
		setTimeout(notificationTimer, delayCalculator(self.second));

		// Set locale.
		moment.locale(config.language);
	},
	
	getDom: function () {
		var wrapper = document.createElement("div");
		var dateWrapper = document.createElement("div");
		var timeWrapper = document.createElement("div");
		var secondsWrapper = document.createElement("sup");
		var periodWrapper = document.createElement("span");
		var sunWrapper = document.createElement("div");
		var moonWrapper = document.createElement("div");
		var weekWrapper = document.createElement("div");
		// Style Wrappers
		dateWrapper.className = "date normal medium";
		timeWrapper.className = "time bright large light";
		secondsWrapper.className = "dimmed";
		weekWrapper.className = "week dimmed medium";

		var timeString;
		var now = moment();
		this.lastDisplayedMinute = now.minute();
		if (this.config.timezone) {
			now.tz(this.config.timezone);
		}

		var hourSymbol = "HH";
		if (this.config.timeFormat !== 24) {
			hourSymbol = "h";
		}

		if (this.config.clockBold === true) {
			timeString = now.format(hourSymbol + '[<span class="bold">]mm[</span>]');
		} else {
			timeString = now.format(hourSymbol + ":mm");
		}

		if (this.config.showDate) {
			dateWrapper.innerHTML = now.format(this.config.dateFormat);
		}
		if (this.config.showWeek) {
			weekWrapper.innerHTML = this.translate("WEEK", { weekNumber: now.week() });
		}
		timeWrapper.innerHTML = timeString;
		secondsWrapper.innerHTML = now.format("ss");
		if (this.config.showPeriodUpper) {
			periodWrapper.innerHTML = now.format("A");
		} else {
			periodWrapper.innerHTML = now.format("a");
		}
		if (this.config.displaySeconds) {
			timeWrapper.appendChild(secondsWrapper);
		}
		if (this.config.showPeriod && this.config.timeFormat !== 24) {
			timeWrapper.appendChild(periodWrapper);
		}

		function formatTime(config, time) {
			var formatString = hourSymbol + ":mm";
			if (config.showPeriod && config.timeFormat !== 24) {
				formatString += config.showPeriodUpper ? "A" : "a";
			}
			return moment(time).format(formatString);
		}

		wrapper.appendChild(dateWrapper);
		wrapper.appendChild(timeWrapper);
		wrapper.appendChild(weekWrapper);

		return wrapper;
	}
});

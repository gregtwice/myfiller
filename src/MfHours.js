class MfTime {
  #raw_input = "";
  #mf_time = "";
  #isValid = false;

  #error = "";

  // [08:00, 8:00, :45, 08:]
  #long_date_re = /(?<hours>\d{1,2})?:(?<mins>\d{2})?/;
  // [0800, 800]
  #short_date_re = /\d{3,4}/;

  /**
   *
   * @param {string} input
   */
  constructor(input) {
    /**
     * @type {string}
     */
    this.#raw_input = input;
    /**
     * @type {string}
     */

    this.#validate_raw_input();
    if (this.#isValid) {
      this.#format_mf_time();
    }
  }

  #errors = {
    wrong_format: "expected a time in the form h:mm",
    wrong_hour: "expected hours to be less than 24",
    wrong_minutes: "expected minutes to be less than 60",
  };

  #validate_raw_input() {
    this.#short_date_re.lastIndex = 0;
    this.#long_date_re.lastIndex = 0;
    if (this.#short_date_re.test(this.#raw_input) || this.#long_date_re.test(this.#raw_input)) {
      this.#isValid = true;
    } else {
      this.#error = this.#errors.wrong_format;
      this.#isValid = false;
    }
  }

  #format_mf_time() {
    /*
        Expect either 
        08:00 => no formatting needed
        8:00 => 08:00
        :45 => 00:45
        08: => 08:00
        800 => 08:00
        0800 => 08:00
        */
    this.#long_date_re.lastIndex = 0;

    if (this.#raw_input.includes(":")) {
      let { hours, mins } = this.#long_date_re.exec(this.#raw_input.trim()).groups;
      const mf_hours = hours ? hours.padStart(2, "0") : "00";
      const mf_mins = mins ?? "00";

      if (mf_hours < 0 || mf_hours > 23) {
        this.#isValid = false;
        this.#error = this.#errors.wrong_hour;
      }
      if (mf_mins < 0 || mf_mins > 59) {
        this.#isValid = false;
        this.#error = this.#errors.wrong_minutes;
      }

      this.#mf_time = `${mf_hours}:${mf_mins}`;
    } else {
      // parse the other format
      const short_format = this.#raw_input.padStart(4, "0");
      const mf_hours = short_format.substring(0, 2);
      const mf_mins = short_format.substring(2, 4);
      this.#mf_time = `${mf_hours}:${mf_mins}`;
    }
  }

  /**
   * add another MfTime to this
   * @param {MfTime} rhs
   */
  add_time(rhs) {
    const MILLISECONDS = 1;
    const SECONDS = 1000 * MILLISECONDS;
    const MINUTES = 60 * SECONDS;
    const HOURS = 60 * MINUTES;
    let this_date = new Date(0, 0, 0, this.hours, this.minutes, 0, 0);
    let rhs_date = new Date(0, 0, 0, rhs.hours, rhs.minutes, 0, 0);
    let end_hour = new Date(
      this_date.getTime() + rhs_date.getHours() * HOURS + rhs_date.getMinutes() * MINUTES
    );
    return new MfTime(end_hour.getHours() + ":" + (end_hour.getMinutes() + "").padStart(2, "0"));
  }
  get formatted_date() {
    return this.#mf_time;
  }

  get hours() {
    return parseInt(this.#mf_time.split(":")[0]);
  }

  get minutes() {
    return parseInt(this.#mf_time.split(":")[1]);
  }

  get errorString() {
    return this.#error;
  }
  get valid() {
    return this.#isValid;
  }
}

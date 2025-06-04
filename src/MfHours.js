class MfTime {

    raw_input;
    mf_time;

    // [08:00, 8:00, :45, 08:]
    long_date_re = /(?<hours>\d{1,2})?:(?<mins>\d{2})?/;
    // [0800, 800]
    short_date_re = /\d{3,4}/;

    /**
     * 
     * @param {string} input 
     */
    constructor(input) {
        /**
         * @type {string}
         */
        this.raw_input = input;
        /**
         * @type {string}
         */
        this.mf_time = "";
        this.isValid = false;
        this.validate_raw_input();
        if (this.isValid) {
            this.format_mf_time();
        }
    }

    validate_raw_input() {
        this.short_date_re.lastIndex = 0;
        this.long_date_re.lastIndex = 0;
        if (this.short_date_re.test(this.raw_input) || this.long_date_re.test(this.raw_input)) {
            this.isValid = true;
        } else {
            this.isValid = false;
        }
    }

    format_mf_time() {
        /*
        Expect either 
        08:00 => no formatting needed
        8:00 => 08:00
        :45 => 00:45
        08: => 08:00
        800 => 08:00
        0800 => 08:00
        */
        this.long_date_re.lastIndex = 0;

        if (this.raw_input.includes(":")) {

            let { hours, mins } = this.long_date_re.exec(this.raw_input.trim()).groups;
            const mf_hours = hours ? hours.padStart(2, "0") : "00";
            const mf_mins = mins ?? "00";
            this.mf_time = `${mf_hours}:${mf_mins}`;
        } else {
            // parse the other format
            const short_format = this.raw_input.padStart(4, "0");
            const mf_hours = short_format.substring(0, 2);
            const mf_mins = short_format.substring(2, 4);
            this.mf_time = `${mf_hours}:${mf_mins}`;
        }
    }

    get formatted_date() {
        return this.mf_time;
    }

    get valid() {
        return this.isValid;
    }
}
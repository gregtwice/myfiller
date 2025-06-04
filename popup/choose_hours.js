/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */

const DEFAULT_PAUSE_VALUE = "00:45";

function listenForClicks() {
  function set_local_storage(object) {
    browser.storage.local.set(object).catch(reportExecuteScriptError);
  }

  // install event listener for local storage of time values in the popup
  document.querySelectorAll(".timeInput").forEach((input) => {
    input.addEventListener("keyup", (e) => {
      let value = {};
      value[e.target.id] = e.target.value;
      set_local_storage(value);
    });
  });

  // install the event for saving the value of project select
  document.querySelector("#projects").addEventListener("change", (event) => {
    const selectedOption = event.target.value;
    set_local_storage({ project: selectedOption });
  });

  // install envent for custom pause duration
  document.querySelector("#useCustomPause").addEventListener("click", (event) => {
    set_local_storage({ customPause: event.target.checked });
    set_custom_pause_disabled(event.target.checked);
    if (event.target.checked === false) {
      document.querySelector("#pause").value = DEFAULT_PAUSE_VALUE;
    }
  });

  document.addEventListener("click", (e) => {
    /**
     * Resets all text fields in the RA
     * @param {*} tabs the tabs given by the browser [0] is the active one
     */
    function reset(tabs) {
      browser.tabs
        .sendMessage(tabs[0].id, {
          command: "RA::resetAllInputs",
        })
        .catch(reportExecuteScriptError);
    }

    /**
     * Sets the office hours to the given times of arrival and departures
     * @param {*} tabs the tabs given by the browser [0] is the active one
     */
    function fillOfficeHours(tabs) {
      const s_hour = document.querySelector("#startDay");
      const e_hour = document.querySelector("#endDay");
      const p_hour = document.querySelector("#pause");

      const start_hour = { dom: s_hour, hours: new MfTime(s_hour.value) };
      const end_hour = { dom: e_hour, hours: new MfTime(e_hour.value) };
      const pause_time = { dom: p_hour, hours: new MfTime(p_hour.value) };
      const hours = [start_hour, end_hour, pause_time];

      if (hours.every((e) => e.hours.valid)) {
        send_message(tabs, "RA::fillOfficeHours", {
          startOfDay: start_hour.hours.mf_time,
          pauseTime: pause_time.hours.mf_time,
          endOfDay: end_hour.hours.mf_time,
        });
      } else {
        // TODO:handle validation error
        hours.forEach((hour) => {
          if (hour.hours.valid === false) {
            console.log(hour);

            set_feedback(hour.dom, hour.hours.error);
            // hour.dom.setCustomValidity("invalid");
          }
        });
      }
    }

    /**
     * Fills the project hours per project from the selected project
     * @param {*} tabs the tabs given by the browser [0] is the active one
     */
    function fillProjectHours(tabs) {
      const projectIdx = document.querySelector("#projects").value;
      const hoursWorked = new MfTime(document.querySelector("#projectHours").value);
      if (hoursWorked.valid) {
        send_message(tabs, "RA::fillProjectHours", {
          projectIdx: projectIdx,
          timeWorked: hoursWorked.mf_time,
        });
      } else {
        // TODO:handle validation error

        set_feedback(document.querySelector("#projectHours"), hoursWorked.error);
      }
    }

    function clearProjectHours(tabs) {
      const projectIdx = document.querySelector("#projects").value;
      send_message(tabs, "RA::fillProjectHours", { projectIdx: projectIdx, timeWorked: "00:00" });
    }

    if (e.target.tagName !== "BUTTON") {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }

    switch (e.target.id) {
      case "reset":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(reset)
          .catch(reportExecuteScriptError);
        break;
      case "setHours":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(fillOfficeHours)
          .catch(reportExecuteScriptError);
        break;
      case "setProjectHours":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(fillProjectHours)
          .catch(reportExecuteScriptError);
        break;
      case "setProjectHours":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(fillProjectHours)
          .catch(reportExecuteScriptError);
        break;
      case "clearProjectHours":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(clearProjectHours)
          .catch(reportExecuteScriptError);
    }
  });

  function send_message(tabs, command, message) {
    browser.tabs.sendMessage(tabs[0].id, {
      command: command,
      ...message,
    });
  }
}

function set_custom_pause_disabled(disabled) {
  document.querySelector("#pause").disabled = !disabled;
}

// retreive saved values from the local storage
function restore_popup() {
  browser.storage.local
    .get(["startDay", "endDay", "pause", "projectHours"])
    .then((o) => {
      // populate the inputs
      for (const [k, v] of Object.entries(o)) {
        document.querySelector("#" + k).value = v;
      }
    })
    .catch(reportExecuteScriptError);

  browser.storage.local
    .get("project")
    .then((o) => {
      let prjSel = document.querySelector("#projects");
      console.log(prjSel.children);
      console.log(o.project);
      prjSel.value = o.project;
    })
    .catch(reportExecuteScriptError);
  browser.storage.local
    .get("pause")
    .then((storage) => {
      set_custom_pause_disabled(storage.pause);
      document.querySelector("#useCustomPause").checked = storage.pause;
      if (storage.pause === false) {
        document.querySelector("#pause").value = DEFAULT_PAUSE_VALUE;
      }
    })
    .catch(reportExecuteScriptError);
}

function populateSelectWithProjects() {
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => {
      browser.tabs
        .sendMessage(tabs[0].id, { command: "prj::getAll" })
        .then((response) => {
          console.log(response);
          let prjSel = document.querySelector("#projects");
          for (const [index, project] of response.entries()) {
            prjSel.appendChild(new Option(project, index));
          }

          restore_popup();
        })
        .catch(reportExecuteScriptError);
    })
    .catch(reportExecuteScriptError);
}

function set_feedback(elem, error) {
  console.log(elem.nextElementSibling);
  elem.nextElementSibling.innerText = error;
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/hourfiller.js" })
  .then(listenForClicks)
  .then(populateSelectWithProjects)
  .catch(reportExecuteScriptError);

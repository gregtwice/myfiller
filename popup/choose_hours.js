/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  // install event listener for local storage of time values in the popup
  document.querySelectorAll(".timeInput").forEach((input) => {
    input.addEventListener("keyup", (e) => {
      let value = {};
      value[e.target.id] = e.target.value;
      browser.storage.local.set(value).catch(reportExecuteScriptError);
    });
  });

  // retreive saved values from the local storage
  browser.storage.local
    .get(["startDay", "endDay", "pause", "projectHours"])
    .then((o) => {
      // populate the inputs
      for (const [k, v] of Object.entries(o)) {
        document.querySelector("#" + k).value = v;
      }
    })
    .catch(reportExecuteScriptError);

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
      const start_hour = new MfTime(document.querySelector("#startDay").value);
      const end_hour = new MfTime(document.querySelector("#endDay").value);
      const pause_time = new MfTime(document.querySelector("#pause").value);

      if (start_hour.valid && end_hour.valid && pause_time.valid) {
        browser.tabs
          .sendMessage(tabs[0].id, {
            command: "RA::fillOfficeHours",
            startOfDay: start_hour.mf_time,
            pauseTime: pause_time.mf_time,
            endOfDay: end_hour.mf_time,
          })
          .catch(reportExecuteScriptError);
      } else {
        // TODO:handle validation error
        console.error(start_hour.raw_input, end_hour.raw_input);
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
        browser.tabs
          .sendMessage(tabs[0].id, {
            command: "RA::fillProjectHours",
            projectIdx: projectIdx,
            timeWorked: hoursWorked.mf_time,
          })
          .catch(reportExecuteScriptError);
      } else {
        // TODO:handle validation error
        console.error(start_hour.raw_input, end_hour.raw_input);
      }
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
          .then(fillOfficeHours)
          .catch(reportExecuteScriptError);
        break;
    }
  });
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
          if (response.length > 1) {
            prjSel.value = 1;
          }
        })
        .catch(reportExecuteScriptError);
    })
    .catch(reportExecuteScriptError);
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

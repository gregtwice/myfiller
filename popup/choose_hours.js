/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */

const DEFAULT_PAUSE_VALUE = "00:45";

async function set_local_storage(object) {
  await browser.storage.local.set(object).catch(reportExecuteScriptError);
}

/**
 * Sets the error message and toggles the visibility of the field
 * @param {HTMLInputElement} input
 * @param {string} message
 */
function set_error_on_input(input, message) {
  input.nextElementSibling.innerText = message;
}

/**
 * Clears the error field of the input
 * @param {HTMLInputElement} input
 */
function clear_error_on_input(input) {
  input.nextElementSibling.innerText = "";
}

async function set_event_listeners() {
  // install event listener for local storage of time values in the popup
  document.querySelectorAll(".timeInput").forEach((input) => {
    input.addEventListener("keyup", (e) => {
      set_local_storage({ [e.target.id]: e.target.value });
    });
  });

  // format time after user has left the input
  document.querySelectorAll(".timeInput").forEach((input) => {
    input.addEventListener("blur", (e) => {
      const mf_time = new MfTime(e.target.value);
      if (mf_time.valid) {
        e.target.value = mf_time.formatted_date;
        clear_error_on_input(e.target);
        set_local_storage({ [e.target.id]: mf_time.formatted_date });
      } else {
        set_error_on_input(e.target, mf_time.errorString);
      }
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
}

/**
 * Resets all text fields in the RA
 * @param {*} tabs the tabs given by the browser [0] is the active one
 */
async function resetRA(tabs) {
  await browser.tabs
    .sendMessage(tabs[0].id, {
      command: "RA::resetAllInputs",
    })
    .catch(reportExecuteScriptError);
}

async function send_message(tabs, command, message) {
  browser.tabs
    .sendMessage(tabs[0].id, {
      command: command,
      ...message,
    })
    .catch(reportExecuteScriptError);
}

/**
 * Sets the office hours to the given times of arrival and departures
 * @param {*} tabs the tabs given by the browser [0] is the active one
 */
async function fillOfficeHours(tabs) {
  console.log("Hello");
  const s_hour = document.querySelector("#startDay");
  const w_time = document.querySelector("#hoursWorked");
  const p_time = document.querySelector("#pause");

  const arrival = { dom: s_hour, hours: new MfTime(s_hour.value) };
  const work_time = { dom: w_time, hours: new MfTime(w_time.value) };
  const pause = { dom: p_time, hours: new MfTime(p_time.value) };
  const departure = {
    dom: w_time,
    hours: arrival.hours.add_time(work_time.hours).add_time(pause.hours),
  };
  const hours = [arrival, departure, pause];

  if (hours.every((e) => e.hours.valid)) {
    send_message(tabs, "RA::fillOfficeHours", {
      startOfDay: arrival.hours.formatted_date,
      pauseTime: pause.hours.formatted_date,
      endOfDay: departure.hours.formatted_date,
    });
  } else {
    hours.forEach((hour) => {
      if (hour.hours.valid === false) {
        set_feedback(hour.dom, hour.hours.errorString);
      }
    });
  }
}

/**
 * Fills the project hours per project from the selected project
 * @param {*} tabs the tabs given by the browser [0] is the active one
 */
async function fillProjectHours(tabs) {
  const projectIdx = document.querySelector("#projects").value;
  const hoursWorked = new MfTime(document.querySelector("#projectHours").value);
  if (hoursWorked.valid) {
    send_message(tabs, "RA::fillProjectHours", {
      projectIdx: projectIdx,
      timeWorked: hoursWorked.formatted_date,
    });
  } else {
    set_feedback(document.querySelector("#projectHours"), hoursWorked.errorString);
  }
}

async function clearProjectHours(tabs) {
  const projectIdx = document.querySelector("#projects").value;
  send_message(tabs, "RA::fillProjectHours", { projectIdx: projectIdx, timeWorked: "00:00" });
}

function listenForClicks() {
  document.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }

    switch (e.target.id) {
      case "reset":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(resetRA)
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
}

function set_custom_pause_disabled(disabled) {
  document.querySelector("#pause").disabled = !disabled;
}

// retreive saved values from the local storage
function restore_popup() {
  browser.storage.local
    .get(["startDay", "hoursWorked", "pause", "projectHours"])
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

async function populateSelectWithProjects() {
  const tabs = await browser.tabs
    .query({ active: true, currentWindow: true })
    .catch(reportExecuteScriptError);

  const response = await browser.tabs
    .sendMessage(tabs[0].id, { command: "prj::getAll" })
    .catch(reportExecuteScriptError);

  let prjSel = document.querySelector("#projects");

  for (const [index, project] of response.entries()) {
    const project_name = project.type === "SA" ? ` — ${project.name}` : project.name;
    prjSel.appendChild(new Option(project_name, index));
  }

  restore_popup();
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
  console.error(`Failed to execute mf filler content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/hourfiller.js" })
  .then(set_event_listeners)
  .then(listenForClicks)
  .then(populateSelectWithProjects)
  .catch(reportExecuteScriptError);

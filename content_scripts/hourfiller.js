(function () {
  if (window.hasMyFireFillerRun) {
    return;
  }
  window.hasMyFireFillerRun = true;

  function mf_is_visible(elem) {
    return elem.style.display != "none";
  }

  function my_fire_text_field_filler(cssClass, hour, base = document) {
    let event = new Event("blur");
    let items = Array.from(base.querySelectorAll(cssClass));
    items.filter(mf_is_visible).forEach((node) => {
      node.firstElementChild.value = hour;
      // Make the mf js update the hours worked
      node.firstElementChild.dispatchEvent(event);
    });
  }

  function my_fire_set_hour_of_arrival(hour) {
    my_fire_text_field_filler(".txtStartDay", hour);
  }

  function my_fire_set_hour_of_departure(hour) {
    my_fire_text_field_filler(".txtEndDay", hour);
  }

  function my_fire_set_pause_duration(hour) {
    my_fire_text_field_filler(".txtPauseDay", hour);
  }

  function my_fire_set_project_hours(projectIndex, hoursWorked) {
    let project = document.querySelectorAll(".affectation").item(projectIndex);
    my_fire_text_field_filler(".heureProjet", hoursWorked, project);
  }

  /**
   * Reset all the fields to their default values
   */
  function reset_hour_fields() {
    my_fire_set_hour_of_arrival("00:00");
    my_fire_set_pause_duration("00:45");
    my_fire_set_hour_of_departure("00:00");
    for (let project = 0; project < get_number_of_projects(); project++) {
      my_fire_set_project_hours(project, "00:00");
    }
  }

  /**
   * Calculates the amount of projects - minus the IC
   */
  function get_number_of_projects() {
    return document.querySelectorAll(".affectation").length;
  }

  browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
      case "RA::resetAllInputs":
        reset_hour_fields();
        break;
      case "RA::fillOfficeHours":
        my_fire_set_hour_of_arrival(message.startOfDay);
        my_fire_set_pause_duration(message.pauseTime);
        my_fire_set_hour_of_departure(message.endOfDay);
        break;

      case "RA::fillProjectHours":
        const { projectIdx, timeWorked } = message;
        my_fire_set_project_hours(projectIdx, timeWorked);
        break;
      case "prj::getAll":
        const projects = Array.from(document.querySelectorAll(".titreProj>span")).map(
          (e) => e.firstChild.nodeValue
        );
        console.log(projects);

        return Promise.resolve(projects);
    }
  });
})();

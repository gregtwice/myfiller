
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    document.addEventListener("click", (e) => {

      
        function reset(tabs) {
            console.log("resetting");

            browser.tabs.sendMessage(tabs[0].id, {
                command: "reset",
            }
            ).catch(reportExecuteScriptError);
        }

        function fill(tabs) {
            console.log("filling");
            browser.tabs.sendMessage(tabs[0].id, {
                command: "fill",
                startOfDay: "09:00",
                endOfDay: "18:00"
            }).catch(reportExecuteScriptError);;
        }


        if (e.target.tagName !== "BUTTON") {
            // Ignore when click is not on a button within <div id="popup-content">.
            return;
        }
        if (e.target.type === "reset") {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(reset)
                .catch(reportExecuteScriptError);
        } else {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(fill)
                .catch(reportExecuteScriptError);

        }
    });
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
browser.tabs.executeScript({ file: "/content_scripts/hourfiller.js" })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);

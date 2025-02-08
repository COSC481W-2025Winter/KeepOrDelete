const { expect } = require('chai');

/*Unit testing for Go Button
1) Make sure pop up works if no directory is selected
2) Make sure path is properly sent to keep_or_delete page*/

/*Couldn't test window.location.href because electron-mocha uses that to control the testing enviorment
 Must use stubs to replicate the behaviour of navigation.*/
describe('Go Button Functionality', function () {
  // Variables to capture navigation attempts.
  let navigateCalled;
  let navigateUrl;

  beforeEach(function () {
    /*Creating a minimal DOM sample to simulate
    the environment of a our main_menu page.
    DOM = Document Object Model 
    fake path = /src/main_menu.js*/

    document.body.innerHTML = `
      <div id="filepath">/src/main_menu.js</div>
      <button id="goButton">Go</button>
    `;

    // Reset our navigation stub variables and alert message.
    navigateCalled = false;
    navigateUrl = '';

    window.alertMessage = '';
    window.alert = function(message) {
      window.alertMessage = message;
    };

    // Define our stub navigation function.
    function navigateStub(url) {
      navigateCalled = true;
      navigateUrl = url;
    }

    // Functionality for main_menu.js 
    document.getElementById("goButton").addEventListener("click", () => {
        const currentDir = document.getElementById("filepath").innerText.trim();
        if (!currentDir || currentDir === "No directory selected") {
          alert("Please select a directory first.");
          return;
        }
        // Navigate to the keep or delete page
        // window.location.href = "./breadNbutter/keep_or_delete.html";
        navigateStub("./breadNbutter/keep_or_delete.html");
      });
    });

    // Act Arrange & Assert
  it('Go to keep_or_delete page when path is selected', function () {
    document.getElementById("goButton").click();
    expect(navigateCalled).to.be.true;
    expect(navigateUrl).to.equal("./breadNbutter/keep_or_delete.html");
  });

  it('shows an alert if the path is an empty string', function () {
    document.getElementById("filepath").innerText = "";
    document.getElementById("goButton").click();
    expect(window.alertMessage).to.equal("Please select a directory first.");
    expect(navigateCalled).to.be.false;
  });

  it('shows an alert if no valid directory is selected', function () {
    document.getElementById("filepath").innerText = "No directory selected";
    document.getElementById("goButton").click();
    expect(window.alertMessage).to.equal("Please select a directory first.");
    expect(navigateCalled).to.be.false;
  });
});

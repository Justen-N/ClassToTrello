var trelloSuccess = function () {
    //shouldn't get here... Can't do anything if it does
}
var trelloFailed = function () {
    console.log("Failure!");
}

function init() {

    $("#connectTrello").click(function () {
        if (localStorage.getItem("trelloToken")) {
            $("#trello_logged_out").css("display", "none");
        } else {
            window.Trello.authorize({
                type: "popup",
                name: "Class to Trello",
                return_url: "https://cgfdmfihdnahelbbibceeackgnncbgjn.chromiumapp.org/",
                scope: {
                    read: true,
                    write: true
                },
                expiration: "never",
                trelloSuccess,
                trelloFailed
            });
            $("#trello_logged_out").css("display", "none");
            $('#trello_logged_in').css("display", "block");
        }
    });


    //trello logout button logic
    $("#disconnectTrello").click(function () {
        localStorage.removeItem("trelloToken");
        window.Trello.deauthorize();
        $("#trello_logged_in").css("display", "none");
        $("#trello_logged_out").css("display", "initial");
        location.reload();
    });
    $("#connectCanvas").click(function(){
        let redirect = chrome.identity.getRedirectURL()
        let canvas_url = "https://byui.instructure.com/login/oauth2/auth?client_id="+C_APP_KEY+"Response_type=code&redirect_uri="+redirect;
        chrome.identity.launchWebAuthFlow({canvas_url},function(responseUrl){
            
        });
    });

}
$(document).ready(init);
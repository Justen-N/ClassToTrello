var trelloSuccess = function () {
    //shouldn't get here... Can't do anything if it does
}
var trelloFailed = function () {
    console.log("Failure!");
}

function init() {

    $("#connectTrello").click(function () {
        if (localStorage.getItem("trello_token")) {
            $("#trello_logged_out").css("display", "none");
            $('#trello_logged_in').css("display", "block");
        } else {
            window.Trello.setKey(APP_KEY);
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
        window.Trello.deauthorize();
        localStorage.removeItem("trello_token");
        $("#trello_logged_in").css("display", "none");
        $("#trello_logged_out").css("display", "initial");
        location.reload();
    });
    $("#connectCanvas").click(function(){
        let redirect = encodeURIComponent(chrome.identity.getRedirectURL())
        let canvas_url = "https://byui.instructure.com/login/oauth2/auth?client_id="+C_APP_KEY+"&response_type=code&redirect_uri="+redirect;
        chrome.identity.launchWebAuthFlow({"url":canvas_url},function(responseUrl){
            console.log(responseUrl);
        });
    });
    $("#trelloTutorial").click(function(){
        if (localStorage.getItem("trello_token")){
            window.Trello.setToken(localStorage.getItem("trello_token"));
            console.log(Trello);
            Trello.post("boards",{name:"CTT Tutorial Board",desc:"A short tutorial in using the Canvas to Trello extension"})
        }
    });
}
$(document).ready(init);
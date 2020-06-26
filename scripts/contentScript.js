var trelloSuccess = function () {
    //shouldn't get here... Can't do anything if it does
}
var trelloFailed = function () {
    console.log("Failure!");
}

function init() {
    const appRedirect = chrome.identity.getRedirectURL();
    console.log(appRedirect);
    console.log(location.href);
    let tToken = localStorage.getItem("trello_token");
    if (tToken) {
        Trello.setKey(APP_KEY);
        Trello.setToken(tToken)
        Trello.authorize({
            name: "Canvas to Trello",
            expiration: "never",
            interactive: "false",
            scope: {
                read: true,
                write: true
            },
            success: function () {
                console.log("Trello Authentication Successful.");
            },
            error: function () {
                console.log("Auth Failed");
                //todo: inform the user that auth failed. 
            }
        });
    }
    $("#connectTrello").click(function () {
        Trello.authorize({
            type: "redirect",
            name: "Class to Trello",
            interactive: true,
            return_url: appRedirect + "/trello",
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
    });


    //trello logout button logic
    $("#disconnectTrello").click(function () {
        Trello.deauthorize();
        localStorage.removeItem("trello_token");
        $("#trello_logged_in").css("display", "none");
        $("#trello_logged_out").css("display", "initial");
        location.reload();
    });
    $("#connectCanvas").click(function () {

        let canvas_url = "https://byui.instructure.com/login/oauth2/auth?client_id=" + C_APP_KEY + "&response_type=code&redirect_uri=" + redirect;
        chrome.identity.launchWebAuthFlow({
            "url": canvas_url
        }, function (responseUrl) {
            console.log(responseUrl);
        });
    });
    $("#trelloTutorial").click(function () {
        if (Trello.token()) {
            Trello.get("/members/me/boards", {
                fields: "name, id"
            }, function (data, status, xhr) {
                let presentFlag = false;
                for (element of xhr.responseJSON) {
                    if (element.name === "CTT Tutorial Board") {
                        presentFlag = true;
                        break;
                    }
                };
                if (!presentFlag){
                    Trello.post("boards", {
                        name: "CTT Tutorial Board",
                        desc: "A short tutorial in using Trello to manage your school work",
                        idBoardSource:"5de6a962ec1e3a8fd67c27a2",
                        keepFromSource: "cards"
                    })
                }
            });
        } else {
            console.log("unauthorized");
        }
    });
    if (tToken) {
        $("#trello_logged_out").css("display", "none");
        $('#trello_logged_in').css("display", "block");
    } else {
        $("#trello_logged_out").css("display", "block");
        $('#trello_logged_in').css("display", "none");
    }

}
$(document).ready(init);
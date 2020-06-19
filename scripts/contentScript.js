var trelloSuccess = function() {
    //shouldn't get here... Can't do anything if it does
}
var trelloFailed = function(){
    console.log("Failure!");
}
function init(){    
    if(chrome.storage.local)
    $("#connectTrello").click(function () {
        window.Trello.authorize({
            type:"popup",name:"Class to Trello",return_url:"https://cgfdmfihdnahelbbibceeackgnncbgjn.chromiumapp.org/",scope:{read:true,write:true},expiration:"never",trelloSuccess,trelloFailed});
    });

    //trello logout button logic
    $("#disconnectTrello").click(function (){
        window.Trello.deauthorize();
        location.reload();
    });

}
$(document).ready(init);

console.log("scriptLoaded");

var container = document.getElementsByTagName("pre");
var value = container[0];
var token = value.innerHTML;
console.log(token);
chrome.runtime.sendMessage({token:token}, function (response) {
    console.log("response received");
    if(response.received="true"){
        console.log("inside window closure")
        window.close();
    }
})
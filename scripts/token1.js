var container = document.getElementsByTagName("pre");
var value = container[0];
var token = value.innerHTML;
console.log(token);
chrome.runtime.sendMessage({token:token}, function (response) {
    if(response.received="true"){
        window.close();
    }
})
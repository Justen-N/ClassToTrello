chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    console.log(request.token)
    localStorage.setItem('trello_token',request.token)    
    sendResponse({received:"true"});
})
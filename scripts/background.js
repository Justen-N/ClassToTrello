chrome.browserAction.onClicked.addListener(accessed)

function accessed(tab){

}
chrome.browserAction
function launchTrelloAuth(){
    chrome.identity.launchWebAuthFlow({'url':'byui.instructure/login/oauth2/auth?client_id=10706~oVStm0CADq2eD7sC0j1UerHdcXHjeuDReiAoaUgEFewnxnhwuBGX1vz627KCddkL&response_type=code&redirect_uri=https://classtotrello.chromiumapp.org/oauth_complete?code=XXX&state=YYY', 'interactive':'true'}
    ,function(redirect_url){console.log(redirect_url)});
}
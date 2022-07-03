function init() {

    let webBrowser
    if (typeof browser === 'undefined') {
        webBrowser = chrome
    }
    else {
        webBrowser = browser
    }

    document.addEventListener('message', function (e) {
        var data = e.detail;
        console.log('received', data);
    });





    var s = document.createElement('script');
    s.src = webBrowser.runtime.getURL('lib/socket-sniffer.js');
    s.onload = function () {
        this.remove();
    };



    (document.head || document.body).appendChild(s)

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            postMessage(request)
        }
    );


}

init()
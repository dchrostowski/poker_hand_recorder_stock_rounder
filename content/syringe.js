function init() {
    var webBrowser
    if(typeof browser === 'undefined') {
        webBrowser = chrome
    }
    else {
        webBrowser = browser
    }
    document.addEventListener('yourCustomEvent', function (e) {
        var data = e.detail;
        console.log('received', data);
      });
      
      
      
      var s = document.createElement('script');
      s.src = webBrowser.runtime.getURL('lib/socket-sniffer.js');
      s.onload = function() {
          this.remove();
      };
      
      (document.head || document.body).appendChild(s)
      
}

init()
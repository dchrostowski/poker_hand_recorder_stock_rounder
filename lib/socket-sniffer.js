WebSocket.prototype = null; // extending WebSocket will throw an error if this is not set
const ORIGINAL_WEBSOCKET = WebSocket;
var WebSocket = window.WebSocket = class extends WebSocket {
 constructor(...args) {
  super(...args);

  this.addEventListener('message', event => {
   let ws_sniff_debug_from = new CustomEvent( "ws_sniff_debug_from", {
    detail: {
     data: event,
     obj: this
    }
   });
   document.body.dispatchEvent(ws_sniff_debug_from);
   console.log(event)
  });

  this.addEventListener('open', event => {
   let ws_sniff_debug_open = new CustomEvent( "ws_sniff_debug_open", {
    detail: {
     data: event,
     obj: this
    }
   });
    console.log(event)
  });

  
 }
 send(...args) {
  let ws_sniff_debug_to = new CustomEvent( "ws_sniff_debug_to", {
   detail: {
    data: args[0],
    obj: this
   }
  });
  document.body.dispatchEvent(ws_sniff_debug_to);
  super.send(...args);
 }
}
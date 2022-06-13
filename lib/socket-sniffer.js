const cardMap = {
  0: "2c",
  1: "2d",
  2: "2h",
  3: "2s",
  4: "3c",
  5: "3d",
  6: "3h",
  7: "3s",
  8: "4c",
  9: "4d",
  10: "4h",
  11: "4s",
  12: "5c",
  13: "5d",
  14: "5h",
  15: "5s",
  16: "6c",
  17: "6d",
  18: "6h",
  19: "6s",
  20: "7c",
  21: "7d",
  22: "7h",
  23: "7s",
  24: "8c",
  25: "8d",
  26: "8h",
  27: "8s",
  28: "9c",
  29: "9d",
  30: "9h",
  31: "9s",
  32: "Tc",
  33: "Td",
  34: "Th",
  35: "Ts",
  36: "Jc",
  37: "Jd",
  38: "Jh",
  39: "Js",
  40: "Qc",
  41: "Qd",
  42: "Qh",
  43: "Qs",
  44: "Kc",
  45: "Kd",
  46: "Kh",
  47: "Ks",
  48: "Ac",
  49: "Ad",
  50: "Ah",
  51: "As"

}

const actionMap = {
  1: 'folds',
  2: 'checks',
  3: 'calls',
  8: 'bets',
  9: 'raises',
  6: 'posts small blind',
  7: 'posts big blind',
  16: "mucks hand",
  11: 'mucks hand'
}

const getSeatsFormatted = (seats) => {
  return seats.map((seat, idx) => {
    if (seat !== null) {
      return `Seat ${idx+1}: ${seat['n']} (${seat['c']} chips)`
    }
    return null

  }).filter(seat => seat !== null)
}

const potTypeMap = {
  70: 'Fixed',
  85: 'No Limit',
  80: 'Pot Limit',
}

const gameTypeMap = {
  72: "Hold'em",
  74: "Pineapple Hold'em",
  80: "Omaha HL",
  79: "Omaha",
}

const supportedGameTypes = [72,80,79];
const supportedPotTypes = [70,85,80];

const handData = {}


var saveData = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
    var data_str = ''
    Object.keys(data).map((hid) => {
      hdataMessages = data[hid].messages || []
      if (typeof hdataMessages[0] !== 'undefined') {
        hdataMessages.forEach(m => data_str += m + "\r\n")
      }
      

    })
      var blob = new Blob([data_str], {type: "octet/stream"}),
          url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
  };
}());

function exportData() {

  function KeyPress(e) {
    console.log(e.keyCode)
    var evtobj = window.event? event : e
    if (evtobj.keyCode == 49 && evtobj.ctrlKey) {
      saveData(handData,'handData.txt')
    }
}

document.onkeydown = KeyPress;

}

exportData()



function parseGameState(message, site) {
  
  if (message.t === 'GameState') {
    
    
    const { events, gameState } = message
    const { s, gi, gt,pt, ti, ...everythingElse } = gameState
    if(supportedGameTypes.indexOf(gt) === -1) {
      let errGameTypes = ''
      supportedGameTypes.forEach(sgt => errGameTypes += `${gameTypeMap[sgt]}\n`)
      console.error(`Unsupported game type.  Only works with the following game types:\n${errGameTypes}`)
      return
    }

    if(supportedPotTypes.indexOf(pt) === -1) {
      let errGameTypes = ''
      supportedPotTypes.forEach(sgt => errGameTypes += `${portTypeMap[sgt]}\n`)
      console.error(`Unsupported game type.  Only works with the following game types:\n${errGameTypes}`)
      return
    }


    const gameType = gameTypeMap[gt]
    const potType = potTypeMap[pt]
    const handId = gi
    const messageHandData = handData?.[handId] || {}
    
    messageHandData['handId'] = handId
    messageHandData['tableId'] = ti
    



    const seats = s

    

    if (events) {
      const pot = gameState.d?.p
      const communityCardsRaw = gameState.d?.c
      let communityCards = []
      if (communityCardsRaw) {
        communityCards = communityCardsRaw.split(';').map((c) => cardMap[c])
      }
      if(communityCards.length > 0) {
        //console.log("Cards on table: " + communityCards)
        
      }
      events.forEach((event) => {
        const seatIndex = event?.['s'] || null
        const actionIndex = event?.['a'] || null
        const eT = event?.['t'] || null
        const eventChips = event?.['f'] || null
        const seatIndexValid = seatIndex !== null
        let statement = ''
        let statement2 = ''

        if(seatIndexValid && actionIndex && eT === 9) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          const playerAction = actionMap[actionIndex] || 'did something'
          const chipAction = event?.f ? `${eventChips}` : ''
          const playerRemainingChips = seats[seatIndex]?.c || 0
          const allIn = playerRemainingChips > 0 ? '' : 'and is all in'

          if(actionIndex === 6) {
            messageHandData['small_blind'] = event?.f
            messageHandData['sbPlayer'] = playerName
          }
          
          if(actionIndex === 7) {
            messageHandData['big_blind'] = event?.f
            messageHandData['bbPlayer'] = playerName

          }


          statement = `${playerName} ${playerAction} ${chipAction}`

          if(playerAction === 'did something') {
            statement2 = statement
            statement = ''
          }
          
        }

        else if(eT === 7 && seatIndexValid &&  eventChips) {
          const handWinner = `[${seatIndex}] ${seats[seatIndex]?.n}` || 'Someone'
          const amountWon = eventChips
          statement = `${handWinner} collects ${amountWon} from pot`
        }

        else if(eT === 6 && seatIndexValid) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          //statement = `It's [${seatIndex}] ${playerName}'s turn.`
          
        }

        else if(eT === 5 && seatIndexValid) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          statement = 'New hand. ' + playerName + ' is the dealer'
          messageHandData['dealer'] = playerName
          const seatNumber = seatIndex + 1
          const messages = [`Table '${ti}' 9-max (Real Money) Seat #${seatNumber} is the button`]
          const formattedSeats = getSeatsFormatted(seats)
          messageHandData['messages'] = messages.concat(formattedSeats)
        }

        if(eT === 32) {
          // TO DO: get winning hand info
          statement = "Hand is over\n==================================="
          const firstLine = `${site} Hand #${handId}: ${gameType} ${potType} (${messageHandData.small_blind}/${messageHandData.big_blind} - ${new Date().toISOString()} [${new Date().toISOString()}]`
          messageHandData['messages'] = [firstLine].concat(messageHandData['messages'])
          handData[handId] = messageHandData
          console.log("DATA FILE WILL LOOK LIKE THIS:")
          handData[handId].messages.forEach((msg) => {
            console.log(msg)
          })
          console.log("END")
        }

        if(!statement) {
          console.log(event)
        }
        else {
          console.log(statement)
        }

        handData[handId] = messageHandData
        




       })
    }

  }
}


WebSocket.prototype = null; // extending WebSocket will throw an error if this is not set
const ORIGINAL_WEBSOCKET = WebSocket;
var WebSocket = window.WebSocket = class extends WebSocket {
  constructor(...args) {
    super(...args);

    this.addEventListener('message', event => {
      let ws_sniff_debug_from = new CustomEvent("ws_sniff_debug_from", {
        detail: {
          data: event,
          obj: this
        }
      });
      document.body.dispatchEvent(ws_sniff_debug_from);
      let site
      if(event.origin === 'wss://web.stockpokeronline.com') {
        site = "StockPokerOnline"
      }
      else if(event.origin === 'wss://web.latpoker.com') {
        site = "RounderCasino"
      }
      parseGameState(JSON.parse(event.data),site)
    });

    this.addEventListener('open', event => {
      let ws_sniff_debug_open = new CustomEvent("ws_sniff_debug_open", {
        detail: {
          data: event,
          obj: this
        }
      });
      console.log(event)
    });


  }
  send(...args) {
    let ws_sniff_debug_to = new CustomEvent("ws_sniff_debug_to", {
      detail: {
        data: args[0],
        obj: this
      }
    });
    document.body.dispatchEvent(ws_sniff_debug_to);
    super.send(...args);
  }
}
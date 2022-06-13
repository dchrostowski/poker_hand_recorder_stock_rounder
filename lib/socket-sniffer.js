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
  1: 'folded',
  2: 'checked',
  3: 'called',
  8: 'bet',
  9: 'raised',
  6: 'posted the small blind',
  7: 'posted the big blind',
  16: "mucked their cards",
  11: 'mucked their hand'
}

const getSeats = (seats) => {
  return seats.map((seat, idx) => {
    if (seat !== null) {
      return "Seat " + idx + ": " + seat.n
    }
    return null

  })
}



function parseGameState(message, site) {
  
  if (message.t === 'GameState') {
    const site = site
    const { events, gameState } = message
    const { s, gid, ...everythingElse } = gameState
    const handId = gid
    const seats = s
    

    if (events) {
      const pot = gameState.d?.p
      const communityCardsRaw = gameState.d?.c
      let communityCards = []
      if (communityCardsRaw) {
        communityCards = communityCardsRaw.split(';').map((c) => cardMap[c])
      }
      //console.log(getSeats(seats))
      if(communityCards.length > 0) {
        console.log("Cards on table: " + communityCards)
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
          const playerName = `[${seatIndex}] ${seats[seatIndex]?.n}` || 'Someone'
          const playerAction = actionMap[actionIndex] || 'did something'
          const chipAction = event?.f ? `with ${eventChips} chips` : ''
          const playerRemainingChips = seats[seatIndex]?.c || 0
          const allIn = playerRemainingChips > 0 ? '' : 'and is all in'


          statement = `${playerName} ${playerAction} ${chipAction} ${allIn}`

          if(playerAction === 'did something') {
            statement2 = statement
            statement = ''
          }
          
        }

        else if(eT === 7 && seatIndexValid &&  eventChips) {
          const handWinner = `[${seatIndex}] ${seats[seatIndex]?.n}` || 'Someone'
          const amountWon = eventChips
          statement = `${handWinner} wins the hand and gets ${amountWon}`
        }

        else if(eT === 6 && seatIndexValid) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          //statement = `It's [${seatIndex}] ${playerName}'s turn.`
          statement = ' '
        }

        else if(eT === 5 && seatIndexValid) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          statement = 'New hand. ' + playerName + ' is the dealer'

        }

        if(eT === 32) {
          // TO DO: get winning hand info
          statement = "Hand is over\n==================================="
        }

        if(!statement) {
          console.log(statement2)
          console.log(event)
        }
        else {
          console.log(statement)
        }
        




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
      if(message.origin === 'wss://web.stockpokeronline.com') {
        site = "StockPokerOnline"
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
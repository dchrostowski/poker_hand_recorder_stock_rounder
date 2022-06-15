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
  10: 'shows',
  16: "doesn't show hand",
  11: 'mucks hand'
}

const getSeatsFormatted = (seats) => {
  return seats.map((seat, idx) => {
    if (seat !== null) {
      return `Seat ${idx + 1}: ${seat['n']} (${seat['c']} chips)`
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

const supportedGameTypes = [72, 80, 79];
const supportedPotTypes = [70, 85, 80];

const handData = {}


var saveData = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
    var data_str = ''
    Object.keys(data).map((hid) => {
      const hdataMessages = data[hid].messages || []
      const tableId = data[hid].tableId

      if (typeof hdataMessages[0] !== 'undefined' && hdataMessages[0].indexOf('Hand #') !== -1 && typeof hdataMessages[1] !== 'undefined' && hdataMessages[1].indexOf(tableId) !== -1) {
        hdataMessages.forEach(m => data_str += m + "\r\n")
      }


    })
    var blob = new Blob([data_str], { type: "octet/stream" }),
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
    var evtobj = window.event ? event : e
    if (evtobj.keyCode == 49 && evtobj.ctrlKey) {
      saveData(handData, 'handData.txt')
    }
  }

  document.onkeydown = KeyPress;

}

exportData()

function seatsDealt(seats) {
  for(let i=0; i<seats.length; i++) {
    if(!seats[0]?.d) {
      return false;
    }
  }
  return true
}

function remainingPlayers(messageHandData) {
  const playersIn = messageHandData?.playerCount
  const foldCount = Object.keys(messageHandData.folds).length
  return playersIn - foldCount
}



function parseGameState(message, site) {

  if (message.t === 'GameState') {


    const { events, gameState } = message
    const { s, gi, gt, pt, ti, m, ...everythingElse } = gameState


    if (supportedGameTypes.indexOf(gt) === -1) {
      let errGameTypes = ''
      supportedGameTypes.forEach(sgt => errGameTypes += `${gameTypeMap[sgt]}\n`)
      console.error(`Unsupported game type.  Only works with the following game types:\n${errGameTypes}`)
      return
    }

    if (supportedPotTypes.indexOf(pt) === -1) {
      let errGameTypes = ''
      supportedPotTypes.forEach(sgt => errGameTypes += `${portTypeMap[sgt]}\n`)
      console.error(`Unsupported game type.  Only works with the following game types:\n${errGameTypes}`)
      return
    }


    const gameType = gameTypeMap[gt]
    const potType = potTypeMap[pt]
    const handId = gi
    const messageHandData = handData?.[handId] || { messages: [], winners: {}, folds: {} }
    const round = m.r
    console.log("round " + round)


    messageHandData['handId'] = handId
    messageHandData['tableId'] = ti


    const seats = s
    const pot = gameState.d?.p

    if(pot) {
      messageHandData['pot'] = pot
    }



    




    if (events.length > 0) {
      
      const communityCardsRaw = gameState.d?.c





      let communityCards = []
      if (communityCardsRaw) {
        communityCards = communityCardsRaw.split(';').map((c) => cardMap[c])
      }
      if (communityCards.length === 3 && !messageHandData?.flop) {
        messageHandData['flop'] = communityCards
        const statement = `*** FLOP *** [${communityCards.join(" ")}]`
        messageHandData.messages = messageHandData.messages.concat([statement])
        handData[handId] = messageHandData
        console.log(statement)
      }
      else if (communityCards.length === 4 && !messageHandData?.turn) {
        messageHandData['turn'] = communityCards
        const formattedFlop = `[${messageHandData.flop.join(" ")}]`
        const formattedTurnCard = `[${communityCards[3]}]`
        const statement = `*** TURN *** ${formattedFlop} ${formattedTurnCard}`
        messageHandData.messages = messageHandData.messages.concat([statement])
        handData[handId] = messageHandData
        console.log(statement)
      }
      else if (communityCards.length === 5 && !messageHandData?.river) {

        messageHandData['river'] = communityCards
        const formattedTurn = `[${messageHandData.turn.join(" ")}]`
        const formattedRiverCard = `[${communityCards[3]}]`
        const statement = `*** RIVER *** ${formattedTurn} ${formattedRiverCard}`
        messageHandData.messages = messageHandData.messages.concat([`*** RIVER *** ${formattedTurn} ${formattedRiverCard}`])
        handData[handId] = messageHandData
        console.log(statement)
      }

      events.forEach((event, eventIdx) => {



        const seatIndex = event['s'] || 0
        const actionIndex = event?.['a'] || null
        const eT = event?.['t'] || null
        const eventChips = event?.['f'] || null
        const seatIndexValid = seatIndex >= 0 ? true : false
        let statement = ''
        let statement2 = ''


        if (actionIndex && eT === 9) {

          const playerName = seats[seatIndex]?.n || 'Someone'
          let playerAction = actionMap[actionIndex] || 'did something'
          const chipAction = event?.f ? `${eventChips}` : ''


          if (actionIndex === 1) {
            messageHandData.folds[seatIndex] = round
            handData[handId] = messageHandData

          }

          if (actionIndex === 6) {
            messageHandData['small_blind'] = event?.f
            messageHandData['sbPlayer'] = playerName
          }

          if (playerAction === 'shows') {
            console.log("what did " + playerName + " have?")
            const formattedPlayerCards = seats[seatIndex].d.split(";").map(c => cardMap[c]).join(' ')
            playerAction += ` [${formattedPlayerCards}] (${seats[seatIndex].hcnu})`

          }


          if (actionIndex === 7) {
            messageHandData['big_blind'] = event?.f
            messageHandData['bbPlayer'] = playerName
          }

          if(playerAction !== 'did something') {
            statement = `${playerName} ${playerAction} ${chipAction}`
            messageHandData['messages'] = messageHandData['messages'].concat([statement])
            handData[handId] = messageHandData
          }

          


        }

        else if (eT === 7 && seatIndexValid && eventChips) {
          console.log(event)
          const handWinner = `${seats[seatIndex]?.n}` || 'Someone'
          const amountWon = eventChips
          statement = `${handWinner} collected ${amountWon} from pot`
          messageHandData.winners[seatIndex] = statement
          handData[handId] = messageHandData
        }
        else if(eT === 12 && event?.hcm === "UB") {
          const playerName = seats[seatIndex].n
          const uncalledBet = event?.f
          statement = `Uncalled bet (${uncalledBet}) returned to ${playerName}`
          messageHandData.messages = messageHandData.messages.concat([statement])
          handData[handId] = messageHandData

        }

        else if (eT === 15) {
          winners = messageHandData.winners
          Object.values(winners).forEach((message) => {
            messageHandData.messages = messageHandData.messages.concat([message])
            handData[handId] = messageHandData
          })


        }

        else if (eT === 6 && seatIndexValid) {

          const playerName = seats[seatIndex]?.n || 'Someone'
          statement = `It's [${seatIndex}] ${playerName}'s turn.`

        }

        else if (eT === 4 && seatIndexValid) {
          const playerName = seats[seatIndex]?.n || 'Someone'
          statement = 'New hand. ' + playerName + ' is the dealer'
          messageHandData['dealerIndex'] = seatIndex
          const seatNumber = seatIndex + 1
          const messages = [`Table '${ti}' 9-max (Real Money) Seat #${seatNumber} is the button`]
          const formattedSeats = getSeatsFormatted(seats)
          messageHandData['messages'] = messages.concat(formattedSeats)
          handData[handId] = messageHandData
        }

        if (eT === 32) {
          console.log("pot???")
          console.log(messageHandData.pot)
          console.log('------------')

          statement = "Hand is over\n==================================="
          const firstLine = `${site} Hand #${handId}: ${gameType} ${potType} (${messageHandData.small_blind}/${messageHandData.big_blind} - ${new Date().toISOString()} [${new Date().toISOString()}]`

          messageHandData['messages'] = [firstLine]
            .concat(messageHandData['messages'])
          
          //summaryMessages = getSummaryData
          console.log("DATA FILE WILL LOOK LIKE THIS:")
          handData[handId].messages.forEach((msg) => {
            console.log(msg)
          })
          console.log("END")
        }

        if (!statement) {
          console.log(event)
          console.log(statement2)
          console.log('---------------------')
        }
        else {
          console.log(event)
          console.log(statement)
          console.log('---------------------')
        }


        handData[handId] = messageHandData





      })
    }

    if(round === 5 && !messageHandData?.showDown && remainingPlayers(messageHandData) > 1) {
      messageHandData['showDown'] = true
      messageHandData.messages = messageHandData.messages.concat(['*** SHOW DOWN***'])
      handData[handId] = messageHandData
    }

    if(messageHandData?.big_blind && !messageHandData.hole && seatsDealt(seats)) {
      console.log("should be in here at some point")
      messageHandData['hole'] = true
      handData[handId] = messageHandData
      let knownCardsMessages = ["*** HOLE CARDS ***"]
      let playersIn = 0
      for(let i=0; i<seats.length; i++) {
        const seat = seats[i]
        if(seat !== null) {
          
          const rawCards = seat.d
          if(typeof rawCards !== undefined) {
            playersIn++

          }
          if(typeof rawCards !== 'undefined' && rawCards !== "-1;-1"){
            console.log("what are raw cards then?")
            console.log(rawCards)
            const cards = rawCards.split(';').map(c => cardMap[c])
            const formattedCards = '[' + cards.join(' ') + ']'
            const playerName = seat.n
            knownCardsMessages.push(`Dealt to ${playerName} ${formattedCards}`)

          }
        }
      }
      messageHandData['playerCount'] = playersIn
      console.log(playersIn + " PLAYERS IN")
      console.log("players remaining: " + remainingPlayers(messageHandData))
      messageHandData.messages = messageHandData.messages.concat(knownCardsMessages)
      handData[handId] = messageHandData

    }

    console.log("players remaining: " + remainingPlayers(messageHandData))


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
      if (event.origin === 'wss://web.stockpokeronline.com') {
        site = "StockPokerOnline"
      }
      else if (event.origin === 'wss://web.latpoker.com') {
        site = "RounderCasino"
      }
      parseGameState(JSON.parse(event.data), site)
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
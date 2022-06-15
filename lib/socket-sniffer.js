const cardMap = {
  '-1': "?",
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
  4: 'posts ante',
  6: 'posts small blind',
  7: 'posts big blind',
  10: 'shows',
  16: "doesn't show hand",
  11: 'mucks hand',
  25: 'posts straddle',
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

const getHandId = async (message) => message?.gameState?.gi
const getRound = async (message) => message?.gameState?.m?.r || 0

const convertCards = (cardString) => {
  return cardString.split(';').map(c => cardMap[c])
}

class PokerHand {
  constructor(message, site) {
    const { events, gameState } = message
    const { s, gi, gt, pt, ti, m, ...everythingElse } = gameState
    const { sb, bb, di } = m
    this.handId = gi
    this.gameType = gameTypeMap[gt]
    this.potType = potTypeMap[pt]
    this.site = site
    this.tableId = ti
    this.message = message
    this.update(message)
    this.eventMessages = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
    this.folds = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []}


    
  }

  updateSeats = async (seats) => {
    if(!seats || seats.length === 0) {
      return seats
    }
    const newSeats = seats.map((seat) => {
      if(seat === null) return seat
      let newSeat = seat
      if(newSeat?.d) {
        try{
          const cards = convertCards(newSeat.d)
          newSeat = {...newSeat, d:cards}
        }
        catch(err) {
          
        }
      }
      if(newSeat?.dc) {
        try {
          const cards = convertCards(seat.dc)
          newSeat = {...newSeat, dc:cards}
        }
        catch(err) {

        }
      }

      return newSeat
    })
    return newSeats
  }

  update = async (message) => {
    const { events, gameState } = message
    const { s, gi, gt, pt, ti, m, ...everythingElse } = gameState
    const { sb, bb, di } = m
    this.seats = await this.updateSeats(s)
    this.round = m?.r || 0
    this.dealer = di || 0
    this.smallBlind = sb || 0
    this.bigBlind = bb || 0
    this.message = message
  }

  updateHand = async (message) => {
    // console.log("UPDATE HAND")
    // console.log("ROUND BEFORE: " + this.round)
    // console.log("blinds/dealer before:")
    // console.log("dealer: " + `${this.seats[this.dealer]?.n} [${this.dealer}]`)
    // console.log("small blind: " + `${this.seats[this.smallBlind]?.n} [${this.smallBlind}]`)
    // console.log("big blind: " + `${this.seats[this.bigBlind]?.n} [${this.bigBlind}]`)
    if(message?.events) {
      await this.parseEvents(message?.events, message?.gameState?.s)
    }
    await this.update(message)

    // console.log("blinds/dealer after:")
    // console.log("dealer: " + `${this.seats[this.dealer]?.n} [${this.dealer}]`)
    // console.log("small blind: " + `${this.seats[this.smallBlind]?.n} [${this.smallBlind}]`)
    // console.log("big blind: " + `${this.seats[this.bigBlind]?.n} [${this.bigBlind}]`)
    // console.log("ROUND AFTER: " + this.round)
    // console.log("-----------------------------")

    


    return
  }

  parseEvents = async (events, seats) => {
    console.log(`---${this.handId} BEGIN PARSE EVENTS ${this.round}---`)
    for (let i = 0; i < events.length; i++) {
      const evt = events[i]
      console.log(JSON.stringify(evt))


      const seatIndex = evt['s'] || 0
      const actionIndex = evt?.['a'] || null
      let action = actionMap[actionIndex] || 'did something'
      const player = this.seats[seatIndex]?.n || 'someone'
      const eT = evt?.['t'] || null
      const eventChips = evt?.['f'] || ''
      seats = await this.updateSeats(seats)

      

      if(eT === 9 && actionIndex >= 0) {

        
        if (actionIndex === 1) {
          this.folds[this.round] = seatIndex
        }
        if (action === 'shows') {
          const cards = seats[seatIndex]?.d || seats[seatIndex]?.dc
          const formattedPlayerCards = cards.join(' ')
          const hcnu = this.seats[seatIndex].hcnu || ''
          const lcnu = this.seats[seatIndex].lcnu || ''
          action += ` [${formattedPlayerCards}] (${hcnu} ${lcnu})`


        }

        const statement = `${player} ${action} ${eventChips}`
        console.log(statement)
        // if(action === 'posts big blind') {
        //   this.eventMessages[0].push(statement)
        // }

        // else if(action === 'posts small blind') {
        //   if(!this.eventMessages[this.round].includes(statement)){
        //     this.eventMessages[this.round].push(statement)
        //   }

        // }
        // else {
          this.eventMessages[this.round].push(statement)
        // }
        
        
        
      }

      if(eT === 32) {
        console.log('END OF HAND, SEE MESSAGES')
        console.log(this.eventMessages)
      }
      
    }
    console.log(`---${this.handId} END PARSE EVENTS ${this.round}---`)
  }
}

const getPokerHand = async (message, site) => {
  const handId = await getHandId(message)
  const round = await getRound(message)
  let pokerHand
  if (round === 0 && !handData[handId]) {
    pokerHand = new PokerHand(message, site)
    handData[handId] = pokerHand

  }

  else if (handData[handId]) {
    pokerHand = handData[handId]
    pokerHand.updateHand(message)
    handData[handId] = pokerHand
  }

  else {
    console.log("-----------------------------")
    console.log("can't create/get poker hand")
    console.log("round is " + round)
    console.log("hand id is " + handId)
    console.log('------------------------------')
    return
  }

  return pokerHand

}



async function parseGameState(message, site) {

  if (message.t === 'GameState') {
    console.log("incoming socket message.")
    const pokerHand = await getPokerHand(message, site)
    if (pokerHand) {
      // console.log("-------HAND DETAILS------------")
      // console.log(pokerHand.site)
      // console.log(pokerHand.gameType)
      // console.log(pokerHand.potType)
      // console.log("dealer: " + `${pokerHand.seats[pokerHand.dealer]?.n} [${pokerHand.dealer}]`)
      // console.log("small blind: " + `${pokerHand.seats[pokerHand.smallBlind]?.n} [${pokerHand.smallBlind}]`)
      // console.log("big blind: " + `${pokerHand.seats[pokerHand.bigBlind]?.n} [${pokerHand.bigBlind}]`)
      // console.log("hand id: " + pokerHand.handId)
      // pokerHand.seats.forEach((seat,idx) => {
      //   if(seat !== null) {
      //     let player = seat?.n + " [" + idx + "] "
      //     if(idx === pokerHand.bigBlind) player += "(big blind)"
      //     if(idx === pokerHand.smallBlind) player += "(small blind)"
      //     if(idx === pokerHand.dealer) player += "(button)"
      //     console.log(player)
      //     console.log("\t" + seat?.c + " chips")
      //     console.log("\t cards: " + seat?.d)

      //   }
        
      // })
      // console.log(pokerHand.handId)
      // console.log("-------------------------------")

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
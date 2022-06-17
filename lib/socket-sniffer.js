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
  17: 'folds and shows'
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


const saveData = (function () {
  let a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
    let data_str = ''
    Object.keys(data).forEach((hid) => {
      if(data[hid].finalHandOutput.length > 0) {
        data[hid].finalHandOutput.forEach(line => data_str += `${line}\n`)
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

function addExportDataListener() {

  function KeyPress(e) {
    console.log(e.keyCode)
    
    var evtobj = window.event ? event : e
    if (evtobj.keyCode == 83 && evtobj.ctrlKey) {
      e.preventDefault()
      saveData(handData, 'handData.txt')
    }
  }

  document.onkeydown = KeyPress;

}

addExportDataListener()

const getHandId = async (message) => message?.gameState?.gi
const getRound = async (message) => message?.gameState?.m?.r || 0

const convertCards = (cardString) => {
  return cardString.split(';').map(c => cardMap[c])
}

const formatCards = (cardArray) => {
  if(cardArray.length === 0) {
    return '[ ]'
  }
  const cardString = cardArray.join(' ')
  return `[${cardString}]`
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
    this.eventMessages = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    this.board = []
    this.dealtMessages = []
    this.initialSeatInfoMessages = getSeatsFormatted(s)
    this.shows = {}
    this.wins = {}
    this.folds = {}
    this.finalHandOutput = []




  }

  setDealtMessages = async () => {
    this.seats.forEach(seat => {
      
      if(seat !== null && seat?.cards && !seat.cards.includes('?')) {
        //Dealt to FluffyStutt [2h Ks]
        const playerName = seat.n
        const formattedCards = formatCards(seat.cards)
        const statement = `Dealt to ${playerName} ${formattedCards}`
        this.dealtMessages.push(statement)
        console.log(statement)


      }
    })


  }



  handSummary = async () => {
//     Total pot 350 | Rake 18 
// Board [8h 7s 8d Th 2c]
// Seat 1: adevlupec (big blind) showed [Qs Ts] and won (332) with two pair, Tens and Eights
// Seat 2: Dette32 mucked [5s Kc]
// Seat 3: Drug08 (button) mucked [4d 6h]
// Seat 4: FluffyStutt (small blind) folded before Flop
    const line1 = '*** SUMMARY ***'
    const line2 = `Total pot ${this.pot} | Rake 0`
    const line3 = `Board ${formatCards(this.board)}`

    const roundMap = {
      0: 'before Flop',
      1: 'before Flop',
      2: 'on the Flop',
      3: 'on the Turn',
      4: 'on the River'
    }

    const summary = [line1,line2,line3]

    this.seats.forEach((seat, idx) => {
      if(seat !== null) {
        let playerName = `Seat ${idx+1}: ${seat.n}`
        if(idx === this.smallBlind) {
          playerName += ' (small blind)'
        }
        if(idx === this.bigBlind) {
          playerName += ' (big blind)'
        }
        if(idx === this.dealer) {
          playerName += ' (button)'
        }
        if(this.folds[idx]) {
          const when = roundMap[this.folds[idx]]
          const statement = `${playerName} folded ${when}`
          summary.push(statement)
        }

        if(this.shows[idx] && this.wins[idx]) {
          const statement = `${playerName} showed ${this.shows[idx].cards} and won ${this.wins[idx]} with ${this.shows[idx].descriptor}`
          summary.push(statement)
        }

        else if(this.shows[idx] && !this.wins[idx]) {
          const statement = `${playerName} showed ${this.shows[idx].cards} and lost with ${this.shows[idx].descriptor}`
          summary.push(statement)
        }

        else if(this.wins[idx]) {
          const statement = `${playerName} collected ${this.wins[idx]}`
          summary.push(statement)
        }

      }
      
    });

    return summary


  }

  finalizeHand = async () => {
    
    //const line1 = `${this.site} Hand #${this.handId}: ${this.gameType} ${this.potType} (${this.smallBlindAmount}/${this.bigBlindAmount}`
    const line2 = `Table '${this.tableId}' 9-max (Real Money) Seat #${this.dealer + 1} is the button`
    let finalHandOutput = [line2].concat(this.initialSeatInfoMessages).concat(this.eventMessages[0])
    finalHandOutput.push('*** HOLE CARDS ***')
    finalHandOutput = finalHandOutput
      .concat(this.dealtMessages)
      .concat(this.eventMessages[1])

    if(this.board.length >= 3) {
      const flopFormatted = formatCards(this.board.slice(0,3))
      finalHandOutput.push(`*** FLOP *** ${flopFormatted}`)
      finalHandOutput = finalHandOutput.concat(this.eventMessages[2])
    }

    

    if(this.board.length >= 4) {
      //*** TURN *** [8h 7s 8d] [Th]
      const flopFormatted = formatCards(this.board.slice(0,3))
      const turnCardFormatted = formatCards([this.board[3]])
      const turnFormatted = `${flopFormatted} ${turnCardFormatted}`
      finalHandOutput.push(`*** TURN *** ${turnFormatted}`)
      finalHandOutput = finalHandOutput.concat(this.eventMessages[3])
    }

    if(this.board.length === 5) {
      //*** River *** [8h 7s 8d Th] [As]
      const turnFormatted = formatCards(this.board.slice(0,4))
      const riverCardFormatted = formatCards([this.board[4]])
      const riverFormatted = `${turnFormatted} ${riverCardFormatted}`
      finalHandOutput.push(`*** RIVER *** ${riverFormatted}`)
      finalHandOutput = finalHandOutput.concat(this.eventMessages[4])
      
      
    }

    if(this.eventMessages[5].length > 2) {
      finalHandOutput.push('*** SHOWDOWN ***')
    }
    
    finalHandOutput = finalHandOutput.concat(this.eventMessages[5])
    const summary = await this.handSummary()
    finalHandOutput = finalHandOutput.concat(summary)
    



    console.log("FINAL HAND OUTPUT:")
    console.log('--------------------------------------')
    finalHandOutput.forEach(line => console.log(line))
    console.log('--------------------------------------')

    this.finalHandOutput = finalHandOutput

    



  }

  updateSeats = async (seats) => {
    if (!seats || seats.length === 0) {
      return seats
    }
    const newSeats = seats.map((seat) => {
      if (seat === null) return seat
      let newSeat = seat
      if (newSeat?.d) {
        try {
          const cards = convertCards(newSeat.d)
          newSeat = { ...newSeat, cards: cards }
        }
        catch (err) {

        }
      }
      if (newSeat?.dc) {
        try {
          const cards = convertCards(seat.dc)
          newSeat = { ...newSeat, cards: cards }
        }
        catch (err) {

        }
      }

      return newSeat
    })
    return newSeats
  }

  update = async (message) => {
    const { events, gameState } = message
    const { s, gi, gt, pt, ti, m, d, ...everythingElse } = gameState
    const { sb, bb, di } = m
    this.seats = await this.updateSeats(s)
    this.round = m?.r || 0
    this.dealer = di || 0
    this.smallBlind = sb || 0
    this.bigBlind = bb || 0
    this.message = message

    if(d && d?.c) {
      this.board = convertCards(d.c)
    }
  }

  updateHand = async (message) => {
    // console.log("UPDATE HAND")
    // console.log("ROUND BEFORE: " + this.round)
    // console.log("blinds/dealer before:")
    // console.log("dealer: " + `${this.seats[this.dealer]?.n} [${this.dealer}]`)
    // console.log("small blind: " + `${this.seats[this.smallBlind]?.n} [${this.smallBlind}]`)
    // console.log("big blind: " + `${this.seats[this.bigBlind]?.n} [${this.bigBlind}]`)
    this.seats = await this.updateSeats(message?.gameState?.s)
    if(this.round === 0) {
      await this.setDealtMessages()
    }
    if (message?.events) {
      await this.parseEvents(message?.events)
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

  parseEvents = async (events) => {
    console.log(`---${this.handId} BEGIN PARSE EVENTS ${this.round}---`)
    for (let i = 0; i < events.length; i++) {
      const evt = events[i]
      


      const seatIndex = evt['s'] || 0
      const actionIndex = evt?.['a'] || null
      let action = actionMap[actionIndex] || 'did something'
      const player = this.seats[seatIndex]?.n || 'someone'
      const eT = evt?.['t'] || null
      const eventChips = evt?.['f'] || ''




      if (eT === 9 && actionIndex >= 0) {

        if (action === 'did something') {
          console.log("DEBUG:")
          console.log(JSON.stringify(evt))

        }

        if (actionIndex === 1 || actionIndex === 17) {
          this.folds[seatIndex] = this.round
        }
        if (action === 'shows') {
          const cards = this.seats[seatIndex]?.cards
          const formattedPlayerCards = formatCards(cards)
          const hcnu = this.seats[seatIndex].hcnu || ''
          const lcnu = this.seats[seatIndex].lcnu || ''
          this.shows[seatIndex] = {cards: `${formattedPlayerCards}`, descriptor: `${hcnu} ${lcnu}`.trim()}
          action += ' ' +  `${formattedPlayerCards} (${hcnu} ${lcnu})`.trim()
        }

        if (action === 'folds and shows') {
          action = 'folds'
        }



        const statement = `${player} ${action} ${eventChips}`
        console.log(statement)
        this.eventMessages[this.round].push(statement)



      }

      else if (eT === 7 && evt?.hcm === "UB") {
        const statement = `Uncalled bet (${eventChips}) returned to ${player}`
        this.eventMessages[this.round].push(statement)
        console.log(statement)
        //console.log(JSON.stringify(evt))
      }

      else if (eT === 31) {
        const statement = `${player} collected ${eventChips} from pot`
        this.wins[seatIndex] = eventChips
        // Seat 1: adevlupec (big blind) showed [Qs Ts] and won (332) with two pair, Tens and Eights
        
        this.eventMessages[this.round].push(statement)
        console.log(statement)
        this.pot = eventChips
        //console.log(JSON.stringify(evt))


      }

      else if (eT === 32) {

        //console.log(JSON.stringify(evt))
        console.log('END OF HAND, SEE MESSAGES')
        await this.finalizeHand()
      }
      else {
        //console.log(JSON.stringify(evt))
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
    console.log("awaiting new hand")
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
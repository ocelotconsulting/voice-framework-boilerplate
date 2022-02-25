const estimatedRestoration = {
  homeOrOther:{
    confirm: [
      `Are you asking about your home or somewhere else?`,
      `Would you like to know the estimate for your home or another location?`
    ],
    misheard: [
      `I didn't get that. Home or somewhere else?`,
      `I didn't get that. Home or other?`,
      `All you have to say is Home or other?`,
      `You can say Home or other to look up estimates or go back to do something else?`,
    ]
  },
  otherLocation:{
    confirm: [
      `Please select a letter from the following. {{options}}`,
      `Which location are you trying to find out about? {{options}}`,
      `The following are ongoing outages at the moment. Say {{options}}`,
      `There are multiple locations that are experiencing outages at the moment, please select from the following options {{options}}`
    ],
    misheard: [
      `I didn't get that. Select from {{options}}?`,
      `I didn't get that. Please choose a letter?`,
      `I must be having a hard time hearing you. Just say {{options}}`,
      `Are you saying a letter? The options are {{options}}`,
    ]
  },
  address:{
    confirm: [
      `The address we have on file is {{address}}.  Is this the property you're inquiring about?`
    ],
    misheard: [
      `I didn't catch that. You can respond yes or no.  The address we have is {{address}}.  Is that right?`
    ],
    wrongAddress: [
      `Without the correct address, we won't be able provide an estimate for power restoration.  Please visit {{website}} or call customer service at <say-as interpret-as="telephone">{{phoneNumber}}</say-as> to link your account with your address and report the outage.`
    ],
  },
  resume: [
    'So... back to your power restoration estimate.'
  ],
  reply: {
    home: [
      `The estimated time for your power to be restored is {{estimate}}.`,
    ],
    other:[
      `The estimated time for power to be restored in {{selectedOutage}} is {{estimate}}.`,
      `We expect power to be restored for {{selectedOutage}} in around {{estimate}}.`,
      `Crews are hard at work restoring power to {{selectedOutage}}. The current estimate to get service up and running is {{estimate}}.`,
      `The estimated time for your power to be restored is {{estimate}}.`,
    ]
  }
}

module.exports = { estimatedRestoration }

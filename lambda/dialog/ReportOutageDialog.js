const reportOutage = {
  askForHouseNumber: {
    confirm:[
      `What is the house number for the house that you would like to report an outage at?`
    ],
    misheard: [
      `Please just say a number for the address you're trying to report an outage at.`
    ]
  },
  askForTelephoneNumber: {
    confirm:[
      `What is the telephone number for service at this address?`
    ],
    misheard: [
      `Please say the telephone number for this address as a ten digit number.`
    ]
  },
  tryAgain: {
    confirm: [
      `I'm sorry but house number {{houseNumber}} and phone number <say-as interpret-as="telephone">{{phoneNumber}}</say-as> don't match our records. Would you like to try saying the numbers again?`
    ],
    misheard: [
      `Was that a yes or a no.`,
      `I didn't catch that. You can respond yes or no.`,
      `I didn't catch that. Would you like to try saying the numbers again?`
    ]
  },
  reportAnOutage: {
    confirm: [
      `There are no reported outages in your area. Would you like to report an outage at your address?`
    ],
    misheard: [
      `Was that a yes or a no.`,
      `I didn't catch that. You can respond yes or no.`,
      `I didn't catch that. Would you like to report an outage at your address?`
    ]
  },
  letYouKnow: {
    confirm: [
      `Would you like a notification when the power is restored?`,
      `Would you like to be notified when the power is restored?`,
      `Would you like us to get in touch with you when the power is restored?`
    ],
    misheard: [
      `Was that a yes or a no.`,
      `I didn't catch that. You can respond yes or no.`,
      `I didn't catch that. Would you like us to notify you when the power is restored?`
    ]
  },
  letYouKnowWOutageReport: {
    confirm: [
      `There is currently an outage in your area affecting {{impact}} customers in {{areaDescription}}. {{workDescription}} Would you like a notification when the power is restored?`
    ],
    misheard: [
      `Was that a yes or a no.`,
      `I didn't catch that. You can respond yes or no.`,
      `I didn't catch that. Would you like us to notify you when the power is restored?`
    ]
  },
  reply: {
    withContact: [
      `Great!  We received your outage report, and we'll let you know when power is restored.  Thank you.`
    ],
    noContact: [
      `Great!  We received your outage report.  Thank you.`
    ],
    haveANiceDay: [
      `Thank you. Come back if there is a problem.`
    ]
  }
}

module.exports = { reportOutage }

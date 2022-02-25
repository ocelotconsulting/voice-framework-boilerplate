const reportOutage = {
  wrongAddress: [
    `Sorry, we can't report an outage for you because we don't have the right address for your account.  Please call <say-as interpret-as="telephone">{{phoneNumber}}</say-as> or visit {{website}} to report the outage`,
  ],
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
  reply: {
    withContact: [
      `Great!  We received your outage report, and we'll let you know when power is restored.  Thank you.`
    ],
    noContact: [
      `Great!  We received your outage report.  Thank you.`
    ]
  }
}

module.exports = { reportOutage }

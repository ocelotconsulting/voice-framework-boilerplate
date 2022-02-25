const confirmAddress = {
  confirm: [
    `The address we have on file is {{address}}.  Is this the property you're inquiring about?`
  ],
  misheard: [
    `I didn't catch that. You can respond yes or no.  The address we have is {{address}}.  Is that right?`
  ],
  wrongAddress: [
    `Without the correct address, we won't be able provide information about your bill.  Please visit {{website}} or call customer service at <say-as interpret-as="telephone">{{phoneNumber}}</say-as> to link your account with your address or hear about your bill.`
  ],
  resume: [
    `So where were we? Your address...`
  ],
}

module.exports = { confirmAddress }

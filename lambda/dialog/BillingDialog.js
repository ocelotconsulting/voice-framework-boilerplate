const billing = {
  returnBill: [
    `So far, your bill this month is {{billAmount}}.`,
  ],
  incorrectAddress: [
    `Without the correct address, we won't be able provide information about your bill.  Please visit {{website}} or call customer service at <say-as interpret-as="telephone">{{phoneNumber}}</say-as> to link your account with your address or hear about your bill.`
  ],
}

module.exports = { billing }

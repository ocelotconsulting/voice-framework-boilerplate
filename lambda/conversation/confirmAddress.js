const { conversationTemplates } = require('@ocelot-consulting/ocelot-voice-framework')
const { fakeAddress, fakePhoneNumber, fakeWebsite } = require('../constants')

const confirmAddress = conversationTemplates.yesNoQuestion({
  handleYes: () => ({
    confirmAddress: { correctAddress: true, confirmedAddress: true },
  }),
  handleNo: () => ({
    confirmAddress: { correctAddress: false, confirmedAddress: true },
  }),
  alreadyAnswered: ({ conversationAttributes }) => conversationAttributes.confirmAddress?.confirmedAddress,
  answer: ({ conversationAttributes }) => conversationAttributes.confirmAddress?.correctAddress,
  questionResponse: dialog => dialog(`confirmAddress.confirm`, { address: fakeAddress }),
  noResponse: dialog => dialog('confirmAddress.wrongAddress', { website: fakeWebsite, phoneNumber: fakePhoneNumber }),
  misheardResponse: dialog => dialog('confirmAddress.misheard', { address: 'your address here' }),
  resumeResponse: dialog => dialog('confirmAddress.resume'),
})

module.exports = { confirmAddress }

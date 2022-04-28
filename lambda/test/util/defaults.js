const defaultConversationAttributes = (confirmedAddress = false, correctAddress = false, wipeConversation = false) => ({
  confirmAddress: {
    confirmedAddress,
    correctAddress,
  },
  resume: {
    wipeConversation,
  },
})

const defaultSessionAttributes = () => ({
  conversationAttributes: defaultConversationAttributes(),
})

const emptyIntent = (name) => ({
  name: name,
  slots: {}
})

const defaultParams = () => ({
  conversationStack: [],
  currentSubConversation: {billing:{}},
  sessionAttributes: defaultSessionAttributes(),
  intent: {},
  topConversation: true,
  newConversation: false,
  poppedConversation: false,
  fallThrough: false,
})

const defaultNumberIntent = (value) => ({
  name:'ANumber',
  slots: {
    number: {
      value: value
    },
  },
})

const defaultPhoneNumberIntent = (value) => ({
  name:'APhoneNumber',
  slots: {
    phoneNumber: {
      value: value
    },
  },
})

const defaultYesNoIntent = (valueId = 'yes') => ({
  name:'YesNoIntent',
  slots: {
    yesNo: {
      resolutions: {
        resolutionsPerAuthority:[
          {
            values:[
              {
                value:{
                  id: valueId,
                },
              },
            ],
          },
        ],
      },
    },
  },
})

const defaultPickALetterIntent = (valueId = 'a') => ({
  name:'LetterIntent',
  slots: {
    letter: {
      resolutions: {
        resolutionsPerAuthority:[
          {
            values:[
              {
                value:{
                  id: valueId,
                },
              },
            ],
          },
        ],
      },
    },
  },
})



module.exports = {
  defaultConversationAttributes,
  defaultSessionAttributes,
  defaultParams,
  defaultNumberIntent,
  defaultPhoneNumberIntent,
  defaultYesNoIntent,
  defaultPickALetterIntent,
  emptyIntent
}

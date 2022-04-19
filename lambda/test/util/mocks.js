const mock_ = require('lodash')
const { initialize } = require('@ocelot-consulting/ocelot-voice-framework')
const conversationSet = require('../../conversation')
const dialog = require('../../dialog')

let mockRequestAttributesKeys = {}
let mockSessionAttributes = {}
let mockSlots = {}

const setRequestAttributes = newKeys => {
  mockRequestAttributesKeys = mock_.merge(mockRequestAttributesKeys, newKeys)
}

const setSlots = newSlots => {
  mockSlots = mock_.merge(mockSlots, newSlots)
}

const handlerInput = {
  attributesManager: {
    getRequestAttributes: () => ({
      t: key => {
        if (!mockRequestAttributesKeys[key]) console.log(`getRequestAttributes called with missing key: ${key}`);
        return mockRequestAttributesKeys[key];
      }
    }),
    setRequestAttributes,
    getSessionAttributes: () => mockSessionAttributes,
    setSessionAttributes: newSession => {
      mockSessionAttributes = newSession
    },
  },
  responseBuilder: {
    speak: jest.fn().mockReturnThis(),
    withShouldEndSession: jest.fn().mockReturnThis(),
    getResponse: jest.fn().mockReturnThis(),
    addElicitSlotDirective: jest.fn().mockReturnThis(),
    addConfirmSlotDirective: jest.fn().mockReturnThis(),
    reprompt: jest.fn().mockReturnThis(),
    addDelegateDirective: jest.fn().mockReturnThis(),
    withSimpleCard: jest.fn().mockReturnThis(),
  },
  requestEnvelope: {
    request: {
      intent: {
        name: 'GenericIntentName',
        slots: mockSlots,
      },
      type: 'GenericRequestType',
    },
    session: {
      user: {
        userId: 'fakeUserId'
      },
    },
  },
}

const mockGetSession = jest.fn(() => handlerInput.attributesManager.getSessionAttributes())
const mockSaveSession = jest.fn(sessionAttributes => handlerInput.attributesManager.setSessionAttributes(sessionAttributes))

const getMockState = () => mockGetSession().state.currentSubConversation[Object.keys(mockGetSession().state.currentSubConversation)[0]]

const { StateHandler } = initialize({
  conversationSet,
  dialog,
  fetchSession: mockGetSession,
  saveSession: mockSaveSession,
})

module.exports = {
  run: async input => StateHandler.handle(input),
  mockGetSession,
  mockSaveSession,
  getMockState,
  handlerInput,
  setSlots,
}

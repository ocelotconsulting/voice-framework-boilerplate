const {
  run,
  mockGetSession,
  mockSaveSession,
  getMockState,
  getResponse,
  handlerInput,
  setSlots,
} = require('../util/mocks')
const {
  defaultConversationAttributes,
  defaultSessionAttributes,
  defaultYesNoIntent,
} = require('../util/defaults')
const fetchBill = require('../../service/fetchBill')

describe('Billing Conversation Tests', () => {
  beforeEach(async () => {
    handlerInput.attributesManager.setRequestAttributes({
      'home.welcome': 'home.welcome',
      'home.engage': 'home.engage',
      'confirmAddress.confirm': 'confirmAddress.confirm',
      'confirmAddress.misheard': 'confirmAddress.misheard',
      'billing.returnBill': 'billing.returnBill',
      'billing.incorrectAddress': 'billing.incorrectAddress',
      'estimatedRestoration.homeOrOther.confirm': 'estimatedRestoration.homeOrOther.confirm',
      'estimatedRestoration.homeOrOther.misheard': 'estimatedRestoration.homeOrOther.misheard',
      'confirmAddress.resume': 'confirmAddress.resume',
      'estimatedRestoration.reply.home': 'estimatedRestoration.reply.home',
      'home.reEngage': 'home.reEngage',
      'home.promptResume': 'home.promptResume',
    })
    handlerInput.requestEnvelope.request.type = 'LaunchRequest'
    await run(handlerInput)
    handlerInput.requestEnvelope.request.intent.name = 'Billing'
    handlerInput.responseBuilder.speak.mockClear()
    handlerInput.responseBuilder.reprompt.mockClear()
    handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
    handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
    handlerInput.responseBuilder.withShouldEndSession.mockClear()
    handlerInput.responseBuilder.getResponse.mockClear()
    handlerInput.requestEnvelope.request.type = 'IntentRequest'
    mockGetSession.mockClear()
    mockSaveSession.mockClear()
    jest.spyOn(fetchBill, 'generateRandomBillAmount').mockImplementation(() => '$100.00')
    jest.spyOn(fetchBill, 'fetchBill').mockImplementation(async () => Promise.resolve({ billAmount: '$100.00' }))
  })

  describe('routing logic', () => {
    it('Sends machine to confirmAddress (yesNoQuestion) when new', async () => {
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('yesNoQuestion')
      expect(getMockState().machineContext.alreadyAnswered(handlerInput.attributesManager.getSessionAttributes())).toBeFalsy();
      expect(getResponse()[0][0]).toEqual('confirmAddress.confirm')
    })

    it('Returns the user\'s bill when correctAddress: true', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            billing: {
              machineState: 'correctAddress',
              machineContext: {
                conversationAttributes: {
                  confirmAddress: {
                    confirmedAddress: true,
                    correctAddress: true,
                  },
                },
              },
            },
          },
          conversationStack: [],
        },
        conversationAttributes: {
          confirmAddress: {
            confirmedAddress: true,
            correctAddress: true,
          },
        },
      })

      await run(handlerInput)


      expect(getMockState().machineState).toEqual('returnBill')
      expect(getResponse()[0][0]).toEqual('billing.returnBill')
    })

    it('Sends user to incorrectAddress when correctAddress: false', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            billing: {
              machineState: 'incorrectAddress',
              machineContext: {
                conversationAttributes: {
                  confirmAddress: {
                    confirmedAddress: true,
                    correctAddress: false,
                    resuming: true
                  },
                },
              },
            },
          },
          conversationStack: [],
        },
        conversationAttributes: {
          confirmAddress: {
            confirmedAddress: true,
            correctAddress: false,
            resuming: true,
          },
        },
      })

      await run(handlerInput)


      expect(getMockState().machineState).toEqual('incorrectAddress')
      expect(getResponse()[0][0]).toEqual('billing.incorrectAddress')
    })
  })

  describe('systemic test', () => {
    it('walks through triggering uniqueness', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...defaultSessionAttributes(),
        conversationAttributes:{
          ...defaultConversationAttributes(false, false),
        },
        state: {
          currentSubConversation: {
            billing: {}
          },
          conversationStack: [],
        },
      })

      await run(handlerInput)

      expect(getResponse().length).toEqual(1)
      expect(getResponse()[0][0]).toEqual('confirmAddress.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      // handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      // await run(handlerInput)

      // expect(getResponse().length).toEqual(1)
      // expect(getResponse[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm');
      // handlerInput.responseBuilder.speak.mockClear();

      // handlerInput.requestEnvelope.request.intent.name = 'Billing'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.misheard');
      handlerInput.responseBuilder.speak.mockClear();

      // handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      // await run(handlerInput)

      // expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      // expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.misheard');
      // handlerInput.responseBuilder.speak.mockClear();

      // handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'
      // await run(handlerInput)

      // expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      // expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.confirm');
      // handlerInput.responseBuilder.speak.mockClear();

      // handlerInput.requestEnvelope.request.intent.name = 'Billing'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.misheard');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('billing.returnBill');
      handlerInput.responseBuilder.speak.mockClear();

      //should be in home or other

      const { state } = handlerInput.attributesManager.getSessionAttributes()

      expect(state.conversationStack).toEqual([])
      expect(state.currentSubConversation).toEqual({
        billing: {
          machineState: 'returnBill',
          machineContext: {
            billAmount: '$324.91',
            website: 'company.com',
            phoneNumber: '314-333-3333',
            previousMachineState: 'confirmAddress',
            resuming: true,
            conversationAttributes: {
              confirmAddress: { correctAddress: true, confirmedAddress: true },
              resume: { wipeConversation: false }
            },
            error: '',
            misunderstandingCount: 0
          }
        }
      })
    });
  });
})

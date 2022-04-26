const {
  run,
  mockGetSession,
  mockSaveSession,
  getMockState,
  getResponse,
  handlerInput,
  setSlots,
} = require('../util/mocks')

describe('Report Outage Conversation Tests', () => {
  beforeEach(async () => {
    handlerInput.attributesManager.setRequestAttributes({
      'home.welcome': 'home.welcome',
      'home.engage': 'home.engage',
      'home.promptResume': 'home.promptResume',
      'home.error': 'home.error',
      'confirmAddress.confirm': 'confirmAddress.confirm',
      'confirmAddress.misheard': 'confirmAddress.misheard',
      'reportOutage.wrongAddress': 'reportOutage.wrongAddress',
      'reportOutage.reply.noContact': 'reportOutage.reply.noContact',
    })
    handlerInput.requestEnvelope.request.type = 'LaunchRequest'
    await run(handlerInput)
    handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
    handlerInput.responseBuilder.speak.mockClear()
    handlerInput.responseBuilder.reprompt.mockClear()
    handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
    handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
    handlerInput.responseBuilder.withShouldEndSession.mockClear()
    handlerInput.responseBuilder.getResponse.mockClear()
    handlerInput.requestEnvelope.request.type = 'IntentRequest'
    mockGetSession.mockClear()
    mockSaveSession.mockClear()
  })

  describe('routing tests', () => {
    it('Sends machine to confirmAddress when new', async () => {
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('yesNoQuestion')
      expect(getResponse()[0][0]).toEqual('confirmAddress.confirm')
    })


    it('when address is incorrect, tells the user they must correct their address online or by phone to report outage (badAddress)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            reportOutage: {
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
      expect(getResponse()[0][0]).toEqual('reportOutage.wrongAddress')
    });

    it('when address is correct, tells the user thanks for reporting(thanksForReporting)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            reportOutage: {
              machineState: 'thanksForReporting',
              machineContext: {
                conversationAttributes: {
                  confirmAddress: {
                    confirmedAddress: true,
                    correctAddress: true,
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
            correctAddress: true,
            resuming: true,
          },
        },
      })

      await run(handlerInput)

      expect(getMockState().machineState).toEqual('thanksForReporting')
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.noContact')
    });

    it('gives the generic error response on errors (error)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            reportOutage: {
              machineState: 'error',
              machineContext: { error: 'fake error' },
            },
          },
          conversationStack: [],
        }
      })

      await run(handlerInput)

      expect(getMockState().machineState).toEqual('error')
      expect(getResponse()[0][0]).toEqual('home.error');
    });
  })
});

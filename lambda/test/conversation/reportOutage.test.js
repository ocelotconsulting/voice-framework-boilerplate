const {
  run,
  mockGetSession,
  mockSaveSession,
  getMockState,
  getResponse,
  handlerInput,
  setSlots,
} = require('../util/mocks')

const { defaultNumberIntent, defaultPhoneNumberIntent, defaultYesNoIntent } = require('../util/defaults');

describe('Report Outage Conversation Tests', () => {
  beforeAll(async () => {
    handlerInput.attributesManager.setRequestAttributes({
      'home.welcome': 'home.welcome',
      'home.engage': 'home.engage',
      'home.promptResume': 'home.promptResume',
      'home.error': 'home.error',
      'confirmAddress.confirm': 'confirmAddress.confirm',
      'confirmAddress.misheard': 'confirmAddress.misheard',
      'reportOutage.wrongAddress': 'reportOutage.wrongAddress',
      'reportOutage.reply.noContact': 'reportOutage.reply.noContact',
      'reportOutage.askForHouseNumber.confirm': 'reportOutage.askForHouseNumber.confirm',
      'reportOutage.askForHouseNumber.misheard': 'reportOutage.askForHouseNumber.misheard',
      'reportOutage.askForTelephoneNumber.confirm': 'reportOutage.askForTelephoneNumber.confirm',
      'reportOutage.askForTelephoneNumber.misheard': 'reportOutage.askForTelephoneNumber.misheard',
    })
    handlerInput.requestEnvelope.request.type = 'LaunchRequest'
    await run(handlerInput)
    handlerInput.requestEnvelope.request.type = 'IntentRequest'
  })

  beforeEach(async () => {
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
    it('Sends machine to askForHouseNumber when new', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('askForHouseNumber')
      expect(getResponse()[0][0]).toEqual('reportOutage.askForHouseNumber.confirm')
    })

    it('Sends machine to misheard when not a number', async () => {

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);

      await run(handlerInput)
      
      expect(getMockState().machineState).toEqual('askForHouseNumber')
      expect(getResponse()[0][0]).toEqual('reportOutage.askForHouseNumber.misheard')
    })

    it('Sends machine to saying house number sends them to ask for phone', async () => {

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      setSlots(defaultNumberIntent(1234).slots);

      await run(handlerInput)

      expect(getMockState().machineState).toEqual('askForTelephoneNumber')
      expect(getResponse()[0][0]).toEqual('reportOutage.askForTelephoneNumber.confirm')
    })

    it('Sends machine to misheard when not a telephone number', async () => {

      await run(handlerInput)
      
      expect(getMockState().machineState).toEqual('askForTelephoneNumber')
      expect(getResponse()[0][0]).toEqual('reportOutage.askForTelephoneNumber.misheard')
    })

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

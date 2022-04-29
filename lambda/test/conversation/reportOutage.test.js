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

const clearResponseMocks = () => {
  handlerInput.responseBuilder.speak.mockClear()
  handlerInput.responseBuilder.reprompt.mockClear()
  handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
  handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
  handlerInput.responseBuilder.withShouldEndSession.mockClear()
  handlerInput.responseBuilder.getResponse.mockClear()
}

describe('Report Outage Conversation Tests', () => {
  beforeAll(async () => {
    handlerInput.attributesManager.setRequestAttributes({
      'home.engage': 'home.engage',
      'home.welcome': 'home.welcome',
      'home.reEngage': 'home.reEngage',
      'home.error': 'home.error',
      'reportOutage.reply.withContact': 'reportOutage.reply.withContact',
      'reportOutage.reply.noContact': 'reportOutage.reply.noContact',
      'reportOutage.askForHouseNumber.confirm': 'reportOutage.askForHouseNumber.confirm',
      'reportOutage.askForHouseNumber.misheard': 'reportOutage.askForHouseNumber.misheard',
      'reportOutage.askForTelephoneNumber.confirm': 'reportOutage.askForTelephoneNumber.confirm',
      'reportOutage.askForTelephoneNumber.misheard': 'reportOutage.askForTelephoneNumber.misheard',
      'reportOutage.letYouKnowWOutageReport.confirm': 'reportOutage.letYouKnowWOutageReport.confirm',
      'reportOutage.letYouKnowWOutageReport.misheard': 'reportOutage.letYouKnowWOutageReport.misheard',
      'reportOutage.tryAgain.confirm': 'reportOutage.tryAgain.confirm',
      'reportOutage.tryAgain.misheard': 'reportOutage.tryAgain.misheard',
      'reportOutage.reportAnOutage.confirm': 'reportOutage.reportAnOutage.confirm',
      'reportOutage.reportAnOutage.misheard': 'reportOutage.reportAnOutage.misheard',
      'reportOutage.reply.haveANiceDay': 'reportOutage.reply.haveANiceDay',
      'reportOutage.letYouKnow.confirm': 'reportOutage.letYouKnow.confirm',
      'reportOutage.letYouKnow.misheard': 'reportOutage.letYouKnow.misheard'
    })
    handlerInput.requestEnvelope.request.type = 'LaunchRequest'
    await run(handlerInput)
    handlerInput.requestEnvelope.request.type = 'IntentRequest'
  })

  beforeEach(async () => {
    clearResponseMocks()
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
      //1233 % 3 = 0 => No outage in your area
      //1234 % 3 = 1 => There is an outage
      //1235 % 3 = 2 => Not matching number
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

    it('Sends machine to calling API when getting phone number', async () => {

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);

      await run(handlerInput)

      expect(getMockState().machineState).toEqual('letYouKnowWOutageReport')
      expect(getResponse()[0][0]).toEqual('reportOutage.letYouKnowWOutageReport.confirm')
    })

    it('Sends machine to calling API when getting phone number', async () => {

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      setSlots(defaultNumberIntent('10').slots);

      await run(handlerInput)

      expect(getMockState().machineState).toEqual('letYouKnowWOutageReport')
      expect(getResponse()[0][0]).toEqual('reportOutage.letYouKnowWOutageReport.misheard')
    })

    it('Thank them with contact', async () => {

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      //console.log(`before ${JSON.stringify(handlerInput.attributesManager.getSessionAttributes().state, null, 2)}`)
      await run(handlerInput)
      //console.log(`after ${JSON.stringify(handlerInput.attributesManager.getSessionAttributes().state, null, 2)}`)

      expect(getMockState().machineState).toEqual('resume') //we should be at home now
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.withContact home.reEngage')
    })

    it('test mismatching numbers path', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1235 % 3 = 2 => Not matching number
      setSlots(defaultNumberIntent(1235).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('tryAgain')
      expect(getResponse()[0][0]).toEqual('reportOutage.tryAgain.confirm')

      clearResponseMocks()
      await run(handlerInput) //Wrong intent

      expect(getMockState().machineState).toEqual('tryAgain')
      expect(getResponse()[0][0]).toEqual('reportOutage.tryAgain.misheard')

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);

      clearResponseMocks()
      await run(handlerInput) //Try again

      expect(getMockState().machineState).toEqual('askForHouseNumber')
      expect(getResponse()[0][0]).toEqual('reportOutage.askForHouseNumber.confirm')

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1235 % 3 = 2 => Not matching number
      setSlots(defaultNumberIntent(1235).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('no').slots);

      clearResponseMocks()
      await run(handlerInput) //Done

      expect(getMockState().machineState).toEqual('resume') //we should be at home now
      expect(getResponse()[0][0]).toEqual('home.reEngage')

    })

    it('test the no side of the let you know for an outage', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1234 % 3 = 1 => There is an outage
      setSlots(defaultNumberIntent(1234).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('no').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('resume')
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.noContact home.reEngage')

    })

    it('test the no side of would you like to report an outage', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1233 % 3 = 1 => There is not an outage
      setSlots(defaultNumberIntent(1233).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('reportAnOutage')
      expect(getResponse()[0][0]).toEqual('reportOutage.reportAnOutage.confirm')

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('no').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('resume')
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.haveANiceDay home.reEngage')

    })

    it('test the yes side of would you like to report an outage with contact', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1233 % 3 = 1 => There is not an outage
      setSlots(defaultNumberIntent(1233).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('reportAnOutage')
      expect(getResponse()[0][0]).toEqual('reportOutage.reportAnOutage.confirm')

      clearResponseMocks()
      await run(handlerInput) //wrong intent

      expect(getMockState().machineState).toEqual('reportAnOutage')
      expect(getResponse()[0][0]).toEqual('reportOutage.reportAnOutage.misheard')

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('letYouKnow')
      expect(getResponse()[0][0]).toEqual('reportOutage.letYouKnow.confirm')

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      clearResponseMocks()
      await run(handlerInput) //wrong intent

      expect(getMockState().machineState).toEqual('letYouKnow')
      expect(getResponse()[0][0]).toEqual('reportOutage.letYouKnow.misheard')

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('resume')
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.withContact home.reEngage')

    })

    it('test the yes side of would you like to report an outage with no contact', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'ReportOutage'
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'ANumber'
      //1233 % 3 = 1 => There is not an outage
      setSlots(defaultNumberIntent(1233).slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'APhoneNumber'
      setSlots(defaultPhoneNumberIntent('3143225555').slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      await run(handlerInput)

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('no').slots);
      clearResponseMocks()
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('resume')
      expect(getResponse()[0][0]).toEqual('reportOutage.reply.noContact home.reEngage')

    })

    

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

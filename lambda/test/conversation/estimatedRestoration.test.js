const { defaultSessionAttributes, defaultConversationAttributes, defaultYesNoIntent, defaultPickALetterIntent } = require('../util/defaults');
const {
  run,
  mockGetSession,
  mockSaveSession,
  getMockState,
  handlerInput,
  setSlots,
} = require('../util/mocks')

const fakePhoneNumber = '111-111-1111'
const fakeWebsite = 'google.com'

const defaultEstimatedRestorationMachineContext = () => ({
  selectedHome: false,
  selectedOutage: '',
  estimate: '',
  misunderstandingCount: 0,
  error: '',
  previousMachineState: 'fresh',
  resuming: false,
  conversationAttributes: defaultConversationAttributes(),
  address: "11477 Olde Cabin Rd Suite 320"
})

const dialog = jest.fn()

describe('Estimated Restoration Conversation Tests', () => {
  beforeEach(async () => {
    dialog.mockRestore();
    handlerInput.requestEnvelope.request.type = 'LaunchRequest';
    handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
    handlerInput.responseBuilder.speak.mockClear()
    handlerInput.responseBuilder.reprompt.mockClear()
    handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
    handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
    handlerInput.responseBuilder.withShouldEndSession.mockClear()
    handlerInput.responseBuilder.getResponse.mockClear()
    await run(handlerInput)
    handlerInput.requestEnvelope.request.type = 'IntentRequest';
    mockGetSession.mockClear()
    mockSaveSession.mockClear()
  });

  describe('routing logic', () => {
    it('Sends machine to askAboutAddress when new', async () => {
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('askAboutHomeOrOther')
      expect(getMockState().machineContext.address).toEqual('123 Company Dr')
    })

    it('Sends machine from askAboutHomeOrOther to pickFromListQuestion when user triggers OtherIntent', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'OtherIntent'
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('pickFromListQuestion')
    })
  });

  describe('actual response', () => {
    it('when address is incorrect, tells the user they must correct their address online or by phone to get a restoration estimate (badAddress)', async () => {
      const params = {
        dialog,
        subConversation: {
          estimatedRestoration: {
            machineState: 'incorrectAddress',
            machineContext: {},
          },
        },
        sessionAttributes: {
          previousPoppedConversation:''
        }
      };

      await run(handlerInput);

      expect(dialog.mock.calls[0][0]).toEqual('estimatedRestoration.address.wrongAddress');
      expect(dialog.mock.calls[0][1]).toEqual({ website: fakeWebsite, phoneNumber: fakePhoneNumber });
    });

    it('when address is correct, gives the user their estimated restoration time (reportEstimateToUser)', async () => {
      const params = {
        dialog,
        subConversation: {
          estimatedRestoration: {
            machineState: 'reportEstimateToUser',
            machineContext: { estimate: '6 hours' },
          },
        },
        sessionAttributes: {
          previousPoppedConversation:''
        }
      };

      await run(params);

      expect(dialog.mock.calls[0][0]).toEqual('estimatedRestoration.reply.other');
      expect(dialog.mock.calls[0][1]).toEqual({ estimate: '6 hours' });
    });

    it('gives the generic error response on errors (error)', async () => {
      const params = {
        dialog,
        subConversation: {
          estimatedRestoration: {
            machineState: 'error',
            machineContext: { error: 'fake error' },
          },
        },
        sessionAttributes: {
          previousPoppedConversation:''
        }
      };

      await run(params);

      expect(dialog.mock.calls[0][0]).toEqual('home.error');
    });
  });

  describe('systemic test', () => {
    it('sends the machine to correctAddress after confirming address when user is asking about their home', async () => {
      const requestAttributes = {
        'estimatedRestoration.reply.other': 'estimatedRestoration.reply.other'
      }
      handlerInput.attributesManager.setRequestAttributes(requestAttributes)

      handlerInput.attributesManager.setRequestAttributes(requestAttributes)
      handlerInput.attributesManager.setSessionAttributes({
        ...defaultSessionAttributes,
        conversationAttributes: defaultConversationAttributes(true, true),
        state: {
          currentSubConversation: {
            confirmAddress: {
              machineState: 'yesAnswer',
              machineContext: {
                address: "11477 Olde Cabin Rd Suite 320",
                misunderstandingCount: 0,
                previousMachineState: "confirmAddress",
                resuming: false,
                conversationAttributes: {
                  correctAddress: true,
                  confirmedAddress: true
                }
              }
            }
          },
          conversationStack: [{
            estimatedRestoration: {
              machineState: "confirmAddress",
              machineContext: defaultEstimatedRestorationMachineContext(),
            }
          }],
        }
      })

      const slots1 = {}
      setSlots(slots1)

      handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'

      await run(handlerInput)

      const { state } = handlerInput.attributesManager.getSessionAttributes()

      expect(state.currentSubConversation).toEqual({
        estimatedRestoration: {
          machineState: 'reportEstimateToUser',
          machineContext: {
            ...defaultEstimatedRestorationMachineContext(),
            estimate: '3 hours',
            resuming: true,
            previousMachineState: 'confirmAddress',
            conversationAttributes: {
              confirmAddress: {
                correctAddress: true,
                confirmedAddress: true,
              },
              resume: {
                wipeConversation: false,
              },
            },
          },
        },
      })
      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
    });

    it('sends the machine to incorrectAddress after confirming address when user is asking about their home', async () => {
      const requestAttributes = {
        'estimatedRestoration.address.wrongAddress': 'estimatedRestoration.address.wrongAddress'
      }
      handlerInput.attributesManager.setRequestAttributes(requestAttributes)

      handlerInput.attributesManager.setRequestAttributes(requestAttributes)
      handlerInput.attributesManager.setSessionAttributes({
        ...defaultSessionAttributes,
        conversationAttributes:defaultConversationAttributes(true, false),
        state: {
          currentSubConversation: {
            confirmAddress: {
              machineState: 'noAnswer',
              machineContext: {
                address: "11477 Olde Cabin Rd Suite 320",
                misunderstandingCount: 0,
                previousMachineState: "confirmAddress",
                resuming: false,
                conversationAttributes: {
                  correctAddress: false,
                  confirmedAddress: true
                }
              }
            }
          },
          conversationStack: [
            {
              estimatedRestoration: {
                machineState: "confirmAddress",
                machineContext: {
                  ...defaultEstimatedRestorationMachineContext()
                }
              }
            }
          ],
        }
      })

      const slots1 = {}
      setSlots(slots1)

      handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'

      await run(handlerInput)

      const { state } = handlerInput.attributesManager.getSessionAttributes()

      expect(state.currentSubConversation).toEqual({
        estimatedRestoration: {
          machineState: 'incorrectAddress',
          machineContext: {
            ...defaultEstimatedRestorationMachineContext(),
            resuming: true,
            previousMachineState: 'confirmAddress',
            conversationAttributes: defaultConversationAttributes(true),
          }
        }
      })
      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
    });

    it('walks through the expected path of estimatedRestoration', async () => {
      const requestAttributes = {
        'estimatedRestoration.reply.other': 'estimatedRestoration.reply.other',
        'estimatedRestoration.address.wrongAddress': 'estimatedRestoration.address.wrongAddress',
        'estimatedRestoration.homeOrOther.confirm': 'estimatedRestoration.homeOrOther.confirm',
        'confirmAddress.confirm': 'confirmAddress.confirm',
        'estimatedRestoration.reply.home': 'estimatedRestoration.reply.home',
        'home.reEngage': 'home.reEngage',
        'estimatedRestoration.otherLocation.confirm': 'estimatedRestoration.otherLocation.confirm'
      }
      handlerInput.attributesManager.setRequestAttributes(requestAttributes)
      handlerInput.attributesManager.setSessionAttributes({
        ...defaultSessionAttributes,
        conversationAttributes:{
          ...defaultConversationAttributes(false, false),
        },
        state: {
          currentSubConversation: {
            engagement: {}
          },
          conversationStack: [
          ],
        }
      })

      const slots = {}
      setSlots(slots)

      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.reply.home home.reEngage');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      setSlots(slots)
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.reply.home home.reEngage');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'OtherIntent'
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.otherLocation.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'PickALetterIntent'
      setSlots(defaultPickALetterIntent().slots)
      await run(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.reply.other home.reEngage');
      handlerInput.responseBuilder.speak.mockClear();

      const { state } = handlerInput.attributesManager.getSessionAttributes()

      expect(state.currentSubConversation).toEqual({
        engagement: {
          machineState: 'resume',
          machineContext: {
            resuming: true,
            previousMachineState: "estimatedRestoration",
            conversationAttributes: {
              confirmAddress: {
                correctAddress: true,
                confirmedAddress: true,
              },
              resume: {
                wipeConversation: false,
              }
            },
          },
        },
      })
    });
  });
});


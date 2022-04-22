const { defaultSessionAttributes, defaultConversationAttributes, defaultYesNoIntent, defaultPickALetterIntent } = require('../util/defaults');
const {
  run,
  mockGetSession,
  mockSaveSession,
  getMockState,
  getResponse,
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

describe('Estimated Restoration Conversation Tests', () => {
  beforeEach(async () => {
    handlerInput.requestEnvelope.request.type = 'LaunchRequest';
    await run(handlerInput)
    handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
    handlerInput.responseBuilder.speak.mockClear()
    handlerInput.responseBuilder.reprompt.mockClear()
    handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
    handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
    handlerInput.responseBuilder.withShouldEndSession.mockClear()
    handlerInput.responseBuilder.getResponse.mockClear()
    handlerInput.requestEnvelope.request.type = 'IntentRequest';
    mockGetSession.mockClear()
    mockSaveSession.mockClear()
    handlerInput.attributesManager.setRequestAttributes({
      'estimatedRestoration.address.wrongAddress': 'estimatedRestoration.address.wrongAddress',
      'estimatedRestoration.homeOrOther.confirm': 'estimatedRestoration.homeOrOther.confirm',
      'estimatedRestoration.homeOrOther.misheard': 'estimatedRestoration.homeOrOther.misheard',
      'estimatedRestoration.otherLocation.confirm': 'estimatedRestoration.otherLocation.confirm',
      'estimatedRestoration.reply.other': 'estimatedRestoration.reply.other',
      'home.error': 'home.error',
      'confirmAddress.confirm': 'confirmAddress.confirm',
      'confirmAddress.wrongAddress': 'confirmAddress.wrongAddress',
      'estimatedRestoration.reply.home': 'estimatedRestoration.reply.home',
      'home.reEngage': 'home.reEngage',
      'estimatedRestoration.goBack': 'estimatedRestoration.goBack',
      'resume.fresh': 'resume.fresh',
      'home.welcome': 'home.welcome',
      'home.promptResume': 'home.promptResume',
      'home.misheardResume': 'home.misheardResume',
      'estimatedRestoration.homeOrOther.confirm': 'estimatedRestoration.homeOrOther.confirm',
      'estimatedRestoration.resume': 'estimatedRestoration.resume',
    })
  });

  describe('routing logic', () => {
    it('Sends machine to askAboutAddress when new', async () => {
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('askAboutHomeOrOther')
      expect(getMockState().machineContext.address).toEqual('123 Company Dr')
      expect(getResponse()[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm')
    })

    it('Sends machine from askAboutHomeOrOther to pickFromListQuestion when user triggers OtherIntent', async () => {
      handlerInput.requestEnvelope.request.intent.name = 'OtherIntent'
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('pickFromListQuestion')
      expect(getResponse()[0][0]).toEqual('estimatedRestoration.otherLocation.confirm')
      await run(handlerInput)

      expect(getMockState().machineState).toEqual('pickFromListQuestion')
      expect(getResponse()[0][0]).toEqual('estimatedRestoration.otherLocation.confirm')
    })

    it('when address is incorrect, tells the user they must correct their address online or by phone to get a restoration estimate (incorrectAddress)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            estimatedRestoration: {
              machineState: 'addressResult',
              machineContext: {
                conversationAttributes: {
                  confirmAddress: {
                    correctAddress: false,
                  }
                }
              },
            },
          },
          conversationStack: []
        },
        conversationAttributes: {
          confirmAddress: {
            correctAddress: false,
          },
        },
      })
      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'

      await run(handlerInput);

      expect(getMockState().machineState).toEqual('incorrectAddress')
      expect(getResponse()[0][0]).toEqual('estimatedRestoration.address.wrongAddress')
    });

    it('when address is correct, gives the user their estimated restoration time (reportEstimateToUser)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            estimatedRestoration: {
              machineState: 'reportEstimateToUser',
              machineContext: {
                conversationAttributes: {
                  confirmAddress: {
                    correctAddress: true,
                  }
                },
                estimate: '6 hours',
              },
            },
          },
          conversationStack: [],
        },
        conversationAttributes: {
          conversationAttributes: {
            confirmAddress: {
              correctAddress: true,
            }
          }
        }
      })

      await run(handlerInput);

      expect(getMockState().machineState).toEqual('reportEstimateToUser')
      expect(getResponse()[0][0]).toEqual('estimatedRestoration.reply.other');
    });

    it('gives the generic error response on errors (error)', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: {
            estimatedRestoration: {
              machineState: 'error',
              machineContext: { error: 'fake error' },
            },
          },
          conversationStack: [],
        }
      })

      await run(handlerInput);

      expect(getMockState().machineState).toEqual('error')
      expect(getResponse()[0][0]).toEqual('home.error');
    });
  });

  describe('systemic test', () => {
    it('sends the machine to correctAddress after confirming address when user is asking about their home', async () => {
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

      setSlots({})
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
      expect(getResponse().length).toEqual(1)
    });

    it('sends the machine to incorrectAddress after confirming address when user is asking about their home', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...defaultSessionAttributes,
        conversationAttributes: defaultConversationAttributes(true, false),
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

      setSlots({})
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
      expect(getResponse().length).toEqual(1)
    });

    it('walks through the expected path of estimatedRestoration', async () => {
      handlerInput.attributesManager.setSessionAttributes({
        ...handlerInput.attributesManager.getSessionAttributes(),
        state: {
          ...handlerInput.attributesManager.getSessionAttributes().state,
          currentSubConversation: { estimatedRestoration: {}},
          conversationStack: [],
        },
        conversationAttributes: {},
      })

      console.log('before: ', handlerInput.attributesManager.getSessionAttributes())
      // setSlots({})
      await run(handlerInput)

      console.log('after: ', handlerInput.attributesManager.getSessionAttributes())


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
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.reply.home');
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


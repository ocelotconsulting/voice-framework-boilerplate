
const { mockGetSession, mockSaveSession } = require('../util/mockSessionAttributesService')
const { billing } = require('../../conversation/billing')
const { fakePhoneNumber, fakeWebsite } = require('../constants')
const { handlerInput, setSlots } = require('../util/mockHandlerInput')
 const { StateHandler } = require('../../conversation');

const {
  defaultConversationAttributes,
  defaultSessionAttributes,
  defaultParams,
  defaultYesNoIntent,
  emptyIntent
} = require('./subConversations/defaults')

const dialog = jest.fn();

const defaultBillingMachineContext = () => ({
  conversationAttributes:defaultConversationAttributes(),
  billAmount:"",
  misunderstandingCount:0,
  error:"",
  previousMachineState: "fresh",
  resuming: false
})

const defaultBillingConversation = () => ({
  billing:{
    machineState:"confirmAddress",
    machineContext:defaultBillingMachineContext()
  }
})

describe('Billing Conversation Tests', () => {
  describe('acceptIntent()', () => {
    it('Sends machine to confirmAddress when new', async () => {
      const params = {...defaultParams(), intent: emptyIntent('Billing')};

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await billing.acceptIntent(params);

      expect(conversationStack).toEqual([
        defaultBillingConversation()
      ]);
      expect(currentSubConversation).toEqual(
        {
          "confirmAddress":{}
        }
      );
      expect(sessionAttributes).toEqual(defaultSessionAttributes());
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeFalsy();
    })

    it('Sends machine to correctAddress on correctAddress:true', async () => {
      const params = {...defaultParams(),
        currentSubConversation: {
          billing: {...defaultBillingConversation().billing,
            machineContext: {
              ...defaultBillingMachineContext(),
              conversationAttributes: defaultConversationAttributes(true, true),
              previousMachineState: "confirmAddress"
            }
          }
        },
        sessionAttributes: {...defaultSessionAttributes(),
          conversationAttributes: defaultConversationAttributes(true, true)
        },
        intent: defaultYesNoIntent(),
        poppedConversation:true
      };

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await billing.acceptIntent(params);

      expect(conversationStack).toEqual([]);
      expect(currentSubConversation).toEqual(
        {
          billing:{ ...defaultBillingConversation().billing,
            machineState:"reportBillToUser",
            machineContext: {...defaultBillingMachineContext(),
              conversationAttributes: defaultConversationAttributes(true, true),
              billAmount:currentSubConversation.billing.machineContext.billAmount,
              previousMachineState:"confirmAddress",
              resuming: true
            }
          }
        }
      );
      expect(sessionAttributes).toEqual({...defaultSessionAttributes(),
        conversationAttributes:defaultConversationAttributes(true, true)
      });
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeTruthy();
    })

    it('Sends machine to incorrectAddress on correctAddress:false', async () => {
      const params = {...defaultParams(),
        currentSubConversation: defaultBillingConversation(),
        poppedConversation: true
      };

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await billing.acceptIntent(params);

      expect(conversationStack).toEqual([]);
      expect(currentSubConversation).toEqual(
        {
          billing:{
            ...defaultBillingConversation().billing,
            machineState:"incorrectAddress",
            machineContext:{
              ...defaultBillingMachineContext(),
              previousMachineState: "confirmAddress",
              resuming: true
            }
          }
        }
      );
      expect(sessionAttributes).toEqual(defaultSessionAttributes());
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeTruthy();
    })

    it('Sends machine to reportBillToUser confirmedAddress true and correctAddress true', async () => {
      const params = {
        ...defaultParams(),
        currentSubConversation: {
          billing:{}
        },
        sessionAttributes: {
          ...defaultSessionAttributes(),
          conversationAttributes:defaultConversationAttributes(true, true)
        },
        intent: {
          name:'test',
          slots: {}
        }
      };

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await billing.acceptIntent(params);

      expect(conversationStack).toEqual([]);
      expect(currentSubConversation).toEqual(
        {
          billing:{
            ...defaultBillingConversation().billing,
            machineState:"reportBillToUser",
            machineContext:{
              ...defaultBillingMachineContext(),
              conversationAttributes:defaultConversationAttributes(true, true),
              billAmount:currentSubConversation.billing.machineContext.billAmount,
              previousMachineState: "fresh",
              resuming: false
            }
          }
        }
      );
      expect(sessionAttributes).toEqual({
        ...defaultSessionAttributes(),
        conversationAttributes:defaultConversationAttributes(true, true)
      });
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeTruthy();
    });

    it('Sends machine to reportBillToUser confirmedAddress true and correctAddress true', async () => {
      const params = {
        ...defaultParams(),
        currentSubConversation: {
          billing:{}
        },
        sessionAttributes: {
          ...defaultSessionAttributes(),
          conversationAttributes:defaultConversationAttributes(true, false)
        },
        intent: {
          name:'test',
          slots: {}
        }
      };

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await billing.acceptIntent(params);

      expect(conversationStack).toEqual([]);
      expect(currentSubConversation).toEqual(
        {
          billing:{
            ...defaultBillingConversation().billing,
            machineState:"incorrectAddress",
            machineContext:{
              ...defaultBillingMachineContext(),
              conversationAttributes:defaultConversationAttributes(true, false),
              billAmount:currentSubConversation.billing.machineContext.billAmount,
              previousMachineState: "fresh",
              resuming: false
            }
          }
        }
      );
      expect(sessionAttributes).toEqual({
        ...defaultSessionAttributes(),
          conversationAttributes:defaultConversationAttributes(true, false)
      });
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeTruthy();
    });
  });

  describe('craftResponse()', () => {
    beforeEach(() => {
      dialog.mockRestore();
      mockGetSession.mockClear()
      mockSaveSession.mockClear()
    });

    it('when address is incorrect, tells the user they must correct their address online or by phone to get an accurate bill report (badAddress)', () => {
      const params = {
        dialog,
        subConversation: {
          billing: {
            machineState: 'incorrectAddress',
            machineContext: {},
          },
        },
      };

      billing.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('billing.wrongAddress');
      expect(dialog.mock.calls[0][1]).toEqual({ website: fakeWebsite, phoneNumber: fakePhoneNumber });
    });

    it('when address is correct, tells the user their bill (reportBillToUser)', () => {
      const params = {
        dialog,
        subConversation: {
          billing: {
            machineState: 'reportBillToUser',
            machineContext: { billAmount: 'fake bill amount' },
          },
        },
      };

      billing.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('billing.returnBill');
      expect(dialog.mock.calls[0][1]).toEqual({ billAmount: 'fake bill amount' });
    });

    it('gives the generic error response on errors (error)', () => {
      const params = {
        dialog,
        subConversation: {
          billing: {
            machineState: 'error',
            machineContext: { error: 'fake error' },
          },
        },
      };

      billing.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('home.error');
    });
  });

  describe('systemic test', () => {
    beforeEach(() => {
      dialog.mockRestore();
      handlerInput.requestEnvelope.request.type = 'IntentRequest';
      handlerInput.responseBuilder.speak.mockClear()
      handlerInput.responseBuilder.reprompt.mockClear()
      handlerInput.responseBuilder.addElicitSlotDirective.mockClear()
      handlerInput.responseBuilder.addConfirmSlotDirective.mockClear()
      handlerInput.responseBuilder.withShouldEndSession.mockClear()
      handlerInput.responseBuilder.getResponse.mockClear()
      mockGetSession.mockClear()
      mockSaveSession.mockClear()
    });

    it('walks through triggering uniqueness', async () => {
      const requestAttributes = {
        'confirmAddress.confirm': "confirmAddress.confirm",
        "confirmAddress.misheard": "confirmAddress.misheard",
        "estimatedRestoration.homeOrOther.confirm": "estimatedRestoration.homeOrOther.confirm",
        "estimatedRestoration.homeOrOther.misheard": "estimatedRestoration.homeOrOther.misheard",
        "confirmAddress.resume": "confirmAddress.resume",
        "billing.returnBill": "billing.returnBill",
        "estimatedRestoration.reply.home": "estimatedRestoration.reply.home",
        "home.reEngage": "home.reEngage",
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

      handlerInput.requestEnvelope.request.intent.name = 'Billing'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'Billing'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.misheard');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'EstimatedRestoration'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('estimatedRestoration.homeOrOther.misheard');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'HomeIntent'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.confirm');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'Billing'
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('confirmAddress.misheard');
      handlerInput.responseBuilder.speak.mockClear();

      handlerInput.requestEnvelope.request.intent.name = 'YesNoIntent'
      setSlots(defaultYesNoIntent('yes').slots);
      await StateHandler.handle(handlerInput)

      expect(handlerInput.responseBuilder.speak.mock.calls.length).toEqual(1)
      expect(handlerInput.responseBuilder.speak.mock.calls[0][0]).toEqual('billing.returnBill estimatedRestoration.reply.home home.reEngage');
      handlerInput.responseBuilder.speak.mockClear();

      //should be in home or other

      const { state } = handlerInput.attributesManager.getSessionAttributes()

      expect(state.conversationStack).toEqual([])
      expect(state.currentSubConversation).toEqual({
        engagement: {
          machineState: 'resume',
          machineContext: {
            resuming: true,
            previousMachineState: "billing",
            conversationAttributes: defaultConversationAttributes(true, true)
          }
        }
      })
    });
  });
})

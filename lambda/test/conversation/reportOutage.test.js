
const { reportOutage } = require('../../conversation/reportOutage')
const { fakePhoneNumber, fakeWebsite } = require('../../constants')

const dialog = jest.fn();

describe('Report Outage Conversation Tests', () => {
  describe('acceptIntent()', () => {
    it('Sends machine to askAboutAddress when new', async () => {
      const params = {
        conversationStack: [],
        currentSubConversation: {reportOutage:{}},
        sessionAttributes: {
          previousPoppedConversation: ''
        },
        intent: {
          name:'ReportOutage',
          slots: {},
        },
        topConversation: true,
        newConversation: false,
        poppedConversation: false,
        fallThrough: false,
      };

      const {
        conversationStack,
        currentSubConversation,
        sessionAttributes,
        fallThrough,
        pop,
      } = await reportOutage.acceptIntent(params);

      expect(conversationStack).toEqual([
        {
          reportOutage:{
            machineState:"confirmAddress",
            machineContext:{
              conversationAttributes:{},
              letThemKnow:"",
              misunderstandingCount:0,
              error:"",
              previousMachineState: "fresh",
              resuming: false
            }
          }
        }
      ]);
      expect(currentSubConversation).toEqual(
        {
          confirmAddress: {}
        }
      );
      expect(sessionAttributes).toEqual(
        {
          conversationAttributes:{},
          previousPoppedConversation:''
        }
      );
      expect(fallThrough).toBeFalsy();
      expect(pop).toBeFalsy();
    })


  });

  describe('craftResponse()', () => {
    beforeEach(() => {
      dialog.mockRestore();
    });

    it('when address is incorrect, tells the user they must correct their address online or by phone to report outage (badAddress)', () => {
      const params = {
        dialog,
        subConversation: {
          reportOutage: {
            machineState: 'incorrectAddress',
            machineContext: {},
          },
        },
        sessionAttributes: {
          previousPoppedConversation: ''
        }
      };

      reportOutage.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('reportOutage.wrongAddress');
      expect(dialog.mock.calls[0][1]).toEqual({ website: fakeWebsite, phoneNumber: fakePhoneNumber });
    });

    it('when address is correct, tells the user thanks for reporting(thanksForReporting)', () => {
      const params = {
        dialog,
        subConversation: {
          reportOutage: {
            machineState: 'thanksForReporting',
            machineContext: {},
          },
        },
        sessionAttributes: {
          previousPoppedConversation: ''
        }
      };

      reportOutage.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('reportOutage.reply.noContact');
    });

    it('gives the generic error response on errors (error)', () => {
      const params = {
        dialog,
        subConversation: {
          reportOutage: {
            machineState: 'error',
            machineContext: { error: 'fake error' },
          },
        },
        sessionAttributes: {
          previousPoppedConversation: ''
        }
      };

      reportOutage.craftResponse(params);

      expect(dialog.mock.calls[0][0]).toEqual('home.error');
    });
  });
});

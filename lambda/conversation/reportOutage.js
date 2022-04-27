const {
  immediate,
  invoke,
  reduce,
  state,
  transition,
  guard,
} = require('robot3')
const { utils } = require('@ocelot-consulting/ocelot-voice-framework')
const { fakePhoneNumber, fakeWebsite } = require('../constants')

const callOutageApi = async () => {
  console.log('outage reported')
}

const stateMap = {
  fresh: state(
    transition('processIntent', 'confirmAddress',
      guard(({ conversationAttributes }) => !conversationAttributes.confirmAddress?.confirmedAddress),
    ),
    transition('processIntent', 'incorrectAddress',
      guard(({ conversationAttributes }) => !conversationAttributes.confirmAddress?.correctAddress),
    ),
    transition('processIntent', 'letYouKnow',
      guard(({ conversationAttributes }) => conversationAttributes.confirmAddress?.correctAddress),
    ),
  ),
  confirmAddress: state(
    immediate('incorrectAddress',
      guard(({ resuming, conversationAttributes }) => resuming && !conversationAttributes.confirmAddress?.correctAddress),
    ),
    immediate('letYouKnow',
      guard(({ resuming, conversationAttributes }) => resuming && conversationAttributes.confirmAddress?.correctAddress),
    ),
  ),
  letYouKnow: state(
    transition('processIntent', 'gotAllData',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'yes'),
      reduce(ctx => ({ ...ctx, letThemKnow: true }))
    ),
    transition('processIntent', 'gotAllData',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'no'),
      reduce(ctx => ({ ...ctx, letThemKnow: false }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'letYouKnow',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  gotAllData: invoke(callOutageApi,
    transition('done', 'thanksForReporting'),
    transition('error', 'error',
      reduce((ctx, { error }) => ({ ...ctx, error })),
    )
  ),
  thanksForReporting: state(),
  incorrectAddress: state(),
  error: state(),
  goBack: state(),
};

const reportOutage = {
  handle: ({ dialog, sessionAttributes }) => ({
    initialState: {
      letThemKnow: '',
      misunderstandingCount: 0,
      error: '',
    },
    stateMap,
    transitionStates: 'confirmAddress',
    dialogMap: {
      letYouKnow: ({ misunderstandingCount }) => dialog(`reportOutage.letYouKnow.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`),
      thanksForReporting: ({ letThemKnow }) => dialog(`reportOutage.reply.${letThemKnow ? 'withContact' : 'noContact'}`),
      incorrectAddress: () => dialog('reportOutage.wrongAddress', { website: fakeWebsite, phoneNumber: fakePhoneNumber }),
      error: () => dialog('home.error'),
    },
    overrideResume: sessionAttributes.previousPoppedConversation === 'confirmAddress',
  }),
  intent: 'ReportOutage',
  canInterrupt: true,
  shouldBeUnique: true,
}

module.exports = { reportOutage }

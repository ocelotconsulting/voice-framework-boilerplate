const {
  immediate,
  invoke,
  reduce,
  state,
  transition,
  guard,
} = require('robot3')
const { fakeAddress, fakePhoneNumber, fakeWebsite } = require('../constants')
const { utils } = require('@ocelot-consulting/ocelot-voice-framework')

// replace this with an api call
const fetchRestorationEstimate = async () => ({ estimate: '3 hours' })

const stateMap = {
  fresh: state(
    transition('processIntent', 'askAboutHomeOrOther',
      reduce(ctx => ({ ...ctx, address: fakeAddress })),
    ),
  ),
  askAboutHomeOrOther: state(
    transition('processIntent', 'pickAnOutage',
      guard((ctx, { intent }) => intent.name === 'OtherIntent'),
      reduce(ctx => ({ ...ctx, selectedHome: false })),
    ),
    transition('processIntent', 'checkForValidatedAddress',
      guard((ctx, { intent }) => [ 'HomeIntent', 'AMAZON.NavigateHomeIntent' ].includes(intent.name)),
      reduce(ctx => ({ ...ctx, selectedHome: true })),
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'askAboutHomeOrOther',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  checkForValidatedAddress: state(
    immediate('confirmAddress',
      guard(({ conversationAttributes }) => !conversationAttributes.confirmAddress || !conversationAttributes.confirmAddress.correctAddress),
    ),
    immediate('addressResult'),
  ),
  pickAnOutage: state(
    immediate('correctAddress',
      guard(({ resuming }) => resuming)
    ),
  ),
  confirmAddress: state(
    immediate('addressResult',
      guard(({ resuming }) => resuming)
    ),
  ),
  addressResult: state(
    immediate('incorrectAddress',
      guard(({ conversationAttributes }) => !conversationAttributes.confirmAddress || !conversationAttributes.confirmAddress.correctAddress),
    ),
    immediate('correctAddress',
      guard(({ conversationAttributes }) => conversationAttributes.confirmAddress.correctAddress),
    ),
  ),
  correctAddress: invoke(fetchRestorationEstimate,
    transition('done', 'reportEstimateToUser',
      reduce((ctx, { data: { estimate }}) => ({ ...ctx, estimate })),
    ),
    transition('error', 'error',
      reduce((ctx, { error }) => ({ ...ctx, error })),
    ),
  ),
  reportEstimateToUser: state(),
  incorrectAddress: state(),
  error: state(),
  goBack: state(),
};

const estimatedRestoration = {
  handle: ({ dialog, sessionAttributes }) => ({
    initialState: {
      selectedHome: false,
      selectedOutage: '',
      estimate: '',
      misunderstandingCount: 0,
      error: '',
    },
    stateMap,
    transitionStates: [ 'confirmAddress', 'pickAnOutage' ],
    dialogMap: {
      askAboutHomeOrOther: ({ misunderstandingCount = 0 }) => dialog(
        `estimatedRestoration.homeOrOther.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`
      ),
      selectOtherOutage: ({ misunderstandingCount = 0 }) => dialog(
        `estimatedRestoration.otherLocation.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`,
        { options: utils.objectMapToSpeech(outageOptions) }
      ),
      reportEstimateToUser: ({ estimate, selectedHome, selectedOutage }) => dialog(
        `estimatedRestoration.reply.${selectedHome ? 'home' : 'other'}`,
        { estimate, selectedOutage },
      ),
      incorrectAddress: () => dialog(
        'estimatedRestoration.address.wrongAddress',
        { website: fakeWebsite, phoneNumber: fakePhoneNumber },
      ),
      error: () => dialog('home.error'),
      resume: () => dialog('estimatedRestoration.resume'),
    },
    overrideResume: [ 'confirmAddress', 'pickAnOutage' ].includes(sessionAttributes.previousPoppedConversation),
  }),
  intent: 'EstimatedRestoration',
  canInterrupt: true,
  description: 'how long it will take to restore power',
}

module.exports = { estimatedRestoration }

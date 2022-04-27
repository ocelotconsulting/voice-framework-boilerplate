const {
  invoke,
  immediate,
  reduce,
  state,
  transition,
  guard,
} = require('robot3')
const { fakePhoneNumber, fakeWebsite } = require('../constants')
const { fetchBill } = require('../service/fetchBill')

const stateMap = {
  fresh: state(
    transition('processIntent', 'confirmAddress',
      guard(({ conversationAttributes }) => !conversationAttributes.confirmAddress?.confirmedAddress),
    ),
    transition('processIntent', 'incorrectAddress',
      guard(({ conversationAttributes }) => (!conversationAttributes.confirmAddress?.correctAddress)),
    ),
    transition('processIntent', 'correctAddress',
      guard(({ conversationAttributes }) => (conversationAttributes.confirmAddress?.correctAddress)),
    ),
  ),
  confirmAddress: state(
    immediate('incorrectAddress',
      guard(({ resuming, conversationAttributes }) => resuming && (!conversationAttributes.confirmAddress?.correctAddress)),
    ),
    immediate('correctAddress',
      guard(({ resuming, conversationAttributes }) => resuming && conversationAttributes.confirmAddress?.correctAddress),
    ),
  ),
  correctAddress: invoke(fetchBill,
    transition('done', 'returnBill',
      reduce((ctx, { data: { billAmount }}) => ({ ...ctx, billAmount })),
    ),
    transition('error', 'error',
      reduce((ctx, { error }) => ({ ...ctx, error })),
    )
  ),
  incorrectAddress: state(),
  returnBill: state(),
  error: state(),
  goBack: state(),
};

const billing = {
  handle: () => ({
    initialState: {
      billAmount: '',
      website: fakeWebsite,
      phoneNumber: fakePhoneNumber,
    },
    stateMap,
    transitionStates: 'confirmAddress',
    overrideResume: true,
  }),
  intent: 'Billing',
  canInterrupt: true,
  shouldBeUnique: true,
}

module.exports = { billing }

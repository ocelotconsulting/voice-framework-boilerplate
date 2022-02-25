const {
  invoke,
  immediate,
  reduce,
  state,
  transition,
  guard,
} = require('robot3')
const { fakePhoneNumber, fakeWebsite } = require('../constants')

const generateRandomBillAmount = () => {
  const min = Math.ceil(0)
  const max = Math.floor(500)
  const decimalMax = Math.floor(99)

  const dollars = Math.floor(Math.random() * (max - min + 1)) + min
  const cents = Math.floor(Math.random() * (decimalMax - min + 1)) + min

  return `$${dollars}.${cents}`
}

// replace this with an api call
const fetchBillForAddress = async () => ({ billAmount: generateRandomBillAmount() })

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
  correctAddress: invoke(fetchBillForAddress,
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
}

module.exports = { billing }

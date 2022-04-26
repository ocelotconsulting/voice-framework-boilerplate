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

const callOutageApi = async ({houseNumber, phoneNumber, attemptCount}) => {
  console.log('outage reported', houseNumber, phoneNumber, attemptCount)

  return [{
    result: 'noOutage'
  }, {
    result: 'yesOutage',
    impact: '300',
    areaDescription: 'The pines neighborhood north of Park Street',
    workDescription: 'Crews are on the scenen and expect repairs to complete in about an hour.'
  }, {
    result: 'badCombination'
  }][attemptCount % 3]
}

const stateMap = {
  fresh: state(
    transition('processIntent', 'askForHouseNumber',
      guard(ctx => ctx.houseNumber === 0),
    ),
    transition('processIntent', 'askForTelephoneNumber',
      guard(ctx => ctx.phoneNumber === ''),
    ),
    immediate('gotAllData'),
  ),
  askForHouseNumber: state(
    transition('processIntent', 'askForTelephoneNumber',
      guard((ctx, { intent }) => intent.name === 'ANumber'),
      reduce((ctx, { intent } ) => ({ ...ctx, houseNumber: intent.slots.number.value, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'askForHouseNumber',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  askForTelephoneNumber: state(
    transition('processIntent', 'gotAllData',
      guard((ctx, { intent }) => intent.name === 'APhoneNumber'),
      reduce((ctx, { intent } ) => ({ ...ctx, phoneNumber: intent.slots.phoneNumber.value, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'askForTelephoneNumber',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  letYouKnow: state(
    transition('processIntent', 'thanksForReporting',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'yes'),
      reduce(ctx => ({ ...ctx, letThemKnow: true, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'thanksForReporting',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'no'),
      reduce(ctx => ({ ...ctx, letThemKnow: false, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'letYouKnow',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  letYouKnowWOutageReport: state(
    transition('processIntent', 'thanksForReporting',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'yes'),
      reduce(ctx => ({ ...ctx, letThemKnow: true, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'thanksForReporting',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'no'),
      reduce(ctx => ({ ...ctx, letThemKnow: false, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'letYouKnow',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  reportAnOutage: state(
    transition('processIntent', 'letYouKnow',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'yes'),
      reduce(ctx => ({ ...ctx, reportingOutage: true, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'haveANiceDay',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'no'),
      reduce(ctx => ({ ...ctx, reportingOutage: false, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'reportAnOutage',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  tryAgain: state(
    transition('processIntent', 'askForHouseNumber',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'yes'),
      reduce(ctx => ({ ...ctx, houseNumber: 0, phoneNumber: '', misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard((ctx, { intent }) => intent.name === 'YesNoIntent' && utils.getSlotValueId(intent.slots.yesNo) === 'no'),
      reduce(ctx => ({ ...ctx, misunderstandingCount: 0 }))
    ),
    transition('processIntent', 'goBack',
      guard(({ misunderstandingCount }, { intent }) => intent.name === 'GoBackIntent' || misunderstandingCount > 3)
    ),
    transition('processIntent', 'tryAgain',
      reduce(ctx => ({ ...ctx, misunderstandingCount: ctx.misunderstandingCount + 1 })),
    ),
  ),
  gotAllData: invoke(callOutageApi,
    transition('done', 'reportAnOutage',
      guard((ctx, {data: { result }}) => result === 'noOutage'),
      reduce((ctx, { data }) => ({ ...ctx, attemptCount: ctx.attemptCount + 1 })),),
    transition('done', 'letYouKnowWOutageReport',
      guard((ctx, {data: { result }}) => result === 'yesOutage'),
      reduce((ctx, { data }) => ({ ...ctx, attemptCount: ctx.attemptCount + 1, outageDetails: {...data} })),),
    transition('done', 'tryAgain',
      guard((ctx, {data: { result }}) => result === 'badCombination'),
      reduce((ctx, { data }) => ({ ...ctx, attemptCount: ctx.attemptCount + 1 })),),
    transition('error', 'error',
      reduce((ctx, { error }) => ({ ...ctx, error })),
    )
  ),
  thanksForReporting: state(),
  haveANiceDay: state(),
  error: state(),
  goBack: state(),
};

const reportOutage = {
  handle: ({ dialog, sessionAttributes }) => ({
    initialState: {
      outageDetails: {},
      attemptCount: 0,
      houseNumber: 0,
      phoneNumber: '',
      reportAnOutage: '',
      letThemKnow: '',
      reportingOutage: '',
      misunderstandingCount: 0,
      error: '',
    },
    stateMap,
    dialogMap: {
      askForHouseNumber: ({ misunderstandingCount }) => dialog(`reportOutage.askForHouseNumber.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`),
      askForTelephoneNumber: ({ misunderstandingCount }) => dialog(`reportOutage.askForTelephoneNumber.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`),
      letYouKnow: ({ misunderstandingCount }) => dialog(`reportOutage.letYouKnow.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`),
      letYouKnowWOutageReport: ({ misunderstandingCount, outageDetails }) => dialog(`reportOutage.letYouKnowWOutageReport.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`, {...outageDetails}),
      reportAnOutage: ({ misunderstandingCount }) => dialog(`reportOutage.reportAnOutage.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`),
      tryAgain: ({ misunderstandingCount, houseNumber, phoneNumber }) => dialog(`reportOutage.tryAgain.${misunderstandingCount > 0 ? 'misheard' : 'confirm'}`, {houseNumber, phoneNumber}),
      thanksForReporting: ({ letThemKnow }) => dialog(`reportOutage.reply.${letThemKnow ? 'withContact' : 'noContact'}`),
      haveANiceDay: () => dialog(`reportOutage.reply.haveANiceDay`),
      error: () => dialog('home.error'),
    },
  }),
  intent: 'ReportOutage',
  canInterrupt: true,
}

module.exports = { reportOutage }

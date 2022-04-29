

// replace this with an api call
const reportOutageAPI = async ({houseNumber, phoneNumber}) => {
  //console.log('outage reported', houseNumber, phoneNumber)

  return [{
    result: 'noOutage'
  }, {
    result: 'yesOutage',
    impact: '300',
    areaDescription: 'The pines neighborhood north of Park Street',
    workDescription: 'Crews are on the scenen and expect repairs to complete in about an hour.'
  }, {
    result: 'badCombination'
  }][houseNumber % 3]
}

module.exports = { reportOutageAPI }

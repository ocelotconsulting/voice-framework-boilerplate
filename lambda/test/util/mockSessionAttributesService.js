const { handlerInput } = require('./mockHandlerInput')

const mockGetSession = jest.fn(() => handlerInput.attributesManager.getSessionAttributes())
const mockSaveSession = jest.fn(sessionAttributes => handlerInput.attributesManager.setSessionAttributes(sessionAttributes))

jest.mock('../../service/SessionAttributesService', () => ({
  __esModule: true,
  getSessionFromDynamoDb: mockGetSession,
  saveSessionToDynamoDb: mockSaveSession,
}))

module.exports = {
  mockGetSession,
  mockSaveSession,
}

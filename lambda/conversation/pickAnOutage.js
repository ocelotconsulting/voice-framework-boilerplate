const { utils, conversationTemplates } = require('@ocelot-consulting/ocelot-voice-framework')

const outageOptions = {
  a: 'zipcode 63132',
  b: 'Charter Oak neighborhood',
  c: 'the garden district'
};

const pickAnOutage = conversationTemplates.pickFromListQuestion({
  itemList: outageOptions,
  questionResponse: dialog => dialog(
    'estimatedRestoration.otherLocation.confirm',
    { options: utils.objectMapToSpeech(outageOptions)},
  ),
  misheardResponse: dialog => dialog(
    'estimatedRestoration.otherLocation.misheard',
    { options: utils.objectMapToSpeech(outageOptions)},
  ),
  resumeResponse: dialog => dialog('estimatedRestoration.resume'),
})

module.exports = { pickAnOutage }

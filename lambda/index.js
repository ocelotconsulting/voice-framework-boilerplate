const { generate } = require('@ocelot-consulting/ocelot-voice-framework')

exports.handler = generate({
  conversationSet: require('./conversation'),
  dialog: require('./dialog'),

  // the following can be replaced with your own fetch/post to manage session storage with your own DB
  // fetchSession: getSession,
  // saveSession: saveSession,
})

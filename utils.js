const removeAccents = require('remove-accents')

module.exports = {
  gras: function (msg) {
    return '**' + msg + '**'
  },
  tag: function (id) {
    return '<@' + id + '>'
  },
  sanitize: function (text) {
    return removeAccents(text).replace(/[-‘’']/g, ' ').replace(/[.*?!]/g, '').toUpperCase().trim()
  }
}

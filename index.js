const Discord = require('discord.js')
const flags = require('./flags.json')
const removeAccents = require('remove-accents')

const channels = {}

const client = new Discord.Client()

client.on('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}!`)
})

function sendQuestion(msg) {
  const keys = Object.keys(flags)
  const randIndex = Math.floor(Math.random() * keys.length)
  const randKey = keys[randIndex]

  const loopMode = (msg.content === '!flag loop') || (channels[msg.channel.id] && channels[msg.channel.id].loop)
  msg.channel.send(randKey).then(() => {
    if (loopMode) {
      channels[msg.channel.id] = {flag: randKey, loop: true}
    } else {
      channels[msg.channel.id] = {flag: randKey, loop: false}
    }
  })
}

function checkAnswer(msg, flag) {
  return removeAccents(msg).replace(/-/g, '').toUpperCase() === removeAccents(flag).replace(/-/g, '').toUpperCase()
}

client.on('message', (msg) => {
  if (msg.author.id !== client.user.id) {
    if (channels[msg.channel.id]) {
      if (msg.content === 'STOP' || msg.content === 'je sais pas' || msg.content === '!flag stop') {
        msg.reply('Arrêt du jeu... c\'était : ' + flags[channels[msg.channel.id].flag])
        delete channels[msg.channel.id]
      } else if (checkAnswer(msg.content, flags[channels[msg.channel.id].flag])) {
        if (channels[msg.channel.id].loop) {
          msg.react('👍').then(() => {
            sendQuestion(msg)
          })
        } else {
          delete channels[msg.channel.id]
          msg.reply('Bravo!')
        }
      } else {
        msg.react('👎')
      }
    } else if (msg.content === '!flag') {
      msg.channel.send('**Quel est le drapeau ?**').then(() => {
        sendQuestion(msg)
      })
    } else if (msg.content === '!flag loop') {
      msg.channel.send('**Quel est le drapeau ?** (mode boucle)').then(() => {
        sendQuestion(msg)
      })
    } else if (msg.content === '!flag help') {
      const embed = new Discord.MessageEmbed()
      // Set the title of the field
        .setTitle('Aide...')
      // Set the color of the embed
        .setColor(0xff0000)
      // Set the main content of the embed
        .setDescription('- **!flag help** : aide\n- **!flag** : trouve un seul drapeau\n- **!flag loop** : trouve des drapeaux à l\'infini\n - **STOP|je sais pas|!flag stop** : termine le jeu en cours')
      // Send the embed to the same channel as the message
      msg.channel.send(embed)
    }
  }
})

if (process.env.TOKEN) {
  client.login(process.env.TOKEN).then(() => {
    console.log('Nice.')
  })
} else {
  console.log('Il manque le token!!!')
}

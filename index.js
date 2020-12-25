const Discord = require('discord.js')
const flags = require('./flags.json')
const config = require('./config.json')
const removeAccents = require('remove-accents')

const keys = Object.keys(flags)
const keysLength = keys.length

const keysNoCapital = []
for (const i of keys) {
  if (flags[i]['capital']) keysNoCapital.push(i)
}
const keysNoCapitalLength = keysNoCapital.length

const channels = {}

const client = new Discord.Client()

/**
 * Bot is ready
 */
client.on('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}!`)
})

/**
 * Send the flag
 * @param msg current message object
 * @param loop mode
 */
async function sendFlag(msg, loop) {
  const randFlag = keys[Math.floor(Math.random() * keysLength)]

  if (channels[msg.channel.id]) {
    channels[msg.channel.id].flag = randFlag
    channels[msg.channel.id].pending = true
  } else {
    channels[msg.channel.id] = {flag: randFlag, loop, mode: 'flag', pending: true}
  }

  await msg.channel.send(randFlag)
  channels[msg.channel.id].pending = false
}

/**
 * Send the capital
 * @param msg current message object
 * @param loop mode
 */
async function sendCapital(msg, loop) {
  const randFlag = keysNoCapital[Math.floor(Math.random() * keysNoCapitalLength)]

  if (channels[msg.channel.id]) {
    channels[msg.channel.id].flag = randFlag
    channels[msg.channel.id].pending = true
  } else {
    channels[msg.channel.id] = {flag: randFlag, loop, mode: 'capital', pending: true}
  }

  await msg.channel.send(randFlag + ' **' + flags[randFlag].country.split('|').join(', ') + '**')
  channels[msg.channel.id].pending = false
}

/**
 * Check the answer
 * @param msg message content
 * @param flag answer
 * @param mode
 */
function checkAnswer(msg, flag, mode) {
  if (mode === 'capital') {
    flag = flag['capital']
  } else if (mode === 'flag') {
    flag = flag['country']
  } else {
    return
  }

  let b = false
  for (const i of flag.split('|')) {
    if (removeAccents(msg).replace(/-/g, ' ').replace(/\./g, '').toUpperCase().trim()
        === removeAccents(i).replace(/-/g, ' ').replace(/\./g, '').toUpperCase().trim()) {
      b = true
      break
    }
  }
  return b
}

/**
 * Messages
 */
client.on('message', async (msg) => {
  if (msg.author.bot || /hmmm*/i.test(msg.content)) return // Message is not from bot and not "hmmm"
  const args = msg.content.slice(config.prefix.length).trim().split(' ') // Get arguments
  const command = args.shift().toLowerCase() // Get command

  // If bot is currently playing/waiting in channel
  if (channels[msg.channel.id]) {
    // Return if pending (message not sent)
    if (channels[msg.channel.id].pending || msg.content.startsWith('!')) return

    // Stop the game
    if ((command === config.command && args[0] === 'stop') || /.*(je(\s.*ne)?\s.*sais\s.*(plus|pas)|aucune\s.*idée).*/i.test(msg.content)) {
      const tmpMode = channels[msg.channel.id].mode
      const tmpFlag = flags[channels[msg.channel.id].flag]
      delete channels[msg.channel.id]

      if (tmpMode === 'capital') {
        await msg.reply(config.text.stop + ' **' + tmpFlag['capital'] + '**')
      } else if (tmpMode === 'flag') {
        await msg.reply(config.text.stop + ' **' + tmpFlag['country'] + '**')
      }

    // Check if answer is correct
    } else if (checkAnswer(msg.content, flags[channels[msg.channel.id].flag], channels[msg.channel.id].mode)) {
      // Check if loop mode
      if (channels[msg.channel.id].loop) {
        await msg.react('👍')
        if (channels[msg.channel.id].mode === 'capital') await sendCapital(msg, true)
        else if (channels[msg.channel.id].mode === 'flag') await sendFlag(msg, true)
      } else {
        delete channels[msg.channel.id] // Delete the current channel in object
        await msg.reply('Bravo!')
      }
    } else await msg.react('👎')

  // Check for prefix + flag commands
  } else if (command === config.command && msg.content.startsWith(config.prefix)) {
    // Not loop mode
    if (!args.length) {
      await msg.channel.send(config.text.flagQuestion)
      await sendFlag(msg, false)

    // Loop mode
    } else if (args[0] === 'loop') {
      await msg.channel.send(config.text.flagQuestion + ' ' + config.text.flagLoop)
      await sendFlag(msg, true)

    } else if (args[0] === 'capital' && args[1] === 'loop') {
      await msg.channel.send(config.text.capitalQuestion + ' ' + config.text.flagLoop)
      await sendCapital(msg, true)

    // Help
    } else if (args[0] === 'help') {
      const embed = new Discord.MessageEmbed()
        .setTitle(config.text.helpTitle).setColor(0xff0000).setDescription(config.text.help)
      await msg.channel.send(embed)

    // Unknown argument
    } else {
      await msg.channel.send(config.text.unknown)
    }
  }
})

/**
 * Login the bot
 */
if (process.env.TOKEN) {
  client.login(process.env.TOKEN).then(() => {
    console.log('Nice.')
  })
} else {
  console.log('Il manque le token!!!')
}

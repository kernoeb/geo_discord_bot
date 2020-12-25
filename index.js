const Discord = require('discord.js')
const flags = require('./flags.json')
const config = require('./config.json')
const removeAccents = require('remove-accents')

const keys = Object.keys(flags)
const keysLength = keys.length
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
async function sendQuestion(msg, loop) {
  const randFlag = keys[Math.floor(Math.random() * keysLength)]

  if (channels[msg.channel.id]) {
    channels[msg.channel.id].flag = randFlag
    channels[msg.channel.id].pending = true
  } else {
    channels[msg.channel.id] = {flag: randFlag, loop, pending: true}
  }

  await msg.channel.send(randFlag)
  channels[msg.channel.id].pending = false
}

/**
 * Check the answer
 * @param msg message content
 * @param flag answer
 */
function checkAnswer(msg, flag) {
  return removeAccents(msg).replace(/-/g, ' ').toUpperCase()
    === removeAccents(flag).replace(/-/g, ' ').toUpperCase()
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
    if ((command === 'flag' && args[0] === 'stop') || /.*(je(\s.*ne)?\s.*sais\s.*(plus|pas)|aucune\s.*idée).*/i.test(msg.content)) {
      const tmpFlag = flags[channels[msg.channel.id].flag]
      delete channels[msg.channel.id]
      await msg.reply(config.text.stop + ' ' + tmpFlag)

    // Check if answer is correct
    } else if (checkAnswer(msg.content, flags[channels[msg.channel.id].flag])) {
      // Check if loop mode
      if (channels[msg.channel.id].loop) {
        await msg.react('👍')
        await sendQuestion(msg, true)
      } else {
        delete channels[msg.channel.id] // Delete the current channel in object
        await msg.reply('Bravo!')
      }
    } else await msg.react('👎')

  // Check for prefix + flag commands
  } else if (command === 'flag') {
    // Not loop mode
    if (!args.length) {
      await msg.channel.send(config.text.flagQuestion)
      await sendQuestion(msg, false)

    // Loop mode
    } else if (args[0] === 'loop') {
      await msg.channel.send(config.text.flagQuestion + ' ' + config.text.flagLoop)
      await sendQuestion(msg, true)

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

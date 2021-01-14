/**
 * Discord GeoFR
 * @author kernoeb
 */
const Discord = require('discord.js')
const utils = require('./utils')

const client = new Discord.Client()

const flags = require('./data/flags.json')
const departments = require('./data/departments.json')
const letters_digits = require('./data/letters_digits.json')
const config = require('./config.json')

const flagKeys = Object.keys(flags)
const departmentsKeys = Object.keys(departments)

const flagKeysNoCapital = []
for (const i of flagKeys) {
  if (flags[i]['capital']) flagKeysNoCapital.push(i)
}

// Database
const channels = {}


// Bot is ready
client.on('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}!`)
})

// Help message
async function help(msg) {
  const embed = new Discord.MessageEmbed()
    .setTitle(config.text.helpTitle).setColor(0xff0000).setDescription(config.text.help)
  await msg.channel.send(embed)
}

// Global message sender
async function sendAll(msg, mode, args) {
  if (args && !args.length) {
    await help(msg)
    return
  } else if (args && args.length > 2) {
    await msg.channel.send(config.text.unknown)
    return
  }

  const loop = args && args[1] === 'loop'

  if ((mode && mode === 'capital') || (args && args[0] === 'capital')) {
    if (args) await msg.channel.send(config.text.capitalQuestion + (loop ? (' ' + config.text.loopMode) : ''))
    await send(msg, loop, 'capital', flagKeysNoCapital, randFlag => randFlag + ' ' + utils.gras(flags[randFlag].country.split('|').join(', ')))
    return
  } else if ((mode && mode === 'flag') || (args && args[0] === 'flag')) {
    if (args) await msg.channel.send(config.text.flagQuestion + (loop ? (' ' + config.text.loopMode) : ''))
    await send(msg, loop, 'flag', flagKeys, randFlag => randFlag)
    return
  } else if ((mode && mode === 'departmentNumber') || (args && args[0] === 'dep')) {
    if (args) await msg.channel.send(config.text.departmentNumberQuestion + (loop ? (' ' + config.text.loopMode) : ''))
    await send(msg, loop, 'departmentNumber', departmentsKeys, randFlag => randFlag.split('').map(l => letters_digits[l]).join(''))
    return
  } else if ((mode && mode === 'prefecture') || (args && args[0] === 'prefecture')) {
    if (args) await msg.channel.send(config.text.prefectureNumberQuestion + (loop ? (' ' + config.text.loopMode) : ''))
    await send(msg, loop, 'prefecture', departmentsKeys, randFlag => randFlag.split('').map(l => letters_digits[l]).join('') + ' ' + utils.gras(departments[randFlag].name))
    return
  }

  if (!mode) {
    if (args && args.length === 1 && args[0] === 'help') await help(msg)
    else await msg.channel.send(config.text.unknown)
  }
}

// Send message
async function send(msg, loop, mode, keys, textFct) {
  const randFlag = keys[Math.floor(Math.random() * keys.length)]
  setChannels(msg, randFlag, loop, mode)
  await sendChannel(msg, textFct(randFlag))
}

// Reply with stop message
async function stop(msg, mode, flag) {
  if (mode === 'capital') await msg.channel.send(utils.tag(msg.author.id) + ' ' + config.text.stop + ' ' + config.text.answerWas + ' ' + utils.gras(flag['capital']) + '.')
  else if (mode === 'flag') await msg.channel.send(utils.tag(msg.author.id) + ' ' + config.text.stop + ' ' + config.text.answerWas + ' ' + utils.gras(flag['country']) + '.')
  else if (mode === 'departmentNumber') await msg.channel.send(utils.tag(msg.author.id) + ' ' + config.text.stop + ' ' + config.text.answerWas + ' ' + utils.gras(flag['name']) + '.')
  else if (mode === 'prefecture') await msg.channel.send(utils.tag(msg.author.id) + ' ' + config.text.stop + ' ' + config.text.answerWas + ' ' + utils.gras(flag['prefecture']) + '.')
}

// Reply with next message
async function next(msg, mode, flag) {
  if (mode === 'capital') await msg.channel.send(config.text.answerWas + ' ' + utils.gras(flag['capital']) + '.')
  else if (mode === 'flag') await msg.channel.send(config.text.answerWas + ' ' + utils.gras(flag['country']) + '.')
  else if (mode === 'departmentNumber') await msg.channel.send(config.text.answerWas + ' ' + utils.gras(flag['name']) + '.')
  else if (mode === 'prefecture') await msg.channel.send(config.text.answerWas + ' ' + utils.gras(flag['prefecture']) + '.')
}


// Send to channel and remove pending mode
async function sendChannel(msg, text) {
  await msg.channel.send(text)
  channels[msg.channel.id].pending = false
}

// Get Flag
function getFlag(msg, mode) {
  if (['flag', 'capital'].includes(mode)) return flags[channels[msg.channel.id].flag]
  else if (['departmentNumber', 'prefecture'].includes(mode)) return departments[channels[msg.channel.id].flag]
}

// Set channel object
function setChannels(msg, randFlag, loop, mode) {
  if (channels[msg.channel.id]) {
    channels[msg.channel.id].flag = randFlag
    channels[msg.channel.id].pending = true
  } else {
    channels[msg.channel.id] = {flag: randFlag, loop, mode, pending: true}
  }
}

// Check the answer
function checkAnswer(msg, flag, mode) {
  if (mode === 'capital') flag = flag['capital']
  else if (mode === 'flag') flag = flag['country']
  else if (mode === 'departmentNumber') flag = flag['name']
  else if (mode === 'prefecture') flag = flag['prefecture']

  let b = false
  for (const i of flag.split('|')) {
    if (utils.sanitize(msg) === utils.sanitize(i)) {
      b = true
      break
    }
  }
  return b
}

// Messages
client.on('message', async (msg) => {
  if (msg.author.bot || /hmmm*/i.test(msg.content)) return

  const args = msg.content.slice(config.prefix.length).trim().split(' ') // Arguments
  const command = args.shift().toLowerCase() // Command

  if (channels[msg.channel.id]) {
    if (channels[msg.channel.id].pending || (msg.content.startsWith('!') && (!(command === config.command && /(stop|next)/.test(args[0]))))) return // Pending

    const tmpMode = channels[msg.channel.id].mode
    const tmpFlag = getFlag(msg, tmpMode)

    if ((command === config.command && args[0] === 'stop')) { // Stop
      delete channels[msg.channel.id]
      await stop(msg, tmpMode, tmpFlag)
    } else if (((command === config.command && args[0] === 'next') || /(^Je passe|^Suivant$|^Next$)/i.test(msg.content))) { // Next
      if (channels[msg.channel.id].loop) {
        await next(msg, tmpMode, tmpFlag)
        await sendAll(msg, tmpMode)
      } else {
        await msg.react('❌')
      }
    } else if (checkAnswer(msg.content, tmpFlag, tmpMode)) { // Answer
      if (channels[msg.channel.id].loop) {
        await msg.react('👍')
        await sendAll(msg, tmpMode)
      } else {
        delete channels[msg.channel.id]
        await msg.reply('bravo ! :tada:')
      }
    } else {
      await msg.react('👎')
    }
  } else if (command === config.command && msg.content.startsWith(config.prefix)) {
    await sendAll(msg, null, args)
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

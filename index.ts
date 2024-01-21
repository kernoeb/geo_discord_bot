import _chance from "chance";
import utils from "./utils.js";
const chance = new _chance();

import { Client, EmbedBuilder, IntentsBitField, Message } from "discord.js";
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
});

import config from "./config.json";
import departments from "./data/departments.json";
import flags from "./data/flags.json";
import letters_digits from "./data/letters_digits.json";

const flagKeys = Object.keys(flags);
const departmentsKeys = Object.keys(departments);

const flagKeysNoCapital = [];
for (const i of flagKeys) {
	if (flags[i].capital) flagKeysNoCapital.push(i);
}

interface Flag {
	name?: string;
	capital?: string;
	country?: string;
	prefecture?: string;
}

// Database
const channels = {};

// Bot is ready
client.on("ready", () => {
	console.log(`Connecté en tant que ${client.user.tag}!`);
});

// Help message
async function help(msg: Message) {
	const embed = new EmbedBuilder()
		.setColor(0xff0000)
		.setTitle(config.text.helpTitle)
		.setDescription(config.text.help);
	await msg.channel.send({ embeds: [embed] });
}

// Global message sender
async function sendAll(msg: Message, mode: string, args: string[] | null) {
	if (args && !args.length) {
		await help(msg);
		return;
	}
	if (args && args.length > 2) {
		await msg.channel.send(config.text.unknown);
		return;
	}

	const loop = args && args[1] === "loop";

	if ((mode && mode === "capital") || (args && args[0] === "capital")) {
		if (args)
			await msg.channel.send(
				config.text.capitalQuestion + (loop ? ` ${config.text.loopMode}` : ""),
			);
		await send(
			msg,
			loop,
			"capital",
			flagKeysNoCapital,
			(randFlag: string) =>
				`${randFlag} ${utils.gras(
					flags[randFlag].country.split("|").join(", "),
				)}`,
		);
		return;
	}
	if ((mode && mode === "flag") || (args && args[0] === "flag")) {
		if (args)
			await msg.channel.send(
				config.text.flagQuestion + (loop ? ` ${config.text.loopMode}` : ""),
			);
		await send(msg, loop, "flag", flagKeys, (randFlag: string) => randFlag);
		return;
	}
	if ((mode && mode === "departmentNumber") || (args && args[0] === "dep")) {
		if (args)
			await msg.channel.send(
				config.text.departmentNumberQuestion +
					(loop ? ` ${config.text.loopMode}` : ""),
			);
		await send(
			msg,
			loop,
			"departmentNumber",
			departmentsKeys,
			(randFlag: string) =>
				randFlag
					.split("")
					.map((l) => letters_digits[l])
					.join(""),
		);
		return;
	}
	if ((mode && mode === "prefecture") || (args && args[0] === "prefecture")) {
		if (args)
			await msg.channel.send(
				config.text.prefectureNumberQuestion +
					(loop ? ` ${config.text.loopMode}` : ""),
			);
		await send(
			msg,
			loop,
			"prefecture",
			departmentsKeys,
			(randFlag: string) =>
				`${randFlag
					.split("")
					.map((l) => letters_digits[l])
					.join("")} ${utils.gras(departments[randFlag].name)}`,
		);
		return;
	}

	if (!mode) {
		if (args && args.length === 1 && args[0] === "help") await help(msg);
		else await msg.channel.send(config.text.unknown);
	}
}

// Send message
async function send(
	msg: Message,
	loop: boolean,
	mode: string,
	keys: string[],
	textFct: Function,
) {
	const randFlag = chance.pickone(keys);
	setChannels(msg, randFlag, loop, mode);
	await sendChannel(msg, textFct(randFlag));
}

// Reply with stop message
async function stop(msg: Message, mode: string, flag: Flag) {
	if (mode === "capital")
		await msg.channel.send(
			`${utils.tag(msg.author.id)} ${config.text.stop} ${
				config.text.answerWas
			} ${utils.gras(flag.capital)}.`,
		);
	else if (mode === "flag")
		await msg.channel.send(
			`${utils.tag(msg.author.id)} ${config.text.stop} ${
				config.text.answerWas
			} ${utils.gras(flag.country).split("|").join(", ")}.`,
		);
	else if (mode === "departmentNumber")
		await msg.channel.send(
			`${utils.tag(msg.author.id)} ${config.text.stop} ${
				config.text.answerWas
			} ${utils.gras(flag.name)}.`,
		);
	else if (mode === "prefecture")
		await msg.channel.send(
			`${utils.tag(msg.author.id)} ${config.text.stop} ${
				config.text.answerWas
			} ${utils.gras(flag.prefecture)}.`,
		);
}

// Reply with next message
async function next(msg: Message, mode: string, flag: Flag) {
	if (mode === "capital")
		await msg.channel.send(
			`${config.text.answerWas} ${utils.gras(flag.capital)}.`,
		);
	else if (mode === "flag")
		await msg.channel.send(
			`${config.text.answerWas} ${utils
				.gras(flag.country)
				.split("|")
				.join(", ")}.`,
		);
	else if (mode === "departmentNumber")
		await msg.channel.send(
			`${config.text.answerWas} ${utils.gras(flag.name)}.`,
		);
	else if (mode === "prefecture")
		await msg.channel.send(
			`${config.text.answerWas} ${utils.gras(flag.prefecture)}.`,
		);
}

// Send to channel and remove pending mode
async function sendChannel(msg: Message, text: string) {
	await msg.channel.send(text);
	channels[msg.channel.id].pending = false;
}

// Get Flag
function getFlag(msg: Message, mode: string) {
	if (["flag", "capital"].includes(mode))
		return flags[channels[msg.channel.id].flag];
	if (["departmentNumber", "prefecture"].includes(mode))
		return departments[channels[msg.channel.id].flag];
}

// Set channel object
function setChannels(
	msg: Message,
	randFlag: string,
	loop: boolean,
	mode: string,
) {
	if (channels[msg.channel.id]) {
		channels[msg.channel.id].flag = randFlag;
		channels[msg.channel.id].pending = true;
	} else {
		channels[msg.channel.id] = { flag: randFlag, loop, mode, pending: true };
	}
}

// Check the answer
function checkAnswer(msg: string, _flag: Flag, mode: string) {
	let flag: string;
	if (mode === "capital") flag = _flag.capital;
	else if (mode === "flag") flag = _flag.country;
	else if (mode === "departmentNumber") flag = _flag.name;
	else if (mode === "prefecture") flag = _flag.prefecture;

	let b = false;
	for (const i of flag.split("|")) {
		if (utils.sanitize(msg) === utils.sanitize(i)) {
			b = true;
			break;
		}
	}
	return b;
}

// Messages
client.on("messageCreate", async (msg) => {
	if (msg.author.bot || /hmm+/i.test(msg.content)) return;

	const args = msg.content.slice(config.prefix.length).trim().split(" "); // Arguments
	const command = args.shift().toLowerCase(); // Command

	if (channels[msg.channel.id]) {
		if (channels[msg.channel.id].pending) {
			console.log(`Pending : ${msg.channel.id}`);
			return;
		}
		if (
			msg.content.startsWith("!") &&
			!(command === config.command && /(stop|next)/.test(args[0]))
		)
			return;

		const tmpMode = channels[msg.channel.id].mode;
		const tmpFlag = getFlag(msg, tmpMode);

		if (command === config.command && args[0] === "stop") {
			// Stop
			delete channels[msg.channel.id];
			await stop(msg, tmpMode, tmpFlag);
		} else if (
			(command === config.command && args[0] === "next") ||
			/(^Je passe|^Suivant$|^Next$)/i.test(msg.content)
		) {
			// Next
			if (channels[msg.channel.id].loop) {
				channels[msg.channel.id].pending = true;
				await next(msg, tmpMode, tmpFlag);
				await sendAll(msg, tmpMode, null);
				channels[msg.channel.id].pending = false;
			} else {
				await msg.react("❌");
			}
		} else if (checkAnswer(msg.content, tmpFlag, tmpMode)) {
			// Answer
			if (channels[msg.channel.id].loop) {
				channels[msg.channel.id].pending = true;
				await msg.react("👍");
				await sendAll(msg, tmpMode, null);
				channels[msg.channel.id].pending = false;
			} else {
				delete channels[msg.channel.id];
				await msg.reply("bravo ! :tada:");
			}
		} else {
			await msg.react("👎");
		}
	} else if (
		command === config.command &&
		msg.content.startsWith(config.prefix)
	) {
		await sendAll(msg, null, args);
	}
});

/**
 * Login the bot
 */
if (process.env.TOKEN) {
	client.login(process.env.TOKEN).then(() => {
		console.log("Nice.");
	});
} else {
	console.log("Token missing");
	process.exit(1);
}

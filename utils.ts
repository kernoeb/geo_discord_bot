import removeAccents from "remove-accents";

export default {
	gras: (msg: string) => {
		return `**${msg}**`;
	},
	tag: (id: string) => {
		return `<@${id}>`;
	},
	sanitize: (text: string) => {
		return removeAccents(text)
			.replace(/[-‘’']/g, " ")
			.replace(/[.*?!]/g, "")
			.toUpperCase()
			.trim();
	},
};

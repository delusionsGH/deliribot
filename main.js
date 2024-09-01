import { RoarBot } from "@mbw/roarbot";
import chalk from "npm:chalk";
import { initChat } from "@mumulhl/duckduckgo-ai-chat/";

const config = JSON.parse(await Deno.readTextFile("config.json"));
const log = console.log;
log(chalk.blue(`setting ai model...`));
const ai = await initChat("gpt-4o-mini");
const aiModel = "gpt-4o-mini";
log(chalk.blue(`set model to ${aiModel}.`));
const bot = new RoarBot({
    admins: [config.adminUsername],
});

bot.command("about", { // sample command, copy for new commands
    args: [],
    fn: async function (reply, _args, _post) {
        await reply(
            '```\ndeliribot (previously zzbot.js)\nversion v2.1.6 (240824)\nroarbot made by mybearworld, deliribot by delusions\n\nlatest command added: ai\n"does the ai thing"',
        );
    },
});
bot.command("whois", { // looks for the data of a user, YES I KNOW "fetc" IS WEIRD but mbw told me not to use fetch :(
    args: [{ name: "name", type: "string" }],
    fn: async function (reply, [name], _post) {
        let fetc = await bot.user(name); // fetch the userdata from api/users/(user)
        log(chalk.blue(`fetching @${name}'s userdata...`));
        try {
            fetc = await bot.user(name);
        } catch (_error) {
            return;
        }
        log(chalk.green(`fetched @${name}'s userdata`));
        const result = `# ***@${name}***\n[link to profile picture](https://uploads.meower.org/icons/${fetc.avatar})\n\n**Quote:**\n${fetc.quote.replace(/^/gm, "> ")}\n\n**UUID:** "${fetc.uuid}"\n**Avatar's hex code:**  ${fetc.avatar_color}\n**Permission level**: ${fetc.permissions}`; // combine it all
        await reply(result);
        log(chalk.green.bold(`whois successfully run!`)); // yay it worked
    },
});
bot.command("error", {
    args: [],
    admin: true,
    fn: async function (reply, _args, _post) {
            for (let i = 0; i < 3; i++) {
                await reply("Uncaught error!");
            }
        }
    },
);
bot.command("exit", {
    args: [],
    admin: true,
    fn: async function (reply, _args, _post) {
            await reply("Shutting down zzbot.js.");
            Deno.exit();
        }
    },
);
bot.command("echo", { // does the bot work? if this command works, it certainly does, at least partially
    args: [{ name: "message", type: "full" }],
    admin: true,
    fn: async function (reply, args, _post) {
        await reply(args[0]);
    },
});
bot.command("ai", { // ai chat
    args: [{ name: "message", type: "full" }],
    admin: true,
    fn: async function (reply, [message], _post) {
            log(chalk.blue(`sending message ("${message}")...`));
            const aimessage = await ai.fetchFull(message);
            await reply(aimessage);
            log(chalk.green.bold(`${aiModel} replied with: ${aimessage}`));
        }
    },
);

bot.login(config.botUsername, config.botPassword);

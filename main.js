import { RoarBot } from "@mbw/roarbot";
import chalk from "npm:chalk";
import { initChat } from "@mumulhl/duckduckgo-ai-chat/";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
const octokit = new Octokit();

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
        const result = `# ***@${name}***\n[link to profile picture](https://uploads.meower.org/icons/${fetc.avatar})\n\n**Quote:**\n${fetc.quote.replace(/^/gm, "> ")}\n\n**UUID:** "${fetc.uuid}"\n**Avatar's hex code:**  #${fetc.avatar_color}\n**Permission level**: ${fetc.permissions}`; // combine it all
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
    fn: async function (reply, [message], _post) {
            log(chalk.blue(`sending message ("${message}")...`));
            const aimessage = await ai.fetchFull(message);
            await reply(aimessage);
            log(chalk.green.bold(`${aiModel} replied with: ${aimessage}`));
        }
    },
);
bot.command("joke", { // tells a joke, what else can i say
    args: [],
    fn: async function (reply, _args, _post) {
        log(chalk.blue(`fetching, give me a second`));
        try {
            const response = await fetch("https://official-joke-api.appspot.com/random_joke");
            const joke = await response.json();
            await reply(`here you go:\n\n${joke.setup}\n${joke.punchline}`);
            log(chalk.green.bold(`delivered!`));
        } catch (error) {
            log(chalk.red(`error fetching: ${error.message}`));
            await reply("whoops, no joke for you, something's broken 👍");
        }
    },
});
bot.command("weather", {
    args: [{ name: "city", type: "full" }],
    fn: async function (reply, [city], _post) {
        log(chalk.blue(`Fetching weather...`));
        const apiKey = config.owm_api_key;
        try {
            const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            if (data.cod === 200) {
                const weather = `weather in ${data.name}:\n
temp: ${data.main.temp}°C
what the temp feels like: ${data.main.feels_like}°C
humidity: ${data.main.humidity}%
description of the sky: ${data.weather[0].description}`;
                await reply(weather);
                log(chalk.green.bold(`weather info delivered`));
            } else {
                await reply(`well guess what, i dont think that place exists`);
                log(chalk.yellow(`could not find info`));
            }
        } catch (error) {
            log(chalk.red(`error: ${error.message}`));
            await reply("i dont feel like fetching the weather rn (joking, something broke)");
        }
    },
});
bot.command("githubrepos", {
    args: [{ name: "username", type: "string" }],
    fn: async function (reply, [username], _post) {
        log(chalk.blue(`fetching repositories`));
        try {
            const response = await octokit.repos.listForUser({
                username: username,
                per_page: 10
            });

            const repos = response.data.map(repo => repo.name);
            
            if (repos.length === 0) {
                await reply(`no public repositories found for user`);
            } else {
                const repoList = repos.join(", ");
                await reply(`repositories for ${username}:\n${repoList}`);
            }
            
            log(chalk.green.bold(`successfully fetched repositories for ${username}`));
        } catch (error) {
            log(chalk.red(`error fetching repositories: ${error.message}`));
            await reply(`error! please make sure username is correct`);
        }
    },
});
bot.command("npm", {
    args: [{ name: "package", type: "string" }],
    fn: async function (reply, [packageName], _post) {
        log(chalk.blue(`Fetching npm package info...`));
        try {
            const response = await fetch(`https://registry.npmjs.org/${packageName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.error) {
                await reply(`packagenot found!`);
                return;
            }

            const latestVersion = data['dist-tags'].latest;
            const packageInfo = data.versions[latestVersion];

            const infoMessage = `
# ${packageName}
latest version: ${latestVersion}
description: ${packageInfo.description || 'no description available'}
author: ${packageInfo.author ? packageInfo.author.name : 'unknown'}
license: ${packageInfo.license || 'not specified'}
${packageInfo.homepage || 'homepage not specified'}
            `.trim();

            await reply(infoMessage);
            log(chalk.green.bold(`successfully fetched npm package info for ${packageName}`));
        } catch (error) {
            log(chalk.red(`error fetching npm package info: ${error.message}`));
            await reply(`error occurred while fetching information for package`);
        }
    },
});
bot.command("github-user", {
    args: [{ name: "username", type: "string" }],
    fn: async function (reply, [username], _post) {
        log(chalk.blue(`fetching gh user info for...`));
        try {
            const { data: user } = await octokit.users.getByUsername({ username });

            const userInfo = `
# ${user.login}
-# ${user.name || '<not specified>'}

bio: ${user.bio || 'no bio provided'}
location: ${user.location || 'not specified'}
public repos: ${user.public_repos}
followers: ${user.followers}
following: ${user.following}
created: ${new Date(user.created_at).toDateString()}
            `.trim();

            await reply(userInfo);
            log(chalk.green.bold(`successfully fetched gh user info`));
        } catch (error) {
            log(chalk.red(`error fetching gh user info: ${error.message}`));
            await reply(`error, make sure username is correct!`);
        }
    },
});

bot.login(config.botUsername, config.botPassword);

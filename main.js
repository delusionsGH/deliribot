import { RoarBot } from "@mbw/roarbot";
import chalk from "npm:chalk";
import { initChat } from "@mumulhl/duckduckgo-ai-chat/";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import "jsr:@std/dotenv/load";
const octokit = new Octokit();
const config = {};

if (Deno.env.get("adminUsername") != undefined) {
    config.adminUsername = Deno.env.get("adminUsername");
}
if (Deno.env.get("owm_api_key") != undefined) {
    config.owm_api_key = Deno.env.get("owm_api_key");
}
if (Deno.env.get("debugWeatherLocation") != undefined) {
    config.debugWeatherLocation = Deno.env.get("debugWeatherLocation");
}
if (Deno.env.get("botUsername") != undefined) {
    config.botUsername = Deno.env.get("botUsername");
}
if (Deno.env.get("botPassword") != undefined) {
    config.botPassword = Deno.env.get("botPassword");
}
if (Deno.env.get("discordWebhook") != undefined) {
    config.discordWebhook = Deno.env.get("discordWebhook");
}
if (Deno.env.get("hbUrl") != undefined) {
    config.hbUrl = Deno.env.get("hbUrl");

    setInterval(() => {
        try {
          fetch(config.hbUrl);
          console.log("HeartBeat sent to " + config.hbUrl);
        } catch (error) {
          console.log("Heartbeat failed");
          console.error(error);
        }
      }, 90000);

}


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
            `***deliribot***\nv3.0 ***BETA***\n-# roarbot made by mybearworld, ***deliribot*** by delusions\n-# This is a beta version of ***deliribot***. Report any issues on the ***deliribot*** GitHub: github.com/delusionsGH/deliribot`,
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
bot.command("error", { // Uncaught error!
    args: [],
    admin: true,
    fn: async function (reply, _args, _post) {
            for (let i = 0; i < 3; i++) {
                await reply("Uncaught error!");
            }
        }
    },
);
bot.command("exit", { // goobye
    args: [],
    admin: true,
    fn: async function (reply, _args, _post) {
            await reply("Shutting down!");
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
bot.command("weather", { // weather
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
bot.command("ghrepos", { // github repo search for users
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
bot.command("npm", { // looks for the data of an npm package
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
                await reply(`package not found!`);
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
bot.command("ghuser", { // github userdata
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
bot.command("weatherdebug", { // debug
    admin: true,
    args: [],
    fn: async function (reply, _post) {
        log(chalk.blue(`Fetching weather...`));
        const apiKey = config.owm_api_key;
        try {
            const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(config.debugWeatherLocation)}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            if (data.cod === 200) {
                const weather = `weather (no im not telling you the location)\n
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
let words = [];
let currentWord = "";
let guessesLeft = 6;
let gameActive = false;
let guessHistory = [];

async function fetchWordList() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        words = text.split('\n').filter(word => word.trim() !== '');
        log(chalk.green(`successfully fetched ${words.length} words`));
    } catch (error) {
        log(chalk.red(`Error fetching word list: ${error.message}`));
        // If fetch fails, we'll use a small default list
        words = ["python", "coding", "script", "array", "function", "variable", "loop"];
    }
}

await fetchWordList();

bot.command("wordle", { // wordle by josh wardle, ported to meower
    args: [{ name: "guess", type: "string", optional: true }],
    fn: async function (reply, [guess], _post) {
        if (!gameActive) {
            if (words.length === 0) {
                await reply("error: word list is empty.");
                return;
            }
            currentWord = words[Math.floor(Math.random() * words.length)];
            guessesLeft = 6;
            gameActive = true;
            guessHistory = [];
            await reply(`# game started!\nyou have 6 guesses\nuse 'wordle [your guess]' to play\nthe word has ${currentWord.length} letters`);
            return;
        }

        if (!guess) {
            await reply(`you have ${guessesLeft} guesses left, word has ${currentWord.length} letters`);
            return;
        }

        if (guess.length !== currentWord.length) {
            await reply(`your guess must be ${currentWord.length} letters long!`);
            return;
        }

        guessesLeft--;

        if (guess.toLowerCase() === currentWord) {
            gameActive = false;
            guessHistory.push({ guess, result: "🟩".repeat(currentWord.length) });
            await reply(`# gg!\nyou guessed the word: ${currentWord}\n\n${formatGuessHistory()}`);
            return;
        }

        let result = "";
        for (let i = 0; i < currentWord.length; i++) {
            if (guess[i].toLowerCase() === currentWord[i]) {
                result += "🟩";
            } else if (currentWord.includes(guess[i].toLowerCase())) {
                result += "🟨";
            } else {
                result += "⬛";
            }
        }

        guessHistory.push({ guess, result });

        if (guessesLeft === 0) {
            gameActive = false;
            await reply(`# game over!\nword was: ${currentWord}\n\n${formatGuessHistory()}`);
        } else {
            await reply(`${formatGuessHistory()}`);
        }
    },
});
function formatGuessHistory() {
    return guessHistory.map(({ guess, result }) => 
        `${result} | ${guess.padEnd(currentWord.length)}`
    ).join('\n');
}
const polls = new Map();

bot.command("poll", { // polls because meower wont add them
    args: [{ name: "fullInput", type: "full" }],
    fn: async function (reply, [fullInput], _post) {
        log(chalk.blue(`Creating a new poll...`));
        try {
            const [question, optionsString] = fullInput.split('|').map(s => s.trim());
            
            if (!question || !optionsString) {
                await reply("provide a question and options separated by '|'!\nexample: \`\`\`poll What's your favorite color? | Red, Blue, Green\`\`\`");
                return;
            }

            const options = optionsString.split(',').map(option => option.trim());
            
            if (options.length < 2) {
                await reply("provide at least two options!");
                return;
            }

            const pollId = Date.now().toString();
            const poll = {
                question,
                options: options.map(option => ({ text: option, votes: 0 })),
                voters: new Set()
            };

            polls.set(pollId, poll);

            const pollMessage = formatPollMessage(poll, pollId);
            await reply(pollMessage);

            log(chalk.green.bold(`poll created successfully`));
        } catch (error) {
            log(chalk.red(`error creating poll: ${error.message}`));
            await reply("error creating poll!\nhost, see console for more info");
        }
    },
});
bot.command("vote", { // part of polls
    args: [
        { name: "pollId", type: "string" },
        { name: "optionIndex", type: "number" }
    ],
    fn: async function (reply, [pollId, optionIndex], post) {
        log(chalk.blue(`processing vote...`));
        try {
            const poll = polls.get(pollId);
            if (!poll) {
                await reply("invalid poll id!\nthe poll may have expired or doesn't exist");
                return;
            }

            if (poll.voters.has(post.userId)) {
                await reply("you have already voted in this poll!");
                return;
            }

            if (optionIndex < 1 || optionIndex > poll.options.length) {
                await reply(`invalid option!\nplease choose a number between 1 and ${poll.options.length}`);
                return;
            }

            poll.options[optionIndex - 1].votes++;
            poll.voters.add(post.userId);

            const updatedPollMessage = formatPollMessage(poll, pollId);
            await reply(updatedPollMessage);

            log(chalk.green.bold(`vote processed successfully!`));
        } catch (error) {
            log(chalk.red(`error processing vote: ${error.message}`));
            await reply(`error processing vote!\nhost, see console for more info`);
        }
    },
});
function formatPollMessage(poll, pollId) {
    let message = `# ${poll.question}\n`;
    message += `(${pollId})\n\n`;
    poll.options.forEach((option, index) => {
        message += `${index + 1}: ${option.text} | ${option.votes} votes\n`;
    });
    message += "\n-# how to vote: \"@deliribot vote [id] [option number]\"\n";
    return message;
}
const webhookUrl = config.discordWebhook;
async function sendDiscordMessage(content) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: content,
                username: `deliribot (${bot.user})`,
            }),
        });

        if (response.ok) {
            chalk.green.bold('message sent successfully!');
        } else {
            chalk.red.bold('failed to send message:', response.statusText);
        }
    } catch (error) {
        console.error('error sending message:', error);
    }
}
bot.command("webhook", { // sends to a webhook url of your choice
    args: [{ name: "message", type: "full" }],
    fn: async function (reply, [message], _post) {

        try {
            await sendDiscordMessage(message);
            await reply(`attempted to send to discord via webhook`);
        } catch (error) {
            console.error('error in webhook command:', error);
            await reply("sending message failed!");
        }
    }
});
const ENDPOINT_NAMES = new Map([
    ['uploads.meower.org', 'uploads'],
    ['api.meower.org/search', 'search'],
    ['api.meower.org', 'api'],
    ['api.meower.org/users/', 'apiuserdata'],
    ['api.meower.org/users/deliribot/posts', 'apiuserpost']
]);
async function checkEndpoint(url) {
    try {
        const response = await fetch(url);
        return { endpoint: url, isUp: response.ok };
    } catch (_error) {
        return { endpoint: url, isUp: false };
    }
}
function checkMeowerAPI() {
    const endpoints = [
        'https://uploads.meower.org/attachments/LSXA9oIyV7D1PNoLSTyv6dPQ/Frame_1.png?preview',
        'https://api.meower.org',
        'https://api.meower.org/search/home?autoget=1&page=1&q=hi',
        'https://api.meower.org/users/deliribot',
        'https://api.meower.org/users/deliribot/posts?autoget=1&page=1'
    ];
    return Promise.allSettled(endpoints.map(checkEndpoint));
}
function formatDate(date) {
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${monthName}/${year}, ${hours}:${minutes}`;
}
bot.command("meowerdiag", {
    args: [],
    fn: async function (reply, _post) {
        log(chalk.blue(`checking...`));
        await reply("checking...\n\n-# meowerDiag (BETA) v0.1.0, may not be correct\n-# does not have full diagnostics, will add more soon")
        try {
            const apiStatus = await checkMeowerAPI();
            const statusLines = apiStatus.map(result => {
                if (result.status === 'fulfilled') {
                    const { endpoint, isUp } = result.value;
                    const status = isUp ? "🟢 UP" : "🔴 DOWN";
                    const name = getEndpointName(endpoint);
                    return `${name} | ${status}`;
                }
                return null;
            }).filter(Boolean);
            const statusMessage = [
                `current state of meower services as of ${formatDate(new Date(Date.now()))}:`,
                ...statusLines,
                '',
                '-# meowerDiag (BETA) v0.1.0, may not be correct\n-# does not have full diagnostics, will add more soon'
            ].join('\n\n');
            await reply(statusMessage);
            log(chalk.green.bold(`status check completed`));
        } catch (error) {
            log(chalk.red(`error checking status: ${error.message}`));
            await reply("error!");
        }
    },
});
function getEndpointName(endpoint) {
    for (const [key, value] of ENDPOINT_NAMES.entries()) {
        if (endpoint.includes(key)) {
            return value;
        }
    }
    return 'unknown';
}
bot.login(config.botUsername, config.botPassword);
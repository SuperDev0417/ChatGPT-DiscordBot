import dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js'

dotenv.config()

const commands = [
    {
        name: 'ask',
        description: 'Ask Anything!',
        options:[
            {
                name:"question",
                description:"Your question",
                type:3,
                required:true
            }
        ]
    },
];

async function initChatGPT() {
    const api = new ChatGPTAPI({ sessionToken: process.env.SESSION_TOKEN })

    await api.ensureAuth()

    return api;
}

async function initDiscordCommands(){
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}



async function main() {

    const chatGTP = await initChatGPT()

    await initDiscordCommands()

    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildIntegrations] });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    function askQuestion(question,interaction){
        let tmr = setTimeout(()=>{
            interaction.editReply({content:"Oppss, something went wrong! (Timeout)"})
        },45000)

        chatGTP.sendMessage(question).then((response)=>{
            clearTimeout(tmr)
            interaction.editReply({content:response})
        }).catch(()=>{
            interaction.editReply({content:"Oppss, something went wrong! (Error)"})
        })
    }

    client.on("interactionCreate", async interaction => {
        const question = interaction.options.getString("question")
        interaction.reply({content:"let me think..."})
        try{
            askQuestion(question,interaction)
        }catch(e){
            console.error(e)
        }
        
    });
    
    client.login(process.env.DISCORD_BOT_TOKEN);
}

main()
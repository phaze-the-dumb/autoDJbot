const dcord = require('discord.js');
const yts = require('yt-search');
const getJSON = require('get-json');
const bot = new dcord.Client();
const fs = require('fs');
const jsmediatags = require("jsmediatags");
const disbut = require('discord.js-buttons')(bot);
const disbut1 = require('discord-buttons')(bot);

let path = 'Path to folder of .mp3 files'
let TOKEN = 'Bot token'

var queue = []
var recentPlayed = []

var dispatcher
var connect

var allSongs = []
var eMSG
var amnt = 0

bot.on('clickButton', async (button) => {
    let data = JSON.parse(button.id)

    if(data.command === "skip"){
        if(amnt === 0){
            amnt = 1
            nextSong()

            await button.reply.send('I skipped the song.').catch(e => {})
        } else if(amnt === 1){
            amnt = 0
        }
    }
});

fs.readdir(path, function(err, data){
    if(err)return console.log(err);

    data.forEach(song => {
        if(song.includes('.mp3')){
            allSongs.push(song)
        }
    })

    setInterval(function(){
        if(queue.length < 3){
            queue.push(allSongs[Math.floor(Math.random() * allSongs.length)])
        }
        //console.log(queue)
    }, 1000)

    bot.on('ready', () => {
        console.log('IM ONLINE')
    })
    
    bot.on('message', async function(msg){
        if(msg.content === "!leave"){
            var VC = msg.member.voice.channel;
            if (!VC)
                return msg.reply("You need to be in a voice channel to play music")
                VC.leave()
        }

        if(msg.content === "!join"){
            if(recentPlayed.length > 3){
                recentPlayed.shift()
            }

            let songId = Math.floor(Math.random() * allSongs.length);
        
            queue.push(allSongs[songId])
    
            var VC = msg.member.voice.channel;
            if (!VC)
                return msg.reply("You need to be in a voice channel to play music")
                VC.join()
                    .then(connection => {
                        connect = connection

                        eMSG = msg
                        nextSong()
                    })
                        .catch(console.error);
        }

        if(msg.content === "!skip"){
            nextSong()
        }

        if(msg.content.startsWith("!volume ")){
            let volume = (msg.content.split('!volume ')).join('')

            volume = parseInt(volume)

            if(volume < 0){
                msg.channel.send('The volume may not be less than 0 `0 - 100`')
            } else{
                if(volume > 100){
                    msg.channel.send('The volume may not be bigger than 100 `0 - 100`')
                } else{
                    dispatcher.setVolume(volume / 100)

                    msg.channel.send('I set the volume to ' + volume)
                }
            }
            
        }
    })
    
    bot.login(TOKEN)
})

function nextSong(){
    let msg = eMSG
    paused = false

    if(dispatcher){
        dispatcher.removeAllListeners()
        console.log('Removed Listeners')
    }

    queue.shift()

    let songurl = path + '/' + queue[0]
    jsmediatags.read(songurl, {
        onSuccess: function(tag) {
            const buffer = Buffer.from(tag.tags.picture.data)
            const attachment = new dcord.MessageAttachment(buffer, 'img.png')

            let button = new disbut.MessageButton()
                .setStyle('blurple') //default: blurple
                .setLabel('Skip') //default: NO_LABEL_PROVIDED
                .setID(JSON.stringify({
                    command: "skip"
                }));

            const embed = new dcord.MessageEmbed()
                .setColor('#00fff2')
                .setTitle('Now Playing')
                .setURL('')
                .setAuthor('', '', '')
                .setDescription(tag.tags.title + ' - ' + tag.tags.artist + '\nAlbum: ' + tag.tags.album)
                .setThumbnail()
                .setTimestamp()
                .setFooter('© ItzWiresDev#6193 2020', '');
    
            msg.channel.send('', {files: [
                attachment
            ], embed, button: button})
        },
        onError: function(error) {
            console.log(':(', error.type, error.info);
        }
    });

    console.log(songurl)
    dispatcher = connect.play(songurl, { volume: 0.5});

    dispatcher.on('finish', nextSong)
}
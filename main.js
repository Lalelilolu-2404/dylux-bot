const { WAConnection: _WAConnection, ReconnectMode, MessageType, MessageOptions } = require('@adiwajshing/baileys');
const simple = require("./whatsapp/connecting.js");
const WAConnection = simple.WAConnection(_WAConnection);
const Fg = new WAConnection();
const qrcode = require("qrcode-terminal");
const {
  cekWelcome,
  cekAntilink,
  cekBadword,
  cekAntidelete,
  cekDetect
} = require('./functions/group');
const {
  getCustomWelcome,
  getCustomBye
} = require('./functions/welcome')
const fs = require("fs");
const thumb = fs.readFileSync('./temp/fg.jpg')
const { getBuffer, week, time, tanggal} = require("./library/functions");
const { color } = require("./library/color");
async function starts() {
	Fg.autoReconnect = ReconnectMode.onConnectionLost;
	Fg.version = [2, 2140, 6];
	Fg.logger.level = 'warn';
	Fg.on('qr', () => {
	console.log(color('[QR]','white'), color('Escanee el codigo QR para conectarse...'));
	});

	fs.existsSync('./whatsapp/sessions.json') && Fg.loadAuthInfo('./whatsapp/sessions.json');
	
	await Fg.connect({timeoutMs: 30*1000});
  fs.writeFileSync('./whatsapp/sessions.json', JSON.stringify(Fg.base64EncodedAuthInfo(), null, '\t'));
  //link = 'https://chat.whatsapp.com/G5sXrkhJ0pb0Tu8nhWLaFK'
  //Fg.query({ json:["action", "invite", `${link.replace('https://chat.whatsapp.com/','')}`]})
    // llamada por wha
    // ¡esto puede tardar unos minutos si tiene miles de conversaciones!!
    Fg.on('chats-received', async ({ hasNewChats }) => {
        console.log(`‣ Tu tienes ${Fg.chats.length} chats, new chats available: ${hasNewChats}`);

        const unread = await Fg.loadAllUnreadMessages ();
        console.log ("‣ Tú tienes " + unread.length + " mensajes no leídos");
    });
    // called when WA sends chats
    // ¡esto puede tardar unos minutos si tiene miles de contactos!
    Fg.on('contacts-received', () => {
        console.log('‣ Tú tienes ' + Object.keys(Fg.contacts).length + ' contactos');
    });
    
    //--- Bienvenida y Despedida 
    
  Fg.on('group-participants-update', async (anu) => {
      isWelcome = cekWelcome(anu.jid);
      if(isWelcome === true) {
      mdata = await Fg.groupMetadata(anu.jid);
      if (anu.action == 'add') {
        num = anu.participants[0];
          try {
	      ppimg = await Fg.getProfilePicture(`${anu.participants[0].split('@')[0]}@c.us`);
	    } catch {
	      ppimg = 'https://i.ibb.co/PZNv21q/Profile-FG98.jpg';
	    } 
	 let username = Fg.getName(num)
      let about = (await Fg.getStatus(num).catch(console.error) || {}).status || ''
      let member = mdata.participants.length
      let tag = '@'+num.split('@')[0]
	    let buff = await getBuffer(ppimg);
	    let welc = await getCustomWelcome(mdata.id)
	    //capt = welc.replace('@user', tag).replace('@name', username).replace('@bio', about).replace('@date', tanggal).replace('@group', mdata.subject);
	   capt = `Hola @${num.split('@')[0]} \nBienvenido/a al Grupo ${mdata.subject}\n`;
	    
	    Fg.send2ButtonLoc(mdata.id, buff, capt, 'Sígueme en Instagram\nhttps://www.instagram.com/fg98._', '⦙☰ MENU', '/menu', '⏍ INFO GP', '/infogp', false, {
	      contextInfo: {
            mentionedJid: Fg.parseMention(capt)
	      }
	    });
      } else if (anu.action == 'remove') {
        num = anu.participants[0];
        let bye = await getCustomBye(mdata.id);
        //capt = bye.replace('@user', tag).replace('@name', username).replace('@bio', about).replace('@date', tanggal).replace('@group', mdata.subject);
	   capt = `*Adios* @${num.split('@')[0]}`;
	    Fg.sendMessage(mdata.id, capt, MessageType.text, { contextInfo: {"mentionedJid": [num]}});
      }
  }
});

//--antidelete 
Fg.on('message-delete', async (m) => {
    if (m.key.fromMe) return;
    let isAntidelete = cekAntidelete(m.key.remoteJid);
    if (isAntidelete === false) return;
    m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
    const Type = Object.keys(m.message)[0];
    await Fg.reply(m.key.remoteJid, `
━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━

*▢ Nombre :* @${m.participant.split`@`[0]} 
*▢ Hora :* ${time}

━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━

`.trim(), m.message, {
      contextInfo: {
        mentionedJid: [m.participant]
      }
    });
    Fg.copyNForward(m.key.remoteJid, m.message).catch(e => console.log(e, m));
  });

//---llamada auto block
Fg.on("CB:Call", json => {
  let call;
  calling = JSON.parse(JSON.stringify(json));
  call = calling[1].from;
  Fg.sendMessage(call, `*${Fg.user.name}* No hagas llamadas al bot, tu número se bloqueará automáticamente`, MessageType.text).then(() => Fg.blockUser(call, "add"));
}); 


}

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
 
function nocache(module, cb = () => { }) {
  console.log("‣ Modulo", `'${module}'`, "se está revisando si hay cambios");
  fs.watchFile(require.resolve(module), async () => {
    await uncache(require.resolve(module));
    cb(module);
    });
    }


/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(module)];
      resolve();
      } catch (e) {
        reject(e);
        }
        });
        }

require('./index.js');
nocache('./index.js', module => console.log(color(`Index.js Se actualizó!`)));


Fg.on('chat-update', async (message) => {
require('./index.js')(Fg, message);
});

starts();

//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//



//Déclaration des variables

'use strict';
const express = require('express');
const bodyParser = require('body-parser');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<footer id=\"gWidget\"></footer><script src=\"https://widget.glitch.me/widget.min.js\"></script></body></html>";
var res;

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});


// Display the web page truc qui sert a rien
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});




// Fonction qui va recevoir les events et les analyser pour réaliser les actions a faire
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});






// Reçois les informations de la foncion précedentes et analyse le message
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    var messageData = {
  "recipient":{
  	"id":senderID
  },
  "sender_action":"typing_on"
};
    // fonction qui permet d'afficher les 3 points quand le bot répond (sert a montrer à l'utilisateur que le bot va lui répondre)
    
    callSendAPI(messageData);
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'product':
        sendProductMessage(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}



// Fonction qui reçoit les callback et qui va les analyser
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;
    var messageData = {
  "recipient":{
  	"id":senderID
  },
  "sender_action":"typing_on"
};
  var payload = event.postback.payload;
  payload =payload.split('||');
  console.log(payload[1]);
  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
   callSendAPI(messageData);
  switch(payload[0]){
      case 'getStarted' :
      sendGenericMessage(senderID);
      break;
      case 'achat' :
      sendAchatMessage(senderID);
      break;
      case 'collection' :
      sendCollectionMessage(senderID);
      break;
      case 'information' :
      sendProductMessage(senderID, payload[1]);
      break;
      case 'nutri':
      sendNutriMessage(senderID,payload[1]);
      break;
      default:
        sendTextMessage(senderID, "postBack called");break
                   }}






//////////////////////////
// Fonction va envois un message de type Text des plus classique
//////////////////////////

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}





//////////////////////////
// Fonction va envois un message de type Générique (Ex : affichage des collections par exemple)
//////////////////////////

function sendGenericMessage(recipientId) {
  var messageData = {
  "recipient":{
    "id":recipientId
  },
  "message":{
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Bonjour, \nPermettez moi de vous guider.\nQue voulez vous faire ?",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://tsechatbot.myshopify.com",
            "title":"Ouvrir le site"
          },
          {
            "type":"postback",
            "title":"Voir nos collections ",
            "payload":"collection"
          },{
            "type":"web_url",
            "url":"https://tsechatbot.myshopify.com",
            "title":"FAQ",
            
          }
        ]
      }
    }
  }
};  
  console.log(messageData.message.attachment.payload.elements);
  callSendAPI(messageData);
}




//////////////////////////
// Fonction va aller chercher des informations sur shopify (produits en fonction de l'id de la collection)
//////////////////////////

function sendProductMessage(recipientId,name) {
  var uri = "https://tsechatbot.myshopify.com/admin/products.json?collection_id="+name;
  console.log(uri);
  getProduit(uri,recipientId,name);
}
function getProduit(url,recipientId,name) {
  
    var xhr = new XMLHttpRequest();
  
    xhr.open('GET', url, true,"62ffda2cd474e07070563fe4089c443f","6295eda9c2499abe83a342338e7b5562");
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        
        res = JSON.parse(xhr.responseText);
        console.log(res);
        //console.log("bondour");
        creationmessage(res,recipientId,name);
        
      } else {
          console.log(status);

      }
    };
    xhr.send();
};






//////////////////////////
// Fonction va aller chercher des informations sur shopify (Collection)
//////////////////////////

function sendCollectionMessage(recipientId){
  getCollection('https://tsechatbot.myshopify.com/admin/custom_collections.json',recipientId,console.log);
}
function getCollection(url,recipientId) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true,"62ffda2cd474e07070563fe4089c443f","6295eda9c2499abe83a342338e7b5562");
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        res = JSON.parse(xhr.responseText);
        console.log(res);
        creationliste(res,recipientId);
       } 
    };
    xhr.send();
};
function creationliste(data,recipientId){
  var k = 0;
  var message;
  var messageData = {
  "recipient":{
    "id":recipientId
  }, "message": {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "generic",
            "elements": [
            ]  
        }
    }
}
    
};
  for(var t in data.custom_collections){
    //console.log(data.custom_collections);
    message =    {
                    "title": data.custom_collections[k].title,
                    "image_url": data.custom_collections[k].image.src,
                    "subtitle": data.custom_collections[k].body_html,
                    "default_action": {
                        "type": "web_url",
                        "url": "https://tsechatbot.myshopify.com/collections/"+data.custom_collections[k].handle,
                        },
                    "buttons": [{
                      "title": "Voir plus",
                    "type": "postback",
                    "payload": "information||"+ data.custom_collections[k].id,
                       }
                    ]
                };
    messageData.message.attachment.payload.elements[k] = message;
    k++;
  }
  //console.log(messageData);
  //console.log(messageData.message.attachment.payload);
  callSendAPI(messageData);
}



//////////////////////////
// Fonction va aller chercher des informations sur shopify (Metafields sur la nutrition en fonction du Handle du produit)
//////////////////////////

function sendNutriMessage(recipientID,name){
 getNutri('https://tsechatbot.myshopify.com/admin/products/'+name+'/metafields.json',recipientID,name);
}
  
function getNutri(url,recipientId,name) {
    console.log(name);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true,"62ffda2cd474e07070563fe4089c443f","6295eda9c2499abe83a342338e7b5562");
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        
        res = JSON.parse(xhr.responseText);
        console.log(res);
        var message = res.metafields[0].value 
        sendTextMessage(recipientId,message);
      } 
    };
    xhr.send();
};












// Fonction qui va créer le message générique 
function creationmessage(data,recipientId,name){
  //console.log(data.products);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }
    }
  }
  var k = 0;
  var message;
  for(var t in data.products){
    console.log((data.products[t].body_html).italics());
    message = {title: data.products[t].title,
            subtitle: data.products[t].body_html,
            item_url: "https://tsechatbot.myshopify.com/collections/"+name+"/products/"+data.products[t].handle,               
            image_url: data.products[t].image.src,
            buttons: [{
              type: "web_url",
              url: "https://tsechatbot.myshopify.com/collections/"+name+"/products/"+data.products[t].handle,
              title: "Ouvrir le site"
            }, {
              type: "postback",
              title: "Plus d'information",
              payload: "nutri||"+data.products[t].id,
            },
           {
            "type":"postback",
            "title":"Acheter",
            "payload":"achat"
          }],
          };
    messageData.message.attachment.payload.elements[t] = message;
    
  }
  //console.log(messageData);
  callSendAPI(messageData);
}




//////////////////////////
// Fonction va aller sur shopify pour ajouter une commande
//////////////////////////
function sendAchatMessage(recipientId) {
  var messageData = {
  "order": {
    "line_items": [
      {
        "title": "Clicky Keyboard",
        "price": 99.99,
        "grams": "600",
        "quantity": 1,
        "tax_lines": [
          {
            "price": 1.0,
            "rate": 0.01,
            "title": "Keyboard tax"
          }
        ]
      }
    ],
    "tax_lines": [
      {
        "price": 6.0,
        "rate": 0.06,
        "title": "State tax"
      }
    ]
  }
}
callSendShopify(messageData);
}






//////////////////////////
// Fonction qui envoi le message sur Facebook
//////////////////////////
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}


//////////////////////////
// Fonction qui envoi le message sur shopify
//////////////////////////
function callSendShopify(messageData) {
  request({
    uri: 'https://tsechatbot.myshopify.com/admin/orders.json',
    qs: { consumer_key: "62ffda2cd474e07070563fe4089c443f"
    , consumer_secret: "6295eda9c2499abe83a342338e7b5562"},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}



// Mise en route du serveur avec affichage du Greetings Message
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
  createGetStarted();
});



//////////////////////////
// Fonction qui envoi le Thread sur Facebook (Envoi du message Greeting)
//////////////////////////
function callThreadSettingsAPI(data) { 
request({
uri: 'https://graph.facebook.com/v2.6/me/thread_settings?access_token='+process.env.token,
qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
method: 'POST',
json: data

}, function (error, response, body) {
if (!error && response.statusCode == 200) {
  console.log("Thread Settings successfully changed!");
} else {
  console.error("Failed calling Thread Reference API", response.statusCode, response.statusMessage, body.error);
}
});  
}



// Fonction qui créer le message de Greetings 
function createGetStarted() {
var data = {
setting_type: "call_to_actions",
thread_state: "new_thread",
call_to_actions:[
 {
  payload:"getStarted"
}
]
};
  
  var message= {
  "setting_type":"greeting",
  "greeting":{
    
    "text":"Bienvenue {{user_full_name}} sur le bot de Chamboultou."
  }
};

callThreadSettingsAPI(message);
callThreadSettingsAPI(data);
}


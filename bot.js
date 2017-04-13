//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
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

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
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

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
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
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
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
  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;
  payload =payload.split('||');
  console.log(payload[1]);
  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  callSendAPI(messageData);
  switch(payload[0]){
    /*case 'product' :
      sendProductMessage(senderID);
      break;*/
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
      
      default:
        sendTextMessage(senderID, "postBack called");break
      
                
  
}}

//////////////////////////
// Sending helpers
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

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Le bon paté",
            subtitle: "Site Paté",
            item_url: "https://fr.ulule.com/chambouletou-pate/",               
            image_url: "https://drfhlmcehrc34.cloudfront.net/cache/a/7/41941855651c35858f7e51de7be9e8.jpg",
            buttons: [{
              type: "web_url",
              url: "https://tsechat.myshopify.com/?key=c9fe91dcceba2aa7825134da9eef9b648478eb7443dcb118b0048fb2e543fda2",
              title: "Ouvrir le site"
            }, {
              type: "postback",
              title: "Voir tout les produit",
              payload: "collection",
            }]
          }]
        }
      }
    }
  };  
  
  console.log(messageData.message.attachment.payload.elements);
  callSendAPI(messageData);
}


function sendProductMessage(recipientId,name) {
  var uri = "https://tsechat.myshopify.com/admin/products.json?collection_id="+name;
  console.log(uri);
  getProduit(uri,recipientId,readData);
  //console.log(JSON.stringify(resu));
  //var table = JSON.parse(getJSON('https://tsechat.myshopify.com/admin/products.json'));
  //console.log(table);
  
  
//callSendAPI(messageData);
}

function sendCollectionMessage(recipientId){
  getCollection('https://tsechat.myshopify.com/admin/custom_collections.json',recipientId,console.log);
}
  
  
function getProduit(url,recipientId,callback) {
  
    var xhr = new XMLHttpRequest();
  
    xhr.open('GET', url, true,"f56f085bf6ee7fd32781433d10a20845","b7f82c376582006f01256d71657a02e3");
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        
        res = JSON.parse(xhr.responseText);
        console.log(res);
        console.log("bondour");
        creationmessage(res,recipientId);
        
      } else {
          console.log(status);
        //callback(status);
      }
    };
    xhr.send();
};

function getCollection(url,recipientId,callback) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true,"f56f085bf6ee7fd32781433d10a20845","b7f82c376582006f01256d71657a02e3");
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        
        res = JSON.parse(xhr.responseText);
        //console.log(res);
        creationliste(res,recipientId);
        
      } else {
        
        //callback(status);
      }
    };
    xhr.send();
};



function creationmessage(data,recipientId){
  console.log(data.products);
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
    //console.log(data.products[t]);
    message = {title: data.products[t].title,
            subtitle: data.products[t].body_html,
            item_url: "https://fr.ulule.com/chambouletou-pate/",               
            image_url: data.products[t].image.src,
            buttons: [{
              type: "web_url",
              url: "https://fr.ulule.com/chambouletou-pate/",
              title: "Ouvrir le site"
            }, {
              type: "postback",
              title: "Plus d'information",
              payload: "information",
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
            "template_type": "list",
            "elements": [
            ],
             "buttons": [
                {
                    "title": "Voir Plus",
                    "type": "web_url",
                    "url": "https://tsechat.myshopify.com/collections"                        
                }
            ]  
        }
    }
}
    
};
  for(var t in data.custom_collections){
    console.log(data.custom_collections);
    
    console.log("\n\n\n\n\n")
    
    message =    {
                    "title": data.custom_collections[k].title,
                    "image_url": data.custom_collections[k].image.src,
                    "subtitle": data.custom_collections[k].body_html,
                    "default_action": {
                        "type": "web_url",
                        "url": "https://tsechat.myshopify.com/collections/"+data.custom_collections[k].handle,
                        
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
  console.log(messageData);
  console.log(messageData.message.attachment.payload);
  callSendAPI(messageData);
}







function readData(sData) {
  
    // On peut maintenant traiter les données sans encombrer l'objet XHR.
    if (sData == "OK") {
        console.log("C'est bon");
      
    } else {
        console.log("Y'a eu un problème");
    }
}


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
  
  
callSendAPI(messageData);
}






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


function callSendShopify(messageData) {
  request({
    uri: 'https://tsechat.myshopify.com/admin/orders.json',
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



// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
  createGetStarted();
});

function callThreadSettingsAPI(data) { //Thread Reference API
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
callThreadSettingsAPI(data);
}
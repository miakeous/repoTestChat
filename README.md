# Facebook Messenger Bot For Chamboultou

This projet is a ChatBot for Chamboultou a french start-up.

This is a clever bot that can understand french language thanks to Wit.ai

![](http://media.topito.com/wp-content/uploads/2016/06/compo-pyramide-ext-640x360px.ZQHDxGTocGfc.jpg)

## Getting Started
To get started you need to:

- Set up your Facebook app on Facebook

- Configure your Facebook App

  The `Callback URL` you set when configuring your app on Facebook is your Gomix project's publish URL with '/webhook' appended. The publish URL is what loads when you click 'Show' and has the format 'https://project-name.gomix.me', so for this example we used 'https://messenger-bot.gomix.me/webhook' for the Callback URL.

  The `Verify Token` is a string you make up - it's just used to make sure it is your Facebook app that your server is interacting with. 

- Copy your app credentials into the `.env` file


- Then creat a Shopify Partner account 


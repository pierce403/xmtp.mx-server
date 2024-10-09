# xmtp.mx-server

XMTP / Email relay using Mailgun

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Introduction

The xmtp.mx-server is a Node.js application implemented in TypeScript that acts as a relay between XMTP messages and emails. It uses Mailgun for email handling and the XMTP SDK for blockchain messaging. When an XMTP message is received, it is parsed and sent as an email via Mailgun. The server can also receive emails through Mailgun and send them as XMTP messages.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- Git

You will also need:
- An Infura Project ID for Ethereum Mainnet
- An XMTP private key for the server
- A Mailgun account with API key and domain set up

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/pierce403/xmtp.mx-server.git
   cd xmtp.mx-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory of the project:
   ```
   touch .env
   ```

2. Add your Infura Project ID, XMTP private key, and Mailgun credentials to the `.env` file:
   ```
   INFURA_KEY=your_infura_project_id_here
   XMTP_PRIVATE_KEY=your_xmtp_private_key_here
   MAILGUN_API_KEY=your_mailgun_api_key_here
   MAILGUN_DOMAIN=your_mailgun_domain_here
   ```

## Usage

To start the server, run:

```
npm start
```

The server will start listening for incoming XMTP messages and handle email sending/receiving through Mailgun.

## API Documentation

### XMTP SDK

The XMTP SDK is used for sending and receiving messages on the XMTP network.

- **Purpose**: Enables communication between blockchain wallet addresses.
- **Usage**: 
  - Initialize client: `Client.create(wallet, { env: 'production' })`
  - Send message: `conversation.send(content)`
  - Stream messages: `xmtpClient.conversations.stream()`

For more details, refer to the [XMTP SDK documentation](https://github.com/xmtp/xmtp-js/tree/main/packages/js-sdk).

### Mailgun.js

Mailgun.js is used for sending and receiving emails.

- **Purpose**: Handles email operations through the Mailgun API.
- **Usage**: 
  - Initialize client: `mailgun.client({ username: 'api', key: MAILGUN_API_KEY })`
  - Send email: `mg.messages.create(MAILGUN_DOMAIN, messageData)`

For more information, see the [Mailgun.js documentation](https://github.com/mailgun/mailgun.js).

### ethers.js

ethers.js is used for interacting with the Ethereum blockchain and resolving ENS names.

- **Purpose**: Provides Ethereum utilities and ENS resolution.
- **Usage**: 
  - Create wallet: `new Wallet(XMTP_PRIVATE_KEY)`
  - Resolve ENS name: `provider.resolveName(ensName)`

For more details, check the [ethers.js documentation](https://docs.ethers.io/v5/).

## Testing

To test the server:

1. Ensure the server is running (`npm start`).
2. Send an XMTP message to the server's XMTP address.
3. Check if the corresponding email is sent via Mailgun.
4. Send an email to your Mailgun domain.
5. Verify if the XMTP message is received and processed correctly.

## Troubleshooting

If you encounter any issues:

1. Check that all prerequisites are installed correctly.
2. Ensure your Infura Project ID is valid and has access to Ethereum Mainnet.
3. Verify that the `.env` file is correctly set up with all required credentials.
4. Check the server logs for any error messages or warnings.
5. Ensure your Mailgun domain is properly configured and verified.

If problems persist, please open an issue on the GitHub repository with details about the error and steps to reproduce it.

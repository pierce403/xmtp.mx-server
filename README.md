# xmtp.mx-server

SMTP server for XMTP / SMTP relay

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Introduction

The xmtp.mx-server is a simple SMTP server implemented in Node.js and TypeScript. It receives emails sent to `<namegoeshere.eth@xmtp.mx>` and uses the XMTP SDK to send an XMTP message from `xmtpmx.eth` to `namegoeshere.eth`.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- Git

You will also need:
- An Infura Project ID for Ethereum Mainnet

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

2. Add your Infura Project ID to the `.env` file:
   ```
   INFURA_KEY=your_infura_project_id_here
   ```

## Usage

To start the server, run:

```
npm start
```

The server will start listening on port 2525 for incoming SMTP connections.

## Testing

To test the server, you can use the provided `send_test_email.js` script:

1. Open a new terminal window.
2. Navigate to the project directory.
3. Run the test script:
   ```
   node send_test_email.js
   ```

This script will send a test email to the SMTP server. Check the server logs to see if the email was received and processed correctly.

## Troubleshooting

If you encounter any issues:

1. Check that all prerequisites are installed correctly.
2. Ensure your Infura Project ID is valid and has access to Ethereum Mainnet.
3. Verify that the `.env` file is correctly set up with your Infura Project ID.
4. Check the server logs for any error messages or warnings.

If problems persist, please open an issue on the GitHub repository with details about the error and steps to reproduce it.

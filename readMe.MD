
# Server Stats Bot
 
A Discord bot that displays server statistics including PM2 process status, Docker container status, and PostgreSQL server status. 
The bot updates its statistics periodically and can also respond to user commands.
 * 
## Features
 
 - Displays PM2 process status for the **Lavalink** process.
 - Monitors the status of Docker containers:
 - You can change the container names to your desired containers:
   - **grave-grave**
   - **grave-echo-grave**
   - **redis:7.2.5**
 - Checks the status of the PostgreSQL server.
 - Generates and updates a visual representation of the server stats on a Discord channel.
 - Responds to the `!stats` command with the latest server stats image.
 
 ## Prerequisites
 
 Make sure you have the following installed:
 
 - [Node.js](https://nodejs.org/en/download/) (v16 or higher)
 - [Docker](https://docs.docker.com/get-docker/)
 - PM2 (Process Manager for Node.js applications)
 - PostgreSQL
 
 ## Setup Instructions
 
 1. **Clone the Repository:**
 
    ```bash
    git clone https://github.com/exril/stats-bot.git
    cd stats-bot
    ```
 
 2. **Install Dependencies:**
 
    Run the following command to install the required Node.js packages:
 
    ```bash
    npm install
    ```
 
 3. **Create `config.json`:**
 
    Create a `config.json` file in the src folder of the project and add your Discord bot token and the channel ID where you want the bot to send the stats. The file should look like this:

    ```json
    {
      "token": "YOUR_BOT_TOKEN",
      "channelId": "YOUR_CHANNEL_ID"
    }
    ```
 
    Replace `YOUR_BOT_TOKEN` and `YOUR_CHANNEL_ID` with your actual bot token and the channel ID.
 
 4. **Background Image:**
 
    Place a background image named `background.png` in the root directory. This image will be used as the canvas background for the stats display.
 
 5. **Run the Bot:**
 
    Start the bot using Node.js:
 
    ```bash
    node index.js
    ```
 
    Alternatively, if you're using PM2, you can run it as follows:
 
    ```bash
    pm2 start index.js --name "ServerStatsBot"
    ```
 
 6. **Check the Bot's Status:**
 
    The bot will post updates in the specified Discord channel every 9 seconds. You can also manually request the latest stats by sending the `!stats` command in the channel.
 
 ## Usage
 
 - **!stats**: Command to retrieve the latest server stats manually.
 
 ## Customization
 
 You can modify the appearance of the stats by editing the drawing functions in the code. Feel free to change the font sizes, colors, and layout to better fit your needs.
 
 ## Contributing
 
 Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.
 
 ## License
 
 This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
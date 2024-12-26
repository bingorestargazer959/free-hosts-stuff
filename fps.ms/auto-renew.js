/*
How To Setup
1. Replace your_server_id_here with the server id - you can find this by clicking your server, going to Settings and scrolling down to Server ID and copying it (it should look like something like this: b3f9a2c4-7e1b-4c3d-9f8e-1a2b3c4d5e6f)
2. Replace your_cookie_value_here with your cookie - you can find this by clicking F12/Inspect and going to Network, refreshing the page and looking for https://panel.fps.ms pop up at the top and scrolling down to the Reponse Headers to find Cookie. Copy this and paste it.
3. npm install axios
*/
const axios = require('axios');

const cookieValue = 'your_cookie_value_here';
const serverId = 'your_server_id_here';

const renewServer = async () => {
    try {
        const response = await axios.post(`https://panel.fps.ms/api/client/freeservers/${serverId}/renew`, null, {
            headers: {
                'Cookie': cookieValue
            }
        });

        if (response.data && response.data.error) {
            console.error('Error:', response.data.error);
        } else {
            console.log('Server renewed successfully:', response.data);
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
};

renewServer();
setInterval(renewServer, 60 * 60 * 1000);

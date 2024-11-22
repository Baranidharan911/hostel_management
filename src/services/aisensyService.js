// src/services/aisensyService.js
import axios from 'axios';

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api';
const AISENSY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2OGNkMmQ2YzY2NTEwMzM2NzY1NGUxYSIsIm5hbWUiOiJpYm90cyA3MDgwIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY2OGNkMmQ1YzY2NTEwMzM2NzY1NGUwZCIsImFjdGl2ZVBsYW4iOiJCQVNJQ19NT05USExZIiwiaWF0IjoxNzIwNTA1MDQ2fQ.3cqA6ihIxoilSgtV7PjG0bJeABCpvLfY0eyhmEfQZgs';

export const sendWhatsAppNotification = async (phoneNumber, message) => {
    try {
        const response = await axios.post(`${AISENSY_API_URL}/sendCampaign`, {
            senderId: 'Ibots 7080', // Your sender ID
            to: phoneNumber,
            message: {
                text: message
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AISENSY_API_KEY}`
            }
        });

        if (response.data.success) {
            console.log('Notification sent successfully');
            return true;
        } else {
            console.error('Failed to send notification', response.data);
            return false;
        }
    } catch (error) {
        console.error('Error sending notification', error);
        return false;
    }
};

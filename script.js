const clockElement = document.getElementById('clock');
const alarmTimeInput = document.getElementById('alarm-time');
const alarmMessageInput = document.getElementById('alarm-message');
const customImageInput = document.getElementById('custom-image');
const customSoundInput = document.getElementById('custom-sound');
const alarmSound = document.getElementById('alarm-sound');
const alarmsList = document.getElementById('alarms-list');
const notification = document.getElementById('notification');
const alarmImageDisplay = document.getElementById('alarm-image-display');
const stopAlarmButton = document.getElementById('stop-alarm-button');
const alarmColorInput = document.getElementById('alarm-color');

let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
let clockInterval;
let alarmTimeout;

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

function setAlarm() {
    const time = alarmTimeInput.value;
    const message = alarmMessageInput.value;
    const image = customImageInput.files[0];
    const color = alarmColorInput.value;

    if (time && message && image) {
        const reader = new FileReader();
        reader.onload = () => {
            const imageDataUrl = reader.result;
            const alarmTime = new Date();
            const [hours, minutes] = time.split(':').map(Number);
            alarmTime.setHours(hours, minutes, 0, 0);

            alarms.push({ time, message, imageDataUrl, color, createdAt: new Date() });
            localStorage.setItem('alarms', JSON.stringify(alarms));
            renderAlarms();
        
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        };
        reader.readAsDataURL(image);
    }
}

function renderAlarms() {
    alarmsList.innerHTML = '';
    alarms.forEach((alarm, index) => {
        const alarmItem = document.createElement('div');
        alarmItem.classList.add('alarm-item');
        alarmItem.innerHTML = `
            <span>${alarm.time} - ${alarm.message}</span>
            <button onclick="removeAlarm(${index})"><i class="fas fa-trash"></i></button>
        `;
        alarmsList.appendChild(alarmItem);
    });
}

function removeAlarm(index) {
    alarms.splice(index, 1);
    localStorage.setItem('alarms', JSON.stringify(alarms));
    renderAlarms();
}

function triggerAlarm(message, imageDataUrl, color) {
    const customSound = customSoundInput.files[0];
    if (customSound) {
        const soundUrl = URL.createObjectURL(customSound);
        alarmSound.src = soundUrl;
    }
    alarmSound.loop = true;  // Adicionado para tocar em loop
    alarmSound.play();
    document.body.classList.add('flash');
    document.body.style.backgroundColor = color;
    showNotification(message);

    if (imageDataUrl) {
        const img = document.createElement('img');
        img.src = imageDataUrl;
        alarmImageDisplay.innerHTML = '';
        alarmImageDisplay.appendChild(img);
        alarmImageDisplay.appendChild(stopAlarmButton);
        alarmImageDisplay.style.display = 'flex';
    }

    // Enviar notificação do navegador
    if (Notification.permission === 'granted') {
        new Notification('Alarme!', {
            body: message,
            icon: imageDataUrl || 'default-icon.png',
        });
    }

    alarmTimeout = setTimeout(() => {
        stopAlarm();
    }, 60000);
}

function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function stopAlarm() {
    clearTimeout(alarmTimeout);
    document.body.classList.remove('flash');
    alarmSound.pause();
    alarmSound.currentTime = 0;
    alarmSound.loop = false;  // Parar o loop
    document.body.style.backgroundColor = '';
    alarmImageDisplay.style.display = 'none';
    alarmImageDisplay.innerHTML = '';
}

function checkAlarms() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    alarms.forEach(alarm => {
        if (alarm.time + ':00' === currentTime) {
            triggerAlarm(alarm.message, alarm.imageDataUrl, alarm.color);
        }
    });
}

function checkMissedAlarms() {
    const now = new Date();
    alarms.forEach(alarm => {
        const alarmTime = new Date();
        const [hours, minutes] = alarm.time.split(':').map(Number);
        alarmTime.setHours(hours, minutes, 0, 0);

        if (now > alarmTime && now - alarmTime < 60000) {
            triggerAlarm(alarm.message, alarm.imageDataUrl, alarm.color);
        }
    });
}

window.onload = () => {
    updateClock();
    renderAlarms();
    checkMissedAlarms();
};

if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
            alert('É necessário conceder permissão para receber notificações de alarme.');
        }
    });
}

clockInterval = setInterval(updateClock, 1000);
setInterval(checkAlarms, 1000);

updateClock();
renderAlarms();

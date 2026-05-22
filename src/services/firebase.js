import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAbHT-riSeCPY9ciZzXlu2SGqov81k0abo",
    authDomain: "election-game-72b29.firebaseapp.com",
    databaseURL: "https://election-game-72b29-default-rtdb.firebaseio.com",
    projectId: "election-game-72b29",
    storageBucket: "election-game-72b29.firebasestorage.app",
    messagingSenderId: "196898428884",
    appId: "1:196898428884:web:7026906951a8660183a841"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;

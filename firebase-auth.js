import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
   // your config
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { onAuthStateChanged };

import {
    auth,
    onAuthStateChanged
} from "./firebase-auth.js";

onAuthStateChanged(auth, (user) => {

    if (!user) {

        const currentPage = encodeURIComponent(
            window.location.pathname +
            window.location.search
        );

        window.location.href =
            `/toolify/login.html?redirect=${currentPage}`;

        return;
    }

    document.body.style.visibility = "visible";

});

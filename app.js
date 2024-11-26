const CLIENT_ID = '474911398667-v3f4bn8ibnovo19q898f7n19n2sse4g4.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/documents.readonly';
const DOCUMENT_ID = '1hZ0bF6c58y1bnwO4F7XeVoUsJKkhonOUAwnrvk8PVic';

let accessToken = '';


const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const searchButton = document.getElementById('search_button');
const songTitleInput = document.getElementById('song_title');
const contentElement = document.getElementById('content');

// Handle authorization click
// function handleAuthClick() {
//     google.accounts.oauth2.initTokenClient({
//         client_id: CLIENT_ID,
//         scope: SCOPES,
//         callback: (response) => {
//             if (response.error) {
//                 console.error('Authorization error:', response.error);
//                 return;
//             }
//             accessToken = response.access_token;
//             console.log(accessToken);
//             authorizeButton.style.display = 'none';
//             signoutButton.style.display = 'block';
//         }
//     }).requestAccessToken();
// }

function handleAuthClick() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error('Authorization error:', response.error);
                return;
            }
            accessToken = response.access_token;
            authorizeButton.style.display = 'none';
            signoutButton.style.display = 'block';
        }
    });

    tokenClient.requestAccessToken();
}

// Handle sign-out click
function handleSignoutClick() {
    google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Access token revoked');
        accessToken = '';
        contentElement.innerHTML = 'Signed out.';
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    });
}

// Fetch the Google Doc content
function getDocumentContent(documentId, accessToken) {
    return fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        return data;
    })
    .catch(error => {
        console.error('Error fetching document:', error);
    });
}

  // Clean text by removing newlines, extra spaces, and other unnecessary characters
  function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

 // Clean text by removing newlines, extra spaces, and other unnecessary characters
 function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Search for a song by title and return the page content containing it
function findSongByTitle(documentContent, songTitle) {
    let currentPageContent = '';
    let pageCount = 1;
    let songFound = false;

    if (documentContent && documentContent.body && documentContent.body.content) {
        const elements = documentContent.body.content;

        console.log("----- Document Content Start -----");
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            console.log(`Element ${i}:`, element);

            // Prolazimo kroz sve tipove elemenata i radimo sa paragrafima
            if (element.paragraph && element.paragraph.elements) {
                let paragraphContent = '';
                element.paragraph.elements.forEach(textRun => {
                    if (textRun.textRun && textRun.textRun.content.trim() !== '') {
                        paragraphContent += textRun.textRun.content;
                    }
                });

                // Logovanje paragrafnog sadržaja
                console.log(`Paragraph ${i} Content:`, paragraphContent);

                // Čišćenje paragrafnog sadržaja i naziva pesme
                const cleanParagraphContent = cleanText(paragraphContent);
                const cleanSongTitle = cleanText(songTitle);

                // Dodajemo paragrafni sadržaj u trenutnu stranicu
                currentPageContent += paragraphContent + '\n';

                // Ako pronađemo naziv pesme, postavljamo oznaku da je pronađena
                if (cleanParagraphContent.includes(cleanSongTitle)) {
                    songFound = true;
                }
            }

            // Ako naiđemo na sectionBreak ili pageBreak, prelazimo na novu stranicu
            if (element.sectionBreak || (element.paragraph && element.paragraph.elements.some(e => e.pageBreak))) {
                if (songFound) {
                    // Prikazujemo sadržaj cele stranice kada pronađemo pesmu
                    contentElement.innerHTML = `Song found on page ${pageCount}:\n\n${currentPageContent}`;
                    console.log("----- Document Content End -----");
                    return;
                }
                // Resetujemo trenutni sadržaj i prelazimo na novu stranicu
                currentPageContent = '';
                pageCount++;
                songFound = false;
            }
        }

        // Ako smo završili sve elemente i pronašli pesmu na poslednjoj stranici
        if (songFound) {
            contentElement.innerHTML = `Song found\n\n${currentPageContent}`;
            console.log("----- Document Content End -----");
            return;
        }

        console.log("----- Document Content End -----");
    }

    // Ako pesma nije pronađena
    contentElement.innerHTML = `The song "${songTitle}" was not found in the document.`;
}

// Handle search button click to find song by title
function handleSearchClick() {
    const songTitle = songTitleInput.value.trim();
    if (!songTitle) {
        contentElement.innerHTML = 'Please enter a song title.';
        return;
    }

    getDocumentContent(DOCUMENT_ID, accessToken)
        .then(documentContent => {
            findSongByTitle(documentContent, songTitle);
        });
}

authorizeButton.onclick = handleAuthClick;
signoutButton.onclick = handleSignoutClick;
searchButton.onclick = handleSearchClick;

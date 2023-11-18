const express = require('express');
const app = express();
const port = 5000; // Specify the port you want to run your server on
const axios = require('axios')
require('dotenv').config();
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
var cors = require('cors')
app.use(bodyParser.json());
// app.use(cors())
// Define a route


// -----------------------> LOGIN VIA GITHUB <----------------------------
app.get('/login-github', (req, res) => {
    const oauthEndpoint = `https://github.com/login/oauth/authorize?client_id=${process.env.GIT_CLIENT_ID}&redirect_uri=http://localhost:5000/callback&allow_signup=true&scope=user%20repo_deployment`;
    return res.redirect(oauthEndpoint);
});


app.get('/callback', (req, res) => {

    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code

    axios({
        method: 'post',
        url: `https://github.com/login/oauth/access_token?client_id=${process.env.GIT_CLIENT_ID}&client_secret=${process.env.GIT_SECRET_ID}&code=${requestToken}`,
        // Set the content type header, so that we get the response in JSON
        headers: {
            accept: 'application/json'
        }
    }).then((response) => {
        access_token = response.data.access_token

        axios({
            method: 'get',
            url: `https://api.github.com/user`,
            headers: {
                Authorization: 'Bearer ' + access_token
            }
        }).then((response) => {
            return res.send({ userData: response.data });
        }).catch((error) => {
            return res.send({ callback_error: error })
        })

    })
})


// -------------------------> LOGIN VIA GOOGLE <-----------------------------

// 1.Go to the Google developer console: https://console.developers.google.com/apis/credentials
// 2.Select or create a Google project.
// 3.Navigate to the credentials page — in the left sidebar — and create an OAuth client ID.

// link: https://developers.google.com/identity/protocols/oauth2/native-app


app.get('/auth', (req, res) => {
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=email%20profile%20https://www.googleapis.com/auth/youtube.readonly&response_type=code&redirect_uri=http://localhost:5000/callback-auth&client_id=${process.env.GOOGLE_CLIENT_KEY}`;
    return res.redirect(googleUrl);
});

app.get('/callback-auth', (req, res) => {
    const code = req.query.code
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_KEY;
    const clientSecret = process.env.GOOGLE_SECRET_KEY;
    const redirectUri = 'http://localhost:5000/callback-auth';
    const authorizationCode = code; // Replace with the actual authorization code

    // Prepare the data for the POST request
    const requestData = {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    };

    // Make the POST request to exchange the authorization code for tokens
    axios.post(tokenEndpoint, requestData)
        .then(response => {
            console.log('Tokens acquired:', response.data);
            const access_token = response.data.access_token;
            console.log('token:', token)
            axios({
                method: 'get',
                url: `https://www.googleapis.com/oauth2/v2/userinfo`,
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            }).then((response) => {
                return res.send({ userData: response.data });
            }).catch((error) => {
                return res.send({ callback_error: error })
            })
        })
        .catch(error => {
            console.error('Error exchanging authorization code for tokens:', error.response.data);
            return res.send({ error: error.response.data })
        });

})


// -------------------> GOOGLE RECAPTCHA V3 <---------------------------


// reCAPTCHA is a free service that protects your site from spam and abuse. 
// It uses advanced risk analysis techniques to tell humans and bots apart.
// ReCAPTCHA v3 helps you detect abusive traffic on your website without user interaction. 
// Instead of showing a CAPTCHA challenge, reCAPTCHA v3 returns a score so you can choose the most appropriate action 
// for your website.


// doc: https://developers.google.com/recaptcha/docs/v3
// step.1 generate token from the client
// step.2 match the token with secret key at the backend side.


app.post('/send-recaptcha', (req, res) => {
    const token = req.body.token; // generated token from the client side (frontend)
    const secret_key = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;

    // verify this token with google recaptcha secret key

    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${token}`
    axios({
        method: 'get',
        url: url,
    }).then((response) => {

        // {"response":{"success":true,"challenge_ts":"2023-11-14T07:15:23Z","hostname":"localhost","score":0.9,"action":"submit"}}
        const score = response.data.score;
        console.log('reCAPTCHA Score:', score);

        // Perform further validation based on the reCAPTCHA score
        if (score >= 0.5) {
            // Proceed with form submission
            return res.send('Form submitted successfully!');
        } else {
            // reCAPTCHA score is below the threshold, consider it as suspicious
            return res.status(403).send('reCAPTCHA validation failed');
        }
    }).catch((error) => {
        return res.send({ callback_error: error })
    })

})


// ---------------> Youtube Data Api <------------------

// https://developers.google.com/youtube/v3/docs/videos/list

app.get('/youtube-videos', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_KEY;
    const access_token = '';
    axios({
        method: 'get',
        url: `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=8HFBY9cudgM&key=${clientId}`,
        headers: {
            Authorization: 'Bearer ' + access_token,
            Accept: 'application/json'
        }
    }).then((response) => {
        // response {
        //     "kind": "youtube#videoListResponse",
        //         "etag": "v_eAgd-eHCrvGl6RwHClo50BFSE",
        //             "items": [
        //                 {
        //                     "kind": "youtube#video",
        //                     "etag": "iKYL6Q1UmGAXoIKQizhleRhNiK0",
        //                     "id": "8HFBY9cudgM",
        //                     "snippet": {
        //                         "publishedAt": "2023-08-14T03:10:32Z",
        //                         "channelId": "UCS2BoGTIdj_hbZfdowLcZBg",
        //                         "title": "romantic songs hindi 2023 | Non stop love mashup | Live Streaming",
        //                         "description": "romantic songs hindi 2023 | Non stop love mashup | Live Streaming\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n► Hindi Songs Live Streaming ◄\n\nSynthesis of the best hindi songs, bringing relaxed moments to listeners. If there is anything unsatisfactory, please give us a comment, so that we can develop \"New Hindi PartyMix\" to grow. Look forward to your support. Thank you !!!\n\n----------------------------------------------------------------------------------------------\n\n❤ Please Share this Mix on Social sites (Facebook, Google +, Twitter etc.) to more people could listen it!\nDon't forget to Like & Share the mix if you enjoy it!\n▷ Subscribe us now!\nThanks for watching! Don't forget to SUBCRIBE, Like & Share my video if you enjoy it! Have a nice day!\n🚫 If you have any problems with copyright issues, please CONTACT US DIRECTLY before doing anything, or questions please leave a message or comment to me.\n\n======================================================\n\nUploaded for promotional and preview purposes only! \nIf you as a copyright holder wish to remove this, \nplease contact me @ akashjoshi136@gmail.com - \nand I will remove it directly from my Channel.\n\n©️ DISCLAIMER: This Following Audio/Video is Strictly meant for Promotional Purpose. We Do not Wish to make any Commercial Use of this & Intended to Showcase the Creativity Of the Artist Involved.\n\nThe original Copyright(s) is (are) Solely owned by the Companies/Original-Artist(s)/Record-label(s).All the contents are intended to Showcase the creativity of the Artist involved and is strictly done for promotional purpose.\n\n*DISCLAIMER: As per 3rd Section of Fair use guidelines Borrowing small bits of material from an original work is more likely to be considered fair use. Copyright Disclaimer Under Section 107 of the Copyright Act 1976, allowance is made for fair use\n\n———————————————————————————————————————————————————\n\n#htmusic #arijitsingh #mashups #trending\n\nTags : mann bharryaa, mann bharrya, mann bharya lofi, shershaah songs, hindi lofi song, indian lofi, lofi indian, indian lofi hip hop, lofi hip hop, indian hip hop,indie, indian lofi mix, lofi mix, indian music, lofi beats, lofi radio,india, lofi study, desi lofi, lofi music, lo-fi hip hop radio, lofi playlist, wanderlust lofi, lofi hip hop mix, sad lofi, lo-fi beats, lofi chill, lofi love song, bollywood lofi, lofi bollywood, indian lofi, bollywood flip, hindi english mashup, bollywood songs, bollywood remix, desi lofi, hindi lofi, quarantine lofi, lofi aesthetics, indian lofi, lo-fi, lofi mix, lofi flip ,lofi beats, lofi remix, lofi vibes, lofi edits, bollywoodlofi, indian lofi music, indian lofi, bollywoodflips, desilofi, lofiedits, lofiremix, indianlofi, bollywood lofi, chillhop, slowed and reverb, slowed and reverbed, slow and reverb, hindi lofi playlist, lofi songs playlist, bollywod lofi playlist, relax and chill, hindi lofi remake, reels viral songs, reel trending song, trending reel song,reels song, midnight vibes, midnight music, lofi vibes, late night vibes, late night music, chillout vibes, chillout music, chillout remix, chillout mix",
        //                         "thumbnails": {
        //                             "default": {
        //                                 "url": "https://i.ytimg.com/vi/8HFBY9cudgM/default.jpg",
        //                                 "width": 120,
        //                                 "height": 90
        //                             },
        //                             "medium": {
        //                                 "url": "https://i.ytimg.com/vi/8HFBY9cudgM/mqdefault.jpg",
        //                                 "width": 320,
        //                                 "height": 180
        //                             },
        //                             "high": {
        //                                 "url": "https://i.ytimg.com/vi/8HFBY9cudgM/hqdefault.jpg",
        //                                 "width": 480,
        //                                 "height": 360
        //                             },
        //                             "standard": {
        //                                 "url": "https://i.ytimg.com/vi/8HFBY9cudgM/sddefault.jpg",
        //                                 "width": 640,
        //                                 "height": 480
        //                             },
        //                             "maxres": {
        //                                 "url": "https://i.ytimg.com/vi/8HFBY9cudgM/maxresdefault.jpg",
        //                                 "width": 1280,
        //                                 "height": 720
        //                             }
        //                         },
        //                         "channelTitle": "Sky React",
        //                         "tags": [
        //                             "love mashup 2022",
        //                             "love mashup 2023",
        //                             "bollywood love songs",
        //                             "bollywood mashup",
        //                             "old vs new",
        //                             "love mashup",
        //                             "old vs new bollywood mashup",
        //                             "old vs new 2023",
        //                             "old new mashup",
        //                             "new hindi songs",
        //                             "hindi songs",
        //                             "bollywood songs",
        //                             "bollywood latest songs",
        //                             "hindi romantic songs",
        //                             "mashup",
        //                             "old vs new mashup",
        //                             "Bollywood Mashup",
        //                             "Old Hindi Songs Mashup 2023",
        //                             "Old New Mashup",
        //                             "new song 2022 hindi",
        //                             "new songs 2023",
        //                             "Punjabi Mashup",
        //                             "new hindi songs 2023",
        //                             "romantic songs hindi"
        //                         ],
        //                         "categoryId": "10",
        //                         "liveBroadcastContent": "none",
        //                         "localized": {
        //                             "title": "romantic songs hindi 2023 | Non stop love mashup | Live Streaming",
        //                             "description": "romantic songs hindi 2023 | Non stop love mashup | Live Streaming\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n► Hindi Songs Live Streaming ◄\n\nSynthesis of the best hindi songs, bringing relaxed moments to listeners. If there is anything unsatisfactory, please give us a comment, so that we can develop \"New Hindi PartyMix\" to grow. Look forward to your support. Thank you !!!\n\n----------------------------------------------------------------------------------------------\n\n❤ Please Share this Mix on Social sites (Facebook, Google +, Twitter etc.) to more people could listen it!\nDon't forget to Like & Share the mix if you enjoy it!\n▷ Subscribe us now!\nThanks for watching! Don't forget to SUBCRIBE, Like & Share my video if you enjoy it! Have a nice day!\n🚫 If you have any problems with copyright issues, please CONTACT US DIRECTLY before doing anything, or questions please leave a message or comment to me.\n\n======================================================\n\nUploaded for promotional and preview purposes only! \nIf you as a copyright holder wish to remove this, \nplease contact me @ akashjoshi136@gmail.com - \nand I will remove it directly from my Channel.\n\n©️ DISCLAIMER: This Following Audio/Video is Strictly meant for Promotional Purpose. We Do not Wish to make any Commercial Use of this & Intended to Showcase the Creativity Of the Artist Involved.\n\nThe original Copyright(s) is (are) Solely owned by the Companies/Original-Artist(s)/Record-label(s).All the contents are intended to Showcase the creativity of the Artist involved and is strictly done for promotional purpose.\n\n*DISCLAIMER: As per 3rd Section of Fair use guidelines Borrowing small bits of material from an original work is more likely to be considered fair use. Copyright Disclaimer Under Section 107 of the Copyright Act 1976, allowance is made for fair use\n\n———————————————————————————————————————————————————\n\n#htmusic #arijitsingh #mashups #trending\n\nTags : mann bharryaa, mann bharrya, mann bharya lofi, shershaah songs, hindi lofi song, indian lofi, lofi indian, indian lofi hip hop, lofi hip hop, indian hip hop,indie, indian lofi mix, lofi mix, indian music, lofi beats, lofi radio,india, lofi study, desi lofi, lofi music, lo-fi hip hop radio, lofi playlist, wanderlust lofi, lofi hip hop mix, sad lofi, lo-fi beats, lofi chill, lofi love song, bollywood lofi, lofi bollywood, indian lofi, bollywood flip, hindi english mashup, bollywood songs, bollywood remix, desi lofi, hindi lofi, quarantine lofi, lofi aesthetics, indian lofi, lo-fi, lofi mix, lofi flip ,lofi beats, lofi remix, lofi vibes, lofi edits, bollywoodlofi, indian lofi music, indian lofi, bollywoodflips, desilofi, lofiedits, lofiremix, indianlofi, bollywood lofi, chillhop, slowed and reverb, slowed and reverbed, slow and reverb, hindi lofi playlist, lofi songs playlist, bollywod lofi playlist, relax and chill, hindi lofi remake, reels viral songs, reel trending song, trending reel song,reels song, midnight vibes, midnight music, lofi vibes, late night vibes, late night music, chillout vibes, chillout music, chillout remix, chillout mix"
        //                         },
        //                         "defaultAudioLanguage": "hi"
        //                     },
        //                     "contentDetails": {
        //                         "duration": "PT1H40M7S",
        //                         "dimension": "2d",
        //                         "definition": "hd",
        //                         "caption": "false",
        //                         "licensedContent": false,
        //                         "contentRating": {},
        //                         "projection": "rectangular"
        //                     },
        //                     "statistics": {
        //                         "viewCount": "2913925",
        //                         "likeCount": "11811",
        //                         "favoriteCount": "0",
        //                         "commentCount": "214"
        //                     }
        //                 }
        //             ],
        //                 "pageInfo": {
        //         "totalResults": 1,
        //             "resultsPerPage": 1
        //     }
        // }

        return res.send({ userData: response.data });
    }).catch((error) => {
        console.log('youtube error:', error);
        return res.send({ youtube_error: error })
    })
})
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
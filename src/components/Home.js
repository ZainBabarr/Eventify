import React, { useEffect, useState } from 'react';
import { FaSpotify } from "react-icons/fa";
import axios from 'axios';
import './Styles/Home.css';
import Search from './Search';

const CLIENT_ID = "";
const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
const REDIRECT_URL_AFTER_LOGIN = "https://eventify.one/search";
const SCOPES = ["user-read-currently-playing", "user-read-playback-state", "user-top-read"];
const SCOPES_URL_PARAM = SCOPES.join("%20");

const Home = () => {
    const [token, setToken] = useState('');
    const [topArtists, setTopArtists] = useState([]);

    useEffect(() => {
        const hash = window.location.hash;
        let _token = getReturnParamsFromSpotifyAuth(hash);
        if (_token.access_token) {
            setToken(_token.access_token);
            window.location.hash = "";
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchTopArtists();
        }
    }, [token]);

    const fetchTopArtists = async () => {
        try {
            const response = await axios.get("https://api.spotify.com/v1/me/top/artists", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Fetched Top Artists:", response.data.items);
            setTopArtists(response.data.items || []); // Ensure it's always an array
        } catch (error) {
            console.error("Error fetching top artists:", error);
        }
    };

    const handleLogin = () => {
        const loginUrl = `${SPOTIFY_AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URL_AFTER_LOGIN)}&scope=${SCOPES_URL_PARAM}&response_type=token&show_dialog=true`;
        console.log("Spotify Login URL:", loginUrl);
        window.location = loginUrl;
    };

    return (
        <div className="home">
            <div className="header">
                <p className="eventify">Eventify</p>
            </div>

            {!token ? (
                <button onClick={handleLogin} className="spotifyButton">
                    <FaSpotify size={30} /> Connect your Spotify Account
                </button>
            ) : (
                <Search token={token} topArtists={topArtists} />
            )}

            <div className="instructions">
                <div className="instruction-item">
                    <span>1. Connect your Spotify Account</span>
                </div>
                <div className="instruction-item">
                    <span>2. View your Top Artists</span>
                </div>
                <div className="instruction-item">
                    <span>3. Add Events to your Calendar</span>
                </div>
            </div>
        </div>
    );
};

const getReturnParamsFromSpotifyAuth = (hash) => {
    const stringAfterHashtag = hash.substring(1);
    const paramsInUrl = stringAfterHashtag.split("&");

    return paramsInUrl.reduce((acc, currentValue) => {
        const [key, value] = currentValue.split("=");
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
};

export default Home;

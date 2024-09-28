import React, { useState, useEffect } from 'react';
import { FaSpotify } from "react-icons/fa";
import './Styles/Search.css'
import { google, ics } from "calendar-link";

const CLIENT_ID = "40579d9dae13427fb3cd25ca6d7586e1";
const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
const REDIRECT_URL_AFTER_LOGIN = "https://eventify.one/";
const SPACE_DELIMITER = "%20";
const SCOPES = ["user-read-currently-playing", "user-read-playback-state", "user-top-read"];
const SCOPES_URL_PARAM = SCOPES.join(SPACE_DELIMITER);

// Function to handle Spotify Authorization callback
const getReturnParamsFromSpotifyAuth = (hash) => {
    const stringAfterHashtag = hash.substring(1);
    const paramsInUrl = stringAfterHashtag.split("&");

    return paramsInUrl.reduce((acc, currentValue) => {
        const [key, value] = currentValue.split("=");
        acc[key] = decodeURIComponent(value); // Decode the value to handle special characters
        return acc;
    }, {});
};

// Ticketmaster API credentials
const TICKETMASTER_API_KEY = "vin5ASi00AGzhuhORUuv2O9Ln2GLPvwN";
const TICKETMASTER_EVENTS_ENDPOINT = "https://app.ticketmaster.com/discovery/v2/events.json";

const createCalendarUrls = (event) => {
    const startDateTime = event.dates?.start?.localDate + 'T' + (event.dates?.start?.localTime || '00:00:00');
    const endDateTime = event.dates?.end?.localDate + 'T' + (event.dates?.end?.localTime || '23:59:59');

    const eventDetails = {
        title: event.name,
        start: startDateTime, 
        end: endDateTime,    
        location: event._embedded?.venues[0]?.name || '',
    };

    // Generate calendar links
    return {
        google: google(eventDetails),
        ics: ics(eventDetails),
    };
};

const Search = ({ setToken }) => {
    const [token, updateToken] = useState("");
    const [topArtists, setTopArtists] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const storedToken = localStorage.getItem("accessToken");

        if (window.location.hash) {
            const { access_token } = getReturnParamsFromSpotifyAuth(window.location.hash);
            if (access_token) {
                localStorage.setItem("accessToken", access_token);
                updateToken(access_token);
                setToken(access_token);
                fetchTopArtists(access_token);
            }
        } else if (storedToken) {
            updateToken(storedToken);
            setToken(storedToken);
            fetchTopArtists(storedToken);
        }
    }, [setToken]);

    const handleLogin = () => {
        window.location = `${SPOTIFY_AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL_AFTER_LOGIN}&scope=${SCOPES_URL_PARAM}&response_type=token&show_dialog=true`;
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        window.location.hash = ""; // Clear URL fragment
        setToken(""); // Clear state
        window.location.href = "/"; // Redirect
    };

    const fetchTopArtists = async (accessToken) => {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/top/artists', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const data = await response.json();
            setTopArtists(data.items);
        } catch (error) {
            console.error("Error fetching top artists:", error);
        }
    };

    const handleArtistClick = async (artistName) => {
        try {
            const response = await fetch(`${TICKETMASTER_EVENTS_ENDPOINT}?apikey=${TICKETMASTER_API_KEY}&keyword=${artistName}&classificationName=music`);
            const data = await response.json();
            setUpcomingEvents(data._embedded?.events || []);
        } catch (error) {
            console.error("Error fetching events for artist:", error);
        }
    };

    return (
        <div className="search">
            {token ? (
                <button onClick={handleLogout} className="spotifyButton">
                    <FaSpotify size={30} /> Log Out
                </button>
            ) : (
                <button onClick={handleLogin} className="spotifyButton">
                    <FaSpotify size={30} /> Log In to Spotify
                </button>
            )}

            <div>
                <p className="eventify">Eventify</p>
            </div>

            <div>
                <div className="top-artists">
                    <h2 className="clickOnTopArtist">
                        Click on your top <span className="highlight">artists</span> to see their future <span className="highlight">events!</span>
                    </h2>
                    <ul>
                        {topArtists && topArtists.length > 0 ? (
                            topArtists.slice(0, 10).map((artist) => (
                                <li key={artist.id}>
                                    <img
                                        className="artistImage"
                                        onClick={() => handleArtistClick(artist.name)}
                                        src={artist.images[0]?.url || "default-artist.png"}
                                        alt={artist.name}
                                    />
                                    <span>{artist.name}</span>
                                </li>
                            ))
                        ) : (
                            <li>No top artists found.</li>
                        )}
                    </ul>
                </div>

                {/* Display upcoming events */}
                <div className="upcoming-events">
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents
                            .filter(event => event.priceRanges && event.priceRanges.length > 0)
                            .map((event) => {
                                const calendarUrls = createCalendarUrls(event);
                                return (
                                    <div key={event.id} className="event-item">
                                        <div className="dropdown">
                                            <button className="calenderButton">Add to Calendar</button>
                                            <div className="dropdown-content">
                                                <a href={calendarUrls.google} target="_blank" rel="noopener noreferrer">Google</a>
                                                <a href={calendarUrls.ics} target="_blank" rel="noopener noreferrer">Apple</a>
                                            </div>
                                        </div>
                                        <div className="event-content">
                                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="event-link">
                                                <h4 className="event-name">{event.name}</h4>
                                                <p className="event-date">{event.dates?.start?.localDate}</p>
                                                <p className="event-location">{event._embedded?.venues[0]?.name}</p>
                                                <p className="event-price">
                                                    ${event.priceRanges[0]?.min} - ${event.priceRanges[0]?.max}
                                                </p>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <p>No upcoming events found for this artist.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;

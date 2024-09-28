import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './components/Home'; 
import Search from './components/Search';

const App = () => {
    const [token, setToken] = useState("");

    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route 
                        path="/search" 
                        element={<Search setToken={setToken} />} // Correct way to pass setToken
                    />
                </Routes>
            </div>
        </Router>
    );
};

export default App;

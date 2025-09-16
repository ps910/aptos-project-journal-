import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './styles.css';

const API = 'http://localhost:4000/api';

export default function App() {
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await axios.get(`${API}/ideas`);
      setIdeas(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="container">
        <header className="header">
          <h1 className="title">Open Journal</h1>
        </header>
        <div className="error-message">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Open Journal</h1>
      </header>
      <main>
        {isLoading ? (
          <p>Loading ideas...</p>
        ) : (
          <div className="ideas-list">
            {ideas.length === 0 ? (
              <p className="welcome-message">No ideas yet. Be the first to share one!</p>
            ) : (
              ideas.map(idea => (
                <div key={idea.id} className="idea-card">
                  <h3 className="idea-title">{idea.title}</h3>
                  <p className="idea-description">{idea.description}</p>
                  <div className="meta">
                    <span>Votes: {idea.votes}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
